/**
 * Enhanced API Client with Connection Pooling, Rate Limiting, and Advanced Retry Logic
 * Provides resilient HTTP requests with comprehensive error handling and monitoring
 */

import { rateLimiter } from './RateLimiter';
import { authManager } from './AuthManager';

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  retryDelayMultiplier: number;
  maxRetryDelay: number;
  connectionPoolSize: number;
  keepAliveTimeout: number;
  rateLimitEnabled: boolean;
  authEnabled: boolean;
  brokerId?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  success: boolean;
  error?: string;
  retryCount?: number;
  timestamp: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  };
  connectionInfo?: {
    pooled: boolean;
    duration: number;
  };
}

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryDelayMultiplier?: number;
  maxRetryDelay?: number;
  shouldRetry?: (error: Error, retryCount: number) => boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response?: any,
    public url?: string
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends Error {
  constructor(public retryAfter: number, public remaining: number, public resetTime: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public needsRefresh: boolean = false) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ApiClient {
  private config: ApiClientConfig;
  private circuitBreakerState: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private connectionPool = new Map<string, { controller: AbortController; lastUsed: number }>();
  private poolCleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseURL: 'http://localhost:8000',
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000,
      retryDelayMultiplier: 2,
      maxRetryDelay: 10000,
      connectionPoolSize: 10,
      keepAliveTimeout: 30000,
      rateLimitEnabled: true,
      authEnabled: true,
      ...config,
    };

    this.startPoolCleanup();
  }

  private shouldRetry(error: Error, retryCount: number): boolean {
    // Don't retry if we've exceeded max retries
    if (retryCount >= this.config.maxRetries) {
      return false;
    }

    // Don't retry rate limit errors (handled separately)
    if (error instanceof RateLimitError) {
      return false;
    }

    // Don't retry authentication errors (handled separately)
    if (error instanceof AuthenticationError) {
      return false;
    }

    // Retry on network errors
    if (error instanceof NetworkError) {
      return true;
    }

    // Retry on timeout errors
    if (error instanceof TimeoutError) {
      return true;
    }

    // Retry on specific HTTP status codes
    if (error instanceof ApiError) {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(error.status);
    }

    return false;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(retryCount: number): number {
    const delay = this.config.retryDelay * Math.pow(this.config.retryDelayMultiplier, retryCount);
    return Math.min(delay, this.config.maxRetryDelay);
  }

  private getCircuitBreakerKey(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.pathname}${urlObj.search}`;
    } catch {
      return url;
    }
  }

  private isCircuitBreakerOpen(key: string): boolean {
    const state = this.circuitBreakerState.get(key);
    if (!state) return false;

    if (state.isOpen) {
      const now = Date.now();
      if (now - state.lastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
        // Reset circuit breaker
        state.isOpen = false;
        state.failures = 0;
        return false;
      }
      return true;
    }

    return false;
  }

  private recordSuccess(key: string): void {
    const state = this.circuitBreakerState.get(key);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }

  private recordFailure(key: string): void {
    const state = this.circuitBreakerState.get(key) || { failures: 0, lastFailure: 0, isOpen: false };
    state.failures++;
    state.lastFailure = Date.now();
    
    if (state.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      state.isOpen = true;
    }
    
    this.circuitBreakerState.set(key, state);
  }

  private createTimeoutSignal(timeout: number): { signal: AbortSignal; cleanup: () => void } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    return {
      signal: controller.signal,
      cleanup: () => clearTimeout(timeoutId),
    };
  }

  async request<T = any>(
    url: string,
    options: RequestInit & { retryConfig?: RetryConfig; skipRateLimit?: boolean; skipAuth?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const { retryConfig, skipRateLimit = false, skipAuth = false, ...fetchOptions } = options;
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    const circuitKey = this.getCircuitBreakerKey(fullUrl);

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(circuitKey)) {
      throw new ApiError(503, 'Service Unavailable - Circuit Breaker Open', null, fullUrl);
    }

    // Rate limiting check
    if (this.config.rateLimitEnabled && !skipRateLimit && this.config.brokerId) {
      const endpoint = this.extractEndpoint(url);
      const weight = rateLimiter.getEndpointWeight(endpoint);
      
      try {
        await rateLimiter.waitForLimit(this.config.brokerId, endpoint, weight);
      } catch (error) {
        throw new RateLimitError(5000, 0, Date.now() + 5000);
      }
    }

    // Authentication headers
    let authHeaders: Record<string, string> = {};
    if (this.config.authEnabled && !skipAuth && this.config.brokerId) {
      try {
        authHeaders = await authManager.getAuthHeaders(this.config.brokerId, this.config.baseURL);
      } catch (error) {
        throw new AuthenticationError('Failed to get authentication headers', true);
      }
    }

    const effectiveRetryConfig = {
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      retryDelayMultiplier: this.config.retryDelayMultiplier,
      maxRetryDelay: this.config.maxRetryDelay,
      shouldRetry: this.shouldRetry.bind(this),
      ...retryConfig,
    };

    let lastError: Error | null = null;
    let retryCount = 0;
    let rateLimitInfo: any = undefined;

    while (retryCount <= effectiveRetryConfig.maxRetries) {
      const { signal, cleanup } = this.createTimeoutSignal(this.config.timeout);
      const connectionInfo = { pooled: false, duration: 0 };

      try {
        const requestStart = Date.now();
        const response = await fetch(fullUrl, {
          ...fetchOptions,
          signal,
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...fetchOptions.headers,
          },
        });

        connectionInfo.duration = Date.now() - requestStart;

        cleanup();

        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        // Extract rate limit info from headers
        if (headers['x-ratelimit-remaining']) {
          rateLimitInfo = {
            remaining: parseInt(headers['x-ratelimit-remaining'], 10),
            resetTime: headers['x-ratelimit-reset'] ? parseInt(headers['x-ratelimit-reset'], 10) : Date.now() + 60000,
          };
        }

        // Try to parse JSON, fall back to text
        let data: T;
        try {
          data = await response.json();
        } catch {
          data = (await response.text()) as T;
        }

        if (!response.ok) {
          // Handle authentication errors
          if (response.status === 401) {
            const authError = new AuthenticationError('Authentication failed', true);
            
            if (this.config.authEnabled && this.config.brokerId) {
              // Try to refresh token once
              try {
                await authManager.refreshToken(this.config.brokerId, this.config.baseURL);
                // Retry the request with new token
                authHeaders = await authManager.getAuthHeaders(this.config.brokerId, this.config.baseURL);
                retryCount++;
                continue;
              } catch (refreshError) {
                this.recordFailure(circuitKey);
                throw authError;
              }
            } else {
              this.recordFailure(circuitKey);
              throw authError;
            }
          }

          // Handle rate limit errors
          if (response.status === 429) {
            const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after'], 10) * 1000 : 5000;
            const rateLimitError = new RateLimitError(retryAfter, rateLimitInfo?.remaining || 0, Date.now() + retryAfter);
            
            if (retryCount < effectiveRetryConfig.maxRetries) {
              await this.delay(retryAfter);
              retryCount++;
              continue;
            }

            this.recordFailure(circuitKey);
            throw rateLimitError;
          }

          const error = new ApiError(response.status, response.statusText, data, fullUrl);
          
          if (retryCount < effectiveRetryConfig.maxRetries && 
              effectiveRetryConfig.shouldRetry!(error, retryCount)) {
            lastError = error;
            retryCount++;
            const delay = this.calculateRetryDelay(retryCount - 1);
            await this.delay(delay);
            continue;
          }

          this.recordFailure(circuitKey);
          throw error;
        }

        this.recordSuccess(circuitKey);

        return {
          data,
          status: response.status,
          headers,
          success: true,
          retryCount: retryCount > 0 ? retryCount : undefined,
          timestamp: new Date().toISOString(),
          rateLimitInfo,
          connectionInfo,
        };

      } catch (error) {
        cleanup();

        if (signal.aborted) {
          lastError = new TimeoutError(this.config.timeout);
        } else if (error instanceof ApiError) {
          lastError = error;
        } else {
          lastError = new NetworkError(
            'Network request failed',
            error instanceof Error ? error : new Error(String(error))
          );
        }

        if (retryCount < effectiveRetryConfig.maxRetries && 
            effectiveRetryConfig.shouldRetry!(lastError, retryCount)) {
          retryCount++;
          const delay = this.calculateRetryDelay(retryCount - 1);
          await this.delay(delay);
          continue;
        }

        this.recordFailure(circuitKey);
        break;
      }
    }

    // If we get here, all retries failed
    throw lastError || new NetworkError('Request failed');
  }

  // Convenience methods
  async get<T = any>(url: string, options: RequestInit & { retryConfig?: RetryConfig } = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, options: RequestInit & { retryConfig?: RetryConfig } = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(url: string, body?: any, options: RequestInit & { retryConfig?: RetryConfig } = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(url: string, options: RequestInit & { retryConfig?: RetryConfig } = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  // Circuit breaker status
  getCircuitBreakerStatus(): Array<{ endpoint: string; failures: number; isOpen: boolean; lastFailure: Date | null }> {
    return Array.from(this.circuitBreakerState.entries()).map(([key, state]) => ({
      endpoint: key,
      failures: state.failures,
      isOpen: state.isOpen,
      lastFailure: state.lastFailure ? new Date(state.lastFailure) : null,
    }));
  }

  // Reset specific circuit breaker
  resetCircuitBreaker(endpoint: string): void {
    this.circuitBreakerState.delete(endpoint);
  }

  // Reset all circuit breakers
  resetAllCircuitBreakers(): void {
    this.circuitBreakerState.clear();
  }

  // Connection pooling methods
  private startPoolCleanup(): void {
    this.poolCleanupTimer = setInterval(() => {
      this.cleanupConnectionPool();
    }, this.config.keepAliveTimeout / 2);
  }

  private cleanupConnectionPool(): void {
    const now = Date.now();
    for (const [key, connection] of this.connectionPool.entries()) {
      if (now - connection.lastUsed > this.config.keepAliveTimeout) {
        connection.controller.abort();
        this.connectionPool.delete(key);
      }
    }
  }

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url, this.config.baseURL);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  // Enhanced methods with broker-specific configuration
  createBrokerClient(brokerId: string): ApiClient {
    return new ApiClient({
      ...this.config,
      brokerId,
      rateLimitEnabled: true,
      authEnabled: true,
    });
  }

  // Get client statistics
  getStats(): {
    circuitBreakers: Array<{ endpoint: string; failures: number; isOpen: boolean }>;
    connectionPool: { active: number; capacity: number };
    config: ApiClientConfig;
  } {
    const circuitBreakers = Array.from(this.circuitBreakerState.entries()).map(([endpoint, state]) => ({
      endpoint,
      failures: state.failures,
      isOpen: state.isOpen,
    }));

    return {
      circuitBreakers,
      connectionPool: {
        active: this.connectionPool.size,
        capacity: this.config.connectionPoolSize,
      },
      config: this.config,
    };
  }

  // Cleanup method
  cleanup(): void {
    if (this.poolCleanupTimer) {
      clearInterval(this.poolCleanupTimer);
      this.poolCleanupTimer = null;
    }

    // Abort all pooled connections
    for (const connection of this.connectionPool.values()) {
      connection.controller.abort();
    }
    this.connectionPool.clear();
  }
}

// Default instance
export const apiClient = new ApiClient();