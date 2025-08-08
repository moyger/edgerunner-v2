/**
 * Connection Diagnostics Tool
 * Tests and diagnoses API connection issues
 */

export interface DiagnosticTest {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  duration?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface DiagnosticResult {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  tests: DiagnosticTest[];
  recommendations: string[];
  timestamp: string;
}

export class ConnectionDiagnostics {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async runFullDiagnostics(): Promise<DiagnosticResult> {
    const tests: DiagnosticTest[] = [
      { name: 'Backend Health Check', description: 'Test if backend server is running', status: 'pending' },
      { name: 'Network Connectivity', description: 'Test basic network connectivity', status: 'pending' },
      { name: 'CORS Configuration', description: 'Test cross-origin requests', status: 'pending' },
      { name: 'API Endpoints', description: 'Test critical API endpoints', status: 'pending' },
      { name: 'Authentication Flow', description: 'Test auth endpoints', status: 'pending' },
      { name: 'Proxy Configuration', description: 'Test Vite proxy setup', status: 'pending' },
    ];

    console.log('🔍 Starting API Connection Diagnostics...');

    // Run tests sequentially
    for (let i = 0; i < tests.length; i++) {
      tests[i].status = 'running';
      console.log(`Running: ${tests[i].name}`);

      const startTime = Date.now();
      
      try {
        switch (tests[i].name) {
          case 'Backend Health Check':
            await this.testBackendHealth(tests[i]);
            break;
          case 'Network Connectivity':
            await this.testNetworkConnectivity(tests[i]);
            break;
          case 'CORS Configuration':
            await this.testCorsConfiguration(tests[i]);
            break;
          case 'API Endpoints':
            await this.testApiEndpoints(tests[i]);
            break;
          case 'Authentication Flow':
            await this.testAuthenticationFlow(tests[i]);
            break;
          case 'Proxy Configuration':
            await this.testProxyConfiguration(tests[i]);
            break;
        }
        
        tests[i].duration = Date.now() - startTime;
        if (tests[i].status === 'running') {
          tests[i].status = 'passed';
        }
      } catch (error) {
        tests[i].status = 'failed';
        tests[i].duration = Date.now() - startTime;
        tests[i].error = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ ${tests[i].name} failed:`, error);
      }
    }

    const result = this.analyzeDiagnosticResults(tests);
    console.log(`🏁 Diagnostics complete. Overall status: ${result.overall}`);
    
    return result;
  }

  private async testBackendHealth(test: DiagnosticTest): Promise<void> {
    const endpoints = [
      `${this.baseUrl}/health`,
      '/api/health',
      `${this.baseUrl}/`,
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        });
        
        if (response.ok) {
          test.status = 'passed';
          test.details = { workingEndpoint: endpoint, allResults: results };
          return;
        }
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    test.details = { attempts: results };
    throw new Error(`No backend endpoints are responding. Tried: ${endpoints.join(', ')}`);
  }

  private async testNetworkConnectivity(test: DiagnosticTest): Promise<void> {
    // Test local connectivity
    const tests = [
      { name: 'Localhost 8000', url: 'http://localhost:8000' },
      { name: 'Localhost 3000', url: 'http://localhost:3000' },
      { name: 'External connectivity', url: 'https://httpbin.org/get' },
    ];

    const results = [];
    let passedCount = 0;

    for (const networkTest of tests) {
      try {
        const response = await fetch(networkTest.url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        
        results.push({
          ...networkTest,
          status: response.status,
          ok: response.ok,
        });
        
        if (response.ok) passedCount++;
      } catch (error) {
        results.push({
          ...networkTest,
          error: error instanceof Error ? error.message : 'Connection failed',
        });
      }
    }

    test.details = { results };

    if (passedCount === 0) {
      throw new Error('No network connectivity detected');
    } else if (passedCount < tests.length) {
      test.status = 'warning';
    }
  }

  private async testCorsConfiguration(test: DiagnosticTest): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000',
        },
      });

      test.details = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (!response.ok && response.status === 404) {
        test.status = 'warning';
        test.error = 'CORS test endpoint not found (expected if backend is down)';
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('CORS')) {
        throw new Error('CORS policy blocking requests. Check Vite proxy configuration.');
      }
      test.status = 'warning';
      test.error = 'CORS test inconclusive (backend may be down)';
    }
  }

  private async testApiEndpoints(test: DiagnosticTest): Promise<void> {
    const endpoints = [
      '/api/broker/status',
      '/api/health',
      '/api/auth/login',
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          reachable: true,
        });
      } catch (error) {
        results.push({
          endpoint,
          reachable: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    test.details = { endpoints: results };
    
    const reachableCount = results.filter(r => r.reachable).length;
    if (reachableCount === 0) {
      throw new Error('No API endpoints are reachable');
    } else if (reachableCount < endpoints.length) {
      test.status = 'warning';
    }
  }

  private async testAuthenticationFlow(test: DiagnosticTest): Promise<void> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: 'test',
          credentials: { test: true },
        }),
      });

      test.details = {
        status: response.status,
        reachable: true,
      };

      // We expect 400/401 for invalid credentials, which means endpoint is working
      if ([400, 401, 422].includes(response.status)) {
        test.status = 'passed';
      } else if (response.status === 404) {
        test.status = 'warning';
        test.error = 'Auth endpoint not found (backend may be down)';
      }
    } catch (error) {
      test.status = 'warning';
      test.error = 'Auth test inconclusive (backend may be down)';
      test.details = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async testProxyConfiguration(test: DiagnosticTest): Promise<void> {
    const proxyTest = await fetch('/api/health', {
      method: 'GET',
      headers: { 'X-Proxy-Test': 'true' },
    }).catch(error => ({
      error: error instanceof Error ? error.message : 'Unknown error',
    }));

    if ('error' in proxyTest) {
      test.details = { proxyError: proxyTest.error };
      
      // Check if this looks like a proxy configuration issue
      if (proxyTest.error.includes('ECONNREFUSED') || proxyTest.error.includes('fetch')) {
        test.status = 'warning';
        test.error = 'Proxy configured but backend not responding (expected if backend is down)';
      } else {
        throw new Error(`Proxy configuration issue: ${proxyTest.error}`);
      }
    } else {
      test.details = { proxyWorking: true };
    }
  }

  private analyzeDiagnosticResults(tests: DiagnosticTest[]): DiagnosticResult {
    const failed = tests.filter(t => t.status === 'failed').length;
    const warnings = tests.filter(t => t.status === 'warning').length;
    const passed = tests.filter(t => t.status === 'passed').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    const recommendations: string[] = [];

    if (failed === 0 && warnings === 0) {
      overall = 'healthy';
    } else if (failed === 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    // Generate recommendations based on test results
    const backendTest = tests.find(t => t.name === 'Backend Health Check');
    if (backendTest?.status === 'failed') {
      recommendations.push('🚨 CRITICAL: Backend server is not running. Start the backend service on port 8000.');
      recommendations.push('📋 Run: cd backend && python start.py (or equivalent backend start command)');
    }

    const networkTest = tests.find(t => t.name === 'Network Connectivity');
    if (networkTest?.status === 'failed') {
      recommendations.push('🌐 Network connectivity issues detected. Check your internet connection.');
    }

    const corsTest = tests.find(t => t.name === 'CORS Configuration');
    if (corsTest?.status === 'failed') {
      recommendations.push('🔧 CORS configuration issues. Ensure Vite proxy is properly configured.');
    }

    const apiTest = tests.find(t => t.name === 'API Endpoints');
    if (apiTest?.status === 'failed') {
      recommendations.push('🔌 API endpoints not accessible. Check backend service and routing configuration.');
    }

    if (overall === 'degraded') {
      recommendations.push('⚠️ Some services have warnings but core functionality should work.');
    }

    if (overall === 'healthy') {
      recommendations.push('✅ All systems operational! API connections should work properly.');
    }

    return {
      overall,
      tests,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  // Quick health check method
  async quickHealthCheck(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get environment information
  getEnvironmentInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      origin: window.location.origin,
      baseUrl: this.baseUrl,
      timestamp: new Date().toISOString(),
      webCryptoAvailable: !!window.crypto?.subtle,
      fetchAvailable: typeof fetch !== 'undefined',
    };
  }
}

export const connectionDiagnostics = new ConnectionDiagnostics();