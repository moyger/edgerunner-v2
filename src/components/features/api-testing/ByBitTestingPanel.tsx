import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  BarChart3,
  TrendingUp,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Key,
  Globe,
  AlertTriangle
} from "lucide-react";
import { BrokerConnection } from "../../../services/brokers";

interface ByBitTestingPanelProps {
  broker: BrokerConnection & { 
    accountData?: any; 
    positionsData?: any; 
    marketData?: any; 
  };
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export function ByBitTestingPanel({ broker, onRefresh, isLoading }: ByBitTestingPanelProps) {
  const [showRawData, setShowRawData] = useState(false);
  const [testingAPI, setTestingAPI] = useState(false);

  const formatCurrency = (value: number | string | undefined, currency = 'USDT') => {
    if (!value && value !== 0) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toLocaleString()} ${currency}`;
  };

  const testAPIConnection = async () => {
    setTestingAPI(true);
    try {
      // Simulate ByBit API connection test
      await fetch('http://localhost:8000/api/broker/bybit/test', {
        method: 'POST'
      });
    } catch (error) {
      console.error('ByBit API test failed:', error);
    } finally {
      setTestingAPI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {broker.status === 'connected' ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" />
              )}
              <span>ByBit Exchange</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={broker.status === 'connected' ? 'default' : 'secondary'}
                className={broker.status === 'connected' ? 
                  'bg-green-100 text-green-800 border-green-200' : 
                  'bg-gray-100 text-gray-800 border-gray-200'
                }
              >
                {broker.status === 'connected' ? 'Connected' : 'API Setup Required'}
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
                    ByBit API Connected
                  </span>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  Crypto trading capabilities are active
                </p>
              </div>
            ) : (
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-md border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-800 dark:text-purple-200 font-medium">
                    ByBit API Setup Required
                  </span>
                </div>
                <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">
                  Configure API keys for cryptocurrency trading access
                </p>
              </div>
            )}

            {/* API Configuration Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Key:
                </span>
                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                  {broker.accountData?.api_key ? '••••••••••' : 'Not configured'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Environment:
                </span>
                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                  {broker.accountData?.environment || 'Testnet'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Connection Method:</span>
                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                  REST API + WebSocket
                </div>
              </div>
            </div>

            {/* Test API Button */}
            <div className="flex justify-center">
              <Button
                onClick={testAPIConnection}
                disabled={testingAPI}
                variant="outline"
                className="w-full md:w-auto"
              >
                {testingAPI ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing API...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Test API Connection
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {broker.accountData ? (
            <div className="space-y-6">
              {/* Main Balance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Balance</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(broker.accountData.total_balance, 'USDT')}
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">Available Balance</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(broker.accountData.available_balance, 'USDT')}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Used Margin</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(broker.accountData.used_margin, 'USDT')}
                  </div>
                </div>
              </div>

              {/* Coin Balances */}
              {broker.accountData.coin_balances && (
                <div>
                  <h4 className="font-medium mb-3">Coin Balances</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(broker.accountData.coin_balances).map(([coin, balance]: [string, any]) => (
                      <div key={coin} className="p-3 border rounded-lg">
                        <div className="font-medium">{coin}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(balance.wallet_balance, coin)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Available: {formatCurrency(balance.available_balance, coin)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No balance data available</p>
              <p className="text-sm">Connect ByBit API to view account balances</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
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
                    <div className={`text-sm px-2 py-1 rounded text-white ${
                      position.side === 'Buy' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {position.side}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Size: {position.size}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Entry Price</div>
                      <div className="font-semibold">{formatCurrency(position.avg_price, 'USDT')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Mark Price</div>
                      <div className="font-semibold">{formatCurrency(position.mark_price, 'USDT')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Unrealized PnL</div>
                      <div className={`font-semibold ${
                        position.unrealised_pnl > 0 ? 'text-green-600' : 
                        position.unrealised_pnl < 0 ? 'text-red-600' : ''
                      }`}>
                        {formatCurrency(position.unrealised_pnl, 'USDT')}
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
              <p className="text-sm">Connect ByBit API to view current positions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Cryptocurrency Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {broker.marketData ? (
            <div className="space-y-4">
              {/* Sample Crypto Prices */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['BTCUSDT', 'ETHUSDT', 'ADAUSDT'].map((symbol) => (
                  <div key={symbol} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{symbol}</div>
                      <div className="text-sm text-green-600">+2.34%</div>
                    </div>
                    <div className="text-2xl font-bold">$47,253.50</div>
                    <div className="text-sm text-muted-foreground">Vol: 1.2B</div>
                  </div>
                ))}
              </div>
              
              {/* Order Book Sample */}
              <div>
                <h4 className="font-medium mb-3">Order Book (BTCUSDT)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-red-600 font-medium mb-2">Asks</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>47,255.00</span>
                        <span className="text-muted-foreground">0.125</span>
                      </div>
                      <div className="flex justify-between">
                        <span>47,254.50</span>
                        <span className="text-muted-foreground">0.234</span>
                      </div>
                      <div className="flex justify-between">
                        <span>47,254.00</span>
                        <span className="text-muted-foreground">0.456</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-600 font-medium mb-2">Bids</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>47,253.00</span>
                        <span className="text-muted-foreground">0.234</span>
                      </div>
                      <div className="flex justify-between">
                        <span>47,252.50</span>
                        <span className="text-muted-foreground">0.345</span>
                      </div>
                      <div className="flex justify-between">
                        <span>47,252.00</span>
                        <span className="text-muted-foreground">0.567</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No market data available</p>
              <p className="text-sm">Connect ByBit API to view crypto prices</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            ByBit API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">API Setup Required</h4>
              <p className="text-purple-700 dark:text-purple-300 text-sm mb-3">
                Add your ByBit API credentials to the backend configuration:
              </p>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded font-mono text-sm">
                <div>BYBIT_API_KEY=your_api_key</div>
                <div>BYBIT_SECRET_KEY=your_secret_key</div>
                <div>BYBIT_TESTNET=true  # Use false for mainnet</div>
              </div>
              <div className="mt-3 p-2 bg-purple-200 dark:bg-purple-800 rounded text-xs">
                <p className="font-medium">⚠️ Security Note:</p>
                <p>Only use API keys with read permissions for testing. Never commit API keys to version control.</p>
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
                  <div className="font-mono text-xs text-purple-600">GET /api/broker/bybit/account</div>
                  <div className="text-sm text-muted-foreground mt-1">Account balance and info</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-xs text-purple-600">GET /api/broker/bybit/positions</div>
                  <div className="text-sm text-muted-foreground mt-1">Open positions</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-xs text-purple-600">GET /api/broker/bybit/orderbook</div>
                  <div className="text-sm text-muted-foreground mt-1">Market depth data</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-xs text-purple-600">POST /api/broker/bybit/order</div>
                  <div className="text-sm text-muted-foreground mt-1">Place new order</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-xs text-purple-600">GET /api/broker/bybit/klines</div>
                  <div className="text-sm text-muted-foreground mt-1">Historical price data</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-xs text-purple-600">WS /api/broker/bybit/stream</div>
                  <div className="text-sm text-muted-foreground mt-1">Real-time price feeds</div>
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

            {/* Trading Features */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Available Trading Features</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Spot Trading</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Futures Trading</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Options Trading</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Margin Trading</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}