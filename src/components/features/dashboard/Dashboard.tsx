import { useState, memo, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Target,
  AlertTriangle,
  Play,
  Pause,
  StopCircle,
  MoreVertical,
  Eye,
  Settings,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { EquityChart } from "./EquityChart";
// import { ScreenReader } from "@/lib/accessibility";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StrategyConfigDialog } from "../strategy/StrategyConfigDialog";
import { StrategyEditSheet } from "../strategy/StrategyEditSheet";
import { StrategyComparisonDialog } from "../strategy/StrategyComparisonDialog";
import { TradeJournal } from "../journal/TradeJournal";
import { brokerService } from "@/services/brokers/BrokerService";
import type { BrokerId, BrokerConnection } from "@/types";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Mock data for the dashboard - organized by broker
const accountDataByBroker = {
  all: {
    totalEquity: 127450.32,
    dailyPnL: 2340.12,
    dailyPnLPercent: 1.87,
    totalPnL: 27450.32,
    totalPnLPercent: 27.45,
    maxDrawdown: -8.2,
    winRate: 68.4,
    avgR: 1.85,
    totalTrades: 347
  },
  ibkr: {
    totalEquity: 85200.45,
    dailyPnL: 1580.30,
    dailyPnLPercent: 1.89,
    totalPnL: 19200.45,
    totalPnLPercent: 29.12,
    maxDrawdown: -6.8,
    winRate: 72.1,
    avgR: 2.05,
    totalTrades: 234
  },
  mt5: {
    totalEquity: 32100.87,
    dailyPnL: 560.82,
    dailyPnLPercent: 1.78,
    totalPnL: 6100.87,
    totalPnLPercent: 23.47,
    maxDrawdown: -9.5,
    winRate: 61.8,
    avgR: 1.52,
    totalTrades: 89
  },
  bybit: {
    totalEquity: 10149.00,
    dailyPnL: 199.00,
    dailyPnLPercent: 2.00,
    totalPnL: 2149.00,
    totalPnLPercent: 26.85,
    maxDrawdown: -12.3,
    winRate: 68.9,
    avgR: 1.95,
    totalTrades: 24
  }
};

// Removed equityData - now handled by EquityChart component

const rMultipleData = [
  { range: "-3R to -2R", count: 12 },
  { range: "-2R to -1R", count: 28 },
  { range: "-1R to 0R", count: 45 },
  { range: "0R to 1R", count: 52 },
  { range: "1R to 2R", count: 89 },
  { range: "2R to 3R", count: 67 },
  { range: "3R+", count: 54 }
];

const openPositionsByBroker = {
  all: [
    { ticker: "AAPL", side: "LONG", quantity: 100, entry: 175.20, current: 178.45, pnl: 325.00, pnlPercent: 1.85, broker: "ibkr" },
    { ticker: "TSLA", side: "SHORT", quantity: 50, entry: 245.80, current: 242.15, pnl: 182.50, pnlPercent: 1.49, broker: "ibkr" },
    { ticker: "NVDA", side: "LONG", quantity: 75, entry: 445.60, current: 438.90, pnl: -502.50, pnlPercent: -1.50, broker: "mt5" },
    { ticker: "EURUSD", side: "LONG", quantity: 10000, entry: 1.0850, current: 1.0875, pnl: 250.00, pnlPercent: 0.23, broker: "mt5" },
    { ticker: "BTC/USDT", side: "LONG", quantity: 0.5, entry: 42000, current: 42850, pnl: 425.00, pnlPercent: 2.02, broker: "bybit" },
  ],
  ibkr: [
    { ticker: "AAPL", side: "LONG", quantity: 100, entry: 175.20, current: 178.45, pnl: 325.00, pnlPercent: 1.85, broker: "ibkr" },
    { ticker: "TSLA", side: "SHORT", quantity: 50, entry: 245.80, current: 242.15, pnl: 182.50, pnlPercent: 1.49, broker: "ibkr" },
  ],
  mt5: [
    { ticker: "NVDA", side: "LONG", quantity: 75, entry: 445.60, current: 438.90, pnl: -502.50, pnlPercent: -1.50, broker: "mt5" },
    { ticker: "EURUSD", side: "LONG", quantity: 10000, entry: 1.0850, current: 1.0875, pnl: 250.00, pnlPercent: 0.23, broker: "mt5" },
  ],
  bybit: [
    { ticker: "BTC/USDT", side: "LONG", quantity: 0.5, entry: 42000, current: 42850, pnl: 425.00, pnlPercent: 2.02, broker: "bybit" },
  ]
};

const activeStrategies = [
  { 
    id: "gap-go",
    name: "Gap & Go", 
    status: "running", 
    trades: 23, 
    pnl: 1450.20, 
    winRate: 74,
    config: {
      gapThreshold: 3.5,
      volumeFilter: "2M+",
      marketCap: "1B+",
      kellyPercent: 2.5,
      stopLoss: 2.0,
      takeProfit: 4.0
    }
  },
  { 
    id: "momentum",
    name: "Momentum Breakout", 
    status: "running", 
    trades: 18, 
    pnl: 890.50, 
    winRate: 61,
    config: {
      breakoutPeriod: 20,
      volumeMultiplier: 2.0,
      rsiThreshold: 70,
      kellyPercent: 1.8,
      stopLoss: 1.5,
      takeProfit: 3.0
    }
  },
  { 
    id: "mean-reversion",
    name: "Mean Reversion", 
    status: "paused", 
    trades: 12, 
    pnl: -245.30, 
    winRate: 42,
    config: {
      oversoldThreshold: 30,
      lookbackPeriod: 14,
      kellyPercent: 1.0,
      stopLoss: 3.0,
      takeProfit: 2.0
    }
  },
  { 
    id: "news-catalyst",
    name: "News Catalyst", 
    status: "running", 
    trades: 8, 
    pnl: 2340.15, 
    winRate: 88,
    config: {
      sentimentThreshold: 0.7,
      volumeSpike: 5.0,
      kellyPercent: 3.0,
      stopLoss: 2.5,
      takeProfit: 5.0
    }
  },
];

export const Dashboard = memo(function Dashboard() {
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showHaltDialog, setShowHaltDialog] = useState(false);
  const [showTradeJournal, setShowTradeJournal] = useState(false);
  const [tradeJournalStrategy, setTradeJournalStrategy] = useState<string | null>(null);
  const [strategies, setStrategies] = useState(activeStrategies);
  const [selectedBroker, setSelectedBroker] = useState<string>("all");
  const [brokerConnections, setBrokerConnections] = useState<Record<string, BrokerConnection>>({});

  // Load broker connections on mount
  useEffect(() => {
    const loadBrokerConnections = async () => {
      try {
        const connections = await brokerService.getAllBrokerStatuses();
        setBrokerConnections(connections);
      } catch (error) {
        console.error('Failed to load broker connections:', error);
      }
    };

    loadBrokerConnections();
    // ScreenReader.announce('Dashboard loaded with trading overview', 'polite');
  }, []);

  // Announce significant P&L changes
  useEffect(() => {
    const totalStrategyPnL = strategies.reduce((sum, s) => sum + s.pnl, 0);
    if (totalStrategyPnL !== 0) {
      const direction = totalStrategyPnL > 0 ? 'gained' : 'lost';
      // ScreenReader.announce(
      //   `Strategy performance update: ${direction} $${Math.abs(totalStrategyPnL).toFixed(2)} total`,
      //   'polite'
      // );
    }
  }, [strategies]);

  // Get filtered data based on selected broker
  const filteredAccountData = useMemo(() => {
    return accountDataByBroker[selectedBroker as keyof typeof accountDataByBroker] || accountDataByBroker.all;
  }, [selectedBroker]);

  const filteredPositions = useMemo(() => {
    return openPositionsByBroker[selectedBroker as keyof typeof openPositionsByBroker] || openPositionsByBroker.all;
  }, [selectedBroker]);

  // Get available brokers (connected + configured)
  const availableBrokers = useMemo(() => {
    const brokers = [
      { value: "all", label: "All Accounts", connected: true },
      { value: "ibkr", label: "Interactive Brokers", connected: brokerConnections.ibkr?.status === 'connected' },
      { value: "mt5", label: "MetaTrader 5", connected: brokerConnections.mt5?.status === 'connected' },
      { value: "bybit", label: "ByBit", connected: brokerConnections.bybit?.status === 'connected' },
    ];
    
    // Only show brokers that have data or are connected
    return brokers.filter(broker => 
      broker.value === "all" || 
      broker.connected || 
      accountDataByBroker[broker.value as keyof typeof accountDataByBroker]
    );
  }, [brokerConnections]);

  // Memoize expensive chart data calculations
  const chartData = useMemo(() => ({
    rMultiple: rMultipleData,
    positions: filteredPositions
  }), [filteredPositions]);


  const handleStrategyAction = (action: string, strategy: any) => {
    setSelectedStrategy(strategy);
    
    switch (action) {
      case "viewConfig":
        setShowConfig(true);
        break;
      case "editParameters":
        setShowEdit(true);
        break;
      case "forceHalt":
        setShowHaltDialog(true);
        break;
      case "viewComparison":
        setShowComparison(true);
        break;
      case "viewTrades":
        setTradeJournalStrategy(strategy.name);
        setShowTradeJournal(true);
        break;
    }
  };

  const handleHaltStrategy = () => {
    if (selectedStrategy) {
      setStrategies(prev => 
        prev.map(strategy => 
          strategy.id === selectedStrategy.id 
            ? { ...strategy, status: "stopped" }
            : strategy
        )
      );
      
      // Announce strategy halt to screen readers
      // ScreenReader.announceTradeEvent('strategy_stopped', selectedStrategy.name);
      
      setShowHaltDialog(false);
      setSelectedStrategy(null);
    }
  };

  const handleUpdateStrategy = (updatedConfig: any) => {
    if (selectedStrategy) {
      setStrategies(prev => 
        prev.map(strategy => 
          strategy.id === selectedStrategy.id 
            ? { ...strategy, config: updatedConfig }
            : strategy
        )
      );
      setShowEdit(false);
      setSelectedStrategy(null);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header with Market Status and Account Filter */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Account:</span>
            <Select value={selectedBroker} onValueChange={setSelectedBroker}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {availableBrokers.map((broker) => (
                  <SelectItem key={broker.value} value={broker.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          broker.connected ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        aria-label={broker.connected ? 'Connected' : 'Disconnected'}
                      />
                      {broker.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Badge 
          variant="secondary" 
          className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
          role="status"
          aria-label="Market Status: Open"
        >
          Market Open
        </Badge>
      </div>

      {/* Account Summary Cards */}
      <section aria-labelledby="account-summary-heading">
        <h2 id="account-summary-heading" className="sr-only">Account Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card role="region" aria-labelledby="total-equity-title">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle id="total-equity-title" className="text-sm font-medium">Total Equity</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold"
                aria-label={`Total equity: $${filteredAccountData.totalEquity.toLocaleString()}`}
              >
                ${filteredAccountData.totalEquity.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                <span aria-label={`Up ${filteredAccountData.totalPnLPercent} percent all time`}>
                  +{filteredAccountData.totalPnLPercent}% all time
                </span>
              </div>
            </CardContent>
          </Card>

          <Card role="region" aria-labelledby="daily-pnl-title">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle id="daily-pnl-title" className="text-sm font-medium">Daily P&L</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold text-green-600"
                aria-label={`Daily profit and loss: positive $${filteredAccountData.dailyPnL.toLocaleString()}`}
              >
                +${filteredAccountData.dailyPnL.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                <span aria-label={`Up ${filteredAccountData.dailyPnLPercent} percent today`}>
                  +{filteredAccountData.dailyPnLPercent}% today
                </span>
              </div>
            </CardContent>
          </Card>

          <Card role="region" aria-labelledby="max-drawdown-title">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle id="max-drawdown-title" className="text-sm font-medium">Max Drawdown</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold text-red-600"
                aria-label={`Maximum drawdown: ${Math.abs(filteredAccountData.maxDrawdown)} percent`}
              >
                {filteredAccountData.maxDrawdown}%
              </div>
              <p className="text-xs text-muted-foreground">Peak to trough</p>
            </CardContent>
          </Card>

          <Card role="region" aria-labelledby="win-rate-title">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle id="win-rate-title" className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold"
                aria-label={`Win rate: ${filteredAccountData.winRate} percent`}
              >
                {filteredAccountData.winRate}%
              </div>
              <p className="text-xs text-muted-foreground">{filteredAccountData.totalTrades} total trades</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Charts Row - Equity Curve and R-Multiple Distribution */}
      <section aria-labelledby="charts-heading">
        <h2 id="charts-heading" className="sr-only">Trading Performance Charts</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equity Chart - Takes 2/3 of the space */}
          <div className="lg:col-span-2" role="region" aria-labelledby="equity-chart-heading">
            <h3 id="equity-chart-heading" className="sr-only">Equity Chart</h3>
            <EquityChart />
          </div>

          {/* R-Multiple Distribution - Takes 1/3 of the space */}
          <Card role="region" aria-labelledby="r-multiple-chart-title">
            <CardHeader>
              <CardTitle id="r-multiple-chart-title" className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
                R-Multiple Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  data={chartData.rMultiple} 
                  margin={{ left: -20 }}
                  role="img"
                  aria-label="Bar chart showing R-Multiple distribution of trades"
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}`, 'Trades']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--chart-2))"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Account Health - Performance Metrics */}
      <Card role="region" aria-labelledby="account-health-title">
        <CardHeader>
          <CardTitle id="account-health-title" className="flex items-center gap-2">
            <Target className="h-5 w-5" aria-hidden="true" />
            Account Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6" role="grid" aria-label="Performance metrics">
            <div className="space-y-1" role="gridcell">
              <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
              <p className="text-2xl font-bold" aria-label="Sharpe ratio: 1.84">1.84</p>
              <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
            </div>
            
            <div className="space-y-1" role="gridcell">
              <p className="text-sm text-muted-foreground">Profit Factor</p>
              <p className="text-2xl font-bold text-green-600" aria-label="Profit factor: 2.12">2.12</p>
              <p className="text-xs text-muted-foreground">Gross profit / loss</p>
            </div>
            
            <div className="space-y-1" role="gridcell">
              <p className="text-sm text-muted-foreground">Avg R-Multiple</p>
              <p className="text-2xl font-bold" aria-label={`Average R-Multiple: ${filteredAccountData.avgR}R`}>
                {filteredAccountData.avgR}R
              </p>
              <p className="text-xs text-muted-foreground">Risk-reward ratio</p>
            </div>
            
            <div className="space-y-1" role="gridcell">
              <p className="text-sm text-muted-foreground">Recovery Factor</p>
              <p className="text-2xl font-bold" aria-label="Recovery factor: 4.21">4.21</p>
              <p className="text-xs text-muted-foreground">Net profit / max DD</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Positions */}
        <Card role="region" aria-labelledby="open-positions-title">
          <CardHeader>
            <CardTitle id="open-positions-title">Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" role="list" aria-label="Current open trading positions">
              {filteredPositions.map((position, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                  role="listitem"
                  aria-label={`${position.ticker} position: ${position.side} ${position.quantity} shares at $${position.current.toFixed(2)}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={position.side === "LONG" ? "default" : "secondary"}
                      aria-label={`Position type: ${position.side}`}
                    >
                      {position.side}
                    </Badge>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{position.ticker}</p>
                        {selectedBroker === "all" && position.broker && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {position.broker.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {typeof position.quantity === 'number' && position.quantity > 1000 
                          ? `${position.quantity.toLocaleString()} units`
                          : `${position.quantity} ${position.quantity === 1 ? 'share' : 'shares'}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p 
                      className={`font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      aria-label={`Profit and loss: ${position.pnl >= 0 ? 'positive' : 'negative'} $${Math.abs(position.pnl).toFixed(2)}`}
                    >
                      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {position.pnl >= 0 ? '+' : ''}{position.pnlPercent}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Strategies */}
        <Card role="region" aria-labelledby="active-strategies-title">
          <CardHeader>
            <CardTitle id="active-strategies-title">Active Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" role="list" aria-label="Trading strategies currently active">
              {strategies.map((strategy, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                  role="listitem"
                  aria-label={`${strategy.name} strategy: ${strategy.status}, ${strategy.trades} trades, ${strategy.winRate}% win rate`}
                >
                  <div className="flex items-center gap-3">
                    {strategy.status === "running" ? (
                      <Play className="h-4 w-4 text-green-600" aria-label="Strategy running" />
                    ) : strategy.status === "paused" ? (
                      <Pause className="h-4 w-4 text-yellow-600" aria-label="Strategy paused" />
                    ) : (
                      <StopCircle className="h-4 w-4 text-red-600" aria-label="Strategy stopped" />
                    )}
                    <div>
                      <p className="font-medium">{strategy.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {strategy.trades} trades • {strategy.winRate}% win rate
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p 
                        className={`font-medium ${strategy.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        aria-label={`Strategy profit and loss: ${strategy.pnl >= 0 ? 'positive' : 'negative'} $${Math.abs(strategy.pnl).toFixed(2)}`}
                      >
                        {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(2)}
                      </p>
                      <Badge 
                        variant={strategy.status === "running" ? "default" : "secondary"}
                        className="text-xs"
                        aria-label={`Strategy status: ${strategy.status}`}
                      >
                        {strategy.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          aria-label={`Strategy actions for ${strategy.name}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStrategyAction("viewConfig", strategy)}>
                          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                          View Config
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStrategyAction("editParameters", strategy)}>
                          <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                          Edit Parameters
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStrategyAction("viewComparison", strategy)}>
                          <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Backtest vs Live
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStrategyAction("viewTrades", strategy)}>
                          <Activity className="mr-2 h-4 w-4" aria-hidden="true" />
                          View Trades
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleStrategyAction("forceHalt", strategy)}
                          className="text-red-600"
                        >
                          <AlertCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                          Force Close / Halt
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Dialogs and Sheets */}
      {selectedStrategy && (
        <>
          <StrategyConfigDialog 
            strategy={selectedStrategy}
            open={showConfig}
            onOpenChange={setShowConfig}
          />
          
          <StrategyEditSheet 
            strategy={selectedStrategy}
            open={showEdit}
            onOpenChange={setShowEdit}
            onSave={handleUpdateStrategy}
          />
          
          <StrategyComparisonDialog 
            strategy={selectedStrategy}
            open={showComparison}
            onOpenChange={setShowComparison}
          />
        </>
      )}

      <TradeJournal 
        open={showTradeJournal}
        onOpenChange={setShowTradeJournal}
        strategyFilter={tradeJournalStrategy}
        title={tradeJournalStrategy ? `${tradeJournalStrategy} - Trade Journal` : "All Trades - Trade Journal"}
      />

      <AlertDialog open={showHaltDialog} onOpenChange={setShowHaltDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Close Strategy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to force close "{selectedStrategy?.name}"? This will immediately stop the strategy and close any open positions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleHaltStrategy} className="bg-red-600 hover:bg-red-700">
              Force Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default Dashboard;