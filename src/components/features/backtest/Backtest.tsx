import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Badge } from "../../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Separator } from "../../../../components/ui/separator";
import { 
  Play, 
  Download, 
  Save, 
  Plus, 
  Calendar,
  TrendingUp,
  BarChart3,
  DollarSign,
  Target,
  Clock,
  Activity,
  Search,
  Settings,
  FileText,
  Share2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const STRATEGIES = [
  { value: "gap_go", label: "Gap & Go Morning Breakout", description: "High-probability gap up momentum strategy", winRate: "72.3%", avgR: "+1.85R" },
  { value: "vcp_breakout", label: "Minervini VCP Breakout", description: "Volatility contraction pattern", winRate: "68.7%", avgR: "+2.12R" },
  { value: "vwap_momentum", label: "VWAP Momentum", description: "Volume-weighted price momentum", winRate: "65.1%", avgR: "+1.42R" },
  { value: "morning_reversal", label: "Morning Reversal", description: "Early morning mean reversion", winRate: "59.8%", avgR: "+1.23R" }
];

const MARKET_TYPES = [
  { value: "stocks", label: "Stocks", description: "US Equities" },
  { value: "crypto", label: "Crypto", description: "Cryptocurrency" },
  { value: "forex", label: "Forex", description: "Foreign Exchange" },
  { value: "futures", label: "Futures", description: "Futures Contracts" }
];

const TIMEFRAMES = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "1d", label: "Daily" }
];

const POSITION_SIZING = [
  { value: "fixed", label: "Fixed Amount" },
  { value: "percent", label: "% of Equity" },
  { value: "kelly", label: "Kelly Criterion" },
  { value: "risk_parity", label: "Risk Parity" }
];

const COMMISSION_MODELS = [
  { value: "fixed", label: "Fixed per Trade" },
  { value: "percent", label: "% of Trade Value" },
  { value: "tiered", label: "Tiered Pricing" }
];

// Mock data for results
const equityData = [
  { date: "2024-01", value: 100000 },
  { date: "2024-02", value: 105200 },
  { date: "2024-03", value: 98800 },
  { date: "2024-04", value: 112400 },
  { date: "2024-05", value: 118900 },
  { date: "2024-06", value: 125600 },
  { date: "2024-07", value: 119200 },
  { date: "2024-08", value: 134500 }
];

const rMultipleData = [
  { range: "-3R to -2R", count: 8 },
  { range: "-2R to -1R", count: 22 },
  { range: "-1R to 0R", count: 35 },
  { range: "0R to 1R", count: 28 },
  { range: "1R to 2R", count: 45 },
  { range: "2R to 3R", count: 32 },
  { range: "3R to 4R", count: 18 },
  { range: "4R+", count: 12 }
];

const tradeLog = [
  { date: "2024-08-01", symbol: "AAPL", side: "Long", size: 100, entry: 225.50, exit: 232.10, rMultiple: "+1.47R", pnl: "+$660" },
  { date: "2024-08-01", symbol: "TSLA", side: "Long", size: 50, entry: 258.75, exit: 245.20, rMultiple: "-1.00R", pnl: "-$677" },
  { date: "2024-08-02", symbol: "NVDA", side: "Long", size: 25, entry: 118.20, exit: 125.80, rMultiple: "+2.15R", pnl: "+$190" },
  { date: "2024-08-02", symbol: "AMZN", side: "Long", size: 75, entry: 178.90, exit: 185.40, rMultiple: "+1.83R", pnl: "+$488" },
  { date: "2024-08-03", symbol: "MSFT", side: "Long", size: 60, entry: 415.20, exit: 428.90, rMultiple: "+2.74R", pnl: "+$822" }
];

export function Backtest() {
  const [selectedStrategy, setSelectedStrategy] = useState("gap_go");
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeResultsTab, setActiveResultsTab] = useState("equity");

  const handleRunBacktest = () => {
    setIsRunning(true);
    // Simulate backtest running
    setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 3000);
  };

  const selectedStrategyData = STRATEGIES.find(s => s.value === selectedStrategy);

  return (
    <div className="h-full flex bg-background">
      {/* Left Sidebar - Configuration */}
      <div className="w-96 border-r border-border bg-card overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Strategy Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Strategy Selection</h2>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
            
            <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGIES.map(strategy => (
                  <SelectItem key={strategy.value} value={strategy.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{strategy.label}</span>
                      <span className="text-xs text-muted-foreground">{strategy.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStrategyData && (
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{selectedStrategyData.label}</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">{selectedStrategyData.description}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-background text-xs">
                    {selectedStrategyData.winRate} Win Rate
                  </Badge>
                  <Badge variant="outline" className="bg-background text-xs">
                    {selectedStrategyData.avgR} Avg
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Market & Timeframe */}
          <div className="space-y-4">
            <h3 className="font-medium">Market & Timeframe</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search symbols (e.g. AAPL, BTC/USD)" className="pl-9" defaultValue="AAPL" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Market Type</Label>
                <Select defaultValue="stocks">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_TYPES.map(market => (
                      <SelectItem key={market.value} value={market.value}>
                        <div className="flex flex-col">
                          <span>{market.label}</span>
                          <span className="text-xs text-muted-foreground">{market.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" defaultValue="2024-01-01" />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" defaultValue="2024-08-31" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select defaultValue="15m">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map(tf => (
                      <SelectItem key={tf.value} value={tf.value}>
                        {tf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Strategy Parameters */}
          <div className="space-y-4">
            <h3 className="font-medium">Strategy Parameters</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Position Sizing</Label>
                <Select defaultValue="percent">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_SIZING.map(ps => (
                      <SelectItem key={ps.value} value={ps.value}>
                        {ps.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Risk per Trade (%)</Label>
                <Input type="number" placeholder="1.0" defaultValue="1.0" step="0.1" />
              </div>

              <div className="space-y-2">
                <Label>Stop Loss (R)</Label>
                <Input type="number" placeholder="1.0" defaultValue="1.0" step="0.1" />
              </div>

              <div className="space-y-2">
                <Label>Profit Target (R)</Label>
                <Input type="number" placeholder="2.0" defaultValue="2.0" step="0.1" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Capital Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Capital Settings</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Starting Capital ($)</Label>
                <Input type="number" placeholder="100000" defaultValue="100000" />
              </div>

              <div className="space-y-2">
                <Label>Commission Model</Label>
                <Select defaultValue="fixed">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMISSION_MODELS.map(cm => (
                      <SelectItem key={cm.value} value={cm.value}>
                        {cm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Slippage (bps)</Label>
                <Input type="number" placeholder="5" defaultValue="5" />
              </div>

              <div className="space-y-2">
                <Label>Max Concurrent Trades</Label>
                <Input type="number" placeholder="10" defaultValue="10" />
              </div>
            </div>
          </div>

          {/* Run Backtest Button */}
          <div className="pt-4">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              size="lg"
              onClick={handleRunBacktest}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This will simulate the strategy using historical data
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Results */}
      <div className="flex-1 flex flex-col">
        {!showResults ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to Backtest</h3>
              <p className="text-muted-foreground mb-6">
                Configure your strategy parameters and market settings, then run a backtest to analyze historical performance.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600 mb-1" />
                  <div className="font-medium">Date Range</div>
                  <div className="text-muted-foreground">8 months of data</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 text-green-600 mb-1" />
                  <div className="font-medium">Estimated Time</div>
                  <div className="text-muted-foreground">~30 seconds</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-medium">Backtest Results</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedStrategyData?.label} • AAPL • 15m • Jan 1 - Aug 31, 2024
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Result
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Results Content */}
            <Tabs value={activeResultsTab} onValueChange={setActiveResultsTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="equity">Equity Curve</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="rmultiple">R-Multiple</TabsTrigger>
                <TabsTrigger value="trades">Trade Log</TabsTrigger>
                <TabsTrigger value="replay">Visual Replay</TabsTrigger>
              </TabsList>

              <TabsContent value="equity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Portfolio Equity Curve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={equityData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                            labelStyle={{ color: 'var(--foreground)' }}
                            contentStyle={{ 
                              backgroundColor: 'var(--card)', 
                              border: '1px solid var(--border)',
                              borderRadius: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Win Rate</p>
                          <p className="text-2xl font-medium text-green-600">67.2%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Sharpe Ratio</p>
                          <p className="text-2xl font-medium">1.84</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-red-600" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Max Drawdown</p>
                          <p className="text-2xl font-medium text-red-600">-8.2%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">CAGR</p>
                          <p className="text-2xl font-medium text-green-600">24.8%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Trades</span>
                        <span className="font-medium">200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Winning Trades</span>
                        <span className="font-medium text-green-600">134</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Losing Trades</span>
                        <span className="font-medium text-red-600">66</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average R-Multiple</span>
                        <span className="font-medium text-green-600">+1.42R</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expectancy</span>
                        <span className="font-medium text-green-600">+0.85R</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit Factor</span>
                        <span className="font-medium">2.34</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Return</span>
                        <span className="font-medium text-green-600">+34.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volatility</span>
                        <span className="font-medium">18.7%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Beta</span>
                        <span className="font-medium">0.72</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sortino Ratio</span>
                        <span className="font-medium">2.61</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Calmar Ratio</span>
                        <span className="font-medium">3.02</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VaR (95%)</span>
                        <span className="font-medium text-red-600">-2.4%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="rmultiple" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      R-Multiple Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rMultipleData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`${value} trades`, 'Count']}
                            labelStyle={{ color: 'var(--foreground)' }}
                            contentStyle={{ 
                              backgroundColor: 'var(--card)', 
                              border: '1px solid var(--border)',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trades" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Trade Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Entry</TableHead>
                          <TableHead>Exit</TableHead>
                          <TableHead>R-Multiple</TableHead>
                          <TableHead>P&L</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tradeLog.map((trade, index) => (
                          <TableRow key={index}>
                            <TableCell>{trade.date}</TableCell>
                            <TableCell className="font-medium">{trade.symbol}</TableCell>
                            <TableCell>
                              <Badge variant={trade.side === "Long" ? "default" : "secondary"}>
                                {trade.side}
                              </Badge>
                            </TableCell>
                            <TableCell>{trade.size}</TableCell>
                            <TableCell>${trade.entry}</TableCell>
                            <TableCell>${trade.exit}</TableCell>
                            <TableCell>
                              <span className={trade.rMultiple.startsWith("+") ? "text-green-600" : "text-red-600"}>
                                {trade.rMultiple}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={trade.pnl.startsWith("+") ? "text-green-600" : "text-red-600"}>
                                {trade.pnl}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="replay" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Visual Trade Replay
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium mb-2">TradingView Integration</h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                          Interactive chart replay showing entry and exit points with strategy signals will be displayed here.
                        </p>
                        <Button variant="outline" className="mt-4">
                          <Play className="h-4 w-4 mr-2" />
                          Launch Chart Replay
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}