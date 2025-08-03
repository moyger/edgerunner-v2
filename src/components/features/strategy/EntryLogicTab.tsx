import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Switch } from "../../../../components/ui/switch";
import { Badge } from "../../../../components/ui/badge";
import { Label } from "../../../../components/ui/label";
import {
  Plus,
  X,
  Code,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  Zap,
  Clock,
} from "lucide-react";

interface LogicRule {
  id: string;
  indicator: string;
  condition: string;
  value: string;
  connector?: "AND" | "OR";
}

const INDICATORS = [
  { value: "price", label: "Price" },
  { value: "volume", label: "Volume" },
  { value: "atr", label: "ATR" },
  { value: "ema", label: "EMA" },
  { value: "sma", label: "SMA" },
  { value: "vwap", label: "VWAP" },
  { value: "rsi", label: "RSI" },
  { value: "macd", label: "MACD" },
  { value: "bb", label: "Bollinger Bands" },
  { value: "premarket_high", label: "Premarket High" },
  { value: "previous_close", label: "Previous Close" },
  { value: "gap_percent", label: "Gap %" },
];

const CONDITIONS = [
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  { value: "equals", label: "=" },
  { value: "greater_equal", label: ">=" },
  { value: "less_equal", label: "<=" },
  { value: "crosses_above", label: "Crosses Above" },
  { value: "crosses_below", label: "Crosses Below" },
];

const PRESET_STRATEGIES = [
  {
    name: "Dux Gap Up",
    description: "Gap up with volume confirmation and momentum",
    winRate: "72.3%",
    avgR: "+1.85R",
    icon: TrendingUp,
    color: "bg-green-500/10 border-green-500/20 text-green-600",
  },
  {
    name: "Minervini VCP",
    description: "Volatility contraction pattern breakout",
    winRate: "68.7%",
    avgR: "+2.12R",
    icon: BarChart3,
    color: "bg-blue-500/10 border-blue-500/20 text-blue-600",
  },
  {
    name: "VWAP Breakout",
    description: "Volume-weighted average price momentum",
    winRate: "65.1%",
    avgR: "+1.42R",
    icon: Activity,
    color:
      "bg-purple-500/10 border-purple-500/20 text-purple-600",
  },
  {
    name: "Morning Reversal",
    description: "Early morning mean reversion setup",
    winRate: "59.8%",
    avgR: "+1.23R",
    icon: Target,
    color:
      "bg-orange-500/10 border-orange-500/20 text-orange-600",
  },
];

const TIMEFRAMES = [
  {
    value: "1m",
    label: "1 Minute",
    description: "Ultra-short term scalping",
  },
  {
    value: "5m",
    label: "5 Minutes",
    description: "Short-term momentum",
  },
  {
    value: "15m",
    label: "15 Minutes",
    description: "Intraday swings",
  },
  {
    value: "30m",
    label: "30 Minutes",
    description: "Medium-term intraday",
  },
  {
    value: "1h",
    label: "1 Hour",
    description: "Longer intraday moves",
  },
  {
    value: "4h",
    label: "4 Hours",
    description: "Multi-session swings",
  },
  {
    value: "1d",
    label: "1 Day",
    description: "Daily swing trading",
  },
  {
    value: "1w",
    label: "1 Week",
    description: "Weekly position trading",
  },
  {
    value: "1M",
    label: "1 Month",
    description: "Long-term investing",
  },
];

export function EntryLogicTab() {
  const [rules, setRules] = useState<LogicRule[]>([
    {
      id: "1",
      indicator: "price",
      condition: "greater_than",
      value: "premarket_high",
      connector: "AND",
    },
    {
      id: "2",
      indicator: "volume",
      condition: "greater_than",
      value: "2x Average Volume",
    },
  ]);

  const [isFormulaMode, setIsFormulaMode] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] =
    useState("15m");

  const addRule = () => {
    const newRule: LogicRule = {
      id: Date.now().toString(),
      indicator: "",
      condition: "",
      value: "",
      connector: rules.length > 0 ? "AND" : undefined,
    };
    setRules([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const updateRule = (
    id: string,
    field: keyof LogicRule,
    value: string,
  ) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, [field]: value } : rule,
      ),
    );
  };

  const toggleConnector = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              connector:
                rule.connector === "AND" ? "OR" : "AND",
            }
          : rule,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Entry Logic</h2>
          <p className="text-sm text-muted-foreground">
            Define when your strategy should enter positions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="formula-mode" className="text-sm">
              Formula Mode
            </Label>
            <Switch
              id="formula-mode"
              checked={isFormulaMode}
              onCheckedChange={setIsFormulaMode}
            />
          </div>
          <Button size="sm">
            <Code className="h-4 w-4 mr-2" />
            View Pine Script
          </Button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Strategy Timeframe
                </Label>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Chart interval for all indicators and entry
                  signals
                </p>
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <Select
                value={selectedTimeframe}
                onValueChange={setSelectedTimeframe}
              >
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((timeframe) => (
                    <SelectItem
                      key={timeframe.value}
                      value={timeframe.value}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {timeframe.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {timeframe.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge
                variant="outline"
                className="bg-background"
              >
                {
                  TIMEFRAMES.find(
                    (t) => t.value === selectedTimeframe,
                  )?.description
                }
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule Builder */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Entry Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isFormulaMode ? (
                <div className="space-y-3">
                  {rules.map((rule, index) => (
                    <div key={rule.id} className="space-y-2">
                      {/* Connector */}
                      {index > 0 && (
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleConnector(rule.id)
                            }
                            className="bg-muted hover:bg-muted/80"
                          >
                            {rule.connector}
                          </Button>
                        </div>
                      )}

                      {/* Rule */}
                      <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card">
                        <div className="text-sm text-muted-foreground min-w-[20px]">
                          {index + 1}
                        </div>

                        <Select
                          value={rule.indicator}
                          onValueChange={(value) =>
                            updateRule(
                              rule.id,
                              "indicator",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Indicator" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDICATORS.map((indicator) => (
                              <SelectItem
                                key={indicator.value}
                                value={indicator.value}
                              >
                                {indicator.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={rule.condition}
                          onValueChange={(value) =>
                            updateRule(
                              rule.id,
                              "condition",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITIONS.map((condition) => (
                              <SelectItem
                                key={condition.value}
                                value={condition.value}
                              >
                                {condition.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={rule.value}
                          onValueChange={(value) =>
                            updateRule(rule.id, "value", value)
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Value" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="premarket_high">
                              Premarket High
                            </SelectItem>
                            <SelectItem value="previous_close">
                              Previous Close
                            </SelectItem>
                            <SelectItem value="2x Average Volume">
                              2x Average Volume
                            </SelectItem>
                            <SelectItem value="50 EMA">
                              50 EMA
                            </SelectItem>
                            <SelectItem value="VWAP">
                              VWAP
                            </SelectItem>
                            <SelectItem value="70">
                              70 (RSI)
                            </SelectItem>
                            <SelectItem value="30">
                              30 (RSI)
                            </SelectItem>
                            <SelectItem value="custom">
                              Custom Value
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(rule.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={addRule}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>Custom Formula</Label>
                  <div className="font-mono text-sm bg-muted p-4 rounded-lg border">
                    <div className="text-muted-foreground mb-2">
                      // Entry Logic Formula
                    </div>
                    <div>price &gt; premarket_high AND</div>
                    <div>volume &gt; avgVolume * 2 AND</div>
                    <div>rsi &lt; 70</div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Switch to visual mode to edit rules, or
                    modify the formula directly
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Additional Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Market Cap Range</Label>
                <Select defaultValue="large_cap">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="large_cap">
                      Large Cap ($10B+)
                    </SelectItem>
                    <SelectItem value="mid_cap">
                      Mid Cap ($2B-$10B)
                    </SelectItem>
                    <SelectItem value="small_cap">
                      Small Cap ($300M-$2B)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sector Filter</Label>
                <Select defaultValue="any">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      Any Sector
                    </SelectItem>
                    <SelectItem value="technology">
                      Technology
                    </SelectItem>
                    <SelectItem value="healthcare">
                      Healthcare
                    </SelectItem>
                    <SelectItem value="financial">
                      Financial
                    </SelectItem>
                    <SelectItem value="consumer">
                      Consumer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Min Price</Label>
                <Select defaultValue="5">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">$1+</SelectItem>
                    <SelectItem value="5">$5+</SelectItem>
                    <SelectItem value="10">$10+</SelectItem>
                    <SelectItem value="20">$20+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Position Size</Label>
                <Select defaultValue="10000">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">$1,000</SelectItem>
                    <SelectItem value="5000">$5,000</SelectItem>
                    <SelectItem value="10000">
                      $10,000
                    </SelectItem>
                    <SelectItem value="25000">
                      $25,000
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preset Strategies */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Preset Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PRESET_STRATEGIES.map((strategy, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${strategy.color}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-background/50">
                      <strategy.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">
                        {strategy.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {strategy.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {strategy.winRate}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {strategy.avgR}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Browse More Presets
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}