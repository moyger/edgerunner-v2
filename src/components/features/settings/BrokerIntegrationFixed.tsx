import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Switch } from "../../../../components/ui/switch";
import { Badge } from "../../../../components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../components/ui/collapsible";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { 
  Link,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  TestTube,
  Settings,
  Plus,
  Info,
  ExternalLink,
  Wifi,
  WifiOff
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../components/ui/tooltip";
import { useIBKRConnectionFixed } from "../../../store/ibkrStoreFixed";
import { ConnectionStatusFixed } from "../../ibkr/ConnectionStatusFixed";

interface BrokerConfig {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "coming_soon" | "planned";
  isDefault: boolean;
  config: {
    apiKey?: string;
    secretKey?: string;
    isPaper?: boolean;
    username?: string;
    port?: string;
    enabled?: boolean;
  };
}

export function BrokerIntegrationFixed() {
  // Use the fixed IBKR store
  const { isConnected, connectionStatus, disconnect, connect } = useIBKRConnectionFixed();
  
  const [defaultBroker, setDefaultBroker] = useState("alpaca");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [expandedBrokers, setExpandedBrokers] = useState<Set<string>>(new Set(["alpaca", "interactive_brokers"]));
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  
  // Memoize the IBKR status calculation to prevent unnecessary re-renders
  const ibkrStatus = useMemo(() => {
    if (isConnected) return "connected";
    if (connectionStatus === "connecting") return "connecting";
    if (connectionStatus === "error") return "disconnected";
    return "disconnected";
  }, [isConnected, connectionStatus]);
  
  const [brokers, setBrokers] = useState<BrokerConfig[]>([
    {
      id: "alpaca",
      name: "Alpaca",
      status: "connected",
      isDefault: true,
      config: {
        apiKey: "PKTEST1A2B3C4D5E6F7G8H9I0J",
        secretKey: "sk_test_••••••••••••••••••••••••••••••••",
        isPaper: true
      }
    },
    {
      id: "interactive_brokers",
      name: "Interactive Brokers",
      status: ibkrStatus,
      isDefault: false,
      config: {
        username: "",
        port: "7497",
        enabled: isConnected
      }
    },
    {
      id: "td_ameritrade",
      name: "TD Ameritrade",
      status: "planned",
      isDefault: false,
      config: {}
    },
    {
      id: "custom",
      name: "Custom Broker",
      status: "planned",
      isDefault: false,
      config: {}
    }
  ]);

  const updateBrokerConfig = useCallback((brokerId: string, field: string, value: string | boolean) => {
    setBrokers(prevBrokers => prevBrokers.map(broker => 
      broker.id === brokerId 
        ? { ...broker, config: { ...broker.config, [field]: value } }
        : broker
    ));
  }, []);

  const toggleBrokerExpansion = useCallback((brokerId: string) => {
    setExpandedBrokers(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(brokerId)) {
        newExpanded.delete(brokerId);
      } else {
        newExpanded.add(brokerId);
      }
      return newExpanded;
    });
  }, []);

  const handleSetDefault = useCallback((brokerId: string) => {
    setDefaultBroker(brokerId);
    setBrokers(prevBrokers => prevBrokers.map(broker => ({
      ...broker,
      isDefault: broker.id === brokerId
    })));
  }, []);

  const handleIBKRConnect = useCallback(async () => {
    try {
      await connect({
        username: "testuser",
        password: "testpass"
      });
    } catch (error) {
      console.error('Connection failed:', error);
    }
  }, [connect]);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case "connecting":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">
            <Settings className="h-3 w-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      case "coming_soon":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">
            <Settings className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        );
      case "planned":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <AlertCircle className="h-3 w-3 mr-1" />
            Planned
          </Badge>
        );
      default:
        return null;
    }
  }, []);

  const getBrokerIcon = useCallback((brokerId: string) => {
    const icons: Record<string, string> = {
      alpaca: "🦙",
      interactive_brokers: "🔷",
      td_ameritrade: "💼",
      custom: "⚙️"
    };
    return icons[brokerId] || "🔗";
  }, []);

  const getConnectedBrokers = useCallback(() => {
    return brokers.filter(broker => broker.status === "connected");
  }, [brokers]);

  const connectedBrokers = getConnectedBrokers();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium">Broker Integration (Fixed)</h2>
            <p className="text-sm text-muted-foreground">
              Connect and manage your brokerage accounts for automated trading
            </p>
          </div>
          
          {/* Global Status */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-medium">{connectedBrokers.length} Connected</div>
              <div className="text-xs text-muted-foreground">
                {connectedBrokers.length > 0 ? "Ready for trading" : "No brokers connected"}
              </div>
            </div>
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        {/* Default Broker Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Default Broker for All Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label>Choose which broker to use by default for new strategies</Label>
              <Select value={defaultBroker} onValueChange={setDefaultBroker}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map(broker => (
                    <SelectItem 
                      key={broker.id} 
                      value={broker.id}
                      disabled={broker.status !== "connected"}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getBrokerIcon(broker.id)}</span>
                        <span>{broker.name}</span>
                        {broker.status === "connected" && <span className="text-xs text-green-600">(Connected)</span>}
                        {broker.status === "coming_soon" && <span className="text-xs text-blue-600">(Coming Soon)</span>}
                        {broker.status === "planned" && <span className="text-xs text-muted-foreground">(Planned)</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can override this setting for individual strategies
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Broker Configuration Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Broker Configurations</h3>
          
          {brokers.map(broker => (
            <Card key={broker.id} className="overflow-hidden">
              <Collapsible 
                open={expandedBrokers.has(broker.id)} 
                onOpenChange={() => toggleBrokerExpansion(broker.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getBrokerIcon(broker.id)}</div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {broker.name}
                            {broker.isDefault && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(broker.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {broker.status === "connected" && !broker.isDefault && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(broker.id);
                            }}
                          >
                            Set as Default
                          </Button>
                        )}
                        {expandedBrokers.has(broker.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Interactive Brokers Configuration */}
                    {broker.id === "interactive_brokers" && (
                      <div className="space-y-6">
                        {/* Fixed Connection Status Component */}
                        <ConnectionStatusFixed showDetails={true} />

                        {/* Connection Actions */}
                        <div className="flex items-center gap-3">
                          {!isConnected ? (
                            <Button 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={handleIBKRConnect}
                              disabled={connectionStatus === 'connecting'}
                            >
                              <Wifi className="h-4 w-4 mr-2" />
                              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to IBKR'}
                            </Button>
                          ) : (
                            <Button 
                              variant="destructive" 
                              onClick={() => disconnect()}
                            >
                              <WifiOff className="h-4 w-4 mr-2" />
                              Disconnect
                            </Button>
                          )}
                          
                          <Button variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            TWS/Gateway Setup
                          </Button>
                        </div>

                        {/* Setup Instructions */}
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div className="font-medium">Before connecting to IBKR:</div>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Install and run TWS (Trader Workstation) or IB Gateway</li>
                                <li>Enable API connections in TWS Global Configuration</li>
                                <li>Set socket port to 7497 (TWS) or 4001 (Gateway)</li>
                                <li>Add 127.0.0.1 to trusted IPs if using localhost</li>
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>

                        {/* Live vs Paper Trading Warning */}
                        {isConnected && (
                          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800 dark:text-yellow-400">
                              <div className="font-medium">Trading Mode Warning</div>
                              <div className="text-sm mt-1">
                                Always verify you're connected to the correct account (Paper vs Live) before executing any trades.
                                Paper trading is recommended for testing strategies.
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* Other broker configurations would go here */}
                    {broker.id === "alpaca" && (
                      <div className="p-4 text-center text-muted-foreground">
                        Alpaca configuration (existing implementation)
                      </div>
                    )}

                    {/* Planned Brokers */}
                    {(broker.id === "td_ameritrade" || broker.id === "custom") && (
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {broker.name} integration is planned for a future release. 
                            {broker.id === "custom" && " This will allow you to connect any broker with API support."}
                          </AlertDescription>
                        </Alert>
                        <Button variant="outline" disabled>
                          Planned Feature
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}