// Trading API Service Interface
// This abstraction layer will make switching to real APIs seamless

import type { 
  Strategy, 
  Position, 
  Trade, 
  Portfolio, 
  ApiResponse, 
  PaginatedResponse,
  StrategyConfig,
  UserSettings 
} from '../types';

// Base API configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers?: Record<string, string>;
}

// Abstract base class for API services
export abstract class TradingApiService {
  protected config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  // Strategy Management
  abstract getStrategies(): Promise<ApiResponse<Strategy[]>>;
  abstract getStrategy(id: string): Promise<ApiResponse<Strategy>>;
  abstract createStrategy(config: StrategyConfig): Promise<ApiResponse<Strategy>>;
  abstract updateStrategy(id: string, updates: Partial<Strategy>): Promise<ApiResponse<Strategy>>;
  abstract deleteStrategy(id: string): Promise<ApiResponse<void>>;
  abstract startStrategy(id: string): Promise<ApiResponse<void>>;
  abstract stopStrategy(id: string): Promise<ApiResponse<void>>;
  abstract pauseStrategy(id: string): Promise<ApiResponse<void>>;

  // Portfolio Management
  abstract getPortfolio(): Promise<ApiResponse<Portfolio>>;
  abstract getPositions(): Promise<ApiResponse<Position[]>>;
  abstract getPosition(id: string): Promise<ApiResponse<Position>>;
  abstract closePosition(id: string): Promise<ApiResponse<void>>;

  // Trade Management
  abstract getTrades(page?: number, limit?: number): Promise<PaginatedResponse<Trade>>;
  abstract getTrade(id: string): Promise<ApiResponse<Trade>>;
  abstract getTradesByStrategy(strategyId: string): Promise<ApiResponse<Trade[]>>;

  // Real-time Data
  abstract subscribeToRealTimeData(callback: (data: any) => void): () => void;

  // Settings
  abstract getUserSettings(): Promise<ApiResponse<UserSettings>>;
  abstract updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>>;

  // Utilities
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async simulateNetworkDelay(): Promise<void> {
    // Simulate realistic network latency (100-500ms)
    const delay = Math.random() * 400 + 100;
    await this.delay(delay);
  }

  protected createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      status: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  protected createErrorResponse<T>(message: string, details?: any): ApiResponse<T> {
    return {
      data: null as any,
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Error classes for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}