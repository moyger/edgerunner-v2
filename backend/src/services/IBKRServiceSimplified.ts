import { EventEmitter } from 'events';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import {
  IBKRCredentials,
  ConnectionStatus,
  MarketDataStatus,
  MarketDataSnapshot,
  MarketDataField,
  MarketDataSubscription,
  OrderRequest,
  Order,
  OrderResponse,
  IBKRPosition,
  AccountSummary,
  IBKRError,
  ErrorSeverity,
  ExecutionReport,
  ConnectionHealth
} from '../types/ibkr';
import { ibkrLogger, logIBKREvent, logOrderEvent, logMarketDataEvent, logError } from '../utils/logger';
import config from '../config';

export class IBKRService extends EventEmitter {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private marketDataStatus: MarketDataStatus = 'inactive';
  private credentials: IBKRCredentials | null = null;
  private subscriptions = new Map<string, MarketDataSubscription>();
  private orders = new Map<number, Order>();
  private positions = new Map<string, IBKRPosition>();
  private accountSummary: AccountSummary | null = null;
  private cache = new NodeCache({ stdTTL: config.cache.ttl, maxKeys: config.cache.maxKeys });
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat = new Date();
  private nextOrderId = 1;
  private reqIdCounter = 1;

  constructor() {
    super();
    this.setupCleanup();
    this.setupMockData();
  }

  // ===== CONNECTION MANAGEMENT =====

  async connect(credentials: IBKRCredentials): Promise<void> {
    try {
      this.credentials = credentials;
      this.setConnectionStatus('connecting');
      
      logIBKREvent('connection_attempt', { 
        host: credentials.host, 
        port: credentials.connectionPort,
        clientId: credentials.clientId,
        isPaper: credentials.isPaper 
      });

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      
      // Initialize mock data
      this.initializeMockData();
      
      logIBKREvent('connection_established', { clientId: credentials.clientId });
      this.emit('connected');

    } catch (error) {
      this.setConnectionStatus('error');
      logError(error as Error, { context: 'IBKRService.connect' });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.setConnectionStatus('disconnected');
      this.setMarketDataStatus('inactive');
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      this.clearCaches();
      logIBKREvent('disconnected');
      this.emit('disconnected');

    } catch (error) {
      logError(error as Error, { context: 'IBKRService.disconnect' });
      throw error;
    }
  }

  // ===== MARKET DATA =====

  async subscribeToMarketData(symbols: string[], fields: MarketDataField[] = [MarketDataField.LAST, MarketDataField.BID, MarketDataField.ASK]): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Not connected to IBKR');
    }

    const subscriptionId = uuidv4();
    const subscription: MarketDataSubscription = {
      id: subscriptionId,
      symbols,
      fields,
      frequency: 'streaming',
      active: true,
      onUpdate: (data) => this.emit('marketDataUpdate', data),
      onError: (error) => this.emit('error', error)
    };

    this.subscriptions.set(subscriptionId, subscription);

    try {
      for (const symbol of symbols) {
        this.startMockMarketData(symbol);
        logMarketDataEvent('subscription_started', symbol, { subscriptionId });
      }

      this.setMarketDataStatus('active');
      return subscriptionId;

    } catch (error) {
      this.subscriptions.delete(subscriptionId);
      logError(error as Error, { context: 'subscribeToMarketData', symbols });
      throw error;
    }
  }

  async unsubscribeFromMarketData(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.active = false;
    this.subscriptions.delete(subscriptionId);
    logMarketDataEvent('subscription_cancelled', '', { subscriptionId });
  }

  // ===== ORDER MANAGEMENT =====

  async placeOrder(orderRequest: OrderRequest): Promise<OrderResponse> {
    if (!this.isConnected()) {
      throw new Error('Not connected to IBKR');
    }

    try {
      const orderId = this.nextOrderId++;
      
      const order: Order = {
        orderId: orderId,
        permId: orderId,
        symbol: orderRequest.symbol,
        action: orderRequest.action,
        quantity: orderRequest.quantity,
        orderType: orderRequest.orderType,
        price: orderRequest.price,
        auxPrice: orderRequest.auxPrice,
        status: 'PendingSubmit',
        filled: 0,
        remaining: orderRequest.quantity,
        avgFillPrice: 0,
        lastFillPrice: 0,
        commission: 0,
        timestamp: new Date().toISOString(),
        strategyId: orderRequest.strategyId,
        account: orderRequest.accountId || 'DU123456'
      };

      this.orders.set(orderId, order);

      // Simulate order processing
      setTimeout(() => {
        this.simulateOrderFill(orderId);
      }, 1000);

      logOrderEvent('order_placed', orderId, {
        symbol: orderRequest.symbol,
        action: orderRequest.action,
        quantity: orderRequest.quantity,
        orderType: orderRequest.orderType
      });

      return {
        orderId: orderId,
        status: 'PendingSubmit',
        filled: 0,
        avgFillPrice: 0,
        remaining: orderRequest.quantity,
        timestamp: order.timestamp,
        commission: 0,
        order
      };

    } catch (error) {
      logError(error as Error, { context: 'placeOrder', orderRequest });
      throw error;
    }
  }

  async cancelOrder(orderId: number): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to IBKR');
    }

    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    order.status = 'Cancelled';
    this.orders.set(orderId, order);
    this.emit('orderUpdate', order);

    logOrderEvent('order_cancelled', orderId);
  }

  // ===== PORTFOLIO =====

  getPositions(): IBKRPosition[] {
    return Array.from(this.positions.values());
  }

  getAccountSummary(): AccountSummary | null {
    return this.accountSummary;
  }

  getConnectionHealth(): ConnectionHealth {
    return {
      isConnected: this.isConnected(),
      lastHeartbeat: this.lastHeartbeat.toISOString(),
      connectionDuration: this.isConnected() ? Date.now() - this.lastHeartbeat.getTime() : 0,
      reconnectAttempts: this.reconnectAttempts,
      dataQuality: this.marketDataStatus === 'active' ? 'good' : 'unavailable'
    };
  }

  getOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getMarketData(symbol: string): MarketDataSnapshot | null {
    return this.cache.get(`market_data_${symbol}`) || null;
  }

  // ===== MOCK DATA SETUP =====

  private setupMockData(): void {
    // Set up some mock positions
    const mockPositions: IBKRPosition[] = [
      {
        account: 'DU123456',
        symbol: 'AAPL',
        position: 100,
        marketPrice: 180.50,
        marketValue: 18050,
        averageCost: 175.25,
        unrealizedPnL: 525,
        realizedPnL: 0,
        conId: 265598
      },
      {
        account: 'DU123456',
        symbol: 'MSFT',
        position: 50,
        marketPrice: 350.75,
        marketValue: 17537.50,
        averageCost: 340.00,
        unrealizedPnL: 537.50,
        realizedPnL: 0,
        conId: 272093
      }
    ];

    mockPositions.forEach(position => {
      const key = `${position.account}_${position.symbol}`;
      this.positions.set(key, position);
    });

    // Set up mock account summary
    this.accountSummary = {
      account: 'DU123456',
      currency: 'USD',
      netLiquidation: 100000,
      totalCashValue: 64412.50,
      settledCash: 64412.50,
      accrualCash: 0,
      buyingPower: 400000,
      equityWithLoanValue: 100000,
      previousDayEquityWithLoanValue: 99000,
      grossPositionValue: 35587.50,
      regTEquity: 100000,
      regTMargin: 0,
      sma: 0,
      initMarginReq: 0,
      maintMarginReq: 0,
      availableFunds: 100000,
      excessLiquidity: 100000,
      cushion: 1.0,
      fullInitMarginReq: 0,
      fullMaintMarginReq: 0,
      fullAvailableFunds: 100000,
      fullExcessLiquidity: 100000,
      lookAheadNextChange: 0,
      lookAheadInitMarginReq: 0,
      lookAheadMaintMarginReq: 0,
      lookAheadAvailableFunds: 100000,
      lookAheadExcessLiquidity: 100000,
      highestSeverity: '',
      dayTradesRemaining: 3,
      leverage: 1.0
    };
  }

  private initializeMockData(): void {
    // Emit initial data
    this.emit('accountUpdate', this.accountSummary);
    
    Array.from(this.positions.values()).forEach(position => {
      this.emit('positionUpdate', position);
    });
  }

  private startMockMarketData(symbol: string): void {
    const basePrice = this.getBasePriceForSymbol(symbol);
    
    const updateMarketData = () => {
      if (!this.isConnected() || this.marketDataStatus !== 'active') {
        return;
      }

      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility * basePrice;
      const newPrice = Math.max(basePrice + change, 0.01);
      
      const snapshot: MarketDataSnapshot = {
        symbol,
        conId: this.getConIdForSymbol(symbol),
        last: Number(newPrice.toFixed(2)),
        bid: Number((newPrice - 0.01).toFixed(2)),
        ask: Number((newPrice + 0.01).toFixed(2)),
        high: Number((newPrice * 1.02).toFixed(2)),
        low: Number((newPrice * 0.98).toFixed(2)),
        close: basePrice,
        volume: Math.floor(Math.random() * 1000000),
        open: basePrice,
        bidSize: Math.floor(Math.random() * 1000) + 100,
        askSize: Math.floor(Math.random() * 1000) + 100,
        lastSize: Math.floor(Math.random() * 500) + 50,
        change: newPrice - basePrice,
        changePercent: ((newPrice - basePrice) / basePrice) * 100,
        timestamp: new Date().toISOString()
      };

      this.cache.set(`market_data_${symbol}`, snapshot);
      
      this.emit('marketDataUpdate', {
        symbol,
        field: MarketDataField.LAST,
        value: snapshot.last,
        timestamp: snapshot.timestamp
      });
    };

    // Update every 2 seconds
    const interval = setInterval(updateMarketData, 2000);
    
    // Clean up interval when disconnected
    this.once('disconnected', () => {
      clearInterval(interval);
    });

    // Initial update
    updateMarketData();
  }

  private simulateOrderFill(orderId: number): void {
    const order = this.orders.get(orderId);
    if (!order || order.status !== 'PendingSubmit') {
      return;
    }

    // Simulate order progression
    order.status = 'Submitted';
    this.emit('orderUpdate', order);

    setTimeout(() => {
      if (order.status === 'Submitted') {
        order.status = 'Filled';
        order.filled = order.quantity;
        order.remaining = 0;
        order.avgFillPrice = order.price || this.getBasePriceForSymbol(order.symbol);
        order.lastFillPrice = order.avgFillPrice;
        order.commission = order.quantity * 0.005; // $0.005 per share

        this.orders.set(orderId, order);
        this.emit('orderUpdate', order);
        this.emit('orderFilled', order);

        // Create execution report
        const execution: ExecutionReport = {
          orderId: order.orderId,
          execId: `exec_${Date.now()}`,
          symbol: order.symbol,
          side: order.action === 'BUY' ? 'BOT' : 'SLD',
          shares: order.quantity,
          price: order.avgFillPrice,
          time: new Date().toISOString(),
          commission: order.commission,
          realizedPnL: 0,
          account: order.account
        };

        this.emit('executionReport', execution);
      }
    }, 1000);
  }

  private getBasePriceForSymbol(symbol: string): number {
    const prices: Record<string, number> = {
      'AAPL': 180.50,
      'MSFT': 350.75,
      'GOOGL': 2800.00,
      'AMZN': 3200.00,
      'TSLA': 250.00,
      'SPY': 450.00,
      'QQQ': 380.00
    };
    return prices[symbol] || 100.00;
  }

  private getConIdForSymbol(symbol: string): number {
    const conIds: Record<string, number> = {
      'AAPL': 265598,
      'MSFT': 272093,
      'GOOGL': 208813720,
      'AMZN': 3691937,
      'TSLA': 76792991,
      'SPY': 756733,
      'QQQ': 320227571
    };
    return conIds[symbol] || Math.floor(Math.random() * 1000000);
  }

  // ===== UTILITY METHODS =====

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emit('connectionStatusChanged', status);
    }
  }

  private setMarketDataStatus(status: MarketDataStatus): void {
    if (this.marketDataStatus !== status) {
      this.marketDataStatus = status;
      this.emit('marketDataStatusChanged', status);
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = new Date();
      this.emit('heartbeat');
    }, config.websocket.heartbeatInterval);
  }

  private clearCaches(): void {
    this.cache.flushAll();
    this.subscriptions.clear();
    this.orders.clear();
    this.positions.clear();
    this.accountSummary = null;
  }

  private setupCleanup(): void {
    const cleanup = () => {
      this.disconnect().catch(console.error);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }

  // ===== PUBLIC GETTERS =====

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getMarketDataStatus(): MarketDataStatus {
    return this.marketDataStatus;
  }
}