/**
 * Real-Time Data Service
 * Manages real-time market data streaming with WebSocket connections
 */

import { webSocketManager, WebSocketMessage, WebSocketState } from './WebSocketManager';
import { rateLimiter } from './RateLimiter';
import type { MarketData } from './brokers/types';

export interface PriceUpdate {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: string;
  exchange?: string;
}

export interface OrderBookUpdate {
  symbol: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  timestamp: string;
}

export interface TradeUpdate {
  symbol: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: string;
  tradeId: string;
}

export interface SubscriptionOptions {
  symbols: string[];
  dataTypes: ('price' | 'orderbook' | 'trades')[];
  throttleMs?: number;
  maxUpdatesPerSecond?: number;
}

export interface DataSubscription {
  id: string;
  symbols: Set<string>;
  dataTypes: Set<string>;
  callback: (data: PriceUpdate | OrderBookUpdate | TradeUpdate) => void;
  errorCallback?: (error: Error) => void;
  options: SubscriptionOptions;
  lastUpdate: number;
  updateCount: number;
  isThrottled: boolean;
}

export class RealTimeDataService {
  private subscriptions = new Map<string, DataSubscription>();
  private symbolSubscribers = new Map<string, Set<string>>();
  private dataCache = new Map<string, PriceUpdate>();
  private connectionRetryCount = 0;
  private maxConnectionRetries = 5;
  private isInitialized = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private throttleTimers = new Map<string, NodeJS.Timeout>();

  constructor(private baseUrl: string = 'ws://localhost:8000/ws') {
    this.initialize();
  }

  /**
   * Initialize the real-time data service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await webSocketManager.connect();
      this.setupMessageHandlers();
      this.startHeartbeat();
      this.isInitialized = true;
      this.connectionRetryCount = 0;

      console.log('Real-time data service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize real-time data service:', error);
      this.handleConnectionError(error instanceof Error ? error : new Error('Initialization failed'));
    }
  }

  /**
   * Subscribe to real-time data
   */
  subscribe(
    options: SubscriptionOptions,
    callback: (data: PriceUpdate | OrderBookUpdate | TradeUpdate) => void,
    errorCallback?: (error: Error) => void
  ): string {
    const subscriptionId = this.generateId();
    
    const subscription: DataSubscription = {
      id: subscriptionId,
      symbols: new Set(options.symbols),
      dataTypes: new Set(options.dataTypes),
      callback,
      errorCallback,
      options,
      lastUpdate: 0,
      updateCount: 0,
      isThrottled: false,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Track symbol subscriptions
    for (const symbol of options.symbols) {
      if (!this.symbolSubscribers.has(symbol)) {
        this.symbolSubscribers.set(symbol, new Set());
      }
      this.symbolSubscribers.get(symbol)!.add(subscriptionId);
    }

    // Send subscription messages
    this.sendSubscriptionMessages(subscription);

    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time data
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    // Remove from symbol subscribers
    for (const symbol of subscription.symbols) {
      const subscribers = this.symbolSubscribers.get(symbol);
      if (subscribers) {
        subscribers.delete(subscriptionId);
        if (subscribers.size === 0) {
          this.symbolSubscribers.delete(symbol);
          this.sendUnsubscribeMessage(symbol);
        }
      }
    }

    // Clear throttle timer if exists
    const timer = this.throttleTimers.get(subscriptionId);
    if (timer) {
      clearTimeout(timer);
      this.throttleTimers.delete(subscriptionId);
    }

    this.subscriptions.delete(subscriptionId);
    return true;
  }

  /**
   * Get current subscription status
   */
  getSubscriptionStatus(): {
    active: number;
    symbols: string[];
    connectionState: WebSocketState;
    dataTypes: string[];
  } {
    const symbols = Array.from(this.symbolSubscribers.keys());
    const dataTypes = new Set<string>();
    
    for (const subscription of this.subscriptions.values()) {
      for (const type of subscription.dataTypes) {
        dataTypes.add(type);
      }
    }

    return {
      active: this.subscriptions.size,
      symbols,
      connectionState: webSocketManager.getState(),
      dataTypes: Array.from(dataTypes),
    };
  }

  /**
   * Get cached market data for a symbol
   */
  getCachedData(symbol: string): PriceUpdate | null {
    return this.dataCache.get(symbol) || null;
  }

  /**
   * Get all cached market data
   */
  getAllCachedData(): Map<string, PriceUpdate> {
    return new Map(this.dataCache);
  }

  /**
   * Force reconnection
   */
  async reconnect(): Promise<void> {
    await webSocketManager.disconnect();
    await this.initialize();
    
    // Resubscribe to all active subscriptions
    for (const subscription of this.subscriptions.values()) {
      this.sendSubscriptionMessages(subscription);
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    subscriptions: number;
    symbols: number;
    cachedPrices: number;
    connectionState: WebSocketState;
    wsStats: any;
    updateCounts: Record<string, number>;
  } {
    const updateCounts: Record<string, number> = {};
    for (const [id, sub] of this.subscriptions.entries()) {
      updateCounts[id] = sub.updateCount;
    }

    return {
      subscriptions: this.subscriptions.size,
      symbols: this.symbolSubscribers.size,
      cachedPrices: this.dataCache.size,
      connectionState: webSocketManager.getState(),
      wsStats: webSocketManager.getStats(),
      updateCounts,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Unsubscribe from all
    for (const subscriptionId of this.subscriptions.keys()) {
      this.unsubscribe(subscriptionId);
    }

    // Clear timers
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const timer of this.throttleTimers.values()) {
      clearTimeout(timer);
    }
    this.throttleTimers.clear();

    // Clear caches
    this.dataCache.clear();
    this.symbolSubscribers.clear();
    
    this.isInitialized = false;
  }

  private setupMessageHandlers(): void {
    // Subscribe to market data messages
    webSocketManager.subscribe('market-data', (message: WebSocketMessage) => {
      this.handleMarketDataMessage(message);
    }, (error: Error) => {
      console.error('WebSocket market data error:', error);
      this.handleConnectionError(error);
    });

    // Subscribe to order book messages
    webSocketManager.subscribe('orderbook', (message: WebSocketMessage) => {
      this.handleOrderBookMessage(message);
    });

    // Subscribe to trade messages
    webSocketManager.subscribe('trades', (message: WebSocketMessage) => {
      this.handleTradeMessage(message);
    });

    // Subscribe to error messages
    webSocketManager.subscribe('error', (message: WebSocketMessage) => {
      console.error('Real-time data error:', message.data);
      this.notifySubscribers('error', message.data.symbol, new Error(message.data.error));
    });
  }

  private handleMarketDataMessage(message: WebSocketMessage): void {
    try {
      const data = message.data;
      const priceUpdate: PriceUpdate = {
        symbol: data.symbol,
        bid: parseFloat(data.bid) || 0,
        ask: parseFloat(data.ask) || 0,
        last: parseFloat(data.last) || 0,
        volume: parseFloat(data.volume) || 0,
        change: parseFloat(data.change) || 0,
        changePercent: parseFloat(data.changePercent) || 0,
        timestamp: data.timestamp || new Date().toISOString(),
        exchange: data.exchange,
      };

      // Update cache
      this.dataCache.set(priceUpdate.symbol, priceUpdate);

      // Notify subscribers
      this.notifySubscribers('price', priceUpdate.symbol, priceUpdate);
    } catch (error) {
      console.error('Error processing market data message:', error);
    }
  }

  private handleOrderBookMessage(message: WebSocketMessage): void {
    try {
      const data = message.data;
      const orderBookUpdate: OrderBookUpdate = {
        symbol: data.symbol,
        bids: data.bids || [],
        asks: data.asks || [],
        timestamp: data.timestamp || new Date().toISOString(),
      };

      this.notifySubscribers('orderbook', orderBookUpdate.symbol, orderBookUpdate);
    } catch (error) {
      console.error('Error processing order book message:', error);
    }
  }

  private handleTradeMessage(message: WebSocketMessage): void {
    try {
      const data = message.data;
      const tradeUpdate: TradeUpdate = {
        symbol: data.symbol,
        price: parseFloat(data.price) || 0,
        size: parseFloat(data.size) || 0,
        side: data.side || 'buy',
        timestamp: data.timestamp || new Date().toISOString(),
        tradeId: data.tradeId || this.generateId(),
      };

      this.notifySubscribers('trades', tradeUpdate.symbol, tradeUpdate);
    } catch (error) {
      console.error('Error processing trade message:', error);
    }
  }

  private notifySubscribers(
    dataType: string, 
    symbol: string, 
    data: PriceUpdate | OrderBookUpdate | TradeUpdate | Error
  ): void {
    const subscribers = this.symbolSubscribers.get(symbol);
    if (!subscribers) {
      return;
    }

    for (const subscriptionId of subscribers) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription || !subscription.dataTypes.has(dataType)) {
        continue;
      }

      try {
        if (data instanceof Error) {
          if (subscription.errorCallback) {
            subscription.errorCallback(data);
          }
        } else {
          // Apply throttling
          if (this.shouldThrottle(subscription)) {
            continue;
          }

          subscription.callback(data);
          subscription.lastUpdate = Date.now();
          subscription.updateCount++;
        }
      } catch (error) {
        console.error('Error in subscription callback:', error);
        if (subscription.errorCallback) {
          subscription.errorCallback(error instanceof Error ? error : new Error('Callback error'));
        }
      }
    }
  }

  private shouldThrottle(subscription: DataSubscription): boolean {
    if (!subscription.options.throttleMs && !subscription.options.maxUpdatesPerSecond) {
      return false;
    }

    const now = Date.now();
    
    // Throttle by time
    if (subscription.options.throttleMs && 
        now - subscription.lastUpdate < subscription.options.throttleMs) {
      return true;
    }

    // Throttle by rate
    if (subscription.options.maxUpdatesPerSecond) {
      const windowStart = now - 1000; // 1 second window
      const recentUpdates = subscription.updateCount; // Simplified for demo
      
      if (recentUpdates >= subscription.options.maxUpdatesPerSecond) {
        return true;
      }
    }

    return false;
  }

  private sendSubscriptionMessages(subscription: DataSubscription): void {
    for (const symbol of subscription.symbols) {
      for (const dataType of subscription.dataTypes) {
        webSocketManager.sendMessage({
          id: this.generateId(),
          type: 'subscribe',
          data: {
            channel: dataType,
            symbol,
            throttle: subscription.options.throttleMs,
            maxUpdates: subscription.options.maxUpdatesPerSecond,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  private sendUnsubscribeMessage(symbol: string): void {
    webSocketManager.sendMessage({
      id: this.generateId(),
      type: 'unsubscribe',
      data: { symbol },
      timestamp: new Date().toISOString(),
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (webSocketManager.getState() === WebSocketState.CONNECTED) {
        webSocketManager.sendMessage({
          id: this.generateId(),
          type: 'heartbeat',
          data: { timestamp: Date.now() },
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000); // 30 seconds
  }

  private handleConnectionError(error: Error): void {
    console.error('Real-time data service connection error:', error);
    
    // Notify all subscription error callbacks
    for (const subscription of this.subscriptions.values()) {
      if (subscription.errorCallback) {
        subscription.errorCallback(error);
      }
    }

    // Attempt reconnection with backoff
    if (this.connectionRetryCount < this.maxConnectionRetries) {
      this.connectionRetryCount++;
      const delay = Math.min(1000 * Math.pow(2, this.connectionRetryCount), 30000);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.connectionRetryCount}/${this.maxConnectionRetries})`);
        this.reconnect().catch(console.error);
      }, delay);
    } else {
      console.error('Max connection retries reached, giving up');
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}

// Singleton instance
export const realTimeDataService = new RealTimeDataService();