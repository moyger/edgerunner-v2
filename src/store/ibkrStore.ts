import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { 
  IBKRCredentials,
  ConnectionStatus,
  MarketDataStatus,
  MarketDataSnapshot,
  MarketDataUpdate,
  IBKROrder,
  IBKRPosition,
  AccountSummary,
  IBKRError,
  ConnectionHealth,
  ExecutionReport,
  OrderRequest,
  OrderResponse,
  MarketDataField,
  MarketDataSubscription,
  IBKRUIState,
  TradingContext,
  RealTimePortfolioValue,
  PositionWithMarketData
} from '../types/ibkr';
import { WebSocketClient, createWebSocketClient } from '../services/WebSocketClient';

interface IBKRStore extends IBKRUIState {
  // WebSocket client
  wsClient: WebSocketClient | null;
  
  // Real-time data
  marketData: Map<string, MarketDataSnapshot>;
  orders: Map<number, IBKROrder>;
  positions: Map<string, IBKRPosition>;
  accountSummary: AccountSummary | null;
  executionReports: ExecutionReport[];
  
  // Portfolio calculations (computed on-demand, not stored)
  // realTimePortfolioValue: calculated dynamically
  // positionsWithMarketData: calculated dynamically
  
  // Trading context
  tradingContext: TradingContext | null;
  
  // Performance metrics
  metrics: {
    messageLatency: number;
    messagesPerSecond: number;
    errorRate: number;
    dataQuality: 'good' | 'delayed' | 'stale' | 'unavailable';
  };
  
  // Loading states
  loading: {
    connection: boolean;
    authentication: boolean;
    orders: boolean;
    positions: boolean;
    marketData: boolean;
  };
  
  // Connection actions
  connect: (credentials: IBKRCredentials, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Market data actions
  subscribeToMarketData: (symbols: string[], fields?: MarketDataField[]) => Promise<string>;
  unsubscribeFromMarketData: (subscriptionId: string) => Promise<void>;
  getMarketData: (symbol: string) => MarketDataSnapshot | null;
  
  // Order actions
  placeOrder: (orderRequest: OrderRequest) => Promise<OrderResponse>;
  cancelOrder: (orderId: number) => Promise<void>;
  getOrder: (orderId: number) => IBKROrder | null;
  getActiveOrders: () => IBKROrder[];
  
  // Portfolio actions
  getPositions: () => Promise<IBKRPosition[]>;
  getAccountSummary: () => Promise<AccountSummary>;
  getConnectionHealth: () => Promise<ConnectionHealth>;
  
  // Real-time update handlers
  handleMarketDataUpdate: (data: MarketDataUpdate) => void;
  handleOrderUpdate: (order: IBKROrder) => void;
  handlePositionUpdate: (position: IBKRPosition) => void;
  handleAccountUpdate: (account: AccountSummary) => void;
  handleExecutionReport: (execution: ExecutionReport) => void;
  handleConnectionStatusChange: (status: string) => void;
  handleError: (error: IBKRError) => void;
  
  // Calculated values
  calculateRealTimePortfolioValue: () => RealTimePortfolioValue;
  getPositionsWithMarketData: () => PositionWithMarketData[];
  getTotalUnrealizedPnL: () => number;
  getTotalRealizedPnL: () => number;
  getDayChange: () => number;
  getDayChangePercent: () => number;
  
  // Utility actions
  clearErrors: () => void;
  resetStore: () => void;
  setLoading: (key: keyof IBKRStore['loading'], loading: boolean) => void;
}

const initialState = {
  // Connection state
  isConnected: false,
  connectionStatus: 'disconnected' as ConnectionStatus,
  marketDataStatus: 'inactive' as MarketDataStatus,
  lastError: null,
  connectionHealth: null,
  isConnecting: false,
  connectionAttempts: 0,
  lastConnectionTime: null,
  
  // WebSocket client
  wsClient: null,
  
  // Data maps
  marketData: new Map<string, MarketDataSnapshot>(),
  orders: new Map<number, IBKROrder>(),
  positions: new Map<string, IBKRPosition>(),
  activeSubscriptions: new Map<string, MarketDataSubscription>(),
  
  // Portfolio data
  accountSummary: null,
  executionReports: [],
  tradingContext: null,
  
  // Performance metrics
  metrics: {
    messageLatency: 0,
    messagesPerSecond: 0,
    errorRate: 0,
    dataQuality: 'unavailable' as const
  },
  
  // Loading states
  loading: {
    connection: false,
    authentication: false,
    orders: false,
    positions: false,
    marketData: false
  }
};

export const useIBKRStore = create<IBKRStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        ...initialState,
        
        // ===== CONNECTION ACTIONS =====
        
        connect: async (credentials: IBKRCredentials, token: string) => {
          try {
            set({ isConnecting: true, connectionAttempts: get().connectionAttempts + 1 });
            
            // First authenticate with the proxy server
            const authResponse = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                username: credentials.username, 
                password: credentials.password 
              })
            });
            
            if (!authResponse.ok) {
              throw new Error('Authentication failed');
            }
            
            const authData = await authResponse.json();
            const authToken = authData.token;
            
            // Create WebSocket client
            const wsUrl = `ws://localhost:3003/ws`;
            const wsClient = createWebSocketClient(wsUrl, {
              onConnected: () => {
                set({ 
                  isConnected: true, 
                  connectionStatus: 'connected',
                  isConnecting: false,
                  lastConnectionTime: new Date().toISOString()
                });
              },
              onDisconnected: () => {
                set({ 
                  isConnected: false, 
                  connectionStatus: 'disconnected',
                  marketDataStatus: 'inactive'
                });
              },
              onError: (error) => {
                console.error('WebSocket error:', error);
                set({ 
                  connectionStatus: 'error',
                  isConnecting: false,
                  lastError: { message: 'WebSocket connection error' }
                });
              },
              onMarketDataUpdate: (data) => {
                get().handleMarketDataUpdate(data);
              },
              onOrderUpdate: (order) => {
                get().handleOrderUpdate(order);
              },
              onPositionUpdate: (position) => {
                get().handlePositionUpdate(position);
              },
              onAccountUpdate: (account) => {
                get().handleAccountUpdate(account);
              },
              onExecutionReport: (execution) => {
                get().handleExecutionReport(execution);
              },
              onConnectionStatusChange: (status) => {
                get().handleConnectionStatusChange(status);
              },
              onIBKRError: (error) => {
                get().handleError(error);
              }
            }, { debug: true });
            
            // Connect to WebSocket
            await wsClient.connect(authToken);
            set({ wsClient });
            
            // Connect to IBKR through the proxy
            const ibkrResponse = await fetch('/api/ibkr/connect', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify(credentials)
            });
            
            if (!ibkrResponse.ok) {
              throw new Error('IBKR connection failed');
            }
            
            // Initial data sync
            await get().getAccountSummary();
            await get().getPositions();
            
          } catch (error) {
            console.error('Connection failed:', error);
            set({ 
              connectionStatus: 'error',
              isConnecting: false,
              lastError: error instanceof Error ? { message: error.message } : { message: 'Connection failed' }
            });
            throw error;
          }
        },
        
        disconnect: async () => {
          const { wsClient } = get();
          
          try {
            // Disconnect from IBKR
            const response = await fetch('/api/ibkr/disconnect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            // Disconnect WebSocket
            if (wsClient) {
              wsClient.disconnect();
            }
            
            set({
              ...initialState,
              wsClient: null
            });
            
          } catch (error) {
            console.error('Disconnect failed:', error);
            // Force reset state even if API call fails
            set({
              ...initialState,
              wsClient: null
            });
          }
        },
        
        // ===== MARKET DATA ACTIONS =====
        
        subscribeToMarketData: async (symbols: string[], fields?: MarketDataField[]) => {
          const { wsClient } = get();
          if (!wsClient?.isConnected()) {
            throw new Error('Not connected to WebSocket');
          }
          
          try {
            set({ loading: { ...get().loading, marketData: true } });
            
            const subscriptionId = await wsClient.subscribeToMarketData(symbols, fields);
            
            // Create subscription record
            const subscription: MarketDataSubscription = {
              id: subscriptionId,
              symbols,
              fields: fields || [MarketDataField.LAST, MarketDataField.BID, MarketDataField.ASK],
              frequency: 'streaming',
              active: true
            };
            
            set((state) => ({
              activeSubscriptions: new Map(state.activeSubscriptions).set(subscriptionId, subscription),
              marketDataStatus: 'active',
              loading: { ...state.loading, marketData: false }
            }));
            
            return subscriptionId;
            
          } catch (error) {
            set({ loading: { ...get().loading, marketData: false } });
            throw error;
          }
        },
        
        unsubscribeFromMarketData: async (subscriptionId: string) => {
          const { wsClient } = get();
          if (!wsClient?.isConnected()) {
            throw new Error('Not connected to WebSocket');
          }
          
          await wsClient.unsubscribeFromMarketData(subscriptionId);
          
          set((state) => {
            const newSubscriptions = new Map(state.activeSubscriptions);
            newSubscriptions.delete(subscriptionId);
            return { activeSubscriptions: newSubscriptions };
          });
        },
        
        getMarketData: (symbol: string) => {
          return get().marketData.get(symbol) || null;
        },
        
        // ===== ORDER ACTIONS =====
        
        placeOrder: async (orderRequest: OrderRequest) => {
          const { wsClient } = get();
          if (!wsClient?.isConnected()) {
            throw new Error('Not connected to WebSocket');
          }
          
          try {
            set({ loading: { ...get().loading, orders: true } });
            
            const response = await wsClient.placeOrder(orderRequest);
            
            set({ loading: { ...get().loading, orders: false } });
            return response;
            
          } catch (error) {
            set({ loading: { ...get().loading, orders: false } });
            throw error;
          }
        },
        
        cancelOrder: async (orderId: number) => {
          const { wsClient } = get();
          if (!wsClient?.isConnected()) {
            throw new Error('Not connected to WebSocket');
          }
          
          await wsClient.cancelOrder(orderId);
        },
        
        getOrder: (orderId: number) => {
          return get().orders.get(orderId) || null;
        },
        
        getActiveOrders: () => {
          return Array.from(get().orders.values()).filter(order => 
            !['Filled', 'Cancelled', 'ApiCancelled'].includes(order.status)
          );
        },
        
        // ===== PORTFOLIO ACTIONS =====
        
        getPositions: async () => {
          const { wsClient } = get();
          if (!wsClient?.isConnected()) {
            throw new Error('Not connected to WebSocket');
          }
          
          try {
            set({ loading: { ...get().loading, positions: true } });
            
            const positions = await wsClient.getPositions();
            
            // Update positions map
            const positionsMap = new Map<string, IBKRPosition>();
            positions.forEach(position => {
              const key = `${position.account}_${position.symbol}`;
              positionsMap.set(key, position);
            });
            
            set({ 
              positions: positionsMap,
              loading: { ...get().loading, positions: false }
            });
            
            return positions;
            
          } catch (error) {
            set({ loading: { ...get().loading, positions: false } });
            throw error;
          }
        },
        
        getAccountSummary: async () => {
          const { wsClient } = get();
          if (!wsClient?.isConnected()) {
            throw new Error('Not connected to WebSocket');
          }
          
          const accountSummary = await wsClient.getAccountSummary();
          set({ accountSummary });
          return accountSummary;
        },
        
        getConnectionHealth: async () => {
          const { wsClient } = get();
          if (!wsClient?.isConnected()) {
            throw new Error('Not connected to WebSocket');
          }
          
          const health = await wsClient.getConnectionHealth();
          set({ connectionHealth: health });
          return health;
        },
        
        // ===== REAL-TIME UPDATE HANDLERS =====
        
        handleMarketDataUpdate: (data: MarketDataUpdate) => {
          set((state) => {
            const marketData = new Map(state.marketData);
            const existing = marketData.get(data.symbol) || {
              symbol: data.symbol,
              conId: 0,
              last: 0,
              bid: 0,
              ask: 0,
              high: 0,
              low: 0,
              close: 0,
              volume: 0,
              open: 0,
              bidSize: 0,
              askSize: 0,
              lastSize: 0,
              change: 0,
              changePercent: 0,
              timestamp: data.timestamp
            };
            
            // Update the specific field
            switch (data.field) {
              case MarketDataField.LAST:
                existing.last = data.value;
                existing.change = existing.close ? data.value - existing.close : 0;
                existing.changePercent = existing.close ? (existing.change / existing.close) * 100 : 0;
                break;
              case MarketDataField.BID:
                existing.bid = data.value;
                break;
              case MarketDataField.ASK:
                existing.ask = data.value;
                break;
              case MarketDataField.HIGH:
                existing.high = data.value;
                break;
              case MarketDataField.LOW:
                existing.low = data.value;
                break;
              case MarketDataField.VOLUME:
                existing.volume = data.value;
                break;
            }
            
            existing.timestamp = data.timestamp;
            marketData.set(data.symbol, existing);
            
            // Return only the direct state update - remove calculated values
            return { marketData };
          });
        },
        
        handleOrderUpdate: (order: IBKROrder) => {
          set((state) => ({
            orders: new Map(state.orders).set(order.orderId, order)
          }));
        },
        
        handlePositionUpdate: (position: IBKRPosition) => {
          set((state) => {
            const key = `${position.account}_${position.symbol}`;
            return {
              positions: new Map(state.positions).set(key, position)
            };
          });
        },
        
        handleAccountUpdate: (account: AccountSummary) => {
          set({ 
            accountSummary: account
          });
        },
        
        handleExecutionReport: (execution: ExecutionReport) => {
          set((state) => ({
            executionReports: [execution, ...state.executionReports.slice(0, 99)] // Keep last 100
          }));
        },
        
        handleConnectionStatusChange: (status: string) => {
          set({ connectionStatus: status as ConnectionStatus });
        },
        
        handleError: (error: IBKRError) => {
          set({ lastError: error });
          console.error('IBKR Error:', error);
        },
        
        // ===== CALCULATED VALUES =====
        
        calculateRealTimePortfolioValue: (): RealTimePortfolioValue => {
          const { positions, marketData, accountSummary } = get();
          
          let totalValue = accountSummary?.totalCashValue || 0;
          let stockValue = 0;
          let unrealizedPnL = 0;
          let realizedPnL = 0;
          
          Array.from(positions.values()).forEach(position => {
            const marketPrice = marketData.get(position.symbol)?.last || position.marketPrice;
            const positionValue = position.position * marketPrice;
            
            stockValue += Math.abs(positionValue);
            totalValue += positionValue;
            unrealizedPnL += position.unrealizedPnL;
            realizedPnL += position.realizedPnL;
          });
          
          const previousValue = accountSummary?.previousDayEquityWithLoanValue || totalValue;
          const dayChange = totalValue - previousValue;
          const dayChangePercent = previousValue ? (dayChange / previousValue) * 100 : 0;
          
          return {
            totalValue,
            cashValue: accountSummary?.totalCashValue || 0,
            stockValue,
            unrealizedPnL,
            realizedPnL,
            dayChange,
            dayChangePercent,
            timestamp: new Date().toISOString()
          };
        },
        
        getPositionsWithMarketData: (): PositionWithMarketData[] => {
          const { positions, marketData } = get();
          
          return Array.from(positions.values()).map(position => {
            const marketDataSnapshot = marketData.get(position.symbol);
            const currentPrice = marketDataSnapshot?.last || position.marketPrice;
            
            return {
              ...position,
              currentPrice,
              dayChange: marketDataSnapshot?.change || 0,
              dayChangePercent: marketDataSnapshot?.changePercent || 0,
              marketDataTimestamp: marketDataSnapshot?.timestamp || new Date().toISOString()
            };
          });
        },
        
        getTotalUnrealizedPnL: () => {
          return Array.from(get().positions.values())
            .reduce((total, position) => total + position.unrealizedPnL, 0);
        },
        
        getTotalRealizedPnL: () => {
          return Array.from(get().positions.values())
            .reduce((total, position) => total + position.realizedPnL, 0);
        },
        
        getDayChange: () => {
          const portfolio = get().calculateRealTimePortfolioValue();
          return portfolio.dayChange || 0;
        },
        
        getDayChangePercent: () => {
          const portfolio = get().calculateRealTimePortfolioValue();
          return portfolio.dayChangePercent || 0;
        },
        
        // ===== UTILITY ACTIONS =====
        
        clearErrors: () => {
          set({ lastError: null });
        },
        
        resetStore: () => {
          set(initialState);
        },
        
        setLoading: (key: keyof IBKRStore['loading'], loading: boolean) => {
          set((state) => ({
            loading: { ...state.loading, [key]: loading }
          }));
        }
      })),
      {
        name: 'ibkr-store',
        partialize: (state) => ({
          // Only persist non-sensitive data
          connectionAttempts: state.connectionAttempts,
          lastConnectionTime: state.lastConnectionTime,
          // Don't persist connection info, real-time data, or credentials
        })
      }
    ),
    { name: 'IBKRStore' }
  )
);

// Selector hooks for optimized subscriptions
export const useIBKRConnection = () => useIBKRStore(state => ({
  isConnected: state.isConnected,
  connectionStatus: state.connectionStatus,
  connectionHealth: state.connectionHealth,
  lastError: state.lastError,
  connect: state.connect,
  disconnect: state.disconnect
}));

export const useIBKRMarketData = () => useIBKRStore(state => ({
  marketData: state.marketData,
  marketDataStatus: state.marketDataStatus,
  subscribeToMarketData: state.subscribeToMarketData,
  unsubscribeFromMarketData: state.unsubscribeFromMarketData,
  getMarketData: state.getMarketData
}));

export const useIBKROrders = () => useIBKRStore(state => ({
  orders: state.orders,
  placeOrder: state.placeOrder,
  cancelOrder: state.cancelOrder,
  getOrder: state.getOrder,
  getActiveOrders: state.getActiveOrders,
  loading: state.loading.orders
}));

export const useIBKRPortfolio = () => useIBKRStore(state => {
  // Calculate values only when selector is called, not in store updates
  const realTimePortfolioValue = state.calculateRealTimePortfolioValue();
  const positionsWithMarketData = state.getPositionsWithMarketData();
  
  return {
    positions: state.positions,
    accountSummary: state.accountSummary,
    realTimePortfolioValue,
    positionsWithMarketData,
    getPositions: state.getPositions,
    getAccountSummary: state.getAccountSummary,
    getTotalUnrealizedPnL: state.getTotalUnrealizedPnL,
    getTotalRealizedPnL: state.getTotalRealizedPnL,
    getDayChange: () => realTimePortfolioValue?.dayChange || 0,
    getDayChangePercent: () => realTimePortfolioValue?.dayChangePercent || 0
  };
});