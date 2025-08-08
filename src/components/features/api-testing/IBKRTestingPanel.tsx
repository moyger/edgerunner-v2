import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  BarChart3,
  TrendingUp,
  Activity,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { BrokerConnection } from "../../../services/brokers";

interface IBKRTestingPanelProps {
  broker: BrokerConnection & { 
    accountData?: any; 
    positionsData?: any; 
    marketData?: any; 
  };
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export function IBKRTestingPanel({ broker, onRefresh, isLoading }: IBKRTestingPanelProps) {
  const [showRawData, setShowRawData] = useState(false);
  const [testingMarketData, setTestingMarketData] = useState(false);

  const formatCurrency = (value: number | string | undefined) => {
    if (!value && value !== 0) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(num);
  };

  const formatPercentage = (value: number | string | undefined) => {
    if (!value && value !== 0) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(2)}%`;
  };

  const testMarketData = async () => {
    setTestingMarketData(true);
    try {
      const symbols = ['AAPL', 'MSFT', 'TSLA'];
      for (const symbol of symbols) {
        await fetch(`http://localhost:8000/api/market-data?broker=ibkr&symbol=${symbol}`);
      }
    } catch (error) {
      console.error('Market data test failed:', error);
    } finally {
      setTestingMarketData(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {broker.status === 'connected' ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" />
              )}
              <span>Interactive Brokers (IBKR)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={broker.status === 'connected' ? 'default' : 'secondary'}
                className={broker.status === 'connected' ? 
                  'bg-green-100 text-green-800 border-green-200' : 
                  'bg-gray-100 text-gray-800 border-gray-200'
                }
              >
                {broker.status === 'connected' ? 'Connected' : 'Offline'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {broker.status === 'connected' ? (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    TWS Connection Active
                  </span>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  Real-time market data and trading capabilities are available
                </p>
              </div>
            ) : (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-800 dark:text-orange-200 font-medium">
                    TWS Connection Required
                  </span>
                </div>
                <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
                  Start TWS or IB Gateway with API enabled (port 7497) to access live features
                </p>
              </div>
            )}

            {/* Connection Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Connection Method:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                  TWS API (Port 7497)
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Check:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Account Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {broker.accountData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Net Liquidation</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(broker.accountData.net_liquidation)}
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">Available Funds</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(broker.accountData.available_funds)}
                </div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Buying Power</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(broker.accountData.buying_power)}
                </div>
              </div>
              
              {/* Additional Account Details */}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Cash Value</div>
                  <div className="font-semibold">{formatCurrency(broker.accountData.total_cash_value)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Equity w/ Loan</div>
                  <div className="font-semibold">{formatCurrency(broker.accountData.equity_with_loan_value)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Margin Req</div>
                  <div className="font-semibold">{formatCurrency(broker.accountData.maintenance_margin_req)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Cushion</div>
                  <div className="font-semibold">{formatPercentage(broker.accountData.cushion)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No account data available</p>
              <p className="text-sm">Connect to TWS to view account information</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Current Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {broker.positionsData?.positions && broker.positionsData.positions.length > 0 ? (
            <div className="space-y-4">
              {broker.positionsData.positions.map((position: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="font-semibold">{position.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {position.position > 0 ? 'LONG' : 'SHORT'} {Math.abs(position.position)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Market Value</div>
                      <div className="font-semibold">{formatCurrency(position.market_value)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Unrealized P&L</div>
                      <div className={`font-semibold ${
                        position.unrealized_pnl > 0 ? 'text-green-600' : 
                        position.unrealized_pnl < 0 ? 'text-red-600' : ''
                      }`}>
                        {formatCurrency(position.unrealized_pnl)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No positions found</p>
              <p className="text-sm">Connect to TWS to view current positions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Data Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Market Data Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Real-time Market Data</h4>
                <p className="text-sm text-muted-foreground">
                  Test live quotes for popular symbols (AAPL, MSFT, TSLA)
                </p>
              </div>
              <Button
                onClick={testMarketData}
                disabled={testingMarketData || broker.status !== 'connected'}
                variant="outline"
              >
                {testingMarketData ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4 mr-2" />
                )}
                Test Market Data
              </Button>
            </div>

            {broker.marketData && (
              <div className="p-3 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Sample Market Data (AAPL):</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Last Price</div>
                    <div className="font-semibold">{broker.marketData.last || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Bid/Ask</div>
                    <div className="font-semibold">
                      {broker.marketData.bid || 'N/A'} / {broker.marketData.ask || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Volume</div>
                    <div className="font-semibold">{broker.marketData.volume || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Time</div>
                    <div className="font-semibold">
                      {broker.marketData.timestamp ? 
                        new Date(broker.marketData.timestamp).toLocaleTimeString() : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Available API Endpoints
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showRawData ? 'Hide' : 'Show'} Raw Data
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <div className="font-mono text-xs text-blue-600">GET /api/account/summary?broker=ibkr</div>
                <div className="text-sm text-muted-foreground mt-1">Account balance and summary</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-mono text-xs text-blue-600">GET /api/positions?broker=ibkr</div>
                <div className="text-sm text-muted-foreground mt-1">Current positions and P&L</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-mono text-xs text-blue-600">GET /api/market-data?broker=ibkr&symbol=AAPL</div>
                <div className="text-sm text-muted-foreground mt-1">Real-time market quotes</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-mono text-xs text-blue-600">GET /api/historical-data?broker=ibkr&symbol=AAPL</div>
                <div className="text-sm text-muted-foreground mt-1">Historical OHLC data</div>
              </div>
            </div>

            {showRawData && (
              <div className="space-y-4 pt-4 border-t">
                {broker.accountData && (
                  <div>
                    <h5 className="font-medium mb-2">Account Data Response:</h5>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono max-h-60 overflow-y-auto">
                      <pre>{JSON.stringify(broker.accountData, null, 2)}</pre>
                    </div>
                  </div>
                )}
                {broker.positionsData && (
                  <div>
                    <h5 className="font-medium mb-2">Positions Data Response:</h5>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono max-h-60 overflow-y-auto">
                      <pre>{JSON.stringify(broker.positionsData, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}