import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { 
  BookOpen,
  Code,
  BarChart3,
  Search,
  Info,
  Lightbulb,
  TrendingUp,
  Calculator,
  Target,
  AlertTriangle,
  CheckCircle,
  Timer,
  DollarSign,
  Activity,
  Percent,
  Shield
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip";

interface GlossaryItem {
  term: string;
  definition: string;
  category: string;
  formula?: string;
  example?: string;
}

export function Documentation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const glossaryItems: GlossaryItem[] = [
    {
      term: "Kelly Criterion",
      definition: "A mathematical formula used to determine the optimal size of a series of bets to maximize long-term growth of capital.",
      category: "Risk Management",
      formula: "f* = (bp - q) / b",
      example: "Where b = odds, p = probability of win, q = probability of loss"
    },
    {
      term: "R-Multiple",
      definition: "The ratio of profit or loss to the initial risk taken on a trade. A 2R trade means you made twice your initial risk.",
      category: "Risk Management",
      formula: "R = (Exit Price - Entry Price) / Initial Risk",
      example: "If you risk $100 and make $200 profit, that's a 2R win"
    },
    {
      term: "Sharpe Ratio",
      definition: "A measure of risk-adjusted return that compares a strategy's return to its volatility.",
      category: "Performance Metrics",
      formula: "Sharpe = (Return - Risk-free Rate) / Standard Deviation",
      example: "A Sharpe ratio above 1.0 is generally considered good"
    },
    {
      term: "Maximum Drawdown",
      definition: "The largest peak-to-trough decline in portfolio value during a specific period.",
      category: "Risk Management",
      example: "If portfolio drops from $100k to $80k, max drawdown is 20%"
    },
    {
      term: "Profit Factor",
      definition: "The ratio of gross profit to gross loss, measuring the overall profitability of a trading strategy.",
      category: "Performance Metrics",
      formula: "Profit Factor = Gross Profit / Gross Loss",
      example: "A profit factor of 1.5 means $1.50 profit for every $1.00 loss"
    },
    {
      term: "Win Rate",
      definition: "The percentage of trades that are profitable out of the total number of trades executed.",
      category: "Performance Metrics",
      formula: "Win Rate = (Winning Trades / Total Trades) × 100",
      example: "60% win rate means 60 out of 100 trades are profitable"
    },
    {
      term: "Alpha",
      definition: "A measure of strategy performance relative to a benchmark, representing excess returns.",
      category: "Performance Metrics",
      example: "Positive alpha indicates outperformance of the benchmark"
    },
    {
      term: "Beta",
      definition: "A measure of systematic risk, showing how much a strategy moves relative to the overall market.",
      category: "Risk Management",
      example: "Beta of 1.2 means 20% more volatile than the market"
    },
    {
      term: "Sortino Ratio",
      definition: "A risk-adjusted return measure that focuses on downside deviation rather than total volatility.",
      category: "Performance Metrics",
      formula: "Sortino = (Return - Target) / Downside Deviation"
    },
    {
      term: "Value at Risk (VaR)",
      definition: "The maximum expected loss over a specific time period at a given confidence level.",
      category: "Risk Management",
      example: "1-day 95% VaR of $10k means 5% chance of losing more than $10k in one day"
    }
  ];

  const categories = ["all", ...Array.from(new Set(glossaryItems.map(item => item.category)))];

  const filteredGlossary = glossaryItems.filter(item => {
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Risk Management":
        return <Shield className="h-4 w-4" />;
      case "Performance Metrics":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex-1 p-6">
        <Tabs defaultValue="syntax" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-3">
              <TabsTrigger value="syntax" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Strategy Syntax
              </TabsTrigger>
              <TabsTrigger value="backtest" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Backtest Engine
              </TabsTrigger>
              <TabsTrigger value="glossary" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Glossary
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Strategy Syntax Guide */}
          <TabsContent value="syntax" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Code className="h-6 w-6" />
                  Strategy Syntax Guide
                </CardTitle>
                <p className="text-muted-foreground">
                  Learn how to write powerful trading strategies using Edgerunner's syntax
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Structure */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Strategy Structure</h3>
                  <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm">
                    <div className="text-green-600 dark:text-green-400">// Entry Logic</div>
                    <div>entry_long = close &gt; sma(close, 20) and volume &gt; sma(volume, 10)</div>
                    <div>entry_short = close &lt; sma(close, 20) and rsi(14) &gt; 70</div>
                    <br />
                    <div className="text-green-600 dark:text-green-400">// Exit Logic</div>
                    <div>exit_long = rsi(14) &gt; 80 or close &lt; sma(close, 20)</div>
                    <div>exit_short = rsi(14) &lt; 20 or close &gt; sma(close, 20)</div>
                    <br />
                    <div className="text-green-600 dark:text-green-400">// Position Sizing</div>
                    <div>position_size = kelly_optimal(win_rate, avg_win, avg_loss)</div>
                  </div>
                </div>

                {/* Technical Indicators */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Technical Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Moving Averages</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 font-mono text-sm">
                        <div><span className="text-blue-600 dark:text-blue-400">sma</span>(close, 20) <span className="text-muted-foreground">// Simple MA</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">ema</span>(close, 20) <span className="text-muted-foreground">// Exponential MA</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">wma</span>(close, 20) <span className="text-muted-foreground">// Weighted MA</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">vwma</span>(close, volume, 20) <span className="text-muted-foreground">// Volume Weighted</span></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Oscillators</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 font-mono text-sm">
                        <div><span className="text-blue-600 dark:text-blue-400">rsi</span>(14) <span className="text-muted-foreground">// Relative Strength</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">stoch</span>(14, 3, 3) <span className="text-muted-foreground">// Stochastic</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">macd</span>(12, 26, 9) <span className="text-muted-foreground">// MACD</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">cci</span>(20) <span className="text-muted-foreground">// Commodity Channel</span></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Price Action</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 font-mono text-sm">
                        <div><span className="text-blue-600 dark:text-blue-400">highest</span>(high, 20) <span className="text-muted-foreground">// Highest high</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">lowest</span>(low, 20) <span className="text-muted-foreground">// Lowest low</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">atr</span>(14) <span className="text-muted-foreground">// Average True Range</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">bb_upper</span>(close, 20, 2) <span className="text-muted-foreground">// Bollinger Upper</span></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Volume</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 font-mono text-sm">
                        <div><span className="text-blue-600 dark:text-blue-400">obv</span>() <span className="text-muted-foreground">// On Balance Volume</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">vwap</span>() <span className="text-muted-foreground">// Volume Weighted AP</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">mfi</span>(14) <span className="text-muted-foreground">// Money Flow Index</span></div>
                        <div><span className="text-blue-600 dark:text-blue-400">ad</span>() <span className="text-muted-foreground">// Accumulation/Distribution</span></div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Operators */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Logical Operators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Comparison</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 font-mono text-sm">
                        <div>&gt; &lt; &gt;= &lt;= == !=</div>
                        <div className="text-muted-foreground text-xs">Standard comparisons</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Logical</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 font-mono text-sm">
                        <div>and or not</div>
                        <div className="text-muted-foreground text-xs">Boolean operations</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Time Series</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 font-mono text-sm">
                        <div>crossover() crossunder()</div>
                        <div className="text-muted-foreground text-xs">Signal crossings</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Examples */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Strategy Examples</h3>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Golden Cross Strategy</CardTitle>
                      <p className="text-sm text-muted-foreground">Long when fast MA crosses above slow MA</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm">
                        <div className="text-green-600 dark:text-green-400">// Define moving averages</div>
                        <div>fast_ma = ema(close, 50)</div>
                        <div>slow_ma = ema(close, 200)</div>
                        <br />
                        <div className="text-green-600 dark:text-green-400">// Entry condition</div>
                        <div>entry_long = crossover(fast_ma, slow_ma) and volume &gt; sma(volume, 20)</div>
                        <br />
                        <div className="text-green-600 dark:text-green-400">// Exit condition</div>
                        <div>exit_long = crossunder(fast_ma, slow_ma) or close &lt; (entry_price * 0.95)</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Mean Reversion Strategy</CardTitle>
                      <p className="text-sm text-muted-foreground">Buy oversold, sell overbought conditions</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm">
                        <div className="text-green-600 dark:text-green-400">// Bollinger Bands setup</div>
                        <div>bb_mid = sma(close, 20)</div>
                        <div>bb_upper = bb_mid + (2 * stdev(close, 20))</div>
                        <div>bb_lower = bb_mid - (2 * stdev(close, 20))</div>
                        <br />
                        <div className="text-green-600 dark:text-green-400">// Entry conditions</div>
                        <div>entry_long = close &lt; bb_lower and rsi(14) &lt; 30</div>
                        <div>entry_short = close &gt; bb_upper and rsi(14) &gt; 70</div>
                        <br />
                        <div className="text-green-600 dark:text-green-400">// Exit conditions</div>
                        <div>exit_long = close &gt; bb_mid or rsi(14) &gt; 70</div>
                        <div>exit_short = close &lt; bb_mid or rsi(14) &lt; 30</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Always include volume confirmation and risk management rules in your strategies. 
                    Test thoroughly in backtest mode before deploying live capital.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backtest Engine Documentation */}
          <TabsContent value="backtest" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Backtest Engine Documentation
                </CardTitle>
                <p className="text-muted-foreground">
                  Understand how the backtesting engine works and optimize your strategy testing
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Engine Overview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Engine Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Data Processing
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>• Bar-by-bar simulation</div>
                        <div>• Realistic fill modeling</div>
                        <div>• Slippage & commission costs</div>
                        <div>• Market hours simulation</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          Execution Model
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>• Next-bar execution</div>
                        <div>• Lookahead bias prevention</div>
                        <div>• Order type simulation</div>
                        <div>• Position sizing limits</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Configuration Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configuration Parameters</h3>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Capital & Risk Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="font-medium">Initial Capital</div>
                            <div className="text-sm text-muted-foreground">Starting portfolio value for backtest</div>
                            <div className="font-mono text-sm bg-muted/50 p-2 rounded">$100,000 (default)</div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="font-medium">Position Size Method</div>
                            <div className="text-sm text-muted-foreground">How to calculate position sizes</div>
                            <div className="font-mono text-sm bg-muted/50 p-2 rounded">Fixed $ | % of Capital | Kelly | Risk-based</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="font-medium">Max Position Size</div>
                            <div className="text-sm text-muted-foreground">Maximum capital per position</div>
                            <div className="font-mono text-sm bg-muted/50 p-2 rounded">20% (default)</div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="font-medium">Max Concurrent Positions</div>
                            <div className="text-sm text-muted-foreground">Maximum number of open positions</div>
                            <div className="font-mono text-sm bg-muted/50 p-2 rounded">10 (default)</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Cost & Slippage Model</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="font-medium">Commission</div>
                          <div className="text-sm text-muted-foreground">Per-trade commission cost</div>
                          <div className="font-mono text-sm bg-muted/50 p-2 rounded">$1.00 per trade</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-medium">Slippage</div>
                          <div className="text-sm text-muted-foreground">Price impact on execution</div>
                          <div className="font-mono text-sm bg-muted/50 p-2 rounded">0.02% (2 bps)</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-medium">Bid-Ask Spread</div>
                          <div className="text-sm text-muted-foreground">Market spread simulation</div>
                          <div className="font-mono text-sm bg-muted/50 p-2 rounded">0.01% (1 bp)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Generated Metrics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Return Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Return</span>
                          <span className="text-muted-foreground">Overall strategy performance</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annualized Return</span>
                          <span className="text-muted-foreground">Yearly return rate</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CAGR</span>
                          <span className="text-muted-foreground">Compound annual growth</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Alpha</span>
                          <span className="text-muted-foreground">Excess return vs benchmark</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Risk Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Max Drawdown</span>
                          <span className="text-muted-foreground">Largest peak-to-trough loss</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Volatility</span>
                          <span className="text-muted-foreground">Annualized standard deviation</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sharpe Ratio</span>
                          <span className="text-muted-foreground">Risk-adjusted return</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sortino Ratio</span>
                          <span className="text-muted-foreground">Downside risk-adjusted</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Trade Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Win Rate</span>
                          <span className="text-muted-foreground">Percentage of winning trades</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profit Factor</span>
                          <span className="text-muted-foreground">Gross profit / gross loss</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Win/Loss</span>
                          <span className="text-muted-foreground">Average trade P&L</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expectancy</span>
                          <span className="text-muted-foreground">Expected value per trade</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Additional Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Trades</span>
                          <span className="text-muted-foreground">Number of completed trades</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Days in Trade</span>
                          <span className="text-muted-foreground">Average holding period</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kelly %</span>
                          <span className="text-muted-foreground">Optimal position size</span>
                        </div>
                        <div className="flex justify-between">
                          <span>MAR Ratio</span>
                          <span className="text-muted-foreground">Return / Max Drawdown</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> Backtest results are based on historical data and do not guarantee future performance. 
                    Always account for transaction costs, slippage, and market conditions when evaluating strategies.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Glossary */}
          <TabsContent value="glossary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Trading Glossary
                </CardTitle>
                <p className="text-muted-foreground">
                  Essential trading and risk management terms for algorithmic traders
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search terms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map(category => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category === "all" ? "All" : category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Glossary Items */}
                <div className="space-y-4">
                  {filteredGlossary.map((item, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{item.term}</CardTitle>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getCategoryIcon(item.category)}
                            {item.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground">{item.definition}</p>
                        
                        {item.formula && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Formula:</h5>
                            <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                              {item.formula}
                            </div>
                          </div>
                        )}
                        
                        {item.example && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Example:</h5>
                            <p className="text-sm text-muted-foreground italic">
                              {item.example}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredGlossary.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No terms found matching your search criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

export default Documentation;