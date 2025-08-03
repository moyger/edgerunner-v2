import { z } from 'zod';

// ===== CONNECTION TYPES =====

export interface IBKRCredentials {
  username: string;
  password: string;
  connectionPort: number;
  clientId: number;
  isPaper: boolean;
  host?: string;
}

export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'error' 
  | 'reconnecting';

export type MarketDataStatus = 
  | 'inactive' 
  | 'connecting' 
  | 'active' 
  | 'error';

export interface ConnectionHealth {
  isConnected: boolean;
  lastHeartbeat: string;
  connectionDuration: number;
  reconnectAttempts: number;
  dataQuality: 'good' | 'delayed' | 'stale' | 'unavailable';
}

// ===== MARKET DATA TYPES =====

export enum MarketDataField {
  BID = 1,
  ASK = 2,
  LAST = 4,
  HIGH = 6,
  LOW = 7,
  VOLUME = 8,
  CLOSE = 9,
  BID_SIZE = 0,
  ASK_SIZE = 3,
  LAST_SIZE = 5,
  OPEN = 14
}

export interface MarketDataSnapshot {
  symbol: string;
  conId: number;
  last: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  open: number;
  bidSize: number;
  askSize: number;
  lastSize: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface MarketDataUpdate {
  symbol: string;
  field: MarketDataField;
  value: number;
  timestamp: string;
}

export interface MarketDataSubscription {
  id: string;
  symbols: string[];
  fields: MarketDataField[];
  frequency: 'snapshot' | 'streaming';
  active: boolean;
}

// ===== ORDER TYPES =====

export interface OrderRequest {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MKT' | 'LMT' | 'STP' | 'STP_LMT' | 'TRAIL' | 'TRAIL_LIMIT';
  price?: number;
  auxPrice?: number;
  timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
  strategyId: string;
  riskChecks: RiskParameters;
  accountId?: string;
}

export interface RiskParameters {
  maxOrderValue: number;
  maxPositionSize: number;
  allowedOrderTypes: string[];
  requireConfirmation: boolean;
}

export type OrderStatus = 
  | 'PendingSubmit'
  | 'PendingCancel'
  | 'PreSubmitted'
  | 'Submitted'
  | 'Cancelled'
  | 'Filled'
  | 'Inactive'
  | 'PartiallyFilled'
  | 'ApiCancelled'
  | 'Unknown';

export interface IBKROrder {
  orderId: number;
  permId: number;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: string;
  price?: number;
  auxPrice?: number;
  status: OrderStatus;
  filled: number;
  remaining: number;
  avgFillPrice: number;
  lastFillPrice: number;
  commission: number;
  timestamp: string;
  strategyId: string;
  parentId?: number;
  ocaGroup?: string;
  account: string;
}

export interface OrderResponse {
  orderId: number;
  status: OrderStatus;
  filled: number;
  avgFillPrice: number;
  remaining: number;
  timestamp: string;
  commission: number;
  order: IBKROrder;
}

export interface ExecutionReport {
  orderId: number;
  execId: string;
  symbol: string;
  side: 'BOT' | 'SLD';
  shares: number;
  price: number;
  time: string;
  commission: number;
  realizedPnL: number;
  account: string;
}

// ===== POSITION AND ACCOUNT TYPES =====

export interface IBKRPosition {
  account: string;
  symbol: string;
  position: number;
  marketPrice: number;
  marketValue: number;
  averageCost: number;
  unrealizedPnL: number;
  realizedPnL: number;
  conId: number;
}

export interface AccountSummary {
  account: string;
  currency: string;
  netLiquidation: number;
  totalCashValue: number;
  settledCash: number;
  accrualCash: number;
  buyingPower: number;
  equityWithLoanValue: number;
  previousDayEquityWithLoanValue: number;
  grossPositionValue: number;
  regTEquity: number;
  regTMargin: number;
  sma: number;
  initMarginReq: number;
  maintMarginReq: number;
  availableFunds: number;
  excessLiquidity: number;
  cushion: number;
  fullInitMarginReq: number;
  fullMaintMarginReq: number;
  fullAvailableFunds: number;
  fullExcessLiquidity: number;
  lookAheadNextChange: number;
  lookAheadInitMarginReq: number;
  lookAheadMaintMarginReq: number;
  lookAheadAvailableFunds: number;
  lookAheadExcessLiquidity: number;
  highestSeverity: string;
  dayTradesRemaining: number;
  leverage: number;
}

export interface PortfolioUpdate {
  account: string;
  positions: IBKRPosition[];
  accountSummary: AccountSummary;
  timestamp: string;
}

// ===== ERROR TYPES =====

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface IBKRError {
  id: number;
  code: number;
  message: string;
  severity: ErrorSeverity;
  timestamp: string;
  context?: any;
  recoverable: boolean;
}

// ===== WEBSOCKET MESSAGE TYPES =====

export enum IBKRMessageType {
  MARKET_DATA = 'marketData',
  ORDER_STATUS = 'orderStatus',
  POSITION_UPDATE = 'positionUpdate',
  ACCOUNT_UPDATE = 'accountUpdate',
  EXECUTION_REPORT = 'executionReport',
  ERROR = 'error',
  CONNECTION_STATUS = 'connectionStatus',
  SUBSCRIPTION_CONFIRM = 'subscriptionConfirm',
  HEARTBEAT = 'heartbeat'
}

export interface IBKRMessage {
  id: string;
  type: IBKRMessageType;
  timestamp: string;
  payload: any;
}

export interface WebSocketMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
}

// ===== VALIDATION SCHEMAS =====

export const IBKRCredentialsSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  connectionPort: z.number().int().min(1000).max(65535),
  clientId: z.number().int().min(1).max(2147483647),
  isPaper: z.boolean(),
  host: z.string().optional().default('127.0.0.1')
});

export const OrderRequestSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z]+$/),
  action: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  orderType: z.enum(['MKT', 'LMT', 'STP', 'STP_LMT', 'TRAIL', 'TRAIL_LIMIT']),
  price: z.number().positive().optional(),
  auxPrice: z.number().positive().optional(),
  timeInForce: z.enum(['DAY', 'GTC', 'IOC', 'FOK']),
  strategyId: z.string().uuid(),
  accountId: z.string().optional(),
  riskChecks: z.object({
    maxOrderValue: z.number().positive(),
    maxPositionSize: z.number().positive(),
    allowedOrderTypes: z.array(z.string()),
    requireConfirmation: z.boolean()
  })
});

export const MarketDataSubscriptionSchema = z.object({
  symbols: z.array(z.string().min(1).max(10)).min(1).max(100),
  fields: z.array(z.nativeEnum(MarketDataField)).min(1),
  frequency: z.enum(['snapshot', 'streaming'])
});

// ===== UI STATE TYPES =====

export interface IBKRUIState {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  marketDataStatus: MarketDataStatus;
  lastError: IBKRError | null;
  isConnecting: boolean;
  connectionHealth: ConnectionHealth | null;
  activeSubscriptions: Map<string, MarketDataSubscription>;
  connectionAttempts: number;
  lastConnectionTime: string | null;
}

// ===== API RESPONSE TYPES =====

export interface IBKRApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
  };
  message?: string;
}

// ===== REAL-TIME UPDATE TYPES =====

export interface RealTimePortfolioValue {
  totalValue: number;
  cashValue: number;
  stockValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dayChange: number;
  dayChangePercent: number;
  timestamp: string;
}

export interface PositionWithMarketData extends IBKRPosition {
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  marketDataTimestamp: string;
}

// ===== SUBSCRIPTION MANAGEMENT =====

export interface SubscriptionRequest {
  type: 'market_data' | 'account' | 'orders' | 'positions';
  symbols?: string[];
  fields?: MarketDataField[];
  frequency?: 'snapshot' | 'streaming';
}

export interface SubscriptionResponse {
  subscriptionId: string;
  status: 'active' | 'pending' | 'error';
  message?: string;
}

// ===== TRADING CONTEXT =====

export interface TradingContext {
  isLive: boolean;
  account: string;
  buyingPower: number;
  dayTradesRemaining: number;
  marginRequirement: number;
  riskLimits: {
    maxOrderValue: number;
    maxPositionSize: number;
    maxDailyLoss: number;
  };
}

// ===== HISTORICAL DATA TYPES =====

export interface HistoricalDataRequest {
  symbol: string;
  endDateTime: string;
  durationStr: string;
  barSizeSetting: string;
  whatToShow: 'TRADES' | 'MIDPOINT' | 'BID' | 'ASK' | 'BID_ASK' | 'ADJUSTED_LAST' | 'HISTORICAL_VOLATILITY' | 'OPTION_IMPLIED_VOLATILITY';
  useRTH: boolean;
  formatDate: number;
}

export interface HistoricalBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  barCount: number;
  wap: number;
}

export interface HistoricalDataResponse {
  symbol: string;
  reqId: number;
  bars: HistoricalBar[];
  isComplete: boolean;
}

// ===== PERFORMANCE METRICS =====

export interface IBKRPerformanceMetrics {
  connectionUptime: number;
  messageLatency: number;
  messagesPerSecond: number;
  errorRate: number;
  reconnectCount: number;
  lastReconnectTime: string | null;
  dataQuality: {
    good: number;
    delayed: number;
    stale: number;
    unavailable: number;
  };
}