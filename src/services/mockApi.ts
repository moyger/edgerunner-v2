// Mock API Implementation
// Preserves all existing UI behavior while preparing for real API integration

import { TradingApiService, ApiConfig, ApiError } from './api';
import type { 
  Strategy, 
  Position, 
  Trade, 
  Portfolio, 
  ApiResponse, 
  PaginatedResponse,
  StrategyConfig,
  UserSettings 
} from '../types';

// Enhanced mock data that matches existing UI expectations
const mockStrategies: Strategy[] = [
  {
    id: 'strategy-1',
    name: 'Momentum Scanner',
    description: 'Identifies stocks with strong momentum patterns and high volume',
    status: 'running',
    type: 'long',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-08-03T19:30:00Z',
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
      universe: ['SPY', 'QQQ', 'IWM', 'AAPL', 'MSFT', 'GOOGL'],
      entryLogic: {
        indicators: [
          { type: 'RSI', parameters: { period: 14 }, period: 14 },
          { type: 'SMA', parameters: { period: 20 }, period: 20 },
        ],
        conditions: [
          { field: 'rsi', operator: 'gt', value: 70, logic: 'and' },
          { field: 'volume', operator: 'gt', value: 1000000, logic: 'and' },
        ],
        timeframe: '1D',
      },
      exitLogic: {
        stopLoss: 2.0,
        takeProfit: 6.0,
        trailingStop: 1.5,
        conditions: [
          { field: 'rsi', operator: 'lt', value: 30, logic: 'or' },
        ],
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
  {
    id: 'strategy-2',
    name: 'Mean Reversion',
    description: 'Exploits temporary price deviations from moving averages',
    status: 'paused',
    type: 'long',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-08-03T19:30:00Z',
    performance: {
      totalReturn: 15.7,
      dailyReturn: 0.8,
      winRate: 72.3,
      sharpeRatio: 1.23,
      maxDrawdown: -3.2,
      totalTrades: 89,
      winningTrades: 64,
      losingTrades: 25,
      avgWinSize: 1.8,
      avgLossSize: -1.1,
    },
    config: {
      universe: ['DIA', 'VTI', 'VEA'],
      entryLogic: {
        indicators: [
          { type: 'BBands', parameters: { period: 20, stdDev: 2 }, period: 20 },
        ],
        conditions: [
          { field: 'price', operator: 'lt', value: 'lower_band', logic: 'and' },
        ],
        timeframe: '4H',
      },
      exitLogic: {
        stopLoss: 1.5,
        takeProfit: 4.0,
        trailingStop: 1.0,
        conditions: [],
      },
      riskManagement: {
        maxPositionSize: 15000,
        maxDailyLoss: 300,
        maxDrawdown: 8,
        leverageLimit: 1.5,
      },
      backtestSettings: {
        startDate: '2023-02-01',
        endDate: '2024-02-01',
        initialCapital: 100000,
        benchmark: 'VTI',
      },
    },
  },
  {
    id: 'strategy-3',
    name: 'Breakout Hunter',
    description: 'Captures breakouts from consolidation patterns',
    status: 'stopped',
    type: 'long',
    createdAt: '2024-03-01T11:00:00Z',
    updatedAt: '2024-08-03T19:30:00Z',
    performance: {
      totalReturn: 8.3,
      dailyReturn: 0.4,
      winRate: 55.1,
      sharpeRatio: 0.89,
      maxDrawdown: -7.5,
      totalTrades: 67,
      winningTrades: 37,
      losingTrades: 30,
      avgWinSize: 3.2,
      avgLossSize: -2.1,
    },
    config: {
      universe: ['XLF', 'XLK', 'XLE'],
      entryLogic: {
        indicators: [
          { type: 'ATR', parameters: { period: 14 }, period: 14 },
        ],
        conditions: [
          { field: 'high', operator: 'gt', value: 'resistance', logic: 'and' },
        ],
        timeframe: '1H',
      },
      exitLogic: {
        stopLoss: 3.0,
        takeProfit: 8.0,
        trailingStop: 2.0,
        conditions: [],
      },
      riskManagement: {
        maxPositionSize: 8000,
        maxDailyLoss: 400,
        maxDrawdown: 12,
        leverageLimit: 1.8,
      },
      backtestSettings: {
        startDate: '2023-03-01',
        endDate: '2024-03-01',
        initialCapital: 100000,
        benchmark: 'SPY',
      },
    },
  },
];

const mockPositions: Position[] = [
  {
    id: 'pos-1',
    symbol: 'AAPL',
    side: 'long',
    quantity: 100,
    entryPrice: 180.50,
    currentPrice: 185.30,
    marketValue: 18530,
    unrealizedPnL: 480,
    realizedPnL: 0,
    openDate: '2024-08-01T14:30:00Z',
    strategyId: 'strategy-1',
    status: 'open',
  },
  {
    id: 'pos-2',
    symbol: 'MSFT',
    side: 'long',
    quantity: 50,
    entryPrice: 420.00,
    currentPrice: 425.80,
    marketValue: 21290,
    unrealizedPnL: 290,
    realizedPnL: 0,
    openDate: '2024-08-02T10:15:00Z',
    strategyId: 'strategy-1',
    status: 'open',
  },
];

const mockTrades: Trade[] = [
  {
    id: 'trade-1',
    symbol: 'GOOGL',
    side: 'buy',
    quantity: 25,
    price: 165.40,
    value: 4135,
    fees: 5.25,
    pnl: 125.50,
    timestamp: '2024-08-03T09:30:00Z',
    strategyId: 'strategy-1',
    positionId: 'pos-closed-1',
    notes: 'Strong momentum signal confirmed',
  },
  {
    id: 'trade-2',
    symbol: 'GOOGL',
    side: 'sell',
    quantity: 25,
    price: 170.45,
    value: 4261.25,
    fees: 5.25,
    pnl: 125.50,
    timestamp: '2024-08-03T11:45:00Z',
    strategyId: 'strategy-1',
    positionId: 'pos-closed-1',
    notes: 'Take profit target reached',
  },
];

const mockPortfolio: Portfolio = {
  totalValue: 125340.50,
  cash: 85520.50,
  positions: mockPositions,
  totalPnL: 25340.50,
  dailyPnL: 2845.30,
  totalReturn: 25.34,
  dailyReturn: 2.34,
};

const mockUserSettings: UserSettings = {
  theme: 'system',
  notifications: {
    email: true,
    push: true,
    tradingAlerts: true,
    systemUpdates: false,
    marketNews: true,
  },
  trading: {
    defaultRiskLevel: 2,
    autoExecute: false,
    confirmTrades: true,
    maxDailyTrades: 10,
  },
  display: {
    currency: 'USD',
    timeZone: 'America/New_York',
    chartTheme: 'dark',
    compactMode: false,
  },
};

export class MockTradingApiService extends TradingApiService {
  private strategies: Strategy[] = [...mockStrategies];
  private positions: Position[] = [...mockPositions];
  private trades: Trade[] = [...mockTrades];
  private portfolio: Portfolio = { ...mockPortfolio };
  private userSettings: UserSettings = { ...mockUserSettings };

  constructor() {
    super({
      baseUrl: 'http://localhost:3003/api',
      timeout: 5000,
      retries: 3,
    });
  }

  // Strategy Management
  async getStrategies(): Promise<ApiResponse<Strategy[]>> {
    await this.simulateNetworkDelay();
    return this.createSuccessResponse(this.strategies);
  }

  async getStrategy(id: string): Promise<ApiResponse<Strategy>> {
    await this.simulateNetworkDelay();
    const strategy = this.strategies.find(s => s.id === id);
    if (!strategy) {
      throw new ApiError(`Strategy with id ${id} not found`, 404);
    }
    return this.createSuccessResponse(strategy);
  }

  async createStrategy(config: StrategyConfig): Promise<ApiResponse<Strategy>> {
    await this.simulateNetworkDelay();
    const newStrategy: Strategy = {
      id: `strategy-${Date.now()}`,
      name: `New Strategy ${this.strategies.length + 1}`,
      description: 'New trading strategy',
      status: 'draft',
      type: 'long',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      performance: {
        totalReturn: 0,
        dailyReturn: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        avgWinSize: 0,
        avgLossSize: 0,
      },
      config,
    };
    this.strategies.push(newStrategy);
    return this.createSuccessResponse(newStrategy);
  }

  async updateStrategy(id: string, updates: Partial<Strategy>): Promise<ApiResponse<Strategy>> {
    await this.simulateNetworkDelay();
    const index = this.strategies.findIndex(s => s.id === id);
    if (index === -1) {
      throw new ApiError(`Strategy with id ${id} not found`, 404);
    }
    this.strategies[index] = {
      ...this.strategies[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.createSuccessResponse(this.strategies[index]);
  }

  async deleteStrategy(id: string): Promise<ApiResponse<void>> {
    await this.simulateNetworkDelay();
    const index = this.strategies.findIndex(s => s.id === id);
    if (index === -1) {
      throw new ApiError(`Strategy with id ${id} not found`, 404);
    }
    this.strategies.splice(index, 1);
    return this.createSuccessResponse(undefined as any);
  }

  async startStrategy(id: string): Promise<ApiResponse<void>> {
    return this.updateStrategyStatus(id, 'running');
  }

  async stopStrategy(id: string): Promise<ApiResponse<void>> {
    return this.updateStrategyStatus(id, 'stopped');
  }

  async pauseStrategy(id: string): Promise<ApiResponse<void>> {
    return this.updateStrategyStatus(id, 'paused');
  }

  private async updateStrategyStatus(id: string, status: Strategy['status']): Promise<ApiResponse<void>> {
    await this.simulateNetworkDelay();
    const strategy = this.strategies.find(s => s.id === id);
    if (!strategy) {
      throw new ApiError(`Strategy with id ${id} not found`, 404);
    }
    strategy.status = status;
    strategy.updatedAt = new Date().toISOString();
    return this.createSuccessResponse(undefined as any);
  }

  // Portfolio Management
  async getPortfolio(): Promise<ApiResponse<Portfolio>> {
    await this.simulateNetworkDelay();
    return this.createSuccessResponse(this.portfolio);
  }

  async getPositions(): Promise<ApiResponse<Position[]>> {
    await this.simulateNetworkDelay();
    return this.createSuccessResponse(this.positions);
  }

  async getPosition(id: string): Promise<ApiResponse<Position>> {
    await this.simulateNetworkDelay();
    const position = this.positions.find(p => p.id === id);
    if (!position) {
      throw new ApiError(`Position with id ${id} not found`, 404);
    }
    return this.createSuccessResponse(position);
  }

  async closePosition(id: string): Promise<ApiResponse<void>> {
    await this.simulateNetworkDelay();
    const position = this.positions.find(p => p.id === id);
    if (!position) {
      throw new ApiError(`Position with id ${id} not found`, 404);
    }
    position.status = 'closed';
    return this.createSuccessResponse(undefined as any);
  }

  // Trade Management
  async getTrades(page = 1, limit = 50): Promise<PaginatedResponse<Trade>> {
    await this.simulateNetworkDelay();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTrades = this.trades.slice(startIndex, endIndex);
    
    return {
      data: paginatedTrades,
      status: 'success',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: this.trades.length,
        totalPages: Math.ceil(this.trades.length / limit),
      },
    };
  }

  async getTrade(id: string): Promise<ApiResponse<Trade>> {
    await this.simulateNetworkDelay();
    const trade = this.trades.find(t => t.id === id);
    if (!trade) {
      throw new ApiError(`Trade with id ${id} not found`, 404);
    }
    return this.createSuccessResponse(trade);
  }

  async getTradesByStrategy(strategyId: string): Promise<ApiResponse<Trade[]>> {
    await this.simulateNetworkDelay();
    const trades = this.trades.filter(t => t.strategyId === strategyId);
    return this.createSuccessResponse(trades);
  }

  // Real-time Data (Mock WebSocket)
  subscribeToRealTimeData(callback: (data: any) => void): () => void {
    const interval = setInterval(() => {
      // Simulate real-time price updates
      const mockUpdate = {
        type: 'market_data',
        payload: {
          symbol: 'AAPL',
          price: 185.30 + (Math.random() - 0.5) * 2,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
      callback(mockUpdate);
    }, 1000);

    return () => clearInterval(interval);
  }

  // Settings
  async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    await this.simulateNetworkDelay();
    return this.createSuccessResponse(this.userSettings);
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    await this.simulateNetworkDelay();
    this.userSettings = { ...this.userSettings, ...settings };
    return this.createSuccessResponse(this.userSettings);
  }
}