import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Loader2, Wifi, AlertTriangle, Info, Shield } from 'lucide-react';
import { IBKRCredentials, IBKRCredentialsSchema } from '../../types/ibkr';
import { useIBKRConnection } from '../../store/ibkrStore';
import { toast } from 'sonner';
import { z } from 'zod';

interface ConnectionDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ConnectionDialog: React.FC<ConnectionDialogProps> = ({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<IBKRCredentials>({
    username: '',
    password: '',
    connectionPort: 7497,
    clientId: 1,
    isPaper: true,
    host: '127.0.0.1'
  });

  const { connect, isConnected, connectionStatus } = useIBKRConnection();

  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Validate credentials
      const validatedCredentials = IBKRCredentialsSchema.parse(credentials);
      
      // Generate a temporary token for this session
      const token = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await connect(validatedCredentials, token);
      
      toast.success('Successfully connected to IBKR');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Connection failed:', error);
      
      let errorMessage = 'Connection failed';
      if (error instanceof z.ZodError) {
        errorMessage = error.errors.map(e => e.message).join(', ');
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setConnectionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInputChange = (field: keyof IBKRCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (field: keyof IBKRCredentials) => (checked: boolean) => {
    setCredentials(prev => ({ ...prev, [field]: checked }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Connect to Interactive Brokers
          </DialogTitle>
          <DialogDescription>
            Enter your IBKR credentials to establish a connection to the trading platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Your credentials are encrypted and never stored permanently. The connection is made through our secure proxy server.
            </AlertDescription>
          </Alert>

          {/* Connection Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Credentials */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Account Credentials</CardTitle>
                <CardDescription className="text-sm">
                  Your IBKR login information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={handleInputChange('username')}
                    placeholder="Enter your IBKR username"
                    required
                    disabled={isConnecting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={handleInputChange('password')}
                    placeholder="Enter your IBKR password"
                    required
                    disabled={isConnecting}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Connection Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Connection Settings</CardTitle>
                <CardDescription className="text-sm">
                  Configure your TWS/Gateway connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      type="text"
                      value={credentials.host}
                      onChange={handleInputChange('host')}
                      placeholder="127.0.0.1"
                      disabled={isConnecting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      value={credentials.connectionPort}
                      onChange={handleInputChange('connectionPort')}
                      placeholder="7497"
                      min="1000"
                      max="65535"
                      disabled={isConnecting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    type="number"
                    value={credentials.clientId}
                    onChange={handleInputChange('clientId')}
                    placeholder="1"
                    min="1"
                    max="2147483647"
                    disabled={isConnecting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier for this connection (must be different from other connections)
                  </p>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <Label htmlFor="paperTrading" className="text-sm font-medium">
                      Paper Trading
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Connect to paper trading account (recommended for testing)
                    </p>
                  </div>
                  <Switch
                    id="paperTrading"
                    checked={credentials.isPaper}
                    onCheckedChange={handleSwitchChange('isPaper')}
                    disabled={isConnecting}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Connection Error */}
            {connectionError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{connectionError}</AlertDescription>
              </Alert>
            )}

            {/* Important Notes */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-1">
                <div className="font-medium">Before connecting:</div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Ensure TWS or IB Gateway is running on your system</li>
                  <li>Enable API connections in TWS/Gateway settings</li>
                  <li>Set the correct socket port (7497 for TWS, 4001 for Gateway)</li>
                  <li>Use paper trading for testing and development</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isConnecting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isConnecting || isConnected}
                className="flex-1"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionDialog;