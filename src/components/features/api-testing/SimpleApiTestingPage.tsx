import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Server,
  Activity,
  Database,
  TrendingUp,
  Settings,
  Info,
  Zap,
  Clock
} from "lucide-react";
import { brokerService, type BrokerConnection } from "../../../services/brokers";
import { SimpleApiClient, testApiConnections } from "../../../services/SimpleApiClient";
import { MT5StatusCard } from "./MT5StatusCard";

interface BackendStatus {
  status: string;
  version: string;
  uptime: number;
  timestamp: string;
}

interface ApiData {
  healthData: any;
  apiStatusData: any;
  brokerStatusData: any;
  accountData: { [key: string]: any };
  marketData: { [key: string]: any };
  positionsData: { [key: string]: any };
  flexQueryData: { [key: string]: any };
}

interface ApiStatus {
  backend: BackendStatus | null;
  brokers: BrokerConnection[];
  lastUpdated: string;
  rawData: ApiData;
}

function SimpleApiTestingPage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    backend: null,
    brokers: [],
    lastUpdated: 'Never',
    rawData: {
      healthData: null,
      apiStatusData: null,
      brokerStatusData: null,
      accountData: {},
      marketData: {},
      positionsData: {},
      flexQueryData: {}
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  // Load API status on component mount
  useEffect(() => {
    refreshApiStatus();
  }, []);

  const refreshApiStatus = async () => {
    setIsLoading(true);
    
    // Run comprehensive test in console
    await testApiConnections();
    
    try {
      // Use simple API client for testing
      const backendHealthy = await SimpleApiClient.testConnection();
      setIsBackendHealthy(backendHealthy);

      let backendStatus: BackendStatus | null = null;
      let brokerStatuses: BrokerConnection[] = [];
      let rawData: ApiData = {
        healthData: null,
        apiStatusData: null,
        brokerStatusData: null,
        accountData: {},
        marketData: {},
        positionsData: {},
        flexQueryData: {}
      };

      if (backendHealthy) {
        // Get backend health details using simple client
        try {
          backendStatus = await SimpleApiClient.get('/health');
          rawData.healthData = backendStatus;
        } catch (error) {
          console.error('Failed to get backend details:', error);
        }

        // Get API status details
        try {
          const response = await fetch('http://localhost:8000/api/status');
          if (response.ok) {
            rawData.apiStatusData = await response.json();
          }
        } catch (error) {
          console.error('Failed to get API status:', error);
        }

        // Get broker statuses - direct API call for debugging
        try {
          // First try direct API call to debug
          const directResponse = await fetch('http://localhost:8000/api/broker/status/all');
          if (directResponse.ok) {
            const directStatuses = await directResponse.json();
            rawData.brokerStatusData = directStatuses;
            brokerStatuses = Object.entries(directStatuses).map(([id, status]) => ({
              ...(status as Record<string, any>),
              id,
              name: id.toUpperCase(),
              status: (status as any)?.status || 'disconnected',
              lastChecked: new Date().toISOString()
            }));
          } else {
            console.error('Direct API call failed:', directResponse.status, directResponse.statusText);
            // Fallback to broker service
            const statuses = await brokerService.getAllBrokerStatuses();
            rawData.brokerStatusData = statuses;
            brokerStatuses = Object.entries(statuses).map(([id, status]) => ({
              ...status,
              id,
              name: id.toUpperCase()
            }));
          }

          // Try to get account data for all brokers (show structure even if disconnected)
          const statusEntries = rawData.brokerStatusData || {};
          for (const [brokerId, status] of Object.entries(statusEntries)) {
            if ((status as any)?.status === 'connected') {
              try {
                const accountResponse = await fetch(`http://localhost:8000/api/account/summary?broker=${brokerId}`);
                if (accountResponse.ok) {
                  rawData.accountData[brokerId] = await accountResponse.json();
                }
              } catch (error) {
                console.error(`Failed to get account data for ${brokerId}:`, error);
                rawData.accountData[brokerId] = { error: error.message };
              }

              try {
                const positionsResponse = await fetch(`http://localhost:8000/api/positions?broker=${brokerId}`);
                if (positionsResponse.ok) {
                  rawData.positionsData[brokerId] = await positionsResponse.json();
                }
              } catch (error) {
                console.error(`Failed to get positions for ${brokerId}:`, error);
                rawData.positionsData[brokerId] = { error: error.message };
              }
            } else {
              // Show expected data structures even when disconnected
              rawData.accountData[brokerId] = {
                account_id: "DU123456",
                error: "No connection - expected structure shown below",
                expected_structure: {
                  account_id: "string",
                  net_liquidation: "number",
                  total_cash_value: "number", 
                  equity_with_loan_value: "number",
                  buying_power: "number",
                  maintenance_margin_req: "number",
                  available_funds: "number",
                  excess_liquidity: "number",
                  cushion: "number",
                  full_init_margin_req: "number",
                  currency: "string"
                }
              };

              rawData.positionsData[brokerId] = {
                positions: [],
                error: "No connection - expected structure shown below",
                expected_structure: {
                  positions: [
                    {
                      symbol: "string",
                      position: "number",
                      market_price: "number",
                      market_value: "number", 
                      average_cost: "number",
                      unrealized_pnl: "number",
                      realized_pnl: "number",
                      currency: "string",
                      contract_id: "number"
                    }
                  ]
                }
              };
            }
          }

        } catch (error) {
          console.error('Failed to get broker statuses:', error);
        }

        // Try to get comprehensive trading data samples (will show structure even if no connection)
        const testSymbols = ['AAPL', 'MSFT', 'TSLA'];
        
        for (const symbol of testSymbols) {
          try {
            const marketResponse = await fetch(`http://localhost:8000/api/market-data?broker=ibkr&symbol=${symbol}`);
            if (marketResponse.ok) {
              rawData.marketData[symbol] = await marketResponse.json();
            } else {
              // Show expected structure even when disconnected
              rawData.marketData[symbol] = {
                symbol: symbol,
                bid: null,
                ask: null,
                last: null,
                volume: null,
                bid_size: null,
                ask_size: null,
                timestamp: new Date().toISOString(),
                error: "No TWS connection - this is the expected data structure"
              };
            }
          } catch (error) {
            rawData.marketData[symbol] = {
              symbol: symbol,
              error: 'Connection failed - expected without TWS',
              expected_structure: {
                symbol: "string",
                bid: "number",
                ask: "number", 
                last: "number",
                volume: "number",
                bid_size: "number",
                ask_size: "number",
                high: "number",
                low: "number",
                close: "number",
                timestamp: "ISO string"
              }
            };
          }
        }

        // Try to get historical data sample
        try {
          const histResponse = await fetch('http://localhost:8000/api/historical-data?broker=ibkr&symbol=AAPL&duration=1 D&bar_size=1 min');
          if (histResponse.ok) {
            rawData.marketData['AAPL_historical'] = await histResponse.json();
          } else {
            rawData.marketData['AAPL_historical'] = {
              symbol: "AAPL",
              bars: [],
              error: "No TWS connection",
              expected_structure: {
                symbol: "string",
                bars: [
                  {
                    timestamp: "ISO string",
                    open: "number",
                    high: "number", 
                    low: "number",
                    close: "number",
                    volume: "number"
                  }
                ]
              }
            };
          }
        } catch (error) {
          console.error('Historical data fetch failed:', error);
        }

        // Try to get Flex Query data
        try {
          // Test trade history endpoint
          const tradesResponse = await fetch('http://localhost:8000/api/flex-query/trades/1267424?token=83876793626275089510528&broker=ibkr');
          if (tradesResponse.ok) {
            rawData.flexQueryData['trades'] = await tradesResponse.json();
          } else {
            rawData.flexQueryData['trades'] = {
              query_id: "1267424",
              data_type: "trades",
              total_records: 0,
              records: [],
              error: "Flex Query not ready or token issue",
              expected_structure: {
                query_id: "string",
                reference_code: "string", 
                data_type: "trades",
                total_records: "number",
                records: [
                  {
                    symbol: "string",
                    tradeDate: "YYYY-MM-DD",
                    quantity: "number",
                    price: "number",
                    proceeds: "number",
                    commission: "number",
                    realizedPL: "number",
                    buySell: "BUY/SELL",
                    openCloseIndicator: "O/C",
                    currency: "string"
                  }
                ],
                generated_at: "ISO timestamp"
              }
            };
          }
        } catch (error) {
          console.error('Flex Query trades fetch failed:', error);
          rawData.flexQueryData['trades'] = {
            error: "Connection failed",
            note: "This is expected if backend is not running"
          };
        }

        // Test positions flex query
        try {
          const positionsFlexResponse = await fetch('http://localhost:8000/api/flex-query/trades/1267425?token=83876793626275089510528&broker=ibkr');
          if (positionsFlexResponse.ok) {
            rawData.flexQueryData['positions'] = await positionsFlexResponse.json();
          } else {
            rawData.flexQueryData['positions'] = {
              query_id: "1267425",
              data_type: "positions",
              total_records: 0,
              records: [],
              error: "Flex Query not ready",
              expected_structure: {
                query_id: "string",
                data_type: "positions",
                total_records: "number",
                records: [
                  {
                    symbol: "string",
                    position: "number",
                    markPrice: "number",
                    positionValue: "number",
                    unrealizedPL: "number",
                    currency: "string"
                  }
                ]
              }
            };
          }
        } catch (error) {
          console.error('Flex Query positions fetch failed:', error);
        }

        // Test manual flex query execution
        try {
          const flexExecuteResponse = await fetch('http://localhost:8000/api/flex-query/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query_id: "1267424",
              token: "83876793626275089510528", 
              broker: "ibkr"
            })
          });

          if (flexExecuteResponse.ok) {
            const executeResult = await flexExecuteResponse.json();
            rawData.flexQueryData['execute_demo'] = executeResult;
          } else {
            rawData.flexQueryData['execute_demo'] = {
              error: "Failed to execute flex query",
              expected_response: {
                query_id: "string",
                reference_code: "string",
                status: "running",
                created_at: "ISO timestamp"
              }
            };
          }
        } catch (error) {
          console.error('Flex Query execute test failed:', error);
        }
      }

      setApiStatus({
        backend: backendStatus,
        brokers: brokerStatuses,
        lastUpdated: new Date().toLocaleTimeString(),
        rawData
      });

    } catch (error) {
      console.error('Failed to refresh API status:', error);
      setIsBackendHealthy(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatUptime = (uptime: number) => {
    const minutes = Math.floor(uptime / 60);
    const seconds = Math.floor(uptime % 60);
    return `${minutes}m ${seconds}s`;
  };

  // Determine overall system capability status
  const getSystemCapabilities = () => {
    const hasBackend = isBackendHealthy === true;
    const hasFlexQueryData = apiStatus.rawData.flexQueryData && 
      Object.keys(apiStatus.rawData.flexQueryData).length > 0 &&
      Object.values(apiStatus.rawData.flexQueryData).some(data => !data?.error);
    
    const hasLiveConnection = apiStatus.brokers.some(b => b.status === 'connected');
    
    return {
      coreSystem: hasBackend,
      historicalData: hasBackend && hasFlexQueryData,
      liveTrading: hasLiveConnection,
      overallStatus: hasBackend ? (hasFlexQueryData ? 'ready' : 'partial') : 'offline'
    };
  };

  const getCapabilityBadgeColor = (status: 'ready' | 'partial' | 'offline' | 'available' | 'unavailable') => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unavailable':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disconnected':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const capabilities = getSystemCapabilities();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Platform Status</h1>
          <p className="text-muted-foreground">
            System capabilities and service availability
          </p>
        </div>
        <Button
          onClick={refreshApiStatus}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* System Status Overview */}
      <Card className={
        capabilities.overallStatus === 'ready' 
          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
          : capabilities.overallStatus === 'partial'
          ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
          : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
      }>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {capabilities.overallStatus === 'ready' ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : capabilities.overallStatus === 'partial' ? (
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600" />
            )}
            <div>
              <div className="text-xl">
                {capabilities.overallStatus === 'ready' && 'System Ready'}
                {capabilities.overallStatus === 'partial' && 'System Partially Ready'}
                {capabilities.overallStatus === 'offline' && 'System Offline'}
              </div>
              <div className={`text-sm font-normal ${
                capabilities.overallStatus === 'ready' 
                  ? 'text-green-700 dark:text-green-300'
                  : capabilities.overallStatus === 'partial'
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {capabilities.overallStatus === 'ready' && 
                  'Your trading analytics platform is fully operational with historical data access'
                }
                {capabilities.overallStatus === 'partial' && 
                  'Backend running, but historical data may be limited'
                }
                {capabilities.overallStatus === 'offline' && 
                  'Backend server needs to be started'
                }
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiStatus.backend && capabilities.overallStatus !== 'offline' && (
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>v{apiStatus.backend.version}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Uptime: {formatUptime(apiStatus.backend.uptime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>Updated: {apiStatus.lastUpdated}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Platform Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Core System */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Core System</h3>
                <Badge className={getCapabilityBadgeColor(capabilities.coreSystem ? 'available' : 'unavailable')}>
                  {capabilities.coreSystem ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  {capabilities.coreSystem ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>API Backend Server</span>
                </div>
                <div className="flex items-center gap-2">
                  {capabilities.coreSystem ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>System Health Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  {capabilities.coreSystem ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>API Endpoints</span>
                </div>
              </div>
            </div>

            {/* Historical Data */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Historical Data</h3>
                <Badge className={getCapabilityBadgeColor(capabilities.historicalData ? 'available' : 'unavailable')}>
                  {capabilities.historicalData ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  {capabilities.historicalData ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  )}
                  <span>IBKR Flex Queries</span>
                </div>
                <div className="flex items-center gap-2">
                  {capabilities.historicalData ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  )}
                  <span>Trade History Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  {capabilities.historicalData ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  )}
                  <span>Portfolio Analytics</span>
                </div>
              </div>
            </div>

            {/* Live Trading */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Live Trading</h3>
                <Badge className={getCapabilityBadgeColor(capabilities.liveTrading ? 'available' : 'unavailable')}>
                  {capabilities.liveTrading ? 'Available' : 'Setup Required'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  {capabilities.liveTrading ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Settings className="h-3 w-3 text-gray-400" />
                  )}
                  <span>Real-time Market Data</span>
                </div>
                <div className="flex items-center gap-2">
                  {capabilities.liveTrading ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Settings className="h-3 w-3 text-gray-400" />
                  )}
                  <span>Order Execution</span>
                </div>
                <div className="flex items-center gap-2">
                  {capabilities.liveTrading ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Settings className="h-3 w-3 text-gray-400" />
                  )}
                  <span>Live Portfolio Updates</span>
                </div>
              </div>
              {!capabilities.liveTrading && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="text-xs text-muted-foreground">
                    <Info className="h-3 w-3 inline mr-1" />
                    Requires TWS or IBKR Gateway connection
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MT5 Status */}
      <MT5StatusCard 
        onAutoConnect={(success) => {
          if (success) {
            console.log('MT5 auto-connection successful');
            // Refresh the broker status to reflect the new connection
            refreshApiStatus();
          } else {
            console.log('MT5 auto-connection failed');
          }
        }}
      />

      {/* Technical Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Backend Details */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Backend API Server</div>
                  <div className="text-sm text-muted-foreground">Core system services</div>
                </div>
              </div>
              <Badge className={getCapabilityBadgeColor(capabilities.coreSystem ? 'available' : 'unavailable')}>
                {capabilities.coreSystem ? 'Running' : 'Offline'}
              </Badge>
            </div>

            {/* Broker Service Details */}
            {apiStatus.brokers.map((broker) => (
              <div key={broker.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {broker.status === 'connected' ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <div className="font-medium">{broker.name} Live Connection</div>
                    <div className="text-sm text-muted-foreground">
                      {broker.status === 'connected' 
                        ? 'Real-time data and trading available'
                        : 'Historical data available via Flex Queries'
                      }
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(broker.status)}>
                  {broker.status === 'connected' ? 'Connected' : 'Setup Required'}
                </Badge>
              </div>
            ))}

            {/* Historical Data Service */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">IBKR Historical Data</div>
                  <div className="text-sm text-muted-foreground">Flex Query system for comprehensive analysis</div>
                </div>
              </div>
              <Badge className={getCapabilityBadgeColor(capabilities.historicalData ? 'available' : 'unavailable')}>
                {capabilities.historicalData ? 'Available' : 'Limited'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Data Available */}
      {isBackendHealthy && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Trading Data You Can Pull</CardTitle>
            <p className="text-muted-foreground">
              All available data structures for frontend integration (shows expected format even when disconnected)
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* System Health Data */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🏥 System Health Data
              </h3>
              <div className="space-y-3">
                {apiStatus.rawData.healthData && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">GET /health - Backend Health</h4>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono">
                      <pre>{JSON.stringify(apiStatus.rawData.healthData, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {apiStatus.rawData.apiStatusData && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">GET /api/status - Full System Status</h4>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono">
                      <pre>{JSON.stringify(apiStatus.rawData.apiStatusData, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {apiStatus.rawData.brokerStatusData && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">GET /api/broker/status/all - Broker Connections</h4>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono">
                      <pre>{JSON.stringify(apiStatus.rawData.brokerStatusData, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Market Data */}
            {Object.keys(apiStatus.rawData.marketData).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  📈 Live Market Data
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Real-time quotes, historical bars, and market depth data
                </p>
                <div className="space-y-3">
                  {Object.entries(apiStatus.rawData.marketData).map(([key, data]) => (
                    <div key={key}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {key.includes('historical') ? 
                          `GET /api/broker/ibkr/historical/${key.split('_')[0]} - Historical OHLC Data` :
                          `GET /api/broker/ibkr/market-data/${key} - Real-time Market Data`
                        }
                      </h4>
                      <div className="bg-muted p-3 rounded-md text-xs font-mono max-h-60 overflow-y-auto">
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Account & Portfolio Data */}
            {Object.keys(apiStatus.rawData.accountData).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  💰 Account & Portfolio Data
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Account summary, positions, P&L, and portfolio values
                </p>
                <div className="space-y-3">
                  {Object.entries(apiStatus.rawData.accountData).map(([broker, data]) => (
                    <div key={broker}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        GET /api/broker/{broker}/account - Account Summary
                      </h4>
                      <div className="bg-muted p-3 rounded-md text-xs font-mono">
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positions Data */}
            {Object.keys(apiStatus.rawData.positionsData).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  📊 Position Data
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Current holdings, unrealized P&L, and position details
                </p>
                <div className="space-y-3">
                  {Object.entries(apiStatus.rawData.positionsData).map(([broker, data]) => (
                    <div key={broker}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        GET /api/broker/{broker}/positions - Current Positions
                      </h4>
                      <div className="bg-muted p-3 rounded-md text-xs font-mono">
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flex Query Historical Data */}
            {Object.keys(apiStatus.rawData.flexQueryData).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  📜 IBKR Flex Query Historical Data
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Historical trade data, performance metrics, and comprehensive trading analysis via IBKR Flex Queries
                </p>
                <div className="space-y-3">
                  {Object.entries(apiStatus.rawData.flexQueryData).map(([key, data]) => (
                    <div key={key}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {key === 'trades' && 'GET /api/flex-query/trades/1267424 - Trade History'}
                        {key === 'positions' && 'GET /api/flex-query/trades/1267425 - Historical Positions'}
                        {key === 'execute_demo' && 'POST /api/flex-query/execute - Execute New Query'}
                        {!['trades', 'positions', 'execute_demo'].includes(key) && `Flex Query: ${key}`}
                      </h4>
                      <div className="bg-muted p-3 rounded-md text-xs font-mono max-h-60 overflow-y-auto">
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                      </div>
                      
                      {/* Show summary for trade data */}
                      {key === 'trades' && data.records && data.records.length > 0 && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                            📊 Trading Summary from your actual IBKR data:
                          </p>
                          <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                            <div>Total Trades: {data.total_records}</div>
                            <div>Symbols: {[...new Set(data.records.map((r: any) => r.symbol))].join(', ')}</div>
                            <div>Currencies: {[...new Set(data.records.map((r: any) => r.currency))].join(', ')}</div>
                            {data.records.some((r: any) => r.proceeds) && (
                              <div>
                                Total Volume: ${Math.abs(data.records.reduce((sum: number, r: any) => 
                                  sum + (parseFloat(r.proceeds) || 0), 0)).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {capabilities.overallStatus !== 'offline' && (
        <Card className={
          capabilities.overallStatus === 'ready'
            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
            : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
        }>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className={`h-5 w-5 mt-0.5 ${
                capabilities.overallStatus === 'ready' ? 'text-green-600' : 'text-blue-600'
              }`} />
              <div className="space-y-2 text-sm">
                <p className={`font-medium ${
                  capabilities.overallStatus === 'ready' 
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-blue-900 dark:text-blue-100'
                }`}>
                  {capabilities.overallStatus === 'ready'
                    ? '🎉 Trading Platform is Ready!'
                    : '⚡ Core System is Running!'
                  }
                </p>
                <p className={capabilities.overallStatus === 'ready' 
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-blue-700 dark:text-blue-300'
                }>
                  {capabilities.overallStatus === 'ready'
                    ? 'Your trading analytics platform is fully operational with comprehensive historical data access. All core features are available for building dashboards and analytics.'
                    : 'Your backend API is running and ready to serve data. Historical trading analysis capabilities may be limited without additional configuration.'
                  }
                </p>
                <p className={capabilities.overallStatus === 'ready' 
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-blue-700 dark:text-blue-300'
                }>
                  Above you can see the actual JSON data available from each API endpoint. 
                  This is the data structure you'll integrate into your frontend components.
                </p>
                <div className="mt-3 space-y-4">
                  {/* Available Now */}
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-md">
                    <p className="font-medium text-green-900 dark:text-green-100 text-sm mb-2">
                      ✅ Available Now - Core Platform Features
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200 text-sm">🏥 System Health:</p>
                        <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-300 text-xs ml-4">
                          <li><code>/health</code> - Backend health and uptime monitoring</li>
                          <li><code>/api/status</code> - Complete system status overview</li>
                          <li><code>/api/broker/status/all</code> - Service availability status</li>
                        </ul>
                      </div>
                      
                      {capabilities.historicalData && (
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200 text-sm">📜 Historical Trading Data:</p>
                          <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-300 text-xs ml-4">
                            <li><code>/api/flex-query/execute</code> - Execute new Flex Query for historical data</li>
                            <li><code>/api/flex-query/trades/{'{query_id}'}</code> - Complete trade history with P&L</li>
                            <li><code>/api/flex-query/performance</code> - Performance metrics (Sharpe, drawdown, etc.)</li>
                            <li><strong>Your actual IBKR trading history is accessible via API!</strong></li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Requires TWS Setup */}
                  {!capabilities.liveTrading && (
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-md">
                      <p className="font-medium text-orange-900 dark:text-orange-100 text-sm mb-2">
                        🔧 Requires TWS/Gateway Setup - Live Trading Features
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200 text-sm">📈 Live Market Data:</p>
                          <ul className="list-disc list-inside space-y-1 text-orange-700 dark:text-orange-300 text-xs ml-4">
                            <li><code>/api/market-data/{'{symbol}'}</code> - Real-time quotes (bid/ask/last/volume)</li>
                            <li><code>/api/historical-data/{'{symbol}'}</code> - Live historical OHLC bars</li>
                            <li><code>/api/market-depth/{'{symbol}'}</code> - Level II market depth</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium text-orange-800 dark:text-orange-200 text-sm">💰 Live Portfolio & Trading:</p>
                          <ul className="list-disc list-inside space-y-1 text-orange-700 dark:text-orange-300 text-xs ml-4">
                            <li><code>/api/account/summary</code> - Live account summary (cash, buying power)</li>
                            <li><code>/api/positions</code> - Current positions with real-time P&L</li>
                            <li><code>/api/orders</code> - Order management and execution</li>
                            <li><code>WebSocket</code> - Real-time streaming updates</li>
                          </ul>
                        </div>

                        <div className="mt-2 p-2 bg-orange-200 dark:bg-orange-800 rounded text-xs">
                          <p className="font-medium text-orange-900 dark:text-orange-100">To enable live trading features:</p>
                          <ol className="list-decimal list-inside space-y-1 text-orange-800 dark:text-orange-200 mt-1">
                            <li>Download and install IBKR Trader Workstation (TWS) or IB Gateway</li>
                            <li>Configure API access in TWS settings (Enable API, set socket port to 7497)</li>
                            <li>Start TWS/Gateway and ensure API connection is active</li>
                            <li>Your platform will automatically detect the connection</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Integration Guide */}
                  <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-md">
                    <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">📋 Frontend Integration Guide:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 text-xs mt-2">
                      <li>Use the JSON structures shown above to create TypeScript interfaces</li>
                      <li>Build services around the available endpoint URLs</li>
                      <li>Implement proper error handling for unavailable features</li>
                      <li>Start with historical data features - they're ready to use now!</li>
                      {capabilities.historicalData && (
                        <li className="font-medium">🎯 Build comprehensive trading analytics dashboards with your actual trade history</li>
                      )}
                      <li>Add live trading features progressively as TWS setup is completed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SimpleApiTestingPage;