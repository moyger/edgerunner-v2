/**
 * Broker API Integration Types
 * Based on API-INTEGRATION.md specifications
 */

export interface BrokerConnection {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastChecked: string;
  error?: string;
}

export interface BrokerCredentials {
  [key: string]: string | number | boolean | undefined;
}

export interface AccountSummary {
  accountId: string;
  totalCash: number;
  totalValue: number;
  buyingPower: number;
  marginUsed: number;
  netLiquidation: number;
  currency: string;
}

export interface Position {
  symbol: string;
  position: number;
  marketPrice: number;
  marketValue: number;
  averageCost: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface Order {
  orderId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  orderType: 'MKT' | 'LMT' | 'STP';
  totalQuantity: number;
  lmtPrice?: number;
  auxPrice?: number;
  status: 'PendingSubmit' | 'Submitted' | 'Filled' | 'Cancelled' | 'Error';
  filled: number;
  remaining: number;
  avgFillPrice: number;
  timestamp: string;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface HistoricalData {
  symbol: string;
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export interface TestResult {
  testId: string;
  category: string;
  name: string;
  status: 'passed' | 'failed' | 'running' | 'not-run';
  duration?: number;
  timestamp?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface BrokerAdapter {
  // Connection Management
  connect(credentials: BrokerCredentials): Promise<BrokerConnection>;
  disconnect(): Promise<void>;
  getConnectionStatus(): Promise<BrokerConnection>;
  
  // Account Information
  getAccountSummary(): Promise<AccountSummary>;
  getPositions(): Promise<Position[]>;
  
  // Market Data
  getMarketData(symbol: string): Promise<MarketData>;
  getHistoricalData(symbol: string, duration: string, barSize: string): Promise<HistoricalData>;
  
  // Order Management
  placeOrder(order: Partial<Order>): Promise<Order>;
  getOrderStatus(orderId: string): Promise<Order>;
  cancelOrder(orderId: string): Promise<boolean>;
  
  // Testing
  runTests(categories?: string[]): Promise<TestResult[]>;
  runTest(testId: string): Promise<TestResult>;
}