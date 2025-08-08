import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Download
} from "lucide-react";

// Mock test results for demonstration
const mockTestResults = [
  {
    id: '1',
    category: 'Authentication',
    testName: 'API Key Validation',
    status: 'not-run' as const,
    duration: null,
    timestamp: null,
    error: null,
  },
  {
    id: '2',
    category: 'Authentication',
    testName: 'OAuth Token Refresh',
    status: 'not-run' as const,
    duration: null,
    timestamp: null,
    error: null,
  },
  {
    id: '3',
    category: 'Market Data',
    testName: 'Real-time Quote Stream',
    status: 'not-run' as const,
    duration: null,
    timestamp: null,
    error: null,
  },
];

interface TestResult {
  id: string;
  category: string;
  testName: string;
  status: 'passed' | 'failed' | 'running' | 'not-run';
  duration: number | null;
  timestamp: string | null;
  error: string | null;
}

export function TestResultsPanel() {
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">Running</Badge>;
      default:
        return <Badge variant="secondary">Not Run</Badge>;
    }
  };

  const handleExportResults = () => {
    console.log('Exporting test results...');
    // Implementation will be added later
  };

  const handleRerunFailedTests = () => {
    console.log('Re-running failed tests...');
    // Implementation will be added later
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">Test Results</h2>
          <p className="text-muted-foreground text-sm">
            View and analyze API test execution results
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportResults}
            disabled
          >
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRerunFailedTests}
            disabled
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rerun Failed
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTestResults.length}</div>
            <p className="text-xs text-muted-foreground">All categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No tests run yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Run tests to see rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {mockTestResults.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No test results available</h3>
              <p className="text-muted-foreground">
                Run your first API tests to see results here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockTestResults.map((result) => (
                <div 
                  key={result.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.testName}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.category}
                        {result.duration && ` • ${result.duration}ms`}
                        {result.timestamp && ` • ${new Date(result.timestamp).toLocaleString()}`}
                      </div>
                      {result.error && (
                        <div className="text-sm text-red-600 mt-1">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}