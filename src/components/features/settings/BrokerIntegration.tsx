import { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../components/ui/tooltip";

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

export function BrokerIntegration() {
  const [defaultBroker, setDefaultBroker] = useState("alpaca");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [expandedBrokers, setExpandedBrokers] = useState<Set<string>>(new Set(["alpaca"]));
  
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
      status: "coming_soon",
      isDefault: false,
      config: {
        username: "",
        port: "7497",
        enabled: false
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

  const updateBrokerConfig = (brokerId: string, field: string, value: string | boolean) => {
    setBrokers(brokers.map(broker => 
      broker.id === brokerId 
        ? { ...broker, config: { ...broker.config, [field]: value } }
        : broker
    ));
  };

  const toggleBrokerExpansion = (brokerId: string) => {
    const newExpanded = new Set(expandedBrokers);
    if (newExpanded.has(brokerId)) {
      newExpanded.delete(brokerId);
    } else {
      newExpanded.add(brokerId);
    }
    setExpandedBrokers(newExpanded);
  };

  const handleSetDefault = (brokerId: string) => {
    setDefaultBroker(brokerId);
    setBrokers(brokers.map(broker => ({
      ...broker,
      isDefault: broker.id === brokerId
    })));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
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
  };

  const getBrokerIcon = (brokerId: string) => {
    // In a real app, these would be actual broker logos
    const icons: Record<string, string> = {
      alpaca: "🦙",
      interactive_brokers: "🔷",
      td_ameritrade: "💼",
      custom: "⚙️"
    };
    return icons[brokerId] || "🔗";
  };

  const getConnectedBrokers = () => {
    return brokers.filter(broker => broker.status === "connected");
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium">Broker Integration</h2>
            <p className="text-sm text-muted-foreground">
              Connect and manage your brokerage accounts for automated trading
            </p>
          </div>
          
          {/* Global Status */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-medium">{getConnectedBrokers().length} Connected</div>
              <div className="text-xs text-muted-foreground">
                {getConnectedBrokers().length > 0 ? "Ready for trading" : "No brokers connected"}
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
                    {/* Alpaca Configuration */}
                    {broker.id === "alpaca" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="alpaca-api-key">API Key</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Found in your Alpaca dashboard under API</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="relative">
                              <Input
                                id="alpaca-api-key"
                                type={showApiKey ? "text" : "password"}
                                value={broker.config.apiKey || ""}
                                onChange={(e) => updateBrokerConfig(broker.id, "apiKey", e.target.value)}
                                placeholder="Your Alpaca API Key"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="alpaca-secret-key">Secret Key</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Keep this secure and never share it</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="relative">
                              <Input
                                id="alpaca-secret-key"
                                type={showSecretKey ? "text" : "password"}
                                value={broker.config.secretKey || ""}
                                onChange={(e) => updateBrokerConfig(broker.id, "secretKey", e.target.value)}
                                placeholder="Your Alpaca Secret Key"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowSecretKey(!showSecretKey)}
                              >
                                {showSecretKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="alpaca-paper">Paper Trading Mode</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Use paper trading for testing without real money</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch 
                            id="alpaca-paper" 
                            checked={broker.config.isPaper || false}
                            onCheckedChange={(checked) => updateBrokerConfig(broker.id, "isPaper", checked)}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            <TestTube className="h-4 w-4 mr-2" />
                            Test Connection
                          </Button>
                          <Button variant="outline">
                            Save Configuration
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Alpaca Dashboard
                          </Button>
                        </div>

                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            Connection successful. Last verified 2 minutes ago.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {/* Interactive Brokers Configuration */}
                    {broker.id === "interactive_brokers" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                          <div className="space-y-2">
                            <Label>Username</Label>
                            <Input placeholder="IB Username" disabled />
                          </div>
                          <div className="space-y-2">
                            <Label>TWS Port</Label>
                            <Input placeholder="7497" disabled />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg opacity-50">
                          <Label>Enable IB Gateway</Label>
                          <Switch disabled />
                        </div>

                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Interactive Brokers integration is coming soon. Sign up for updates to be notified when it's available.
                          </AlertDescription>
                        </Alert>

                        <Button variant="outline" disabled>
                          Coming Soon
                        </Button>
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

        {/* Add New Broker */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Connect Additional Broker</h3>
                <p className="text-sm text-muted-foreground">
                  Custom broker integrations and additional providers coming soon
                </p>
              </div>
              <Button variant="outline" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Broker
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}