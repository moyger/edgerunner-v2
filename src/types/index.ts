// Core Trading Platform Types
// These types preserve all existing component interfaces while adding structure

export type TabId = 'dashboard' | 'strategies' | 'backtest' | 'journal' | 'settings' | 'notifications' | 'docs' | 'api-testing';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'stopped' | 'draft';
  type: 'long' | 'short' | 'hedge' | 'arbitrage';
  createdAt: string;
  updatedAt: string;
  performance: StrategyPerformance;
  config: StrategyConfig;
}

export interface StrategyPerformance {
  totalReturn: number;
  dailyReturn: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWinSize: number;
  avgLossSize: number;
}

export interface StrategyConfig {
  universe: string[];
  entryLogic: EntryLogicConfig;
  exitLogic: ExitLogicConfig;
  riskManagement: RiskManagementConfig;
  backtestSettings: BacktestConfig;
}

export interface EntryLogicConfig {
  indicators: IndicatorConfig[];
  conditions: LogicCondition[];
  timeframe: string;
}

export interface ExitLogicConfig {
  stopLoss: number;
  takeProfit: number;
  trailingStop: number;
  conditions: LogicCondition[];
}

export interface RiskManagementConfig {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  leverageLimit: number;
}

export interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  benchmark: string;
}

export interface IndicatorConfig {
  type: string;
  parameters: Record<string, any>;
  period: number;
}

export interface LogicCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'cross_above' | 'cross_below';
  value: number | string;
  logic: 'and' | 'or';
}

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  openDate: string;
  strategyId: string;
  status: 'open' | 'closed' | 'pending';
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  fees: number;
  pnl: number;
  timestamp: string;
  strategyId: string;
  positionId: string;
  notes?: string;
}

export interface Portfolio {
  totalValue: number;
  cash: number;
  positions: Position[];
  totalPnL: number;
  dailyPnL: number;
  totalReturn: number;
  dailyReturn: number;
}

export interface ChartData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface EquityData extends ChartData {
  drawdown: number;
  benchmark?: number;
}

// UI State Types (preserving all existing interactions)
export interface UIState {
  activeTab: TabId;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket Types for Real-time Data
export interface RealTimeUpdate {
  type: 'position_update' | 'strategy_signal' | 'market_data' | 'trade_execution';
  payload: any;
  timestamp: string;
}

// API Integration Types
export type BrokerId = 'bybit' | 'ibkr' | 'mt5' | 'alpaca';

export interface BrokerCredentials {
  apiKey?: string;
  secretKey?: string;
  username?: string;
  password?: string;
  testnet?: boolean;
  [key: string]: any;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface OrderBookUpdate {
  symbol: string;
  bids: Array<[number, number]>;
  asks: Array<[number, number]>;
  timestamp: number;
}

export interface TradeUpdate {
  symbol: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Settings Types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  trading: TradingSettings;
  display: DisplaySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  tradingAlerts: boolean;
  systemUpdates: boolean;
  marketNews: boolean;
}

export interface TradingSettings {
  defaultRiskLevel: number;
  autoExecute: boolean;
  confirmTrades: boolean;
  maxDailyTrades: number;
}

export interface DisplaySettings {
  currency: 'USD' | 'EUR' | 'GBP';
  timeZone: string;
  chartTheme: 'light' | 'dark';
  compactMode: boolean;
}