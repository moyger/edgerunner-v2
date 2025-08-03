import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Progress } from '../../../components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Clock,
} from 'lucide-react';
import { useIBKRConnectionFixed } from '../../store/ibkrStoreFixed';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const ConnectionStatusFixed: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
  compact = false,
  className = ''
}) => {
  const { 
    isConnected, 
    connectionStatus, 
    connectionHealth, 
    lastError 
  } = useIBKRConnectionFixed();
  
  // Use a ref-based timer instead of state to prevent re-renders
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    // Only update the timer every 10 seconds to reduce re-renders
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array is intentional

  // Memoize expensive calculations
  const statusIcon = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  }, [connectionStatus]);

  const statusColor = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      case 'disconnected':
      default:
        return 'bg-gray-500';
    }
  }, [connectionStatus]);

  const statusText = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  }, [connectionStatus]);

  const dataQualityColor = useMemo(() => {
    if (!connectionHealth) return 'text-gray-600';
    
    switch (connectionHealth.dataQuality) {
      case 'good':
        return 'text-green-600';
      case 'delayed':
        return 'text-yellow-600';
      case 'stale':
        return 'text-orange-600';
      case 'unavailable':
      default:
        return 'text-red-600';
    }
  }, [connectionHealth?.dataQuality]);

  const handleConnectClick = useCallback(() => {
    console.log('Open connection dialog');
    // This would trigger the connection dialog
  }, []);

  // Compact view for topbar
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {statusIcon}
          <span className="text-sm font-medium">
            {statusText}
          </span>
        </div>
        {connectionHealth && (
          <Badge variant="outline" className="text-xs">
            {connectionHealth.dataQuality}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">IBKR Connection</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {statusIcon}
            <Badge className={statusColor}>
              {statusText}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Interactive Brokers API connection status and health
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{statusText}</span>
          </div>
          
          {connectionStatus === 'connecting' && (
            <Progress value={undefined} className="h-2" />
          )}
        </div>

        {/* Error Display */}
        {lastError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {lastError.message || 'An unknown error occurred'}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Health Details */}
        {showDetails && connectionHealth && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="font-medium text-sm">Connection Health</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground">Data Quality</span>
                <div className={`font-medium ${dataQualityColor}`}>
                  {connectionHealth.dataQuality.charAt(0).toUpperCase() + connectionHealth.dataQuality.slice(1)}
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-muted-foreground">Reconnect Attempts</span>
                <div className="font-medium">
                  {connectionHealth.reconnectAttempts}
                </div>
              </div>
              
              {connectionHealth.lastHeartbeat && (
                <div className="space-y-1 col-span-2">
                  <span className="text-muted-foreground">Last Heartbeat</span>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(connectionHealth.lastHeartbeat), { addSuffix: true })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time Metrics */}
        {showDetails && isConnected && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="font-medium text-sm">Performance</h4>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Connection Duration</span>
                <span className="font-medium">
                  {connectionHealth?.connectionDuration 
                    ? formatDistanceToNow(new Date(Date.now() - connectionHealth.connectionDuration))
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Connection Actions */}
        {!isConnected && connectionStatus !== 'connecting' && (
          <div className="pt-2 border-t">
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleConnectClick}
            >
              <Wifi className="h-4 w-4 mr-2" />
              Connect to IBKR
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionStatusFixed;