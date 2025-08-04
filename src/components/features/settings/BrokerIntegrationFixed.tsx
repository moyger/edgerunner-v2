import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Label } from "../../../../components/ui/label";
import { 
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Info,
  ExternalLink,
  Loader2
} from "lucide-react";
import { usePersistentConnection } from "../../../hooks/usePersistentConnection";
import { Switch } from "../../../../components/ui/switch";

export function BrokerIntegrationFixed() {
  // Use persistent connection hook
  const {
    isConnected: ibkrConnected,
    tradingMode,
    isReconnecting,
    connectionError,
    sessionHealth,
    autoReconnectEnabled,
    connect,
    disconnect,
    toggleAutoReconnect,
    clearSession,
    setTradingMode
  } = usePersistentConnection();
  
  const handleIBKRConnect = useCallback(async () => {
    await connect({ rememberConnection: true });
  }, [connect]);

  const handleIBKRDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const getStatusBadge = (connected: boolean, reconnecting: boolean) => {
    if (reconnecting) {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          {connected ? 'Reconnecting...' : 'Connecting...'}
        </Badge>
      );
    }
    
    if (connected) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
          {sessionHealth.hasValidSession && (
            <span className="ml-1 text-xs opacity-75">
              (Persistent)
            </span>
          )}
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Disconnected
      </Badge>
    );
  };

  const connectedCount = ibkrConnected ? 2 : 1; // Alpaca is always connected

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium">Broker Integration</h2>
          <p className="text-sm text-muted-foreground">
            Connect and manage your brokerage accounts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-medium">
              {connectedCount} Connected
            </div>
            <div className="text-xs text-muted-foreground">
              {connectedCount > 1 ? "Ready for trading" : "Alpaca connected"}
            </div>
          </div>
          <div className={`h-3 w-3 rounded-full ${connectedCount > 1 ? 'bg-green-500' : 'bg-yellow-500'}`} />
        </div>
      </div>

      {/* Interactive Brokers Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔷</div>
              <div>
                <CardTitle className="text-lg">Interactive Brokers</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(ibkrConnected, isReconnecting)}
                  {tradingMode && (
                    <Badge 
                      variant={tradingMode === 'live' ? 'destructive' : 'secondary'}
                      className={tradingMode === 'live' 
                        ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' 
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                      }
                    >
                      {tradingMode === 'live' ? '🔴 LIVE' : '📄 PAPER'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Actions */}
          <div className="flex items-center gap-3">
            {!ibkrConnected ? (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleIBKRConnect}
                disabled={isReconnecting}
              >
                <Wifi className="h-4 w-4 mr-2" />
                {isReconnecting ? 'Connecting...' : 'Connect to IBKR'}
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={handleIBKRDisconnect}
                disabled={isReconnecting}
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

          {/* Connection Error */}
          {connectionError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Connection Failed</div>
                <div className="text-sm mt-1">{connectionError}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Persistence Settings */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-Reconnect</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically reconnect when you refresh the page
                  </p>
                </div>
                <Switch
                  checked={autoReconnectEnabled}
                  onCheckedChange={toggleAutoReconnect}
                />
              </div>

              {sessionHealth.hasValidSession && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Session ID: {sessionHealth.sessionInfo?.sessionId?.slice(-8)}</div>
                  <div>Session Age: {Math.floor(sessionHealth.sessionAge / 1000 / 60)} minutes</div>
                  {sessionHealth.shouldAutoReconnect && (
                    <div className="text-green-600">✓ Will auto-reconnect on refresh</div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSession}
                  className="text-xs"
                >
                  Clear Session Data
                </Button>
              </div>
            </div>
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
                  <li>Set socket port to 7497 (Paper) or 7496 (Live)</li>
                  <li>Add 127.0.0.1 to trusted IPs if using localhost</li>
                  <li>Make sure no other applications are using Client ID 1</li>
                </ul>
                <div className="text-xs mt-2 p-2 bg-blue-50 rounded border-blue-200">
                  💡 <strong>Persistent Connection:</strong> Once connected, your session will be saved and automatically restored when you refresh the page!
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Trading Mode Detection */}
          {ibkrConnected && tradingMode && (
            <div className="space-y-4">
              <Alert className={
                tradingMode === 'live' 
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                  : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
              }>
                <AlertCircle className={`h-4 w-4 ${tradingMode === 'live' ? 'text-red-600' : 'text-blue-600'}`} />
                <AlertDescription className={tradingMode === 'live' ? 'text-red-800 dark:text-red-400' : 'text-blue-800 dark:text-blue-400'}>
                  <div className="font-medium">
                    {tradingMode === 'live' ? '🔴 LIVE TRADING MODE DETECTED' : '📄 Paper Trading Mode Detected'}
                  </div>
                  <div className="text-sm mt-1">
                    {tradingMode === 'live' 
                      ? 'You are connected to a LIVE account. Real money transactions are possible!'
                      : 'You are connected to a Paper Trading account. No real money at risk.'
                    }
                  </div>
                </AlertDescription>
              </Alert>

              {/* Manual Override Section */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Manual Trading Mode Override</Label>
                  <Select value={tradingMode} onValueChange={(value: 'paper' | 'live') => setTradingMode(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paper">📄 Paper Trading</SelectItem>
                      <SelectItem value="live">🔴 Live Trading</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Override detected mode if incorrect. Always verify your actual TWS/Gateway connection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Success Message */}
          {ibkrConnected && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-400">
                <div className="font-medium">Successfully Connected!</div>
                <div className="text-sm mt-1">
                  Your IBKR connection is active and ready for trading.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* General Safety Warning */}
          {ibkrConnected && tradingMode === 'live' && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-400">
                <div className="font-medium">⚠️ Live Trading Safety Checklist</div>
                <div className="text-sm mt-2 space-y-1">
                  <div>• Double-check account balance and available funds</div>
                  <div>• Verify position sizing and risk management rules</div>
                  <div>• Test strategies in Paper Trading first</div>
                  <div>• Set appropriate stop-losses and limits</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Alpaca Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="text-2xl">🦙</div>
            <div>
              <CardTitle className="text-lg">Alpaca</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
                <Badge variant="outline" className="text-xs">Default</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Alpaca is already configured and ready for trading.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}