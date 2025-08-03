import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { RadioGroup, RadioGroupItem } from "../../../../components/ui/radio-group";
import { Badge } from "../../../../components/ui/badge";
import { Textarea } from "../../../../components/ui/textarea";
import { 
  Plus, 
  X, 
  Search, 
  Info, 
  Filter,
  Target,
  Clock,
  Settings,
  TrendingUp,
  BarChart3,
  Globe
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../components/ui/tooltip";

interface FilterRule {
  id: string;
  metric: string;
  operator: string;
  value: string;
}

const FILTER_METRICS = [
  { value: "float", label: "Float", tooltip: "Number of shares available for public trading" },
  { value: "gap_percent", label: "Gap %", tooltip: "Percentage gap from previous close" },
  { value: "volume", label: "Volume", tooltip: "Current trading volume" },
  { value: "relative_volume", label: "Relative Volume", tooltip: "Volume compared to average" },
  { value: "market_cap", label: "Market Cap", tooltip: "Total market value of company" },
  { value: "price", label: "Price", tooltip: "Current stock price" },
  { value: "atr", label: "ATR", tooltip: "Average True Range (14-day)" },
  { value: "rsi", label: "RSI", tooltip: "Relative Strength Index" },
  { value: "premarket_volume", label: "Premarket Volume", tooltip: "Volume during premarket hours" },
  { value: "sector", label: "Sector", tooltip: "Industry sector classification" }
];

const OPERATORS = [
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  { value: "equals", label: "=" },
  { value: "greater_equal", label: ">=" },
  { value: "less_equal", label: "<=" },
  { value: "contains", label: "Contains" },
  { value: "not_equals", label: "!=" }
];

const RANKING_OPTIONS = [
  { value: "relative_volume", label: "Relative Volume" },
  { value: "gap_percent", label: "Gap %" },
  { value: "rs_rating", label: "RS Rating" },
  { value: "volatility", label: "Volatility" },
  { value: "volume", label: "Volume" },
  { value: "price_change", label: "Price Change %" }
];

export function UniverseFiltersTab() {
  const [symbolSource, setSymbolSource] = useState("premarket_gappers");
  const [manualTickers, setManualTickers] = useState("");
  const [filters, setFilters] = useState<FilterRule[]>([
    {
      id: "1",
      metric: "gap_percent",
      operator: "greater_than",
      value: "3"
    },
    {
      id: "2",
      metric: "float",
      operator: "less_than",
      value: "50000000"
    },
    {
      id: "3",
      metric: "volume",
      operator: "greater_than",
      value: "300000"
    }
  ]);
  const [rankBy, setRankBy] = useState("relative_volume");
  const [topTrades, setTopTrades] = useState("2");
  const [tieBreaker, setTieBreaker] = useState("volume");
  const [maxTradesPerDay, setMaxTradesPerDay] = useState("5");
  const [maxOpenPositions, setMaxOpenPositions] = useState("3");
  const [cooldownMinutes, setCooldownMinutes] = useState("15");

  const addFilter = () => {
    const newFilter: FilterRule = {
      id: Date.now().toString(),
      metric: "",
      operator: "",
      value: ""
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  const updateFilter = (id: string, field: keyof FilterRule, value: string) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, [field]: value } : filter
    ));
  };

  const getFilterSummary = () => {
    const activeFilters = filters.filter(f => f.metric && f.operator && f.value);
    return activeFilters.map(f => {
      const metric = FILTER_METRICS.find(m => m.value === f.metric)?.label || f.metric;
      const operator = OPERATORS.find(o => o.value === f.operator)?.label || f.operator;
      return `${metric} ${operator} ${f.value}`;
    }).join(", ");
  };

  const getMetricTooltip = (metric: string) => {
    return FILTER_METRICS.find(m => m.value === metric)?.tooltip || "";
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-medium">Universe & Filters</h2>
          <p className="text-sm text-muted-foreground">
            Define your symbol universe, filters, and trade selection criteria
          </p>
        </div>

        {/* Summary Card */}
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Current Configuration</span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                <div>
                  <strong>Source:</strong> {symbolSource === "manual" ? "Manual Tickers" : 
                    symbolSource === "watchlist" ? "Watchlist" :
                    symbolSource === "premarket_gappers" ? "Pre-market Gappers" : "All US Equities"}
                </div>
                {getFilterSummary() && (
                  <div><strong>Filters:</strong> {getFilterSummary()}</div>
                )}
                <div><strong>Selection:</strong> Trade Top {topTrades} Ranked by {RANKING_OPTIONS.find(r => r.value === rankBy)?.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Symbol Source Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Select Your Universe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={symbolSource} onValueChange={setSymbolSource}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual">Manual Ticker List</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="watchlist" id="watchlist" />
                  <Label htmlFor="watchlist">Watchlist</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="premarket_gappers" id="premarket_gappers" />
                  <Label htmlFor="premarket_gappers">Pre-market Gappers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_us_equities" id="all_us_equities" />
                  <Label htmlFor="all_us_equities">All US Equities</Label>
                </div>
              </RadioGroup>

              {symbolSource === "manual" && (
                <div className="space-y-2">
                  <Label>Enter Tickers (comma-separated)</Label>
                  <Textarea
                    placeholder="AAPL, MSFT, GOOGL, TSLA, NVDA"
                    value={manualTickers}
                    onChange={(e) => setManualTickers(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter stock symbols separated by commas
                  </p>
                </div>
              )}

              {symbolSource === "watchlist" && (
                <div className="space-y-2">
                  <Label>Select Watchlist</Label>
                  <Select defaultValue="momentum_plays">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="momentum_plays">Momentum Plays</SelectItem>
                      <SelectItem value="gap_scanners">Gap Scanners</SelectItem>
                      <SelectItem value="earnings_plays">Earnings Plays</SelectItem>
                      <SelectItem value="custom_list">Custom List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {symbolSource === "premarket_gappers" && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Automatically scans stocks with significant pre-market gaps. Additional filters will be applied below.
                  </p>
                </div>
              )}

              {symbolSource === "all_us_equities" && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Warning:</strong> This scans all US equities. Use filters to narrow down results.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ranking & Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Trade Selection Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rank By</Label>
                <Select value={rankBy} onValueChange={setRankBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RANKING_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Trade Top</Label>
                  <Select value={topTrades} onValueChange={setTopTrades}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tie Breaker</Label>
                  <Select value={tieBreaker} onValueChange={setTieBreaker}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volume">Volume</SelectItem>
                      <SelectItem value="volatility">Volatility</SelectItem>
                      <SelectItem value="gap_percent">Gap %</SelectItem>
                      <SelectItem value="relative_volume">Relative Volume</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-700 dark:text-green-300">
                  <div>Selection: Top {topTrades} by {RANKING_OPTIONS.find(r => r.value === rankBy)?.label}</div>
                  <div>Tie Breaker: Highest {tieBreaker}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter by Fundamental or Technical Criteria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div key={filter.id} className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card">
                  <div className="text-sm text-muted-foreground min-w-[20px]">
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <Select
                      value={filter.metric}
                      onValueChange={(value) => updateFilter(filter.id, "metric", value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_METRICS.map(metric => (
                          <SelectItem key={metric.value} value={metric.value}>
                            <div className="flex items-center gap-2">
                              {metric.label}
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{metric.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filter.operator}
                      onValueChange={(value) => updateFilter(filter.id, "operator", value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="Op" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map(operator => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                      className="flex-1"
                    />

                    {filter.metric && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{getMetricTooltip(filter.metric)}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addFilter}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Filter
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4 mr-2" />
                Preview Matching Symbols
              </Button>
              <Badge variant="outline" className="text-xs">
                Last scan: 247 symbols matched
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Execution Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Execution Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Max Trades per Day</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={maxTradesPerDay}
                  onChange={(e) => setMaxTradesPerDay(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Open Positions</Label>
                <Input
                  type="number"
                  placeholder="3"
                  value={maxOpenPositions}
                  onChange={(e) => setMaxOpenPositions(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Cooldown Between Entries (minutes)</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                <div>• Maximum {maxTradesPerDay} trades will be executed per day</div>
                <div>• No more than {maxOpenPositions} positions will be held simultaneously</div>
                <div>• {cooldownMinutes} minute cooldown between new entries</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}