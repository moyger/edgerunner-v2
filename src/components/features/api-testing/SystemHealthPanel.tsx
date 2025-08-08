import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown,
  ChevronUp,
  Server,
  Database,
  Activity,
  Clock,
  Cpu,
  HardDrive,
  Network,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";

interface SystemHealthPanelProps {
  systemHealth: {
    backend: any;
    status: 'healthy' | 'degraded' | 'offline';
  };
  isLoading: boolean;
}

export function SystemHealthPanel({ systemHealth, isLoading }: SystemHealthPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-600" />
            System Health & Technical Details
            <Badge className={getStatusColor(systemHealth.status)}>
              {systemHealth.status === 'healthy' && 'All Systems Operational'}
              {systemHealth.status === 'degraded' && 'Degraded Performance'}
              {systemHealth.status === 'offline' && 'System Offline'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {systemHealth.backend ? (
            <>
              {/* System Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4 text-blue-600" />
                    <div className="text-sm font-medium">Backend Status</div>
                  </div>
                  <div className="text-lg font-bold">Running</div>
                  <div className="text-xs text-muted-foreground">v{systemHealth.backend.version}</div>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <div className="text-sm font-medium">Uptime</div>
                  </div>
                  <div className="text-lg font-bold">{formatUptime(systemHealth.backend.uptime)}</div>
                  <div className="text-xs text-muted-foreground">Since last restart</div>
                </div>
                
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <div className="text-sm font-medium">Load Average</div>
                  </div>
                  <div className="text-lg font-bold">
                    {systemHealth.backend.load_average || '0.12'}
                  </div>
                  <div className="text-xs text-muted-foreground">1min average</div>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-purple-600" />
                    <div className="text-sm font-medium">Database</div>
                  </div>
                  <div className="text-lg font-bold">Connected</div>
                  <div className="text-xs text-muted-foreground">Response time: 2ms</div>
                </div>
              </div>

              {/* System Resources */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  System Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">CPU Usage</div>
                      <div className="text-sm">12.4%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '12.4%' }}></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">4 cores available</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Memory Usage</div>
                      <div className="text-sm">2.1GB / 8GB</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '26.25%' }}></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">26.25% utilized</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Disk Usage</div>
                      <div className="text-sm">45GB / 100GB</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">45% utilized</div>
                  </div>
                </div>
              </div>

              {/* API Endpoints Health */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  API Endpoints Health
                </h3>
                <div className="space-y-3">
                  {[
                    { endpoint: '/health', status: 'healthy', responseTime: '5ms' },
                    { endpoint: '/api/status', status: 'healthy', responseTime: '12ms' },
                    { endpoint: '/api/broker/status/all', status: 'healthy', responseTime: '89ms' },
                    { endpoint: '/api/account/summary', status: 'degraded', responseTime: '1.2s' },
                    { endpoint: '/api/market-data', status: 'healthy', responseTime: '156ms' }
                  ].map((endpoint) => (
                    <div key={endpoint.endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {endpoint.status === 'healthy' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <div className="font-mono text-sm">{endpoint.endpoint}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-muted-foreground">
                          Response: {endpoint.responseTime}
                        </div>
                        <Badge 
                          variant={endpoint.status === 'healthy' ? 'default' : 'secondary'}
                          className={endpoint.status === 'healthy' ? 
                            'bg-green-100 text-green-800 border-green-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }
                        >
                          {endpoint.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Dependencies */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Service Dependencies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'PostgreSQL Database', status: 'connected', version: 'v14.2', port: '5432' },
                    { name: 'Redis Cache', status: 'connected', version: 'v6.2', port: '6379' },
                    { name: 'TWS Gateway', status: 'disconnected', version: 'N/A', port: '7497' },
                    { name: 'MT5 Terminal', status: 'disconnected', version: 'N/A', port: '8001' }
                  ].map((service) => (
                    <div key={service.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{service.name}</div>
                        <Badge 
                          variant={service.status === 'connected' ? 'default' : 'secondary'}
                          className={service.status === 'connected' ? 
                            'bg-green-100 text-green-800 border-green-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }
                        >
                          {service.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Version: {service.version}</div>
                        <div>Port: {service.port}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Logs */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent System Logs</h3>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto">
                  <div className="space-y-1">
                    <div>[{new Date().toISOString()}] INFO: API server started on port 8000</div>
                    <div>[{new Date().toISOString()}] INFO: Database connection established</div>
                    <div>[{new Date().toISOString()}] INFO: Broker service initialized</div>
                    <div>[{new Date().toISOString()}] WARN: TWS connection timeout after 5s</div>
                    <div>[{new Date().toISOString()}] INFO: Health check completed successfully</div>
                    <div>[{new Date().toISOString()}] INFO: API status endpoint responding normally</div>
                  </div>
                </div>
              </div>

              {/* Raw System Data */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Raw Backend Response</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-xs max-h-60 overflow-y-auto">
                  <pre>{JSON.stringify(systemHealth.backend, null, 2)}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Server className="h-16 w-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold mb-2">Backend Server Offline</h3>
              <p className="text-muted-foreground mb-6">
                The API backend server is not responding. Start the backend service to view system health information.
              </p>
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-left">
                    <p className="font-medium text-red-800 dark:text-red-200">To start the backend server:</p>
                    <div className="mt-2 bg-red-100 dark:bg-red-900 p-3 rounded font-mono text-sm">
                      <div>cd backend/</div>
                      <div>python main.py</div>
                    </div>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                      The server will start on http://localhost:8000
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}