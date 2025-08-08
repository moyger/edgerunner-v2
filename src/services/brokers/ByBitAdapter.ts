/**
 * ByBit Exchange API Adapter
 * Cryptocurrency trading platform integration
 */

import { apiClient, ApiError, NetworkError, TimeoutError } from '../ApiClient';
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

export interface ByBitCredentials extends BrokerCredentials {
  apiKey: string;
  secretKey: string;
  testnet?: boolean;
  recvWindow?: number;
}

export class ByBitAdapter implements BrokerAdapter {
  private baseUrl: string;
  private connection: BrokerConnection | null = null;
  private credentials: ByBitCredentials | null = null;
  private apiClient: typeof apiClient;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.apiClient = apiClient.createBrokerClient('bybit');
  }

  async connect(credentials: BrokerCredentials): Promise<BrokerConnection> {
    try {
      this.credentials = credentials as ByBitCredentials;
      
      // Update connection status to connecting
      this.connection = {
        id: 'bybit',
        name: 'ByBit Exchange',
        status: 'connecting',
        lastChecked: new Date().toISOString(),
      };

      // Make API call to backend to establish ByBit connection
      const response = await this.apiClient.post('/api/broker/connect', {
        broker: 'bybit',
        credentials: {
          apiKey: this.credentials.apiKey,
          secretKey: this.credentials.secretKey,
          testnet: this.credentials.testnet ?? true,
          recvWindow: this.credentials.recvWindow ?? 5000,
        }
      });

      const result = response.data;
      
      this.connection = {
        id: 'bybit',
        name: 'ByBit Exchange',
        status: result.status === 'connected' ? 'connected' : 'error',
        lastChecked: new Date().toISOString(),
        error: result.error || undefined,
      };

      return this.connection;
    } catch (error) {
      this.connection = {
        id: 'bybit',
        name: 'ByBit Exchange',
        status: 'error',
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.apiClient.post('/api/broker/disconnect', { broker: 'bybit' });

      this.connection = {
        id: 'bybit',
        name: 'ByBit Exchange',
        status: 'disconnected',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error('ByBit disconnect error:', error);
      throw error;
    }
  }

  async getConnectionStatus(): Promise<BrokerConnection> {
    if (!this.connection) {
      this.connection = {
        id: 'bybit',
        name: 'ByBit Exchange',
        status: 'disconnected',
        lastChecked: new Date().toISOString(),
      };
    }

    try {
      // Check connection status from backend
      const response = await this.apiClient.get('/api/broker/status?broker=bybit');
      const result = response.data;
      this.connection.status = result.status;
      this.connection.lastChecked = new Date().toISOString();
      this.connection.error = result.error;
    } catch (error) {
      console.error('ByBit status check error:', error);
      this.connection.status = 'error';
      this.connection.error = 'Failed to check status';
    }

    return this.connection;
  }

  async getAccountSummary(): Promise<AccountSummary> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to ByBit');
    }

    const response = await this.apiClient.get('/api/account/summary?broker=bybit');
    const data = response.data;
    return {
      accountId: data.account_id || '',
      totalCash: data.total_balance || 0,
      totalValue: data.total_equity || 0,
      buyingPower: data.available_balance || 0,
      marginUsed: data.used_margin || 0,
      netLiquidation: data.total_equity || 0,
      currency: 'USDT',
    };
  }

  async getPositions(): Promise<Position[]> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to ByBit');
    }

    const response = await this.apiClient.get('/api/positions?broker=bybit');
    const data = response.data;
    return (data.positions || []).map((pos: any) => ({
      symbol: pos.symbol || '',
      position: parseFloat(pos.size) || 0,
      marketPrice: parseFloat(pos.mark_price) || 0,
      marketValue: parseFloat(pos.position_value) || 0,
      averageCost: parseFloat(pos.avg_price) || 0,
      unrealizedPnL: parseFloat(pos.unrealised_pnl) || 0,
      realizedPnL: parseFloat(pos.cum_realised_pnl) || 0,
    }));
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    const response = await this.apiClient.get(`/api/market-data?broker=bybit&symbol=${symbol}`);
    const data = response.data;
    return {
      symbol: data.symbol || symbol,
      bid: parseFloat(data.bid_price) || 0,
      ask: parseFloat(data.ask_price) || 0,
      last: parseFloat(data.last_price) || 0,
      high: parseFloat(data.high_price_24h) || 0,
      low: parseFloat(data.low_price_24h) || 0,
      close: parseFloat(data.prev_price_24h) || 0,
      volume: parseFloat(data.volume_24h) || 0,
      timestamp: data.time ? new Date(parseInt(data.time)).toISOString() : new Date().toISOString(),
    };
  }

  async getHistoricalData(symbol: string, duration: string, barSize: string): Promise<HistoricalData> {
    const response = await this.apiClient.get(
      `/api/historical-data?broker=bybit&symbol=${symbol}&duration=${duration}&barSize=${barSize}`
    );

    const data = response.data;
    return {
      symbol: data.symbol || symbol,
      data: (data.result || []).map((candle: any) => ({
        date: new Date(parseInt(candle.open_time)).toISOString(),
        open: parseFloat(candle.open) || 0,
        high: parseFloat(candle.high) || 0,
        low: parseFloat(candle.low) || 0,
        close: parseFloat(candle.close) || 0,
        volume: parseFloat(candle.volume) || 0,
      })),
    };
  }

  async placeOrder(order: Partial<Order>): Promise<Order> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to ByBit');
    }

    const response = await this.apiClient.post('/api/trade', {
      broker: 'bybit',
      order: {
        symbol: order.symbol,
        side: order.action === 'BUY' ? 'Buy' : 'Sell',
        order_type: order.orderType === 'MKT' ? 'Market' : order.orderType === 'LMT' ? 'Limit' : 'Market',
        qty: order.totalQuantity?.toString(),
        price: order.lmtPrice?.toString(),
        stop_px: order.auxPrice?.toString(),
      },
    });

    const data = response.data;
    return {
      orderId: data.order_id || '',
      symbol: data.symbol || order.symbol || '',
      action: data.side === 'Buy' ? 'BUY' : 'SELL',
      orderType: data.order_type === 'Market' ? 'MKT' : data.order_type === 'Limit' ? 'LMT' : 'MKT',
      totalQuantity: parseFloat(data.qty) || 0,
      lmtPrice: data.price ? parseFloat(data.price) : undefined,
      auxPrice: data.stop_px ? parseFloat(data.stop_px) : undefined,
      status: data.order_status || 'Submitted',
      filled: parseFloat(data.cum_exec_qty) || 0,
      remaining: (parseFloat(data.qty) || 0) - (parseFloat(data.cum_exec_qty) || 0),
      avgFillPrice: parseFloat(data.avg_price) || 0,
      timestamp: data.created_time ? new Date(data.created_time).toISOString() : new Date().toISOString(),
    };
  }

  async getOrderStatus(orderId: string): Promise<Order> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to ByBit');
    }

    const response = await this.apiClient.get(`/api/orders/status?broker=bybit&orderId=${orderId}`);
    const data = response.data;
    return {
      orderId: data.order_id || orderId,
      symbol: data.symbol || '',
      action: data.side === 'Buy' ? 'BUY' : 'SELL',
      orderType: data.order_type === 'Market' ? 'MKT' : data.order_type === 'Limit' ? 'LMT' : 'MKT',
      totalQuantity: parseFloat(data.qty) || 0,
      lmtPrice: data.price ? parseFloat(data.price) : undefined,
      auxPrice: data.stop_px ? parseFloat(data.stop_px) : undefined,
      status: data.order_status || 'Unknown',
      filled: parseFloat(data.cum_exec_qty) || 0,
      remaining: (parseFloat(data.qty) || 0) - (parseFloat(data.cum_exec_qty) || 0),
      avgFillPrice: parseFloat(data.avg_price) || 0,
      timestamp: data.updated_time ? new Date(data.updated_time).toISOString() : new Date().toISOString(),
    };
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    if (this.connection?.status !== 'connected') {
      throw new Error('Not connected to ByBit');
    }

    const response = await this.apiClient.post('/api/orders/cancel', {
      broker: 'bybit',
      orderId,
    });

    const result = response.data;
    return result.cancelled === true;
  }

  async runTests(categories?: string[]): Promise<TestResult[]> {
    const response = await this.apiClient.post('/api/broker/test', {
      broker: 'bybit',
      categories: categories || ['authentication', 'market-data', 'account-data'],
    });

    return response.data;
  }

  async runTest(testId: string): Promise<TestResult> {
    const response = await this.apiClient.post(`/api/broker/test/${testId}`, {
      broker: 'bybit',
    });

    return response.data;
  }

  // ByBit-specific test methods
  async testConnection(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      if (!this.credentials) {
        throw new Error('No credentials provided');
      }

      await this.connect(this.credentials);
      
      return {
        testId: 'bybit-connection',
        category: 'authentication',
        name: 'ByBit Connection Test',
        status: 'passed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          apiKey: this.credentials.apiKey ? '••••••••' : 'Not provided',
          testnet: this.credentials.testnet ?? true,
        },
      };
    } catch (error) {
      return {
        testId: 'bybit-connection',
        category: 'authentication',
        name: 'ByBit Connection Test',
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
      // Test with BTCUSDT
      const data = await this.getMarketData('BTCUSDT');
      
      return {
        testId: 'bybit-market-data',
        category: 'market-data',
        name: 'ByBit Market Data Test',
        status: 'passed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          symbol: 'BTCUSDT',
          bid: data.bid,
          ask: data.ask,
          last: data.last,
        },
      };
    } catch (error) {
      return {
        testId: 'bybit-market-data',
        category: 'market-data',
        name: 'ByBit Market Data Test',
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
        testId: 'bybit-account-data',
        category: 'account-data',
        name: 'ByBit Account Data Test',
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
        testId: 'bybit-account-data',
        category: 'account-data',
        name: 'ByBit Account Data Test',
        status: 'failed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Account data test failed',
      };
    }
  }

  // Helper method to validate ByBit credentials
  static validateCredentials(credentials: BrokerCredentials): credentials is ByBitCredentials {
    const bybitCreds = credentials as ByBitCredentials;
    return !!(bybitCreds.apiKey && bybitCreds.secretKey);
  }
}