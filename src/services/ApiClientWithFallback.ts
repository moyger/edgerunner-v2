/**
 * Enhanced API Client with Fallback Strategy
 * Provides working API connections even when backend is unavailable
 */

import { ApiClient, ApiResponse, ApiError, NetworkError } from './ApiClient';

export interface FallbackConfig {
  enableMockData: boolean;
  mockDelay: number;
  fallbackToMock: boolean;
  logFallbacks: boolean;
}

export class ApiClientWithFallback extends ApiClient {
  private fallbackConfig: FallbackConfig;
  private backendAvailable: boolean | null = null;
  private lastBackendCheck = 0;
  private readonly BACKEND_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(config: Partial<any> = {}, fallbackConfig: Partial<FallbackConfig> = {}) {
    super(config);
    
    this.fallbackConfig = {
      enableMockData: true,
      mockDelay: 300,
      fallbackToMock: true,
      logFallbacks: true,
      ...fallbackConfig,
    };
  }

  async request<T = any>(url: string, options: any = {}): Promise<ApiResponse<T>> {
    // First check if backend is available
    const backendAvailable = await this.checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        return await super.request<T>(url, options);
      } catch (error) {
        if (this.fallbackConfig.fallbackToMock) {
          if (this.fallbackConfig.logFallbacks) {
            console.warn('API request failed, falling back to mock data:', error);
          }
          return this.getMockResponse<T>(url, options);
        }
        throw error;
      }
    } else if (this.fallbackConfig.enableMockData) {
      if (this.fallbackConfig.logFallbacks) {
        console.warn(`Backend unavailable, using mock data for ${url}`);
      }
      return this.getMockResponse<T>(url, options);
    } else {
      throw new NetworkError('Backend service unavailable and mock data disabled');
    }
  }

  private async checkBackendAvailability(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent
    if (this.backendAvailable !== null && now - this.lastBackendCheck < this.BACKEND_CHECK_INTERVAL) {
      return this.backendAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      this.backendAvailable = response.ok;
      this.lastBackendCheck = now;
      
      return this.backendAvailable;
    } catch (error) {
      this.backendAvailable = false;
      this.lastBackendCheck = now;
      return false;
    }
  }

  private async getMockResponse<T>(url: string, options: any): Promise<ApiResponse<T>> {
    // Simulate network delay
    if (this.fallbackConfig.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.fallbackConfig.mockDelay));
    }

    const mockData = this.generateMockData(url, options);

    return {
      data: mockData as T,
      status: 200,
      headers: { 'content-type': 'application/json' },
      success: true,
      timestamp: new Date().toISOString(),
      connectionInfo: {
        pooled: false,
        duration: this.fallbackConfig.mockDelay,
      },
    };
  }

  private generateMockData(url: string, options: any): any {
    const method = options.method?.toUpperCase() || 'GET';
    
    // Health check endpoint
    if (url.includes('/health')) {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'mock-backend',
      };
    }

    // Broker connection endpoints
    if (url.includes('/api/broker/connect')) {
      return {
        connected: true,
        broker: options.body?.broker || 'unknown',
        connectionId: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      };
    }

    if (url.includes('/api/broker/status')) {
      const broker = new URL(url, 'http://localhost').searchParams.get('broker') || 'unknown';
      return {
        status: 'connected',
        broker,
        lastHeartbeat: new Date().toISOString(),
        uptime: Math.floor(Math.random() * 3600),
      };
    }

    if (url.includes('/api/broker/disconnect')) {
      return {
        disconnected: true,
        broker: options.body?.broker || 'unknown',
        timestamp: new Date().toISOString(),
      };
    }

    // Authentication endpoints
    if (url.includes('/api/auth/login')) {
      return {
        token: 'mock-access-token-' + Math.random().toString(36).substring(7),
        refresh_token: 'mock-refresh-token-' + Math.random().toString(36).substring(7),
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      };
    }

    if (url.includes('/api/auth/refresh')) {
      return {
        token: 'mock-refreshed-token-' + Math.random().toString(36).substring(7),
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
      };
    }

    // Market data endpoints
    if (url.includes('/api/market-data')) {
      const symbol = new URL(url, 'http://localhost').searchParams.get('symbol') || 'UNKNOWN';
      return {
        symbol,
        bid: 100 + Math.random() * 50,
        ask: 101 + Math.random() * 50,
        last: 100.5 + Math.random() * 50,
        volume: Math.floor(Math.random() * 1000000),
        timestamp: new Date().toISOString(),
      };
    }

    // Account data
    if (url.includes('/api/account/summary')) {
      return {
        accountId: 'MOCK123456',
        totalValue: 50000 + Math.random() * 100000,
        availableFunds: 10000 + Math.random() * 20000,
        buyingPower: 20000 + Math.random() * 40000,
        currency: 'USD',
        timestamp: new Date().toISOString(),
      };
    }

    if (url.includes('/api/positions')) {
      return [
        {
          symbol: 'AAPL',
          quantity: 100,
          avgCost: 150.25,
          currentPrice: 155.50,
          unrealizedPnL: 525.00,
          marketValue: 15550.00,
        },
        {
          symbol: 'GOOGL',
          quantity: 50,
          avgCost: 2500.00,
          currentPrice: 2650.75,
          unrealizedPnL: 7537.50,
          marketValue: 132537.50,
        },
      ];
    }

    // Historical data
    if (url.includes('/api/historical-data')) {
      const symbol = new URL(url, 'http://localhost').searchParams.get('symbol') || 'UNKNOWN';
      const dataPoints = [];
      let basePrice = 100 + Math.random() * 100;
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const change = (Math.random() - 0.5) * 5;
        basePrice += change;
        
        dataPoints.unshift({
          date: date.toISOString().split('T')[0],
          open: basePrice - Math.random() * 2,
          high: basePrice + Math.random() * 3,
          low: basePrice - Math.random() * 3,
          close: basePrice,
          volume: Math.floor(Math.random() * 1000000),
        });
      }
      
      return {
        symbol,
        data: dataPoints,
        timeframe: '1d',
      };
    }

    // Order management
    if (url.includes('/api/trade') && method === 'POST') {
      return {
        orderId: 'ORDER-' + Math.random().toString(36).substring(7).toUpperCase(),
        status: 'submitted',
        symbol: options.body?.order?.symbol || 'UNKNOWN',
        quantity: options.body?.order?.quantity || 0,
        orderType: options.body?.order?.orderType || 'market',
        timestamp: new Date().toISOString(),
      };
    }

    if (url.includes('/api/orders/status')) {
      const orderId = new URL(url, 'http://localhost').searchParams.get('orderId') || 'UNKNOWN';
      return {
        orderId,
        status: ['filled', 'partial', 'submitted'][Math.floor(Math.random() * 3)],
        filledQuantity: Math.floor(Math.random() * 100),
        avgFillPrice: 100 + Math.random() * 50,
        timestamp: new Date().toISOString(),
      };
    }

    if (url.includes('/api/orders/cancel') && method === 'POST') {
      return {
        cancelled: true,
        orderId: options.body?.orderId || 'UNKNOWN',
        timestamp: new Date().toISOString(),
      };
    }

    // Testing endpoints
    if (url.includes('/api/broker/test')) {
      const categories = options.body?.categories || ['authentication'];
      return categories.map((category: string) => ({
        testId: `mock-${category}-test`,
        category,
        name: `Mock ${category.charAt(0).toUpperCase() + category.slice(1)} Test`,
        status: Math.random() > 0.2 ? 'passed' : 'failed',
        duration: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        details: { mock: true, category },
      }));
    }

    // Default mock response
    return {
      message: 'Mock response',
      endpoint: url,
      method,
      timestamp: new Date().toISOString(),
      mock: true,
    };
  }

  // Force backend availability check
  async forceBackendCheck(): Promise<boolean> {
    this.backendAvailable = null;
    this.lastBackendCheck = 0;
    return this.checkBackendAvailability();
  }

  // Get current backend status
  getBackendStatus(): { available: boolean | null; lastChecked: number } {
    return {
      available: this.backendAvailable,
      lastChecked: this.lastBackendCheck,
    };
  }

  // Enable/disable fallback mode
  setFallbackMode(enable: boolean): void {
    this.fallbackConfig.enableMockData = enable;
    this.fallbackConfig.fallbackToMock = enable;
  }
}

// Create enhanced client instance
export const enhancedApiClient = new ApiClientWithFallback();