import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw,
  TrendingUp,
  Wifi,
  WifiOff,
  DollarSign,
  BarChart3,
  ArrowUpDown
} from "lucide-react";
import { brokerService, type BrokerConnection } from "../../../services/brokers";
import { SystemOverviewCard } from "./SystemOverviewCard";
import { IBKRTestingPanel } from "./IBKRTestingPanel";
import { MT5TestingPanel } from "./MT5TestingPanel";
import { ByBitTestingPanel } from "./ByBitTestingPanel";
import { SystemHealthPanel } from "./SystemHealthPanel";

interface BrokerTestingDashboardState {
  isLoading: boolean;
  lastUpdated: string;
  brokers: {
    ibkr: BrokerConnection & { accountData?: any; positionsData?: any; marketData?: any };
    mt5: BrokerConnection & { accountData?: any; positionsData?: any; marketData?: any };
    bybit: BrokerConnection & { accountData?: any; positionsData?: any; marketData?: any };
  };
  systemHealth: {
    backend: any;
    status: 'healthy' | 'degraded' | 'offline';
  };
}

export function BrokerTestingDashboard() {
  const [state, setState] = useState<BrokerTestingDashboardState>({
    isLoading: true,
    lastUpdated: 'Never',
    brokers: {
      ibkr: { id: 'ibkr', name: 'Interactive Brokers', status: 'disconnected', lastChecked: new Date().toISOString() },
      mt5: { id: 'mt5', name: 'MetaTrader 5', status: 'disconnected', lastChecked: new Date().toISOString() },
      bybit: { id: 'bybit', name: 'ByBit', status: 'disconnected', lastChecked: new Date().toISOString() }
    },
    systemHealth: {
      backend: null,
      status: 'offline'
    }
  });
  
  const [activeTab, setActiveTab] = useState('overview');

  const refreshAllData = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Check backend health
      const backendHealthy = await brokerService.isBackendAvailable();
      
      let systemHealth: { backend: any; status: 'healthy' | 'degraded' | 'offline' } = { backend: null, status: 'offline' };
      let brokers = { ...state.brokers };

      if (backendHealthy) {
        // Get backend details
        try {
          const response = await fetch('http://localhost:8000/health');
          if (response.ok) {
            const backendData = await response.json();
            systemHealth = { backend: backendData, status: 'healthy' };
          }
        } catch (error) {
          console.error('Backend health check failed:', error);
          systemHealth = { ...systemHealth, status: 'degraded' };
        }

        // Get all broker statuses
        try {
          const brokerStatuses = await brokerService.getAllBrokerStatuses();
          
          // Update each broker with its status and data
          for (const [brokerId, status] of Object.entries(brokerStatuses)) {
            if (brokers[brokerId as keyof typeof brokers]) {
              brokers[brokerId as keyof typeof brokers] = {
                ...brokers[brokerId as keyof typeof brokers],
                ...status
              };

              // Fetch broker-specific data if connected
              if (status.status === 'connected') {
                try {
                  // Account data
                  const accountResponse = await fetch(`http://localhost:8000/api/account/summary?broker=${brokerId}`);
                  if (accountResponse.ok) {
                    brokers[brokerId as keyof typeof brokers].accountData = await accountResponse.json();
                  }

                  // Positions data
                  const positionsResponse = await fetch(`http://localhost:8000/api/positions?broker=${brokerId}`);
                  if (positionsResponse.ok) {
                    brokers[brokerId as keyof typeof brokers].positionsData = await positionsResponse.json();
                  }

                  // Sample market data for common symbols
                  const marketDataResponse = await fetch(`http://localhost:8000/api/market-data?broker=${brokerId}&symbol=AAPL`);
                  if (marketDataResponse.ok) {
                    brokers[brokerId as keyof typeof brokers].marketData = await marketDataResponse.json();
                  }
                } catch (error) {
                  console.error(`Failed to fetch data for ${brokerId}:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to get broker statuses:', error);
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastUpdated: new Date().toLocaleTimeString(),
        systemHealth,
        brokers
      }));

    } catch (error) {
      console.error('Failed to refresh data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        systemHealth: { backend: null, status: 'offline' }
      }));
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const getOverallSystemStatus = () => {
    const connectedBrokers = Object.values(state.brokers).filter(b => b.status === 'connected').length;
    const totalBrokers = Object.keys(state.brokers).length;
    
    if (state.systemHealth.status === 'offline') return 'offline';
    if (connectedBrokers === 0) return 'limited';
    if (connectedBrokers === totalBrokers) return 'optimal';
    return 'partial';
  };


  const overallStatus = getOverallSystemStatus();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Broker Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and test connections to all trading platforms
          </p>
        </div>
        <Button
          onClick={refreshAllData}
          disabled={state.isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {/* System Overview - Always Visible */}
      <SystemOverviewCard 
        systemHealth={state.systemHealth}
        brokers={state.brokers}
        overallStatus={overallStatus}
        lastUpdated={state.lastUpdated}
      />

      {/* Broker-Specific Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ibkr" className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${
              state.brokers.ibkr.status === 'connected' ? 'bg-green-500' : 
              state.brokers.ibkr.status === 'disconnected' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            IBKR
          </TabsTrigger>
          <TabsTrigger value="mt5" className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${
              state.brokers.mt5.status === 'connected' ? 'bg-green-500' : 
              state.brokers.mt5.status === 'disconnected' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            MT5
          </TabsTrigger>
          <TabsTrigger value="bybit" className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${
              state.brokers.bybit.status === 'connected' ? 'bg-green-500' : 
              state.brokers.bybit.status === 'disconnected' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            ByBit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Broker Status Cards */}
            {Object.entries(state.brokers).map(([brokerId, broker]) => (
              <Card key={brokerId} className={`border-l-4 ${
                brokerId === 'ibkr' ? 'border-l-blue-500' :
                brokerId === 'mt5' ? 'border-l-orange-500' : 'border-l-purple-500'
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {broker.status === 'connected' ? (
                        <Wifi className="h-5 w-5 text-green-600" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-gray-400" />
                      )}
                      {broker.name}
                    </span>
                    <Badge variant={broker.status === 'connected' ? 'default' : 'secondary'}>
                      {broker.status === 'connected' ? 'Connected' : 'Offline'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground">Account</div>
                      <div className="font-medium">
                        {broker.accountData ? 'Available' : 'N/A'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground">Positions</div>
                      <div className="font-medium">
                        {broker.positionsData ? 'Available' : 'N/A'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground">Market</div>
                      <div className="font-medium">
                        {broker.marketData ? 'Available' : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveTab(brokerId)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ibkr" className="mt-6">
          <IBKRTestingPanel 
            broker={state.brokers.ibkr}
            onRefresh={refreshAllData}
            isLoading={state.isLoading}
          />
        </TabsContent>

        <TabsContent value="mt5" className="mt-6">
          <MT5TestingPanel 
            broker={state.brokers.mt5}
            onRefresh={refreshAllData}
            isLoading={state.isLoading}
          />
        </TabsContent>

        <TabsContent value="bybit" className="mt-6">
          <ByBitTestingPanel 
            broker={state.brokers.bybit}
            onRefresh={refreshAllData}
            isLoading={state.isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* System Health Panel - Collapsible */}
      <SystemHealthPanel 
        systemHealth={state.systemHealth}
        isLoading={state.isLoading}
      />
    </div>
  );
}

export default BrokerTestingDashboard;