/**
 * System Diagnostics Panel
 * Comprehensive API connection testing and diagnostics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Zap, Server, AlertTriangle } from 'lucide-react';
import { connectionDiagnostics } from '@/services/ConnectionDiagnostics';
import { enhancedApiClient } from '@/services/ApiClientWithFallback';
import { brokerService } from '@/services/brokers/BrokerService';
import type { DiagnosticResult, DiagnosticTest } from '@/services/ConnectionDiagnostics';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'loading' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

export function SystemDiagnosticsPanel(): JSX.Element {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusIcon = (status: DiagnosticTest['status'] | TestResult['status']) => {
    switch (status) {
      case 'passed':
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'running':
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DiagnosticTest['status'] | TestResult['status']) => {
    switch (status) {
      case 'passed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
      case 'loading':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setActiveTab('diagnostics');
    
    try {
      const result = await connectionDiagnostics.runFullDiagnostics();
      setDiagnostics(result);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    }
    
    setIsRunning(false);
  };

  const runApiTests = async () => {
    const tests: TestResult[] = [];
    setActiveTab('api-tests');
    
    // Test 1: Backend Health
    tests.push({ name: 'Backend Health Check', status: 'loading', message: 'Checking...' });
    setTestResults([...tests]);
    
    try {
      const isHealthy = await connectionDiagnostics.quickHealthCheck();
      tests[tests.length - 1] = {
        name: 'Backend Health Check',
        status: isHealthy ? 'success' : 'error',
        message: isHealthy ? 'Backend is responding' : 'Backend is not responding',
      };
    } catch (error) {
      tests[tests.length - 1] = {
        name: 'Backend Health Check',
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed',
      };
    }
    setTestResults([...tests]);

    // Test 2: Enhanced API Client
    tests.push({ name: 'Enhanced API Client', status: 'loading', message: 'Testing...' });
    setTestResults([...tests]);
    
    try {
      const response = await enhancedApiClient.get('/api/health');
      tests[tests.length - 1] = {
        name: 'Enhanced API Client',
        status: 'success',
        message: 'API client working with fallback support',
        details: response,
      };
    } catch (error) {
      tests[tests.length - 1] = {
        name: 'Enhanced API Client',
        status: 'error',
        message: error instanceof Error ? error.message : 'API client test failed',
      };
    }
    setTestResults([...tests]);

    // Test 3: Mock Data Test
    tests.push({ name: 'Mock Data Fallback', status: 'loading', message: 'Testing...' });
    setTestResults([...tests]);
    
    try {
      const mockResponse = await enhancedApiClient.get('/api/market-data?symbol=TEST');
      tests[tests.length - 1] = {
        name: 'Mock Data Fallback',
        status: 'success',
        message: 'Mock data fallback working correctly',
        details: mockResponse.data,
      };
    } catch (error) {
      tests[tests.length - 1] = {
        name: 'Mock Data Fallback',
        status: 'error',
        message: error instanceof Error ? error.message : 'Mock fallback test failed',
      };
    }
    setTestResults([...tests]);

    // Test 4: Broker Service
    tests.push({ name: 'Broker Service', status: 'loading', message: 'Testing...' });
    setTestResults([...tests]);
    
    try {
      const brokerStatuses = await brokerService.getAllBrokerStatuses();
      const statusCount = Object.keys(brokerStatuses).length;
      tests[tests.length - 1] = {
        name: 'Broker Service',
        status: 'success',
        message: `Broker service operational (${statusCount} brokers configured)`,
        details: brokerStatuses,
      };
    } catch (error) {
      tests[tests.length - 1] = {
        name: 'Broker Service',
        status: 'error',
        message: error instanceof Error ? error.message : 'Broker service test failed',
      };
    }
    setTestResults([...tests]);
  };

  const loadBackendStatus = async () => {
    try {
      const status = await brokerService.getBackendStatus();
      setBackendStatus(status);
    } catch (error) {
      console.error('Failed to load backend status:', error);
    }
  };

  const startBackend = () => {
    // Provide instructions for starting backend
    const instructions = `
To start the backend server:

1. Open a new terminal window
2. Navigate to the project directory
3. Run: ./start-backend.sh

Or manually:
1. cd backend
2. source venv/bin/activate
3. python start.py

The backend should start on port 8000.
    `;
    
    alert(instructions);
  };

  useEffect(() => {
    loadBackendStatus();
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Diagnostics</h2>
        <div className="flex space-x-2">
          <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
            {isRunning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Run Diagnostics
          </Button>
          <Button onClick={runApiTests} variant="outline" size="sm">
            <Server className="w-4 h-4 mr-2" />
            Test APIs
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="api-tests">API Tests</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backend Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  Backend Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {backendStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <Badge className={backendStatus.backend.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {backendStatus.backend.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Checked:</span>
                      <span className="text-sm text-gray-500">
                        {backendStatus.backend.lastChecked > 0 
                          ? new Date(backendStatus.backend.lastChecked).toLocaleTimeString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fallback:</span>
                      <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
                    </div>
                    {!backendStatus.backend.available && (
                      <Button onClick={startBackend} className="w-full mt-3" size="sm">
                        How to Start Backend
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Environment:</span>
                    <Badge className="bg-blue-100 text-blue-800">Development</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Frontend Port:</span>
                    <span className="text-sm">3000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Backend Port:</span>
                    <span className="text-sm">8000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Proxy:</span>
                    <Badge className="bg-green-100 text-green-800">Configured</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnostics">
          {diagnostics ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Connection Diagnostics Results
                  <Badge className={
                    diagnostics.overall === 'healthy' ? 'bg-green-100 text-green-800' :
                    diagnostics.overall === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {diagnostics.overall.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {diagnostics.tests.map((test, index) => (
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(test.status)}
                        <div className="flex-1">
                          <div className="font-medium">{test.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{test.description}</div>
                          {test.error && (
                            <div className="text-sm text-red-600 mt-1 font-medium">{test.error}</div>
                          )}
                          {test.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer">View Details</summary>
                              <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {test.duration && (
                          <span className="text-xs text-gray-400">{test.duration}ms</span>
                        )}
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                {diagnostics.recommendations.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2 text-blue-800">🔧 Recommendations:</h4>
                    <ul className="space-y-2">
                      {diagnostics.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start">
                          <span className="mr-2 text-blue-400">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Running diagnostics...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="api-tests">
          <Card>
            <CardHeader>
              <CardTitle>API Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length > 0 ? (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="font-medium">{result.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer">View Response</summary>
                              <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Click "Test APIs" to run comprehensive API tests
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('http://localhost:8000/health', '_blank')}
                    className="w-full justify-start"
                  >
                    Open Backend Health Check
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      enhancedApiClient.forceBackendCheck();
                      loadBackendStatus();
                    }}
                    className="w-full justify-start"
                  >
                    Force Backend Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={startBackend}
                    className="w-full justify-start"
                  >
                    Backend Start Instructions
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Debug Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log('=== DEBUG INFO ===');
                      console.log('Backend Status:', backendStatus);
                      console.log('Diagnostics:', diagnostics);
                      console.log('API Test Results:', testResults);
                      console.log('Enhanced API Client:', enhancedApiClient);
                    }}
                    className="w-full justify-start"
                  >
                    Log Debug Information
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const info = connectionDiagnostics.getEnvironmentInfo();
                      alert(JSON.stringify(info, null, 2));
                    }}
                    className="w-full justify-start"
                  >
                    Show Environment Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}