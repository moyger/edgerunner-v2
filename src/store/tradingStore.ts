import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Strategy, Position, Trade, Portfolio } from '../types';

interface TradingStore {
  // State
  strategies: Strategy[];
  positions: Position[];
  trades: Trade[];
  portfolio: Portfolio | null;
  selectedStrategy: Strategy | null;
  
  // Loading states
  loading: {
    strategies: boolean;
    positions: boolean;
    trades: boolean;
    portfolio: boolean;
  };
  
  // Error states
  errors: {
    strategies: string | null;
    positions: string | null;
    trades: string | null;
    portfolio: string | null;
  };
  
  // Actions for strategies
  setStrategies: (strategies: Strategy[]) => void;
  addStrategy: (strategy: Strategy) => void;
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  setSelectedStrategy: (strategy: Strategy | null) => void;
  
  // Actions for positions
  setPositions: (positions: Position[]) => void;
  addPosition: (position: Position) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string) => void;
  
  // Actions for trades
  setTrades: (trades: Trade[]) => void;
  addTrade: (trade: Trade) => void;
  
  // Actions for portfolio
  setPortfolio: (portfolio: Portfolio) => void;
  updatePortfolioValue: (value: number) => void;
  
  // Loading actions
  setLoading: (key: keyof TradingStore['loading'], loading: boolean) => void;
  
  // Error actions
  setError: (key: keyof TradingStore['errors'], error: string | null) => void;
  clearErrors: () => void;
  
  // Computed values (maintaining existing component logic)
  getActiveStrategies: () => Strategy[];
  getRunningStrategies: () => Strategy[];
  getStrategyById: (id: string) => Strategy | undefined;
  getPositionsByStrategy: (strategyId: string) => Position[];
  getTotalPnL: () => number;
  getDailyPnL: () => number;
}

// Initial mock data to preserve existing UI behavior
const initialStrategies: Strategy[] = [
  {
    id: '1',
    name: 'Momentum Scanner',
    description: 'Identifies stocks with strong momentum patterns',
    status: 'running',
    type: 'long',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    performance: {
      totalReturn: 23.4,
      dailyReturn: 1.2,
      winRate: 68.5,
      sharpeRatio: 1.45,
      maxDrawdown: -5.8,
      totalTrades: 145,
      winningTrades: 99,
      losingTrades: 46,
      avgWinSize: 2.1,
      avgLossSize: -1.3,
    },
    config: {
      universe: ['SPY', 'QQQ', 'IWM'],
      entryLogic: {
        indicators: [],
        conditions: [],
        timeframe: '1D',
      },
      exitLogic: {
        stopLoss: 2.0,
        takeProfit: 6.0,
        trailingStop: 1.5,
        conditions: [],
      },
      riskManagement: {
        maxPositionSize: 10000,
        maxDailyLoss: 500,
        maxDrawdown: 10,
        leverageLimit: 2,
      },
      backtestSettings: {
        startDate: '2023-01-01',
        endDate: '2024-01-01',
        initialCapital: 100000,
        benchmark: 'SPY',
      },
    },
  },
];

const initialPortfolio: Portfolio = {
  totalValue: 125340.50,
  cash: 25340.50,
  positions: [],
  totalPnL: 25340.50,
  dailyPnL: 2845.30,
  totalReturn: 25.34,
  dailyReturn: 2.34,
};

export const useTradingStore = create<TradingStore>()(
  devtools(
    (set, get) => ({
      // Initial state with mock data to preserve UI
      strategies: initialStrategies,
      positions: [],
      trades: [],
      portfolio: initialPortfolio,
      selectedStrategy: null,
      
      loading: {
        strategies: false,
        positions: false,
        trades: false,
        portfolio: false,
      },
      
      errors: {
        strategies: null,
        positions: null,
        trades: null,
        portfolio: null,
      },
      
      // Strategy actions
      setStrategies: (strategies) => set({ strategies }, false, 'setStrategies'),
      
      addStrategy: (strategy) => set(
        (state) => ({ strategies: [...state.strategies, strategy] }),
        false,
        'addStrategy'
      ),
      
      updateStrategy: (id, updates) => set(
        (state) => ({
          strategies: state.strategies.map(s => 
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          )
        }),
        false,
        'updateStrategy'
      ),
      
      deleteStrategy: (id) => set(
        (state) => ({
          strategies: state.strategies.filter(s => s.id !== id),
          selectedStrategy: state.selectedStrategy?.id === id ? null : state.selectedStrategy,
        }),
        false,
        'deleteStrategy'
      ),
      
      setSelectedStrategy: (strategy) => set({ selectedStrategy: strategy }, false, 'setSelectedStrategy'),
      
      // Position actions
      setPositions: (positions) => set({ positions }, false, 'setPositions'),
      
      addPosition: (position) => set(
        (state) => ({ positions: [...state.positions, position] }),
        false,
        'addPosition'
      ),
      
      updatePosition: (id, updates) => set(
        (state) => ({
          positions: state.positions.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        }),
        false,
        'updatePosition'
      ),
      
      closePosition: (id) => set(
        (state) => ({
          positions: state.positions.map(p => 
            p.id === id ? { ...p, status: 'closed' as const } : p
          )
        }),
        false,
        'closePosition'
      ),
      
      // Trade actions
      setTrades: (trades) => set({ trades }, false, 'setTrades'),
      
      addTrade: (trade) => set(
        (state) => ({ trades: [trade, ...state.trades] }),
        false,
        'addTrade'
      ),
      
      // Portfolio actions
      setPortfolio: (portfolio) => set({ portfolio }, false, 'setPortfolio'),
      
      updatePortfolioValue: (value) => set(
        (state) => state.portfolio ? {
          portfolio: { ...state.portfolio, totalValue: value }
        } : {},
        false,
        'updatePortfolioValue'
      ),
      
      // Loading actions
      setLoading: (key, loading) => set(
        (state) => ({
          loading: { ...state.loading, [key]: loading }
        }),
        false,
        'setLoading'
      ),
      
      // Error actions
      setError: (key, error) => set(
        (state) => ({
          errors: { ...state.errors, [key]: error }
        }),
        false,
        'setError'
      ),
      
      clearErrors: () => set(
        {
          errors: {
            strategies: null,
            positions: null,
            trades: null,
            portfolio: null,
          }
        },
        false,
        'clearErrors'
      ),
      
      // Computed values (maintaining existing component behavior)
      getActiveStrategies: () => get().strategies.filter(s => s.status !== 'draft'),
      
      getRunningStrategies: () => get().strategies.filter(s => s.status === 'running'),
      
      getStrategyById: (id) => get().strategies.find(s => s.id === id),
      
      getPositionsByStrategy: (strategyId) => get().positions.filter(p => p.strategyId === strategyId),
      
      getTotalPnL: () => get().portfolio?.totalPnL || 0,
      
      getDailyPnL: () => get().portfolio?.dailyPnL || 0,
    }),
    { name: 'TradingStore' }
  )
);