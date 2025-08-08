import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../../../components/ui/sheet";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Save, RotateCcw } from "lucide-react";

interface StrategyEditSheetProps {
  strategy: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: any) => void;
}

export function StrategyEditSheet({ strategy, open, onOpenChange, onSave }: StrategyEditSheetProps) {
  const [config, setConfig] = useState(strategy?.config || {});
  const [hasChanges, setHasChanges] = useState(false);

  if (!strategy) return null;

  const handleInputChange = (key: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setConfig(prev => ({ ...prev, [key]: numericValue }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(config);
    setHasChanges(false);
  };

  const handleReset = () => {
    setConfig(strategy.config);
    setHasChanges(false);
  };

  const formatLabel = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Edit {strategy.name}
            <Badge variant={strategy.status === "running" ? "default" : "secondary"}>
              {strategy.status}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Modify strategy parameters. Changes will be applied immediately.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Entry Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entry Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(config)
                .filter(([key]) => !['kellyPercent', 'stopLoss', 'takeProfit'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{formatLabel(key)}</Label>
                    <Input
                      id={key}
                      type="number"
                      step="0.1"
                      value={String(value)}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full"
                    />
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kellyPercent">Kelly Percentage (%)</Label>
                <Input
                  id="kellyPercent"
                  type="number"
                  step="0.1"
                  value={config.kellyPercent}
                  onChange={(e) => handleInputChange('kellyPercent', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  step="0.1"
                  value={config.stopLoss}
                  onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="takeProfit">Take Profit (%)</Label>
                <Input
                  id="takeProfit"
                  type="number"
                  step="0.1"
                  value={config.takeProfit}
                  onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Performance Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-lg font-bold ${strategy.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">P&L</p>
                </div>
                <div>
                  <div className="text-lg font-bold">{strategy.trades}</div>
                  <p className="text-xs text-muted-foreground">Trades</p>
                </div>
                <div>
                  <div className="text-lg font-bold">{strategy.winRate}%</div>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}