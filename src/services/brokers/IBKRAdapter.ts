/**
 * Interactive Brokers API Adapter
 * Based on API-INTEGRATION.md specifications
 */

import { enhancedApiClient } from '../ApiClientWithFallback';
import type { 
  BrokerAdapter, 
  BrokerConnection, 
  BrokerCredentials, 
  AccountSummary, 
  Position, 
  Order, 
  MarketData, 
  HistoricalData, 
  TestResult 
} from './types';

export class IBKRAdapter implements BrokerAdapter {
  private baseUrl: string;
  private connection: BrokerConnection | null = null;
  private credentials: BrokerCredentials | null = null;
  private apiClient: typeof enhancedApiClient;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.apiClient = enhancedApiClient;
  }

  async connect(credentials: BrokerCredentials): Promise<BrokerConnection> {
    try {
      this.credentials = credentials;
      
      // Update connection status to connecting
      this.connection = {
        id: 'ibkr',
        name: 'Interactive Brokers',
        status: 'connecting',
        lastChecked: new Date().toISOString(),
      };

      // Make API call to backend to establish IBKR connection
      const response = await this.apiClient.post('/api/broker/connect', {
        broker: 'ibkr',
        credentials: {
          username: credentials.username,
          password: credentials.password,
          host: credentials.host || '127.0.0.1',
          port: credentials.port || 7497,
          clientId: credentials.clientId || 1,
        }
      });

      const result = response.data;
      
      this.connection = {
        id: 'ibkr',
        name: 'Interactive Brokers',
        status: result.connected ? 'connected' : 'error',
        lastChecked: new Date().toISOString(),
        error: result.error || undefined,
      };

      return this.connection;
    } catch (error) {
      this.connection = {
        id: 'ibkr',
        name: 'Interactive Brokers',
        status: 'error',
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.apiClient.post('/api/broker/disconnect', { broker: 'ibkr' });

      this.connection = {
        id: 'ibkr',
        name: 'Interactive Brokers',
        status: 'disconnected',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  }

  async getConnectionStatus(): Promise<BrokerConnection> {
    if (!this.connection) {
      this.connection = {
        id: 'ibkr',
        name: 'Interactive Brokers',
        status: 'disconnected',
        lastChecked: new Date().toISOString(),
      };
    }

    try {
      // Check connection status from backend
      const response = await this.apiClient.get('/api/broker/status?broker=ibkr');
      const result = response.data;
      this.connection.status = result.status;
      this.connection.lastChecked = new Date().toISOString();
      this.connection.error = result.error;
    } catch (error) {
      console.error('Status check error:', error);
      this.connection.status = 'error';
      this.connection.error = 'Failed to check status';
    }

    return this.connection;
  }

  async getAccountSummary(): Promise<AccountSummary> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    const response = await this.apiClient.get('/api/account/summary?broker=ibkr');
    return response.data;
  }

  async getPositions(): Promise<Position[]> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    const response = await this.apiClient.get('/api/positions?broker=ibkr');
    return response.data;
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    const response = await this.apiClient.get(`/api/market-data?broker=ibkr&symbol=${symbol}`);
    return response.data;
  }

  async getHistoricalData(symbol: string, duration: string, barSize: string): Promise<HistoricalData> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    const response = await this.apiClient.get(
      `/api/historical-data?broker=ibkr&symbol=${symbol}&duration=${duration}&barSize=${barSize}`
    );
    return response.data;
  }

  async placeOrder(order: Partial<Order>): Promise<Order> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    const response = await this.apiClient.post('/api/trade', {
      broker: 'ibkr',
      order,
    });

    return response.data;
  }

  async getOrderStatus(orderId: string): Promise<Order> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    const response = await this.apiClient.get(`/api/orders/status?broker=ibkr&orderId=${orderId}`);
    return response.data;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to IBKR');
    }

    const response = await this.apiClient.post('/api/orders/cancel', {
      broker: 'ibkr',
      orderId,
    });

    const result = response.data;
    return result.cancelled === true;
  }

  async runTests(categories?: string[]): Promise<TestResult[]> {
    const response = await this.apiClient.post('/api/broker/test', {
      broker: 'ibkr',
      categories: categories || ['authentication', 'market-data', 'account-data', 'order-management'],
    });

    return response.data;
  }

  async runTest(testId: string): Promise<TestResult> {
    const response = await this.apiClient.post(`/api/broker/test/${testId}`, {
      broker: 'ibkr',
    });

    return response.data;
  }

  // Test specific methods for API testing page
  async testConnection(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      if (!this.credentials) {
        throw new Error('No credentials provided');
      }

      await this.connect(this.credentials);
      
      return {
        testId: 'ibkr-connection',
        category: 'authentication',
        name: 'IBKR Connection Test',
        status: 'passed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          host: this.credentials.host,
          port: this.credentials.port,
          clientId: this.credentials.clientId,
        },
      };
    } catch (error) {
      return {
        testId: 'ibkr-connection',
        category: 'authentication',
        name: 'IBKR Connection Test',
        status: 'failed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  async testMarketData(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test with a common symbol
      const data = await this.getMarketData('AAPL');
      
      return {
        testId: 'ibkr-market-data',
        category: 'market-data',
        name: 'Market Data Retrieval Test',
        status: 'passed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          symbol: 'AAPL',
          bid: data.bid,
          ask: data.ask,
          last: data.last,
        },
      };
    } catch (error) {
      return {
        testId: 'ibkr-market-data',
        category: 'market-data',
        name: 'Market Data Retrieval Test',
        status: 'failed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Market data test failed',
      };
    }
  }

  async testAccountData(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const accountSummary = await this.getAccountSummary();
      const positions = await this.getPositions();
      
      return {
        testId: 'ibkr-account-data',
        category: 'account-data',
        name: 'Account Data Retrieval Test',
        status: 'passed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          accountId: accountSummary.accountId,
          totalValue: accountSummary.totalValue,
          positionsCount: positions.length,
        },
      };
    } catch (error) {
      return {
        testId: 'ibkr-account-data',
        category: 'account-data',
        name: 'Account Data Retrieval Test',
        status: 'failed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Account data test failed',
      };
    }
  }
}