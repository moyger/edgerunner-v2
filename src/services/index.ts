// Service Layer Entry Point
// Centralized API service configuration

import { TradingApiService } from './api';
import { MockTradingApiService } from './mockApi';

// Environment configuration
const isDevelopment = import.meta.env.DEV;
const apiMode = import.meta.env.VITE_API_MODE || 'mock';

// Service factory - makes switching between mock and real API seamless
export function createTradingApiService(): TradingApiService {
  switch (apiMode) {
    case 'mock':
      return new MockTradingApiService();
    case 'development':
      // Future: return new DevelopmentTradingApiService();
      return new MockTradingApiService();
    case 'production':
      // Future: return new ProductionTradingApiService();
      return new MockTradingApiService();
    default:
      return new MockTradingApiService();
  }
}

// Global service instance
export const tradingApiService = createTradingApiService();

// Re-export types and classes for convenience
export * from './api';
export * from './mockApi';
export type { 
  Strategy, 
  Position, 
  Trade, 
  Portfolio, 
  ApiResponse,
  PaginatedResponse 
} from '../types';