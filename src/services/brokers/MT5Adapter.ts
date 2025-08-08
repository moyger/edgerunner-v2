/**
 * MetaTrader 5 Broker Adapter
 * Frontend adapter for MT5 broker integration
 */

import type { 
  BrokerAdapter, 
  BrokerConnection, 
  BrokerCredentials, 
  TestResult,
  AccountSummary,
  Position,
  MarketData,
  HistoricalData,
  Order
} from './types';

export interface MT5Credentials extends BrokerCredentials {
  login: string;
  password: string;
  server: string;
}

export class MT5Adapter implements BrokerAdapter {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async connect(credentials: BrokerCredentials): Promise<BrokerConnection> {
    try {
      const response = await fetch(`${this.baseUrl}/api/broker/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broker: 'mt5',
          credentials: {
            // Backend expects `username` for MT5 login
            username: (credentials as any).username ?? (credentials as any).login,
            password: (credentials as any).password,
            server: (credentials as any).server,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Connection failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: 'mt5',
        name: 'MetaTrader 5',
        status: data.status || 'connected',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error('MT5 connection error:', error);
      return {
        id: 'mt5',
        name: 'MetaTrader 5',
        status: 'error',
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  async disconnect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/broker/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ broker: 'mt5' }),
      });

      if (!response.ok) {
        throw new Error(`Disconnect failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('MT5 disconnect error:', error);
      throw error;
    }
  }

  async getConnectionStatus(): Promise<BrokerConnection> {
    try {
      const response = await fetch(`${this.baseUrl}/api/broker/status?broker=mt5`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: 'mt5',
        name: 'MetaTrader 5',
        status: data.status || 'disconnected',
        lastChecked: new Date().toISOString(),
        error: data.error,
      };
    } catch (error) {
      return {
        id: 'mt5',
        name: 'MetaTrader 5',
        status: 'error',
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Status check failed',
      };
    }
  }

  async getAccountSummary(): Promise<AccountSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/api/account/summary?broker=mt5`);
      
      if (!response.ok) {
        throw new Error(`Account data request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accountId: data.account_id || '',
        totalCash: data.total_cash || 0,
        totalValue: data.total_value || 0,
        buyingPower: data.buying_power || 0,
        marginUsed: data.margin_used || 0,
        netLiquidation: data.net_liquidation || 0,
        currency: data.currency || 'USD',
      };
    } catch (error) {
      console.error('MT5 account summary error:', error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/positions?broker=mt5`);
      
      if (!response.ok) {
        throw new Error(`Positions request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map((pos: any) => ({
        symbol: pos.symbol || '',
        position: pos.position || 0,
        marketPrice: pos.market_price || 0,
        marketValue: pos.market_value || 0,
        averageCost: pos.average_cost || 0,
        unrealizedPnL: pos.unrealized_pnl || 0,
        realizedPnL: pos.realized_pnl || 0,
      }));
    } catch (error) {
      console.error('MT5 positions error:', error);
      throw error;
    }
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    try {
      const params = new URLSearchParams({ broker: 'mt5', symbol });
      const response = await fetch(`${this.baseUrl}/api/market-data?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Market data request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        symbol: data.symbol || symbol,
        bid: data.bid || 0,
        ask: data.ask || 0,
        last: data.last || 0,
        high: data.high || 0,
        low: data.low || 0,
        close: data.close || 0,
        volume: data.volume || 0,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('MT5 market data error:', error);
      throw error;
    }
  }

  async getHistoricalData(symbol: string, duration: string, barSize: string): Promise<HistoricalData> {
    try {
      const params = new URLSearchParams({ broker: 'mt5', symbol, duration, bar_size: barSize });
      const response = await fetch(`${this.baseUrl}/api/historical-data?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Historical data request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        symbol: data.symbol || symbol,
        data: data.data || [],
      };
    } catch (error) {
      console.error('MT5 historical data error:', error);
      throw error;
    }
  }

  async placeOrder(order: Partial<Order>): Promise<Order> {
    try {
      const response = await fetch(`${this.baseUrl}/api/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broker: 'mt5',
          symbol: order.symbol,
          action: order.action,
          order_type: order.orderType,
          quantity: order.totalQuantity,
          limit_price: order.lmtPrice,
          stop_price: order.auxPrice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Order placement failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        orderId: data.order_id || '',
        symbol: data.symbol || order.symbol || '',
        action: data.action || order.action || 'BUY',
        orderType: data.order_type || order.orderType || 'MKT',
        totalQuantity: data.total_quantity || order.totalQuantity || 0,
        lmtPrice: data.limit_price || order.lmtPrice,
        auxPrice: data.stop_price || order.auxPrice,
        status: data.status || 'Submitted',
        filled: data.filled || 0,
        remaining: data.remaining || 0,
        avgFillPrice: data.avg_fill_price || 0,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('MT5 order placement error:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<Order> {
    try {
      const params = new URLSearchParams({ broker: 'mt5', order_id: orderId });
      const response = await fetch(`${this.baseUrl}/api/orders/status?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Order status request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        orderId: data.order_id || orderId,
        symbol: data.symbol || '',
        action: data.action || 'BUY',
        orderType: data.order_type || 'MKT',
        totalQuantity: data.total_quantity || 0,
        lmtPrice: data.limit_price,
        auxPrice: data.stop_price,
        status: data.status || 'Unknown',
        filled: data.filled || 0,
        remaining: data.remaining || 0,
        avgFillPrice: data.avg_fill_price || 0,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('MT5 order status error:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ broker: 'mt5', order_id: orderId });
      const response = await fetch(`${this.baseUrl}/api/orders/cancel?${params.toString()}`, {
        method: 'POST',
      });

      return response.ok;
    } catch (error) {
      console.error('MT5 order cancellation error:', error);
      return false;
    }
  }

  async runTests(categories?: string[]): Promise<TestResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/broker/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broker: 'mt5',
          categories: categories || ['authentication', 'market-data', 'account-data'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Test execution failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('MT5 test execution error:', error);
      return [{
        testId: 'mt5-connection',
        category: 'authentication',
        name: 'MT5 Connection Test',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Test execution failed',
      }];
    }
  }

  async runTest(testId: string): Promise<TestResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/broker/test/${encodeURIComponent(testId)}?broker=mt5`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Test execution failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MT5 individual test error:', error);
      return {
        testId,
        category: 'unknown',
        name: `MT5 ${testId} Test`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Test execution failed',
      };
    }
  }

  // MT5-specific methods
  async getAvailableSymbols(limit: number = 100): Promise<string[]> {
    try {
      // Backend provides MT5-specific symbols endpoint
      const response = await fetch(`${this.baseUrl}/api/broker/mt5/symbols?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Symbols request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.symbols || [];
    } catch (error) {
      console.error('MT5 symbols error:', error);
      return [];
    }
  }

  // Helper method to validate MT5 credentials
  static validateCredentials(credentials: BrokerCredentials): credentials is MT5Credentials {
    const mt5Creds = credentials as MT5Credentials;
    // Accept either `login` or `username` for compatibility
    return !!(((mt5Creds as any).login || (mt5Creds as any).username) && mt5Creds.password && mt5Creds.server);
  }
}