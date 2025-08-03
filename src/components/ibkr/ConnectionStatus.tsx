import React, { useEffect, useState } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { useIBKRConnection } from '../../store/ibkrStore';
import { ConnectionStatus as ConnectionStatusType } from '../../types/ibkr';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
  compact = false,
  className = ''
}) => {
  const { 
    isConnected, 
    connectionStatus, 
    connectionHealth, 
    lastError 
  } = useIBKRConnection();
  
  // Optimized timer to prevent infinite loops
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  useEffect(() => {
    // Only update every 5 seconds instead of every second to reduce re-renders
    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array is correct here

  const getStatusIcon = (status: ConnectionStatusType) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ConnectionStatusType) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      case 'disconnected':
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ConnectionStatusType) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'error':
        return 'Error';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
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
  };

  // Compact view for topbar
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {getStatusIcon(connectionStatus)}
          <span className="text-sm font-medium">
            {getStatusText(connectionStatus)}
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
            {getStatusIcon(connectionStatus)}
            <Badge className={getStatusColor(connectionStatus)}>
              {getStatusText(connectionStatus)}
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
            <span className="font-medium">{getStatusText(connectionStatus)}</span>
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
                <div className={`font-medium ${getDataQualityColor(connectionHealth.dataQuality)}`}>
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
              onClick={() => {
                // This would trigger the connection dialog
                // For now, just show a placeholder
                console.log('Open connection dialog');
              }}
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

export default ConnectionStatus;