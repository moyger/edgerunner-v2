import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";

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
}

interface TradeJournalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategyFilter?: string | null;
  title?: string;
}

// Mock trade data
const generateTradeData = (): Trade[] => {
  const strategies = ["Gap & Go", "Momentum Breakout", "Mean Reversion", "News Catalyst"];
  const tickers = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "NFLX", "AMD", "CRM"];
  const reasonTags = [
    "Gap Up", "Volume Spike", "Breakout", "Pullback", "News", "Earnings", 
    "Technical Setup", "Momentum", "Support Bounce", "Resistance Break"
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
      status: Math.random() > 0.95 ? "OPEN" : "CLOSED"
    });
  }
  
  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

type SortKey = keyof Trade;
type SortDirection = "asc" | "desc";

export function TradeJournal({ open, onOpenChange, strategyFilter, title }: TradeJournalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");

  const allTrades = useMemo(() => generateTradeData(), []);

  const filteredTrades = useMemo(() => {
    let filtered = allTrades;

    // Strategy filter
    if (strategyFilter) {
      filtered = filtered.filter(trade => trade.strategy === strategyFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.reasonTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.strategy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    // Side filter  
    if (sideFilter !== "all") {
      filtered = filtered.filter(trade => trade.side === sideFilter);
    }

    // Reason filter
    if (reasonFilter !== "all") {
      filtered = filtered.filter(trade => trade.reasonTag === reasonFilter);
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
  }, [allTrades, searchTerm, sortKey, sortDirection, statusFilter, sideFilter, reasonFilter, strategyFilter]);

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



  const uniqueReasons = [...new Set(allTrades.map(trade => trade.reasonTag))].sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {title || (strategyFilter ? `${strategyFilter} - Trade Journal` : "Trade Journal")}
          </DialogTitle>
          <DialogDescription>
            {strategyFilter 
              ? `Detailed trade history for ${strategyFilter} strategy`
              : "Complete trading history with performance analytics"
            }
          </DialogDescription>
        </DialogHeader>



        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ticker, reason, strategy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="LONG">Long</SelectItem>
              <SelectItem value="SHORT">Short</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {uniqueReasons.map(reason => (
                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || statusFilter !== "all" || sideFilter !== "all" || reasonFilter !== "all") && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setSideFilter("all");
                setReasonFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Trade Table */}
        <div className="flex-1 overflow-auto border rounded-lg">
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

        <div className="flex justify-between items-center pt-2 border-t text-sm text-muted-foreground">
          <span>Showing {filteredTrades.length} of {allTrades.length} trades</span>
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}