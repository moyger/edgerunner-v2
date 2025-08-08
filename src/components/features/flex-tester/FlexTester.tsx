import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Download, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface FlexQueryResponse {
  query_id: string;
  reference_code: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

interface FlexQueryData {
  query_id: string;
  data_type: string;
  records: any[];
  total_records: number;
  generated_at: string;
}

interface PerformanceMetrics {
  total_realized_pnl: number;
  total_commissions: number;
  net_pnl: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  largest_win: number;
  largest_loss: number;
}

const FlexTester: React.FC = () => {
  const [queries, setQueries] = useState<FlexQueryResponse[]>([]);
  const [queryData, setQueryData] = useState<FlexQueryData | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<string>('trades');

  const API_BASE = 'http://localhost:8000';

  // Execute a flex query
  const executeFlexQuery = async (queryType: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/flex/execute/${queryType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: FlexQueryResponse = await response.json();
      setQueries(prev => [...prev.filter(q => q.query_id !== data.query_id), data]);
      
      // Automatically poll for completion
      pollForCompletion(data.reference_code);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute flex query');
    } finally {
      setLoading(false);
    }
  };

  // Poll for query completion
  const pollForCompletion = async (referenceCode: string) => {
    const maxAttempts = 30; // 5 minutes with 10s intervals
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/flex/status/${referenceCode}`);
        if (!response.ok) return;
        
        const status: FlexQueryResponse = await response.json();
        setQueries(prev => prev.map(q => q.reference_code === referenceCode ? status : q));
        
        if (status.status === 'COMPLETED') {
          // Fetch the actual data
          fetchQueryData(referenceCode);
          return;
        }
        
        if (status.status === 'FAILED') {
          setError(status.error_message || 'Query failed');
          return;
        }
        
        // Continue polling if still running
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setError('Query timed out after 5 minutes');
        }
        
      } catch (err) {
        console.error('Polling error:', err);
      }
    };
    
    poll();
  };

  // Fetch query data
  const fetchQueryData = async (referenceCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/flex/data/${referenceCode}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: FlexQueryData = await response.json();
      setQueryData(data);
      
      // If it's trade data, calculate metrics
      if (data.data_type === 'trades' && data.records.length > 0) {
        calculateMetrics(data.records);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch query data');
    }
  };

  // Calculate performance metrics
  const calculateMetrics = async (trades: any[]) => {
    try {
      const response = await fetch(`${API_BASE}/api/flex/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trades,
          start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
          end_date: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const metricsData: PerformanceMetrics = await response.json();
        setMetrics(metricsData);
      }
    } catch (err) {
      console.error('Failed to calculate metrics:', err);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      'RUNNING': { variant: 'secondary' as const, icon: Clock, text: 'Running' },
      'COMPLETED': { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      'FAILED': { variant: 'destructive' as const, icon: AlertCircle, text: 'Failed' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.FAILED;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">IBKR Flex Query Tester</h1>
          <p className="text-muted-foreground">Test and view Interactive Brokers Flex Query data</p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Query Execution */}
      <Card>
        <CardHeader>
          <CardTitle>Execute Flex Queries</CardTitle>
          <CardDescription>
            Run predefined IBKR Flex queries to fetch your trading data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => executeFlexQuery('trades')}
              disabled={loading}
              variant="default"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Fetch Trades
            </Button>
            <Button 
              onClick={() => executeFlexQuery('positions')}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Fetch Positions
            </Button>
            <Button 
              onClick={() => executeFlexQuery('cash')}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Fetch Cash Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Query Status */}
      {queries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Query Status</CardTitle>
            <CardDescription>Track the progress of your flex queries</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query Type</TableHead>
                  <TableHead>Reference Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.map((query) => (
                  <TableRow key={query.reference_code}>
                    <TableCell className="font-medium">{query.query_id}</TableCell>
                    <TableCell className="font-mono text-sm">{query.reference_code}</TableCell>
                    <TableCell>
                      <StatusBadge status={query.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(query.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fetchQueryData(query.reference_code)}
                        disabled={query.status !== 'COMPLETED'}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        View Data
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Trading performance analysis from your trade data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Net P&L</p>
                <p className={`text-2xl font-bold ${metrics.net_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.net_pnl)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{formatPercent(metrics.win_rate)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Profit Factor</p>
                <p className="text-2xl font-bold">
                  {metrics.profit_factor === Infinity ? '∞' : metrics.profit_factor.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatPercent(metrics.max_drawdown)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{metrics.total_trades}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Winning Trades</p>
                <p className="text-2xl font-bold text-green-600">{metrics.winning_trades}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Largest Win</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.largest_win)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Largest Loss</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(metrics.largest_loss)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Display */}
      {queryData && (
        <Card>
          <CardHeader>
            <CardTitle>Query Data</CardTitle>
            <CardDescription>
              {queryData.data_type.toUpperCase()} - {queryData.total_records} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedQuery} onValueChange={setSelectedQuery}>
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">Data Type</p>
                    <p className="text-xl font-bold">{queryData.data_type}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-xl font-bold">{queryData.total_records}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">Generated At</p>
                    <p className="text-xl font-bold">
                      {new Date(queryData.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">Query ID</p>
                    <p className="text-sm font-mono">{queryData.query_id}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="table">
                {queryData.records.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(queryData.records[0]).map((key) => (
                              <TableHead key={key} className="sticky top-0 bg-background">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queryData.records.slice(0, 50).map((record, index) => (
                            <TableRow key={index}>
                              {Object.values(record).map((value, cellIndex) => (
                                <TableCell key={cellIndex} className="font-mono text-xs">
                                  {typeof value === 'number' && Math.abs(value) > 0.01 
                                    ? value.toLocaleString() 
                                    : String(value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {queryData.records.length > 50 && (
                      <div className="p-2 text-center text-sm text-muted-foreground border-t">
                        Showing first 50 of {queryData.records.length} records
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="raw">
                <div className="border rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="text-xs">
                    {JSON.stringify(queryData, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlexTester;