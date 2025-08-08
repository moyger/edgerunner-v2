import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface BrokerConnection {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastChecked: string;
  description: string;
}

interface ConnectionStatusCardProps {
  broker: BrokerConnection;
  onTestConnection: (brokerId: string) => void;
}

export function ConnectionStatusCard({ broker, onTestConnection }: ConnectionStatusCardProps) {
  const getStatusIcon = () => {
    switch (broker.status) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'error':
        return <WifiOff className="h-5 w-5 text-red-600" />;
      default:
        return <WifiOff className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (broker.status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">Connecting</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  const getStatusColor = () => {
    switch (broker.status) {
      case 'connected':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'connecting':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return '';
    }
  };

  return (
    <Card className={getStatusColor()}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-sm font-medium">{broker.name}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3">
          {broker.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Last: {new Date(broker.lastChecked).toLocaleTimeString()}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onTestConnection(broker.id)}
            disabled={broker.status === 'connecting'}
          >
            {broker.status === 'connecting' ? 'Testing...' : 'Test'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}