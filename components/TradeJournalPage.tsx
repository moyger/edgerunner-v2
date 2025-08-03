import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Download,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  BarChart3
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";


interface Trade {
  id: string;
  date: string;
  ticker: string;
  side: "LONG" | "SHORT";
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  rMultiple: number;
  strategy: string;
  reasonTag: string;
  duration: string;
  status: "CLOSED" | "OPEN";
  commission: number;
}

// Extended mock trade data with more details for the full page
const generateTradeData = (): Trade[] => {
  const strategies = ["Gap & Go", "Momentum Breakout", "Mean Reversion", "News Catalyst"];
  const tickers = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "NFLX", "AMD", "CRM", "SPY", "QQQ"];
  const reasonTags = [
    "Gap Up", "Volume Spike", "Breakout", "Pullback", "News", "Earnings", 
    "Technical Setup", "Momentum", "Support Bounce", "Resistance Break", "Cup & Handle", "Flag Pattern"
  ];

  const trades: Trade[] = [];
  
  for (let i = 0; i < 347; i++) {
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const side = Math.random() > 0.6 ? "LONG" : "SHORT";
    const reasonTag = reasonTags[Math.floor(Math.random() * reasonTags.length)];
    
    const entryPrice = Math.random() * 500 + 50;
    const rMultiple = (Math.random() - 0.4) * 6; // Slightly positive bias
    const exitPrice = side === "LONG" 
      ? entryPrice * (1 + (rMultiple * 0.02))
      : entryPrice * (1 - (rMultiple * 0.02));
    
    const quantity = Math.floor(Math.random() * 500) + 10;
    const pnl = side === "LONG" 
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity;

    const commission = Math.round((quantity * 0.005 + 1) * 100) / 100; // $0.005 per share + $1 flat fee

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 180));
    
    const durationHours = Math.random() * 24 + 0.5;
    const duration = durationHours < 1 
      ? `${Math.floor(durationHours * 60)}m`
      : `${Math.floor(durationHours)}h ${Math.floor((durationHours % 1) * 60)}m`;

    trades.push({
      id: `trade-${i + 1}`,
      date: date.toISOString().split('T')[0],
      ticker,
      side,
      quantity,
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: Math.round(exitPrice * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      rMultiple: Math.round(rMultiple * 100) / 100,
      strategy,
      reasonTag,
      duration,
      status: Math.random() > 0.95 ? "OPEN" : "CLOSED",
      commission
    });
  }
  
  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

type SortKey = keyof Trade;
type SortDirection = "asc" | "desc";

export function TradeJournalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [strategyFilter, setStrategyFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const allTrades = useMemo(() => generateTradeData(), []);

  const filteredTrades = useMemo(() => {
    let filtered = allTrades;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.reasonTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.strategy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setDate(now.getDate());
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(trade => new Date(trade.date) >= filterDate);
    }

    // Other filters
    if (statusFilter !== "all") {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    if (sideFilter !== "all") {
      filtered = filtered.filter(trade => trade.side === sideFilter);
    }

    if (reasonFilter !== "all") {
      filtered = filtered.filter(trade => trade.reasonTag === reasonFilter);
    }

    if (strategyFilter !== "all") {
      filtered = filtered.filter(trade => trade.strategy === strategyFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [allTrades, searchTerm, sortKey, sortDirection, statusFilter, sideFilter, reasonFilter, strategyFilter, dateFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({ sortKey: key, children }: { sortKey: SortKey; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortKey === key ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </div>
    </TableHead>
  );

  const tradeStats = useMemo(() => {
    const trades = filteredTrades;
    const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalRMultiple = trades.reduce((sum, trade) => sum + trade.rMultiple, 0);
    const totalCommissions = trades.reduce((sum, trade) => sum + trade.commission, 0);
    const winningTrades = trades.filter(trade => trade.pnl > 0).length;
    const losingTrades = trades.filter(trade => trade.pnl < 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
    const avgR = trades.length > 0 ? totalRMultiple / trades.length : 0;
    const largestWin = Math.max(...trades.map(trade => trade.pnl), 0);
    const largestLoss = Math.min(...trades.map(trade => trade.pnl), 0);

    return {
      totalTrades: trades.length,
      totalPnL,
      totalCommissions,
      winningTrades,
      losingTrades,
      winRate,
      avgR,
      largestWin,
      largestLoss
    };
  }, [filteredTrades]);



  const uniqueReasons = [...new Set(allTrades.map(trade => trade.reasonTag))].sort();
  const uniqueStrategies = [...new Set(allTrades.map(trade => trade.strategy))].sort();

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">



      {/* Account Health - Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Account Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="text-2xl font-bold">{tradeStats.totalTrades}</p>
              <p className="text-xs text-muted-foreground">
                {tradeStats.winningTrades}W / {tradeStats.losingTrades}L
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net P&L</p>
              <p className={`text-2xl font-bold ${tradeStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tradeStats.totalPnL >= 0 ? '+' : ''}${tradeStats.totalPnL.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Fees: ${tradeStats.totalCommissions.toLocaleString()}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{tradeStats.winRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                Avg R: {tradeStats.avgR.toFixed(2)}R
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Best / Worst</p>
              <div className="text-sm space-y-1">
                <p className="text-green-600 font-medium">+${tradeStats.largestWin.toLocaleString()}</p>
                <p className="text-red-600 font-medium">${tradeStats.largestLoss.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ticker, reason, strategy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
              </SelectContent>
            </Select>

            <Select value={strategyFilter} onValueChange={setStrategyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {uniqueStrategies.map(strategy => (
                  <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sideFilter} onValueChange={setSideFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Side" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sides</SelectItem>
                <SelectItem value="LONG">Long</SelectItem>
                <SelectItem value="SHORT">Short</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {uniqueReasons.map(reason => (
                  <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || dateFilter !== "all" || strategyFilter !== "all" || statusFilter !== "all" || sideFilter !== "all" || reasonFilter !== "all") && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("all");
                  setStrategyFilter("all");
                  setStatusFilter("all");
                  setSideFilter("all");
                  setReasonFilter("all");
                }}
              >
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trade Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <SortHeader sortKey="date">Date</SortHeader>
                  <SortHeader sortKey="ticker">Ticker</SortHeader>
                  <SortHeader sortKey="side">Side</SortHeader>
                  <SortHeader sortKey="quantity">Qty</SortHeader>
                  <SortHeader sortKey="entryPrice">Entry</SortHeader>
                  <SortHeader sortKey="exitPrice">Exit</SortHeader>
                  <SortHeader sortKey="pnl">P&L</SortHeader>
                  <SortHeader sortKey="rMultiple">R-Multiple</SortHeader>
                  <SortHeader sortKey="strategy">Strategy</SortHeader>
                  <SortHeader sortKey="reasonTag">Reason</SortHeader>
                  <SortHeader sortKey="duration">Duration</SortHeader>
                  <SortHeader sortKey="commission">Commission</SortHeader>
                  <SortHeader sortKey="status">Status</SortHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => (
                  <TableRow key={trade.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">{trade.date}</TableCell>
                    <TableCell className="font-medium">{trade.ticker}</TableCell>
                    <TableCell>
                      <Badge variant={trade.side === "LONG" ? "default" : "secondary"}>
                        {trade.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{trade.quantity}</TableCell>
                    <TableCell className="font-mono">${trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell className="font-mono">${trade.exitPrice.toFixed(2)}</TableCell>
                    <TableCell className={`font-mono font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString()}
                    </TableCell>
                    <TableCell className={`font-mono font-medium ${trade.rMultiple >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{trade.strategy}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{trade.reasonTag}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{trade.duration}</TableCell>
                    <TableCell className="font-mono text-sm">${trade.commission.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={trade.status === "CLOSED" ? "default" : "destructive"}>
                        {trade.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Showing {filteredTrades.length} of {allTrades.length} trades</span>
        <span>Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}