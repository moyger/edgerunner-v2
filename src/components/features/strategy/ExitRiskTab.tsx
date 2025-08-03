import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Switch } from "../../../../components/ui/switch";
import { Slider } from "../../../../components/ui/slider";
import { Badge } from "../../../../components/ui/badge";
import { 
  Shield, 
  Target, 
  TrendingDown, 
  AlertTriangle,
  DollarSign,
  Percent,
  Calculator
} from "lucide-react";

export function ExitRiskTab() {
  const [kellyMultiplier, setKellyMultiplier] = useState([1.0]);
  const [maxLossStreak, setMaxLossStreak] = useState(false);
  const [autoPause, setAutoPause] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium">Exit & Risk Management</h2>
        <p className="text-sm text-muted-foreground">
          Configure profit targets, stop losses, and risk controls
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Take Profit Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Take Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Take Profit Type</Label>
              <Select defaultValue="r_multiple">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="r_multiple">R-Multiple Based</SelectItem>
                  <SelectItem value="percentage">Fixed Percentage</SelectItem>
                  <SelectItem value="price_target">Price Target</SelectItem>
                  <SelectItem value="indicator">Technical Indicator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Target 1 (R)</Label>
                <Input placeholder="2.0" defaultValue="2.0" />
              </div>
              <div className="space-y-2">
                <Label>Target 2 (R)</Label>
                <Input placeholder="3.0" defaultValue="3.0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Partial Exit 1</Label>
                <Select defaultValue="50">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Partial Exit 2</Label>
                <Select defaultValue="remaining">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="remaining">Remaining</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <Calculator className="h-4 w-4" />
                <span>Expected R: +1.85 | Win Rate: 65%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stop Loss Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Stop Loss
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Stop Loss Type</Label>
              <Select defaultValue="atr">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_percent">Fixed Percentage</SelectItem>
                  <SelectItem value="atr">ATR Based</SelectItem>
                  <SelectItem value="structure">Structure Low/High</SelectItem>
                  <SelectItem value="trailing">Trailing Stop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ATR Multiplier</Label>
                <Input placeholder="1.5" defaultValue="1.5" />
              </div>
              <div className="space-y-2">
                <Label>Min Stop %</Label>
                <Input placeholder="0.5" defaultValue="0.5" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="trailing-stop">Enable Trailing Stop</Label>
                <Switch id="trailing-stop" defaultChecked />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Trail Distance</Label>
                  <Select defaultValue="atr">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atr">1x ATR</SelectItem>
                      <SelectItem value="atr_half">0.5x ATR</SelectItem>
                      <SelectItem value="percent">Fixed %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trigger at</Label>
                  <Input placeholder="1.0R" defaultValue="1.0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Sizing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Position Sizing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sizing Method</Label>
              <Select defaultValue="kelly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_dollar">Fixed Dollar Amount</SelectItem>
                  <SelectItem value="fixed_percent">Fixed Percentage</SelectItem>
                  <SelectItem value="kelly">Kelly Criterion</SelectItem>
                  <SelectItem value="risk_parity">Risk Parity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Kelly Multiplier</Label>
                <Badge variant="outline">{kellyMultiplier[0]}x</Badge>
              </div>
              <Slider
                value={kellyMultiplier}
                onValueChange={setKellyMultiplier}
                min={0.25}
                max={1.5}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative (0.25x)</span>
                <span>Aggressive (1.5x)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Max Position Size</Label>
                <Input placeholder="10000" defaultValue="10000" />
              </div>
              <div className="space-y-2">
                <Label>Risk per Trade</Label>
                <div className="flex items-center gap-2">
                  <Input placeholder="1.0" defaultValue="1.0" className="flex-1" />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div>Optimal Kelly: 1.2% per trade</div>
                <div>Current Setting: 1.0% per trade</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Risk Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Daily Max Loss</Label>
                <div className="flex items-center gap-2">
                  <Input placeholder="500" defaultValue="500" className="flex-1" />
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max Trades/Day</Label>
                <Input placeholder="5" defaultValue="5" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-pause">Auto-pause after losses</Label>
                  <p className="text-xs text-muted-foreground">
                    Pause strategy after consecutive losses
                  </p>
                </div>
                <Switch 
                  id="auto-pause" 
                  checked={autoPause}
                  onCheckedChange={setAutoPause}
                />
              </div>

              {autoPause && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Loss Streak Limit</Label>
                    <Select defaultValue="3">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 losses</SelectItem>
                        <SelectItem value="3">3 losses</SelectItem>
                        <SelectItem value="4">4 losses</SelectItem>
                        <SelectItem value="5">5 losses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Resume After</Label>
                    <Select defaultValue="manual">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Resume</SelectItem>
                        <SelectItem value="next_day">Next Trading Day</SelectItem>
                        <SelectItem value="1_hour">1 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="drawdown-limit">Drawdown Limit</Label>
                <Switch id="drawdown-limit" defaultChecked />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Max Drawdown</Label>
                  <div className="flex items-center gap-2">
                    <Input placeholder="10" defaultValue="10" className="flex-1" />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lookback Period</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}