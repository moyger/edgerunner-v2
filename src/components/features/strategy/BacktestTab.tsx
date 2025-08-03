import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Switch } from "../../../../components/ui/switch";
import { Badge } from "../../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { 
  Play, 
  Pause, 
  BarChart3, 
  Calendar, 
  Clock,
  TrendingUp,
  Download,
  Settings,
  Zap,
  AlertCircle
} from "lucide-react";

export function BacktestTab() {
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [deploymentMode, setDeploymentMode] = useState("paper");

  const mockBacktestResults = {
    totalTrades: 247,
    winRate: 67.2,
    avgReturn: 1.85,
    maxDrawdown: -8.3,
    sharpeRatio: 1.42,
    totalReturn: 34.7
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Backtest & Deployment</h2>
          <p className="text-sm text-muted-foreground">
            Test your strategy and deploy to live markets
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button 
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsBacktesting(!isBacktesting)}
            disabled={isBacktesting}
          >
            {isBacktesting ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Backtest
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="backtest" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="backtest">Backtest Configuration</TabsTrigger>
          <TabsTrigger value="deployment">Deployment Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="backtest" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Backtest Settings */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Backtest Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" defaultValue="2023-01-01" />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" defaultValue="2024-01-01" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Symbol/Universe</Label>
                      <Select defaultValue="sp500">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sp500">S&P 500</SelectItem>
                          <SelectItem value="nasdaq100">NASDAQ 100</SelectItem>
                          <SelectItem value="russell2000">Russell 2000</SelectItem>
                          <SelectItem value="custom">Custom Watchlist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timeframe</Label>
                      <Select defaultValue="1min">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1min">1 Minute</SelectItem>
                          <SelectItem value="5min">5 Minutes</SelectItem>
                          <SelectItem value="15min">15 Minutes</SelectItem>
                          <SelectItem value="1hour">1 Hour</SelectItem>
                          <SelectItem value="1day">1 Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Starting Capital</Label>
                      <Input placeholder="100000" defaultValue="100000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Commission per Share</Label>
                      <Input placeholder="0.005" defaultValue="0.005" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="slippage">Include Slippage</Label>
                      <Switch id="slippage" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="realistic-fills">Realistic Fill Simulation</Label>
                      <Switch id="realistic-fills" defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Backtest Results
                    {isBacktesting && <Badge variant="secondary">Running...</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isBacktesting ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Trades</div>
                        <div className="text-xl font-medium">{mockBacktestResults.totalTrades}</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                        <div className="text-xl font-medium text-green-600">
                          {mockBacktestResults.winRate}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Avg R-Multiple</div>
                        <div className="text-xl font-medium text-green-600">
                          +{mockBacktestResults.avgReturn}R
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Max Drawdown</div>
                        <div className="text-xl font-medium text-red-600">
                          {mockBacktestResults.maxDrawdown}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                        <div className="text-xl font-medium">{mockBacktestResults.sharpeRatio}</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Return</div>
                        <div className="text-xl font-medium text-green-600">
                          +{mockBacktestResults.totalReturn}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <Settings className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-600" />
                        <p className="text-sm text-muted-foreground">Running backtest...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Strategy Versions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Strategy Versions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div>
                        <div className="font-medium text-sm">v1.2 (Current)</div>
                        <div className="text-xs text-muted-foreground">Entry + ATR Stop</div>
                      </div>
                      <Badge variant="secondary">67.2%</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                      <div>
                        <div className="font-medium text-sm">v1.1</div>
                        <div className="text-xs text-muted-foreground">Fixed % Stop</div>
                      </div>
                      <Badge variant="outline">64.8%</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                      <div>
                        <div className="font-medium text-sm">v1.0</div>
                        <div className="text-xs text-muted-foreground">Basic Setup</div>
                      </div>
                      <Badge variant="outline">61.3%</Badge>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    Create New Version
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Equity Curve
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Trade Analysis
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Trades
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deployment Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Deployment Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      deploymentMode === "paper" 
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setDeploymentMode("paper")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Paper Trading</h4>
                        <p className="text-sm text-muted-foreground">
                          Test with simulated orders
                        </p>
                      </div>
                      <Badge variant={deploymentMode === "paper" ? "default" : "outline"}>
                        Recommended
                      </Badge>
                    </div>
                  </div>

                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      deploymentMode === "live" 
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setDeploymentMode("live")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Live Trading</h4>
                        <p className="text-sm text-muted-foreground">
                          Execute real orders
                        </p>
                      </div>
                      <Badge variant={deploymentMode === "live" ? "default" : "outline"}>
                        Production
                      </Badge>
                    </div>
                  </div>
                </div>

                {deploymentMode === "live" && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        <p className="font-medium">Live Trading Warning</p>
                        <p>Real money will be at risk. Ensure you've thoroughly tested this strategy.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Trading Account</Label>
                  <Select defaultValue="account1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account1">Main Trading Account</SelectItem>
                      <SelectItem value="account2">Paper Trading Account</SelectItem>
                      <SelectItem value="account3">IRA Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Schedule & Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-schedule">Enable Schedule</Label>
                    <Switch id="auto-schedule" defaultChecked />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Select defaultValue="0930">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0930">9:30 AM</SelectItem>
                          <SelectItem value="1000">10:00 AM</SelectItem>
                          <SelectItem value="1030">10:30 AM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Select defaultValue="1030">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1030">10:30 AM</SelectItem>
                          <SelectItem value="1100">11:00 AM</SelectItem>
                          <SelectItem value="1200">12:00 PM</SelectItem>
                          <SelectItem value="1600">4:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Trading Days</Label>
                    <div className="flex gap-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                        <Button
                          key={day}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Max Positions</Label>
                    <Input placeholder="5" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Capital Allocation</Label>
                    <Select defaultValue="50000">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25000">$25,000</SelectItem>
                        <SelectItem value="50000">$50,000</SelectItem>
                        <SelectItem value="100000">$100,000</SelectItem>
                        <SelectItem value="custom">Custom Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    className={`w-full ${
                      deploymentMode === "live" 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {deploymentMode === "live" ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Deploy Live Strategy
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Start Paper Trading
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}