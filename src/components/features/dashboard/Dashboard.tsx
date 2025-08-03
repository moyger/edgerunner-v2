import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../../../components/ui/dropdown-menu";
import { StrategyConfigDialog } from "../strategy/StrategyConfigDialog";
import { StrategyEditSheet } from "../strategy/StrategyEditSheet";
import { StrategyComparisonDialog } from "../strategy/StrategyComparisonDialog";
import { TradeJournal } from "../journal/TradeJournal";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";

// Mock data for the dashboard
const accountData = {
  totalEquity: 127450.32,
  dailyPnL: 2340.12,
  dailyPnLPercent: 1.87,
  totalPnL: 27450.32,
  totalPnLPercent: 27.45,
  maxDrawdown: -8.2,
  winRate: 68.4,
  avgR: 1.85,
  totalTrades: 347
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

const openPositions = [
  { ticker: "AAPL", side: "LONG", quantity: 100, entry: 175.20, current: 178.45, pnl: 325.00, pnlPercent: 1.85 },
  { ticker: "TSLA", side: "SHORT", quantity: 50, entry: 245.80, current: 242.15, pnl: 182.50, pnlPercent: 1.49 },
  { ticker: "NVDA", side: "LONG", quantity: 75, entry: 445.60, current: 438.90, pnl: -502.50, pnlPercent: -1.50 },
];

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

export function Dashboard() {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showHaltDialog, setShowHaltDialog] = useState(false);
  const [showTradeJournal, setShowTradeJournal] = useState(false);
  const [tradeJournalStrategy, setTradeJournalStrategy] = useState<string | null>(null);
  const [strategies, setStrategies] = useState(activeStrategies);

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
      {/* Market Status */}
      <div className="flex justify-end">
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
          Market Open
        </Badge>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${accountData.totalEquity.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{accountData.totalPnLPercent}% all time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${accountData.dailyPnL.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{accountData.dailyPnLPercent}% today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{accountData.maxDrawdown}%</div>
            <p className="text-xs text-muted-foreground">Peak to trough</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountData.winRate}%</div>
            <p className="text-xs text-muted-foreground">{accountData.totalTrades} total trades</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Equity Curve and R-Multiple Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Chart - Takes 2/3 of the space */}
        <div className="lg:col-span-2">
          <EquityChart />
        </div>

        {/* R-Multiple Distribution - Takes 1/3 of the space */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              R-Multiple Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rMultipleData} margin={{ left: -20 }}>
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

      {/* Account Health - Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Account Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
              <p className="text-2xl font-bold">1.84</p>
              <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profit Factor</p>
              <p className="text-2xl font-bold text-green-600">2.12</p>
              <p className="text-xs text-muted-foreground">Gross profit / loss</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg R-Multiple</p>
              <p className="text-2xl font-bold">{accountData.avgR}R</p>
              <p className="text-xs text-muted-foreground">Risk-reward ratio</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Recovery Factor</p>
              <p className="text-2xl font-bold">4.21</p>
              <p className="text-xs text-muted-foreground">Net profit / max DD</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Positions */}
        <Card>
          <CardHeader>
            <CardTitle>Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openPositions.map((position, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={position.side === "LONG" ? "default" : "secondary"}>
                      {position.side}
                    </Badge>
                    <div>
                      <p className="font-medium">{position.ticker}</p>
                      <p className="text-sm text-muted-foreground">{position.quantity} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
        <Card>
          <CardHeader>
            <CardTitle>Active Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategies.map((strategy, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {strategy.status === "running" ? (
                      <Play className="h-4 w-4 text-green-600" />
                    ) : strategy.status === "paused" ? (
                      <Pause className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <StopCircle className="h-4 w-4 text-red-600" />
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
                      <p className={`font-medium ${strategy.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(2)}
                      </p>
                      <Badge 
                        variant={strategy.status === "running" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {strategy.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStrategyAction("viewConfig", strategy)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Config
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStrategyAction("editParameters", strategy)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Parameters
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStrategyAction("viewComparison", strategy)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Backtest vs Live
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStrategyAction("viewTrades", strategy)}>
                          <Activity className="mr-2 h-4 w-4" />
                          View Trades
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleStrategyAction("forceHalt", strategy)}
                          className="text-red-600"
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
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
}