import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

interface StrategyComparisonDialogProps {
  strategy: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock backtest data for comparison
const generateMockData = (strategyName: string) => {
  const backtestData = {
    equity: [
      { date: "Jan", backtest: 100000, live: 100000 },
      { date: "Feb", backtest: 105200, live: 104800 },
      { date: "Mar", backtest: 108900, live: 107200 },
      { date: "Apr", backtest: 112400, live: 110800 },
      { date: "May", backtest: 118200, live: 115900 },
      { date: "Jun", backtest: 124800, live: 121500 },
      { date: "Jul", backtest: 130500, live: 127450 }
    ],
    metrics: {
      backtest: {
        totalReturn: 30.5,
        winRate: 72.3,
        avgR: 2.1,
        maxDrawdown: -6.8,
        sharpeRatio: 1.84,
        totalTrades: 156
      },
      live: {
        totalReturn: 27.4,
        winRate: strategyName === "Gap & Go" ? 74 : strategyName === "Momentum Breakout" ? 61 : 88,
        avgR: 1.85,
        maxDrawdown: -8.2,
        sharpeRatio: 1.71,
        totalTrades: strategyName === "Gap & Go" ? 23 : strategyName === "Momentum Breakout" ? 18 : 8
      }
    }
  };
  
  return backtestData;
};

export function StrategyComparisonDialog({ strategy, open, onOpenChange }: StrategyComparisonDialogProps) {
  if (!strategy) return null;

  const data = generateMockData(strategy.name);

  const MetricCard = ({ title, backtestValue, liveValue, format = "", icon: Icon }: any) => {
    const backtestNum = parseFloat(backtestValue);
    const liveNum = parseFloat(liveValue);
    const isPercentage = format === "%";
    const isPositiveBetter = title !== "Max Drawdown";
    
    const getDifference = () => {
      const diff = liveNum - backtestNum;
      const isGood = isPositiveBetter ? diff >= 0 : diff <= 0;
      return { diff, isGood };
    };

    const { diff, isGood } = getDifference();

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Backtest</span>
              <span className="text-sm font-medium">{backtestValue}{format}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Live</span>
              <span className="text-sm font-medium">{liveValue}{format}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="text-xs text-muted-foreground">Difference</span>
              <span className={`text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}{format}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {strategy.name} - Backtest vs Live Performance
            <Badge variant={strategy.status === "running" ? "default" : "secondary"}>
              {strategy.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Comparing backtested results with live trading performance
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Equity Curve Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equity Curve Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.equity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`$${value.toLocaleString()}`, name === 'backtest' ? 'Backtest' : 'Live']} />
                  <Line type="monotone" dataKey="backtest" stroke="#3b82f6" strokeWidth={2} name="backtest" />
                  <Line type="monotone" dataKey="live" stroke="#10b981" strokeWidth={2} name="live" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard 
              title="Total Return" 
              backtestValue={data.metrics.backtest.totalReturn}
              liveValue={data.metrics.live.totalReturn}
              format="%"
              icon={TrendingUp}
            />
            <MetricCard 
              title="Win Rate" 
              backtestValue={data.metrics.backtest.winRate}
              liveValue={data.metrics.live.winRate}
              format="%"
              icon={Target}
            />
            <MetricCard 
              title="Average R-Multiple" 
              backtestValue={data.metrics.backtest.avgR}
              liveValue={data.metrics.live.avgR}
              format="R"
              icon={Activity}
            />
            <MetricCard 
              title="Max Drawdown" 
              backtestValue={data.metrics.backtest.maxDrawdown}
              liveValue={data.metrics.live.maxDrawdown}
              format="%"
              icon={TrendingDown}
            />
            <MetricCard 
              title="Sharpe Ratio" 
              backtestValue={data.metrics.backtest.sharpeRatio}
              liveValue={data.metrics.live.sharpeRatio}
            />
            <MetricCard 
              title="Total Trades" 
              backtestValue={data.metrics.backtest.totalTrades}
              liveValue={data.metrics.live.totalTrades}
            />
          </div>

          {/* Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Backtest Period</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">January 2023 - December 2023 (12 months)</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100">Live Trading Period</h4>
                  <p className="text-xs text-green-700 dark:text-green-300">January 2024 - Present (7 months)</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h4 className="text-sm font-medium">Key Observations</h4>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Live performance closely tracks backtest expectations</li>
                    <li>• Slight variance in win rate due to market regime differences</li>
                    <li>• Risk management parameters are performing as expected</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}