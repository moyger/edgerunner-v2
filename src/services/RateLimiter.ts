/**
 * Rate Limiter Service
 * Implements token bucket and sliding window rate limiting with per-broker configurations
 */

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstCapacity: number;
  windowSize: number;
  retryAfter: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
}

export interface RequestRecord {
  timestamp: number;
  endpoint: string;
  weight: number;
}

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number,
    private refillPeriod: number = 1000
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getTimeUntilAvailable(tokens: number = 1): number {
    this.refill();
    
    if (this.tokens >= tokens) {
      return 0;
    }
    
    const tokensNeeded = tokens - this.tokens;
    const timePerToken = this.refillPeriod / this.refillRate;
    return Math.ceil(tokensNeeded * timePerToken);
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / this.refillPeriod) * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

export class SlidingWindow {
  private requests: RequestRecord[] = [];

  constructor(private windowSize: number) {}

  addRequest(endpoint: string, weight: number = 1): void {
    const now = Date.now();
    this.cleanup(now);
    
    this.requests.push({
      timestamp: now,
      endpoint,
      weight,
    });
  }

  getRequestCount(windowMs?: number): number {
    const now = Date.now();
    const window = windowMs || this.windowSize;
    this.cleanup(now);
    
    return this.requests
      .filter(req => now - req.timestamp < window)
      .reduce((total, req) => total + req.weight, 0);
  }

  getRequestsByEndpoint(endpoint: string, windowMs?: number): number {
    const now = Date.now();
    const window = windowMs || this.windowSize;
    this.cleanup(now);
    
    return this.requests
      .filter(req => req.endpoint === endpoint && now - req.timestamp < window)
      .reduce((total, req) => total + req.weight, 0);
  }

  getOldestRequestTime(): number | null {
    this.cleanup(Date.now());
    return this.requests.length > 0 ? this.requests[0].timestamp : null;
  }

  private cleanup(now: number): void {
    this.requests = this.requests.filter(req => now - req.timestamp < this.windowSize);
  }
}

export class RateLimiter {
  private static readonly BROKER_CONFIGS: Record<string, RateLimitConfig> = {
    ibkr: {
      requestsPerSecond: 5,
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      burstCapacity: 10,
      windowSize: 60000, // 1 minute
      retryAfter: 1000,
    },
    bybit: {
      requestsPerSecond: 10,
      requestsPerMinute: 600,
      requestsPerHour: 10000,
      burstCapacity: 20,
      windowSize: 60000,
      retryAfter: 500,
    },
    mt5: {
      requestsPerSecond: 3,
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      burstCapacity: 5,
      windowSize: 60000,
      retryAfter: 2000,
    },
    default: {
      requestsPerSecond: 2,
      requestsPerMinute: 30,
      requestsPerHour: 500,
      burstCapacity: 5,
      windowSize: 60000,
      retryAfter: 1000,
    },
  };

  private tokenBuckets = new Map<string, TokenBucket>();
  private slidingWindows = new Map<string, SlidingWindow>();
  private configs = new Map<string, RateLimitConfig>();

  constructor() {
    this.initializeConfigs();
  }

  /**
   * Check if a request is allowed for a specific broker and endpoint
   */
  checkLimit(broker: string, endpoint: string, weight: number = 1): RateLimitResult {
    const config = this.getConfig(broker);
    const bucketKey = `${broker}:${endpoint}`;
    const windowKey = `${broker}:global`;

    // Get or create token bucket for this specific endpoint
    let bucket = this.tokenBuckets.get(bucketKey);
    if (!bucket) {
      bucket = new TokenBucket(
        config.burstCapacity,
        config.requestsPerSecond,
        1000
      );
      this.tokenBuckets.set(bucketKey, bucket);
    }

    // Get or create sliding window for broker-wide limits
    let window = this.slidingWindows.get(windowKey);
    if (!window) {
      window = new SlidingWindow(config.windowSize);
      this.slidingWindows.set(windowKey, window);
    }

    // Check token bucket (burst/per-second limit)
    if (!bucket.consume(weight)) {
      const retryAfter = bucket.getTimeUntilAvailable(weight);
      return {
        allowed: false,
        remaining: bucket.getAvailableTokens(),
        resetTime: Date.now() + retryAfter,
        retryAfter,
        reason: 'Rate limit exceeded (burst)',
      };
    }

    // Check sliding window limits
    const currentMinuteRequests = window.getRequestCount(60000);
    const currentHourRequests = window.getRequestCount(3600000);

    if (currentMinuteRequests + weight > config.requestsPerMinute) {
      // Return tokens to bucket since we're rejecting
      bucket.consume(-weight);
      
      const oldestRequestTime = window.getOldestRequestTime();
      const resetTime = oldestRequestTime ? oldestRequestTime + 60000 : Date.now() + 60000;
      
      return {
        allowed: false,
        remaining: config.requestsPerMinute - currentMinuteRequests,
        resetTime,
        retryAfter: resetTime - Date.now(),
        reason: 'Rate limit exceeded (per minute)',
      };
    }

    if (currentHourRequests + weight > config.requestsPerHour) {
      // Return tokens to bucket since we're rejecting
      bucket.consume(-weight);
      
      const oldestRequestTime = window.getOldestRequestTime();
      const resetTime = oldestRequestTime ? oldestRequestTime + 3600000 : Date.now() + 3600000;
      
      return {
        allowed: false,
        remaining: config.requestsPerHour - currentHourRequests,
        resetTime,
        retryAfter: resetTime - Date.now(),
        reason: 'Rate limit exceeded (per hour)',
      };
    }

    // Request is allowed, record it
    window.addRequest(endpoint, weight);

    return {
      allowed: true,
      remaining: Math.min(
        bucket.getAvailableTokens(),
        config.requestsPerMinute - currentMinuteRequests - weight,
        config.requestsPerHour - currentHourRequests - weight
      ),
      resetTime: Date.now() + 60000,
    };
  }

  /**
   * Wait for rate limit to allow request
   */
  async waitForLimit(broker: string, endpoint: string, weight: number = 1): Promise<void> {
    const result = this.checkLimit(broker, endpoint, weight);
    
    if (!result.allowed && result.retryAfter) {
      await this.delay(result.retryAfter);
      // Recursive call to check again after waiting
      return this.waitForLimit(broker, endpoint, weight);
    }
  }

  /**
   * Execute a function with rate limiting
   */
  async executeWithRateLimit<T>(
    broker: string,
    endpoint: string,
    fn: () => Promise<T>,
    weight: number = 1,
    maxWaitTime: number = 30000
  ): Promise<T> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const result = this.checkLimit(broker, endpoint, weight);
      
      if (result.allowed) {
        return await fn();
      }
      
      if (result.retryAfter) {
        await this.delay(Math.min(result.retryAfter, maxWaitTime - (Date.now() - startTime)));
      } else {
        // If no retryAfter, use default config retry time
        const config = this.getConfig(broker);
        await this.delay(config.retryAfter);
      }
    }
    
    throw new Error(`Rate limit wait timeout exceeded (${maxWaitTime}ms) for ${broker}:${endpoint}`);
  }

  /**
   * Get current rate limit status for a broker
   */
  getStatus(broker: string): {
    config: RateLimitConfig;
    tokenBuckets: Array<{ endpoint: string; tokens: number; capacity: number }>;
    windows: Array<{ type: string; requests: number; limit: number }>;
  } {
    const config = this.getConfig(broker);
    const buckets: Array<{ endpoint: string; tokens: number; capacity: number }> = [];
    const windows: Array<{ type: string; requests: number; limit: number }> = [];

    // Get token bucket status
    for (const [key, bucket] of this.tokenBuckets.entries()) {
      if (key.startsWith(`${broker}:`)) {
        const endpoint = key.split(':')[1];
        buckets.push({
          endpoint,
          tokens: bucket.getAvailableTokens(),
          capacity: config.burstCapacity,
        });
      }
    }

    // Get sliding window status
    const windowKey = `${broker}:global`;
    const window = this.slidingWindows.get(windowKey);
    if (window) {
      windows.push(
        {
          type: 'minute',
          requests: window.getRequestCount(60000),
          limit: config.requestsPerMinute,
        },
        {
          type: 'hour',
          requests: window.getRequestCount(3600000),
          limit: config.requestsPerHour,
        }
      );
    }

    return { config, tokenBuckets: buckets, windows };
  }

  /**
   * Reset rate limits for a broker
   */
  resetLimits(broker: string): void {
    // Remove all token buckets for this broker
    for (const key of this.tokenBuckets.keys()) {
      if (key.startsWith(`${broker}:`)) {
        this.tokenBuckets.delete(key);
      }
    }

    // Remove sliding windows for this broker
    const windowKey = `${broker}:global`;
    this.slidingWindows.delete(windowKey);
  }

  /**
   * Update rate limit configuration for a broker
   */
  updateConfig(broker: string, config: Partial<RateLimitConfig>): void {
    const currentConfig = this.getConfig(broker);
    const newConfig = { ...currentConfig, ...config };
    this.configs.set(broker, newConfig);
    
    // Reset limits to apply new config
    this.resetLimits(broker);
  }

  /**
   * Get endpoint-specific request weight
   */
  getEndpointWeight(endpoint: string): number {
    // Define weights for different endpoint types
    const weights: Record<string, number> = {
      '/api/market-data': 1,
      '/api/historical-data': 3,
      '/api/account/summary': 2,
      '/api/positions': 2,
      '/api/orders': 1,
      '/api/trade': 5,
      '/api/orders/cancel': 3,
      '/api/broker/connect': 10,
      '/api/broker/disconnect': 5,
      '/api/broker/status': 1,
      '/api/broker/test': 2,
    };

    // Check for exact match first
    if (weights[endpoint]) {
      return weights[endpoint];
    }

    // Check for pattern matches
    for (const [pattern, weight] of Object.entries(weights)) {
      if (endpoint.includes(pattern)) {
        return weight;
      }
    }

    return 1; // Default weight
  }

  private initializeConfigs(): void {
    for (const [broker, config] of Object.entries(RateLimiter.BROKER_CONFIGS)) {
      this.configs.set(broker, config);
    }
  }

  private getConfig(broker: string): RateLimitConfig {
    return this.configs.get(broker) || this.configs.get('default')!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();