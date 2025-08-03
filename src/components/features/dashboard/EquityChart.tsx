import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components/ui/popover";
import { Input } from "../../../../components/ui/input";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// Mock date-fns functions for the demo
const format = (date: Date, formatStr: string): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (formatStr === "MMM dd") {
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
  }
  if (formatStr === "MMM dd, yyyy") {
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
  }
  return date.toLocaleDateString();
};

const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const subMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
};

const startOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

const isWithinInterval = (date: Date, interval: { start: Date; end: Date }): boolean => {
  return date >= interval.start && date <= interval.end;
};

type ChartView = "equity" | "drawdown" | "pnl";
type DateRange = "1M" | "3M" | "YTD" | "custom";

interface EquityDataPoint {
  date: string;
  timestamp: Date;
  equity: number;
  pnl: number;
  drawdown: number;
}

// Generate realistic daily equity data
const generateDailyEquityData = (): EquityDataPoint[] => {
  const data: EquityDataPoint[] = [];
  const startDate = subDays(new Date(), 365);
  let currentEquity = 100000;
  let peak = currentEquity;
  let dailyPnL = 0;
  
  for (let i = 0; i <= 365; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Simulate realistic trading returns with volatility
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (!isWeekend) {
      const randomReturn = (Math.random() - 0.48) * 0.02; // Slightly positive bias
      const dayPnL = currentEquity * randomReturn;
      currentEquity += dayPnL;
      dailyPnL = dayPnL;
    } else {
      dailyPnL = 0; // No trading on weekends
    }
    
    if (currentEquity > peak) {
      peak = currentEquity;
    }
    
    const drawdown = ((currentEquity - peak) / peak) * 100;
    
    data.push({
      date: format(date, "MMM dd"),
      timestamp: date,
      equity: Math.round(currentEquity * 100) / 100,
      pnl: Math.round(dailyPnL * 100) / 100,
      drawdown: Math.round(drawdown * 100) / 100,
    });
  }
  
  return data;
};

const CustomTooltip = ({ active, payload, label, view }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{format(data.timestamp, "MMM dd, yyyy")}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Equity:</span>
            <span className="text-sm font-medium">${data.equity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Daily P&L:</span>
            <span className={`text-sm font-medium ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.pnl >= 0 ? '+' : ''}${data.pnl.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Drawdown:</span>
            <span className={`text-sm font-medium ${data.drawdown < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {data.drawdown.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export function EquityChart() {
  const [chartView, setChartView] = useState<ChartView>("equity");
  const [dateRange, setDateRange] = useState<DateRange>("3M");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const allData = useMemo(() => generateDailyEquityData(), []);

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "1M":
        startDate = subMonths(now, 1);
        break;
      case "3M":
        startDate = subMonths(now, 3);
        break;
      case "YTD":
        startDate = startOfYear(now);
        break;
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          return allData.filter(item => 
            isWithinInterval(item.timestamp, {
              start: customDateRange.from!,
              end: customDateRange.to!,
            })
          );
        }
        return allData;
      default:
        startDate = subMonths(now, 3);
    }

    return allData.filter(item => item.timestamp >= startDate);
  }, [allData, dateRange, customDateRange]);

  const chartData = useMemo(() => {
    return filteredData.map(item => ({
      ...item,
      value: chartView === "equity" ? item.equity : 
             chartView === "drawdown" ? item.drawdown : 
             item.pnl
    }));
  }, [filteredData, chartView]);

  const getChartColor = () => {
    switch (chartView) {
      case "equity":
        return "#2563eb";
      case "drawdown":
        return "#dc2626";
      case "pnl":
        return "#059669";
      default:
        return "#2563eb";
    }
  };

  const getChartStats = () => {
    if (filteredData.length === 0) return { current: 0, change: 0, changePercent: 0 };

    const latest = filteredData[filteredData.length - 1];
    const first = filteredData[0];

    switch (chartView) {
      case "equity":
        const change = latest.equity - first.equity;
        const changePercent = (change / first.equity) * 100;
        return { 
          current: latest.equity, 
          change, 
          changePercent,
          format: (val: number) => `$${val.toLocaleString()}`
        };
      case "drawdown":
        const maxDrawdown = Math.min(...filteredData.map(d => d.drawdown));
        return { 
          current: latest.drawdown, 
          change: latest.drawdown - first.drawdown, 
          changePercent: 0,
          format: (val: number) => `${val.toFixed(2)}%`,
          maxDrawdown: `${maxDrawdown.toFixed(2)}%`
        };
      case "pnl":
        const totalPnL = filteredData.reduce((sum, d) => sum + d.pnl, 0);
        const avgPnL = totalPnL / filteredData.length;
        return { 
          current: totalPnL, 
          change: avgPnL, 
          changePercent: 0,
          format: (val: number) => `$${val.toLocaleString()}`,
          avgDaily: `$${avgPnL.toFixed(2)}`
        };
      default:
        return { current: 0, change: 0, changePercent: 0 };
    }
  };

  const stats = getChartStats();

  const getYAxisDomain = () => {
    if (chartView === "drawdown") {
      const minDrawdown = Math.min(...chartData.map(d => d.value));
      return [Math.floor(minDrawdown * 1.1), 1];
    }
    return ["dataMin", "dataMax"];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {chartView === "equity" && <TrendingUp className="h-5 w-5" />}
              {chartView === "drawdown" && <TrendingDown className="h-5 w-5" />}
              {chartView === "pnl" && <DollarSign className="h-5 w-5" />}
              {chartView === "equity" && "Equity Curve"}
              {chartView === "drawdown" && "Drawdown Curve"}
              {chartView === "pnl" && "Daily P&L"}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-2xl font-bold">
                {stats.format ? stats.format(stats.current) : stats.current}
              </div>
              {chartView === "equity" && (
                <Badge variant={stats.change >= 0 ? "default" : "destructive"}>
                  {stats.change >= 0 ? "+" : ""}{stats.changePercent.toFixed(2)}%
                </Badge>
              )}
              {chartView === "drawdown" && stats.maxDrawdown && (
                <Badge variant="destructive">Max: {stats.maxDrawdown}</Badge>
              )}
              {chartView === "pnl" && stats.avgDaily && (
                <Badge variant="secondary">Avg: {stats.avgDaily}</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Chart View Toggle */}
            <div className="flex border rounded-lg p-1">
              <Button
                variant={chartView === "equity" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartView("equity")}
                className="h-7 px-3"
              >
                Equity
              </Button>
              <Button
                variant={chartView === "drawdown" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartView("drawdown")}
                className="h-7 px-3"
              >
                Drawdown
              </Button>
              <Button
                variant={chartView === "pnl" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartView("pnl")}
                className="h-7 px-3"
              >
                P&L
              </Button>
            </div>

            {/* Date Range Filter */}
            <div className="flex border rounded-lg p-1">
              <Button
                variant={dateRange === "1M" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateRange("1M")}
                className="h-7 px-2"
              >
                1M
              </Button>
              <Button
                variant={dateRange === "3M" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateRange("3M")}
                className="h-7 px-2"
              >
                3M
              </Button>
              <Button
                variant={dateRange === "YTD" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateRange("YTD")}
                className="h-7 px-2"
              >
                YTD
              </Button>
              
              <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange === "custom" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Custom
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Select Date Range</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">From</label>
                        <Input
                          type="date"
                          value={customDateRange.from ? customDateRange.from.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            setCustomDateRange(prev => ({ ...prev, from: date }));
                          }}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">To</label>
                        <Input
                          type="date"
                          value={customDateRange.to ? customDateRange.to.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            setCustomDateRange(prev => ({ ...prev, to: date }));
                          }}
                          max={new Date().toISOString().split('T')[0]}
                          min={customDateRange.from ? customDateRange.from.toISOString().split('T')[0] : undefined}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (customDateRange.from && customDateRange.to) {
                          setDateRange("custom");
                          setShowCustomPicker(false);
                        }
                      }}
                      disabled={!customDateRange.from || !customDateRange.to}
                    >
                      Apply Range
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={getYAxisDomain()}
              tickFormatter={(value) => {
                if (chartView === "equity") {
                  return `$${(value / 1000).toFixed(0)}k`;
                } else if (chartView === "drawdown") {
                  return `${value.toFixed(1)}%`;
                } else {
                  return `$${value.toFixed(0)}`;
                }
              }}
            />
            <Tooltip 
              content={<CustomTooltip view={chartView} />}
              cursor={{ stroke: getChartColor(), strokeWidth: 1, strokeDasharray: "5 5" }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={getChartColor()}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: getChartColor(), strokeWidth: 2, fill: "white" }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Chart Info */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm text-muted-foreground">
          <span>
            Showing {filteredData.length} data points 
            {dateRange === "custom" && customDateRange.from && customDateRange.to && 
              ` from ${format(customDateRange.from, "MMM dd")} to ${format(customDateRange.to, "MMM dd")}`
            }
          </span>
          <span>
            {chartView === "equity" && "Account equity over time"}
            {chartView === "drawdown" && "Peak-to-trough equity decline"}
            {chartView === "pnl" && "Daily profit & loss"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}