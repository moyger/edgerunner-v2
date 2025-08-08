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
  EyeOff,
  User,
  Server,
  AlertTriangle
} from "lucide-react";
import { BrokerConnection } from "../../../services/brokers";

interface MT5TestingPanelProps {
  broker: BrokerConnection & { 
    accountData?: any; 
    positionsData?: any; 
    marketData?: any; 
  };
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export function MT5TestingPanel({ broker, onRefresh, isLoading }: MT5TestingPanelProps) {
  const [showRawData, setShowRawData] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const formatCurrency = (value: number | string | undefined) => {
    if (!value && value !== 0) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(num);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      // Test MT5 connection via unified backend
      await fetch('http://localhost:8000/api/broker/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broker: 'mt5',
          categories: ['authentication']
        })
      });
    } catch (error) {
      console.error('MT5 connection test failed:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {broker.status === 'connected' ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" />
              )}
              <span>MetaTrader 5 (MT5)</span>
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
                    MT5 Terminal Connected
                  </span>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  Trading account is active and ready for operations
                </p>
              </div>
            ) : (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-800 dark:text-orange-200 font-medium">
                    MT5 Connection Required
                  </span>
                </div>
                <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
                  Configure MT5 credentials and ensure MT5 terminal is running
                </p>
              </div>
            )}

            {/* MT5 Configuration Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Login ID:
                </span>
                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                  {broker.accountData?.login || '••••••••••'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Server:
                </span>
                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                  {broker.accountData?.server || 'Not configured'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Connection Method:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                  MT5 Python API
                </div>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex justify-center">
              <Button
                onClick={testConnection}
                disabled={testingConnection}
                variant="outline"
                className="w-full md:w-auto"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {broker.accountData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Balance</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(broker.accountData.balance)}
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">Equity</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(broker.accountData.equity)}
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Free Margin</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(broker.accountData.free_margin)}
                </div>
              </div>
              
              {/* Additional Account Details */}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Margin</div>
                  <div className="font-semibold">{formatCurrency(broker.accountData.margin)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Profit</div>
                  <div className={`font-semibold ${
                    broker.accountData.profit > 0 ? 'text-green-600' : 
                    broker.accountData.profit < 0 ? 'text-red-600' : ''
                  }`}>
                    {formatCurrency(broker.accountData.profit)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Margin Level</div>
                  <div className="font-semibold">
                    {broker.accountData.margin_level ? `${broker.accountData.margin_level.toFixed(2)}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Currency</div>
                  <div className="font-semibold">{broker.accountData.currency || 'USD'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No account data available</p>
              <p className="text-sm">Connect to MT5 to view account information</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            Open Positions
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
                      {position.type === 0 ? 'BUY' : 'SELL'} {Math.abs(position.volume)}
                    </div>
                    <div className="text-xs bg-muted px-2 py-1 rounded">
                      #{position.ticket}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Open Price</div>
                      <div className="font-semibold">{position.price_open}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Current Price</div>
                      <div className="font-semibold">{position.price_current}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Profit</div>
                      <div className={`font-semibold ${
                        position.profit > 0 ? 'text-green-600' : 
                        position.profit < 0 ? 'text-red-600' : ''
                      }`}>
                        {formatCurrency(position.profit)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No open positions</p>
              <p className="text-sm">Connect to MT5 to view current positions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {broker.marketData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Symbol</div>
                <div className="font-semibold text-lg">{broker.marketData.symbol}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Bid</div>
                <div className="font-semibold text-lg">{broker.marketData.bid}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Ask</div>
                <div className="font-semibold text-lg">{broker.marketData.ask}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Spread</div>
                <div className="font-semibold text-lg">
                  {broker.marketData.ask && broker.marketData.bid ? 
                    (broker.marketData.ask - broker.marketData.bid).toFixed(5) : 'N/A'
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No market data available</p>
              <p className="text-sm">Connect to MT5 to view real-time quotes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            MT5 Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Setup Required</h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                Add your MT5 credentials to the backend environment configuration:
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded font-mono text-sm">
                <div>MT5_LOGIN=your_account_number</div>
                <div>MT5_PASSWORD=your_password</div>
                <div>MT5_SERVER=your_broker_server</div>
              </div>
            </div>

            {/* Available Endpoints */}
            <div>
              <h4 className="font-medium mb-3 flex items-center justify-between">
                Available API Endpoints
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawData(!showRawData)}
                >
                  {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showRawData ? 'Hide' : 'Show'} Raw Data
                </Button>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-xs text-orange-600">GET /api/broker/mt5/account</div>
                  <div className="text-sm text-muted-foreground mt-1">Account information</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-xs text-orange-600">GET /api/broker/mt5/positions</div>
                  <div className="text-sm text-muted-foreground mt-1">Open positions</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-xs text-orange-600">GET /api/broker/mt5/symbols</div>
                  <div className="text-sm text-muted-foreground mt-1">Available symbols</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-xs text-orange-600">POST /api/broker/mt5/order</div>
                  <div className="text-sm text-muted-foreground mt-1">Place new order</div>
                </div>
              </div>

              {showRawData && broker.accountData && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <h5 className="font-medium mb-2">Account Data Response:</h5>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono max-h-60 overflow-y-auto">
                      <pre>{JSON.stringify(broker.accountData, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}