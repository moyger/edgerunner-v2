import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";

interface StrategyConfigDialogProps {
  strategy: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StrategyConfigDialog({ strategy, open, onOpenChange }: StrategyConfigDialogProps) {
  if (!strategy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {strategy.name} Configuration
            <Badge variant={strategy.status === "running" ? "default" : "secondary"}>
              {strategy.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Strategy parameters and current settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${strategy.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{strategy.trades}</div>
                  <p className="text-sm text-muted-foreground">Trades</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{strategy.winRate}%</div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Strategy Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(strategy.config).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {typeof value === 'number' 
                        ? key.includes('Percent') || key.includes('Loss') || key.includes('Profit') 
                          ? `${value}%` 
                          : String(value)
                        : String(value)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Position Size (Kelly %)</span>
                  <span className="text-sm text-muted-foreground">{strategy.config.kellyPercent}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Stop Loss</span>
                  <span className="text-sm text-red-600">{strategy.config.stopLoss}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Take Profit</span>
                  <span className="text-sm text-green-600">{strategy.config.takeProfit}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}