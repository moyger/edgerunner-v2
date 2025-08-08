import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { SystemDiagnosticsPanel } from "./SystemDiagnosticsPanel";

interface ApiResponse {
  url: string;
  status: number;
  headers: Record<string, string>;
  data: any;
  timestamp: string;
  error?: string;
}

interface BrokerTestData {
  connection: ApiResponse | null;
  account: ApiResponse | null;
  positions: ApiResponse | null;
  marketData: ApiResponse | null;
  flexQuery: ApiResponse | null;
}

function ApiTestingPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [testData, setTestData] = useState<Record<string, BrokerTestData>>({
    ibkr: {
      connection: null,
      account: null,
      positions: null,
      marketData: null,
      flexQuery: null,
    },
    mt5: {
      connection: null,
      account: null,
      positions: null,
      marketData: null,
      flexQuery: null,
    },
    bybit: {
      connection: null,
      account: null,
      positions: null,
      marketData: null,
      flexQuery: null,
    },
  });

  const makeApiCall = async (url: string, options: RequestInit = {}): Promise<ApiResponse> => {
    const timestamp = new Date().toISOString();
    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => response.text());
      
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      return {
        url,
        status: response.status,
        headers,
        data,
        timestamp,
      };
    } catch (error) {
      return {
        url,
        status: 0,
        headers: {},
        data: null,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const testConnection = async (broker: string) => {
    const key = `${broker}-connection`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await makeApiCall(`http://localhost:8000/api/broker/status?broker=${broker}`);
      setTestData(prev => ({
        ...prev,
        [broker]: { ...prev[broker], connection: result },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const testAccount = async (broker: string) => {
    const key = `${broker}-account`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await makeApiCall(`http://localhost:8000/api/account/summary?broker=${broker}`);
      setTestData(prev => ({
        ...prev,
        [broker]: { ...prev[broker], account: result },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const testPositions = async (broker: string) => {
    const key = `${broker}-positions`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await makeApiCall(`http://localhost:8000/api/positions?broker=${broker}`);
      setTestData(prev => ({
        ...prev,
        [broker]: { ...prev[broker], positions: result },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const testMarketData = async (broker: string) => {
    const key = `${broker}-market`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const symbol = broker === 'bybit' ? 'BTCUSDT' : 'AAPL';
      const result = await makeApiCall(`http://localhost:8000/api/market-data?broker=${broker}&symbol=${symbol}`);
      setTestData(prev => ({
        ...prev,
        [broker]: { ...prev[broker], marketData: result },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const testFlexQuery = async (broker: string) => {
    if (broker !== 'ibkr') return;
    
    const key = `${broker}-flex`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await makeApiCall(
        'http://localhost:8000/api/flex-query/trades/1267424?token=83876793626275089510528&broker=ibkr'
      );
      setTestData(prev => ({
        ...prev,
        [broker]: { ...prev[broker], flexQuery: result },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const testAll = async (broker: string) => {
    await Promise.all([
      testConnection(broker),
      testAccount(broker),
      testPositions(broker),
      testMarketData(broker),
      ...(broker === 'ibkr' ? [testFlexQuery(broker)] : []),
    ]);
  };

  const ResponseDisplay = ({ response }: { response: ApiResponse | null }) => {
    if (!response) {
      return <div className="text-muted-foreground text-sm">No data - click test button to make API call</div>;
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-blue-600 dark:text-blue-400">{response.url}</span>
          <span className={`font-semibold ${
            response.status >= 200 && response.status < 300 
              ? 'text-green-600 dark:text-green-400' 
              : response.status >= 400 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-yellow-600 dark:text-yellow-400'
          }`}>
            {response.error ? 'ERROR' : response.status}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {response.timestamp}
        </div>

        {response.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
            <div className="text-sm font-semibold text-red-800 dark:text-red-400">Error</div>
            <div className="text-sm text-red-700 dark:text-red-300 font-mono">{response.error}</div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground">Headers:</div>
          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto border">
            {JSON.stringify(response.headers, null, 2)}
          </pre>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground">Response Body:</div>
          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto border">
            {typeof response.data === 'string' 
              ? response.data 
              : JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const BrokerTestPanel = ({ broker }: { broker: string }) => {
    const data = testData[broker];
    const brokerName = broker.toUpperCase();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{brokerName} API Testing</h2>
          <Button
            onClick={() => testAll(broker)}
            disabled={Object.values(loading).some(Boolean)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
            Test All Endpoints
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Connection Status */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-card-foreground">Connection Status</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnection(broker)}
                disabled={loading[`${broker}-connection`]}
              >
                {loading[`${broker}-connection`] && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Test
              </Button>
            </div>
            <ResponseDisplay response={data.connection} />
          </div>

          {/* Account Summary */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-card-foreground">Account Summary</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testAccount(broker)}
                disabled={loading[`${broker}-account`]}
              >
                {loading[`${broker}-account`] && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Test
              </Button>
            </div>
            <ResponseDisplay response={data.account} />
          </div>

          {/* Positions */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-card-foreground">Positions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testPositions(broker)}
                disabled={loading[`${broker}-positions`]}
              >
                {loading[`${broker}-positions`] && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Test
              </Button>
            </div>
            <ResponseDisplay response={data.positions} />
          </div>

          {/* Market Data */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-card-foreground">
                Market Data ({broker === 'bybit' ? 'BTCUSDT' : 'AAPL'})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testMarketData(broker)}
                disabled={loading[`${broker}-market`]}
              >
                {loading[`${broker}-market`] && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Test
              </Button>
            </div>
            <ResponseDisplay response={data.marketData} />
          </div>

          {/* Flex Query (IBKR only) */}
          {broker === 'ibkr' && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-card-foreground">Flex Query (Trade History)</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testFlexQuery(broker)}
                  disabled={loading[`${broker}-flex`]}
                >
                  {loading[`${broker}-flex`] && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Test
                </Button>
              </div>
              <ResponseDisplay response={data.flexQuery} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-background text-foreground min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">API Testing - Raw Data View</h1>
        <p className="text-muted-foreground mt-2">
          Test broker API endpoints and view raw JSON/XML responses
        </p>
      </div>

      <Tabs defaultValue="diagnostics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diagnostics">🔍 Diagnostics</TabsTrigger>
          <TabsTrigger value="ibkr">Interactive Brokers</TabsTrigger>
          <TabsTrigger value="mt5">MetaTrader 5</TabsTrigger>
          <TabsTrigger value="bybit">ByBit</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics">
          <SystemDiagnosticsPanel />
        </TabsContent>

        <TabsContent value="ibkr">
          <BrokerTestPanel broker="ibkr" />
        </TabsContent>

        <TabsContent value="mt5">
          <BrokerTestPanel broker="mt5" />
        </TabsContent>

        <TabsContent value="bybit">
          <BrokerTestPanel broker="bybit" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ApiTestingPage;