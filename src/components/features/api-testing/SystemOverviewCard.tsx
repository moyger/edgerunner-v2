import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2,
  AlertCircle,
  Activity,
  Server,
  Clock,
  RefreshCw,
  Zap,
  Database,
  TrendingUp
} from "lucide-react";

interface SystemOverviewCardProps {
  systemHealth: {
    backend: any;
    status: 'healthy' | 'degraded' | 'offline';
  };
  brokers: any;
  overallStatus: string;
  lastUpdated: string;
}

export function SystemOverviewCard({ systemHealth, brokers, overallStatus, lastUpdated }: SystemOverviewCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'partial': return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      case 'limited': return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
      case 'offline': return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      default: return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'partial': return <Activity className="h-6 w-6 text-yellow-600" />;
      case 'limited': return <AlertCircle className="h-6 w-6 text-orange-600" />;
      case 'offline': return <AlertCircle className="h-6 w-6 text-red-600" />;
      default: return <Server className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'optimal': return 'All Systems Operational';
      case 'partial': return 'Partially Connected';
      case 'limited': return 'Limited Connectivity';
      case 'offline': return 'System Offline';
      default: return 'Unknown Status';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'optimal': return 'All brokers connected and operational';
      case 'partial': return 'Some brokers connected, others offline';
      case 'limited': return 'Backend running but no broker connections';
      case 'offline': return 'Backend server needs to be started';
      default: return 'Status unclear';
    }
  };

  const connectedBrokers = Object.values(brokers).filter((b: any) => b.status === 'connected').length;
  const totalBrokers = Object.keys(brokers).length;

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <Card className={getStatusColor(overallStatus)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {getStatusIcon(overallStatus)}
          <div>
            <div className="text-xl">{getStatusText(overallStatus)}</div>
            <div className={`text-sm font-normal ${
              overallStatus === 'optimal' 
                ? 'text-green-700 dark:text-green-300'
                : overallStatus === 'partial'
                ? 'text-yellow-700 dark:text-yellow-300'
                : overallStatus === 'limited'
                ? 'text-orange-700 dark:text-orange-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {getStatusDescription(overallStatus)}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Platform Capabilities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Backend API</h3>
              <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'secondary'}>
                {systemHealth.status === 'healthy' ? 'Running' : 'Offline'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                {systemHealth.status === 'healthy' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-red-600" />
                )}
                <span>System Health</span>
              </div>
              <div className="flex items-center gap-2">
                {systemHealth.status === 'healthy' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-red-600" />
                )}
                <span>API Endpoints</span>
              </div>
            </div>
          </div>

          {/* Broker Connections */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold">Brokers</h3>
              <Badge variant={connectedBrokers > 0 ? 'default' : 'secondary'}>
                {connectedBrokers}/{totalBrokers}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {Object.entries(brokers).map(([id, broker]: [string, any]) => (
                <div key={id} className="flex items-center gap-2">
                  {broker.status === 'connected' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  )}
                  <span>{broker.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Capabilities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Data Access</h3>
              <Badge variant={connectedBrokers > 0 ? 'default' : 'secondary'}>
                {connectedBrokers > 0 ? 'Available' : 'Limited'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                {connectedBrokers > 0 ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                )}
                <span>Market Data</span>
              </div>
              <div className="flex items-center gap-2">
                {connectedBrokers > 0 ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                )}
                <span>Account Info</span>
              </div>
              <div className="flex items-center gap-2">
                {connectedBrokers > 0 ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                )}
                <span>Position Data</span>
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">System Stats</h3>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {systemHealth.backend && (
                <>
                  <div className="flex items-center gap-2">
                    <Server className="h-3 w-3" />
                    <span>v{systemHealth.backend.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Uptime: {formatUptime(systemHealth.backend.uptime)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3" />
                <span>Updated: {lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}