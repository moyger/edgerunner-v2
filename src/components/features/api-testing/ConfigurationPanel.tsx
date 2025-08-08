import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

// Mock configuration data
const initialBrokerConfigs: BrokerConfig[] = [
  {
    id: 'ibkr',
    name: 'Interactive Brokers',
    fields: [
      { id: 'username', label: 'Username', type: 'text', value: '', required: true },
      { id: 'password', label: 'Password', type: 'password', value: '', required: true },
      { id: 'host', label: 'TWS Host', type: 'text', value: '127.0.0.1', required: true },
      { id: 'port', label: 'TWS Port', type: 'number', value: '7497', required: true },
      { id: 'clientId', label: 'Client ID', type: 'number', value: '1', required: true },
    ],
    isConfigured: false,
    isPaperTradingEnabled: true,
  },
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    fields: [
      { id: 'login', label: 'Account Login', type: 'text', value: '', required: true },
      { id: 'password', label: 'Password', type: 'password', value: '', required: true },
      { id: 'server', label: 'Server', type: 'text', value: '', required: true },
      { id: 'path', label: 'MT5 Terminal Path', type: 'text', value: 'C:\\Program Files\\MetaTrader 5\\terminal64.exe', required: true },
    ],
    isConfigured: false,
    isPaperTradingEnabled: true,
  },
  {
    id: 'bybit',
    name: 'ByBit',
    fields: [
      { id: 'apiKey', label: 'API Key', type: 'password', value: '', required: true },
      { id: 'secretKey', label: 'Secret Key', type: 'password', value: '', required: true },
      { id: 'baseUrl', label: 'Base URL', type: 'text', value: 'https://api-testnet.bybit.com', required: true },
      { id: 'recvWindow', label: 'Receive Window (ms)', type: 'number', value: '5000', required: false },
    ],
    isConfigured: false,
    isPaperTradingEnabled: true,
  },
];

interface ConfigField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'number';
  value: string;
  required: boolean;
}

interface BrokerConfig {
  id: string;
  name: string;
  fields: ConfigField[];
  isConfigured: boolean;
  isPaperTradingEnabled: boolean;
}

export function ConfigurationPanel() {
  const [brokerConfigs, setBrokerConfigs] = useState<BrokerConfig[]>(initialBrokerConfigs);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleFieldChange = (brokerId: string, fieldId: string, value: string) => {
    setBrokerConfigs(prev => 
      prev.map(broker => 
        broker.id === brokerId 
          ? {
              ...broker,
              fields: broker.fields.map(field => 
                field.id === fieldId ? { ...field, value } : field
              )
            }
          : broker
      )
    );
    setHasUnsavedChanges(true);
  };

  const handlePaperTradingToggle = (brokerId: string, enabled: boolean) => {
    setBrokerConfigs(prev => 
      prev.map(broker => 
        broker.id === brokerId 
          ? { ...broker, isPaperTradingEnabled: enabled }
          : broker
      )
    );
    setHasUnsavedChanges(true);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveConfiguration = () => {
    console.log('Saving configuration...', brokerConfigs);
    // Implementation will be added later
    setHasUnsavedChanges(false);
  };

  const handleTestConfiguration = (brokerId: string) => {
    console.log(`Testing configuration for ${brokerId}`);
    // Implementation will be added later
  };

  const isConfigurationValid = (broker: BrokerConfig) => {
    return broker.fields.every(field => !field.required || field.value.trim() !== '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">API Configuration</h2>
          <p className="text-muted-foreground text-sm">
            Configure broker API credentials and connection settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSaveConfiguration}
            disabled={!hasUnsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Safety Warning */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Paper Trading Mode Only
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                All configurations are set to paper/sandbox trading mode. Real money trading is disabled for safety.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broker Configurations */}
      <div className="space-y-6">
        {brokerConfigs.map((broker) => (
          <Card key={broker.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{broker.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure API credentials and connection settings
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConfigurationValid(broker) ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Incomplete
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestConfiguration(broker.id)}
                    disabled={!isConfigurationValid(broker)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Paper Trading Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Paper Trading Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Use sandbox/paper trading environment (recommended)
                  </p>
                </div>
                <Switch
                  checked={broker.isPaperTradingEnabled}
                  onCheckedChange={(checked) => handlePaperTradingToggle(broker.id, checked)}
                />
              </div>

              {/* Configuration Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {broker.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={`${broker.id}-${field.id}`} className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${broker.id}-${field.id}`}
                        type={field.type === 'password' && !showPasswords[`${broker.id}-${field.id}`] ? 'password' : field.type}
                        value={field.value}
                        onChange={(e) => handleFieldChange(broker.id, field.id, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className={field.required && !field.value ? 'border-red-300' : ''}
                      />
                      {field.type === 'password' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility(`${broker.id}-${field.id}`)}
                        >
                          {showPasswords[`${broker.id}-${field.id}`] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global Test Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Request Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                defaultValue="30"
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retries">Max Retry Attempts</Label>
              <Input
                id="retries"
                type="number"
                defaultValue="3"
                placeholder="3"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-sm font-medium">Verbose Logging</Label>
              <p className="text-xs text-muted-foreground">
                Enable detailed logging for debugging purposes
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}