/**
 * Auto Startup Service
 * Handles automatic initialization of backend services and broker connections
 */

export interface StartupStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  message?: string;
  error?: string;
  duration?: number;
}

export interface StartupProgress {
  steps: StartupStep[];
  currentStep?: string;
  overallStatus: 'initializing' | 'running' | 'completed' | 'failed';
  completedSteps: number;
  totalSteps: number;
  startedAt: string;
  completedAt?: string;
}

export class AutoStartupService {
  private progress: StartupProgress;
  private callbacks: ((progress: StartupProgress) => void)[] = [];

  constructor() {
    this.progress = {
      steps: [
        { id: 'backend-check', name: 'Checking backend server', status: 'pending' },
        { id: 'backend-start', name: 'Starting backend service', status: 'pending' },
        { id: 'health-check', name: 'Running health diagnostics', status: 'pending' },
        { id: 'broker-discovery', name: 'Discovering available brokers', status: 'pending' },
        { id: 'auto-connect', name: 'Auto-connecting to brokers', status: 'pending' },
        { id: 'data-sync', name: 'Syncing initial data', status: 'pending' },
      ],
      overallStatus: 'initializing',
      completedSteps: 0,
      totalSteps: 6,
      startedAt: new Date().toISOString(),
    };
  }

  onProgress(callback: (progress: StartupProgress) => void) {
    this.callbacks.push(callback);
  }

  private updateProgress(stepId: string, updates: Partial<StartupStep>) {
    const step = this.progress.steps.find(s => s.id === stepId);
    if (step) {
      Object.assign(step, updates);
      
      if (updates.status === 'completed') {
        this.progress.completedSteps++;
      }

      this.progress.currentStep = stepId;

      // Check if all steps completed
      if (this.progress.completedSteps === this.progress.totalSteps) {
        this.progress.overallStatus = 'completed';
        this.progress.completedAt = new Date().toISOString();
      } else if (step.status === 'failed') {
        this.progress.overallStatus = 'failed';
      } else {
        this.progress.overallStatus = 'running';
      }

      // Notify callbacks
      this.callbacks.forEach(callback => callback({ ...this.progress }));
    }
  }

  async startAutoInitialization(): Promise<StartupProgress> {
    console.log('🚀 Starting Edgerunner automatic initialization...');
    
    try {
      await this.checkBackend();
      await this.startBackendIfNeeded();
      await this.runHealthDiagnostics();
      await this.discoverBrokers();
      await this.autoConnectBrokers();
      await this.syncInitialData();

      console.log('✅ Automatic initialization completed successfully!');
      return this.progress;

    } catch (error) {
      console.error('❌ Automatic initialization failed:', error);
      this.progress.overallStatus = 'failed';
      return this.progress;
    }
  }

  private async checkBackend(): Promise<void> {
    const startTime = Date.now();
    this.updateProgress('backend-check', { status: 'running', message: 'Checking if backend is running...' });

    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        this.updateProgress('backend-check', {
          status: 'completed',
          message: 'Backend is already running',
          duration: Date.now() - startTime,
        });
      } else {
        throw new Error(`Backend returned status ${response.status}`);
      }
    } catch (error) {
      // Backend not running - this is expected, we'll start it
      this.updateProgress('backend-check', {
        status: 'completed',
        message: 'Backend not running - will start automatically',
        duration: Date.now() - startTime,
      });
    }
  }

  private async startBackendIfNeeded(): Promise<void> {
    const startTime = Date.now();
    this.updateProgress('backend-start', { status: 'running', message: 'Starting backend service...' });

    try {
      // Check if backend is already running
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        this.updateProgress('backend-start', {
          status: 'completed',
          message: 'Backend service is already running',
          duration: Date.now() - startTime,
        });
        return;
      }
    } catch {
      // Backend not running, need to start it
    }

    // Start backend using the start script
    try {
      // Use a more reliable method to start the backend
      const startResult = await this.startBackendProcess();
      
      if (startResult.success) {
        // Wait for backend to be ready
        await this.waitForBackendReady(30000); // 30 second timeout

        this.updateProgress('backend-start', {
          status: 'completed',
          message: 'Backend service started successfully',
          duration: Date.now() - startTime,
        });
      } else {
        throw new Error(startResult.error || 'Failed to start backend');
      }
    } catch (error) {
      this.updateProgress('backend-start', {
        status: 'failed',
        message: 'Failed to start backend service',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  private async startBackendProcess(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to start backend using the startup script
      const response = await fetch('/api/system/start-backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoStart: true })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      // Fallback: try to detect if backend startup script exists
      console.log('Direct backend start failed, backend may already be starting...');
      return { success: true }; // Assume success and let health check validate
    }
  }

  private async waitForBackendReady(timeout: number): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 1000; // Check every second

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch('http://localhost:8000/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'healthy' || data.status === 'ok') {
            return; // Backend is ready
          }
        }
      } catch {
        // Still waiting
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error('Backend did not become ready within timeout period');
  }

  private async runHealthDiagnostics(): Promise<void> {
    const startTime = Date.now();
    this.updateProgress('health-check', { status: 'running', message: 'Running system diagnostics...' });

    try {
      const response = await fetch('/api/diagnostics/health/summary', {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const health = await response.json();
        
        this.updateProgress('health-check', {
          status: 'completed',
          message: `System health: ${health.overall || 'healthy'}`,
          duration: Date.now() - startTime,
        });
      } else {
        throw new Error('Health check endpoint not available');
      }
    } catch (error) {
      this.updateProgress('health-check', {
        status: 'failed',
        message: 'Health diagnostics failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      // Don't throw - this is not critical for startup
    }
  }

  private async discoverBrokers(): Promise<void> {
    const startTime = Date.now();
    this.updateProgress('broker-discovery', { status: 'running', message: 'Discovering available brokers...' });

    try {
      const response = await fetch('/api/broker/status/all', {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        const brokerCount = Object.keys(data.statuses || {}).length;
        
        this.updateProgress('broker-discovery', {
          status: 'completed',
          message: `Discovered ${brokerCount} broker adapters`,
          duration: Date.now() - startTime,
        });
      } else {
        throw new Error('Broker discovery failed');
      }
    } catch (error) {
      this.updateProgress('broker-discovery', {
        status: 'failed',
        message: 'Broker discovery failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  private async autoConnectBrokers(): Promise<void> {
    const startTime = Date.now();
    this.updateProgress('auto-connect', { status: 'running', message: 'Auto-connecting to configured brokers...' });

    try {
      // Check for auto-connect configuration
      const autoConnectResults = await this.attemptAutoConnections();
      
      const successCount = autoConnectResults.filter(r => r.success).length;
      const totalCount = autoConnectResults.length;

      if (successCount > 0) {
        this.updateProgress('auto-connect', {
          status: 'completed',
          message: `Connected to ${successCount}/${totalCount} brokers`,
          duration: Date.now() - startTime,
        });
      } else if (totalCount === 0) {
        this.updateProgress('auto-connect', {
          status: 'skipped',
          message: 'No brokers configured for auto-connect',
          duration: Date.now() - startTime,
        });
      } else {
        this.updateProgress('auto-connect', {
          status: 'failed',
          message: `Failed to connect to any of ${totalCount} configured brokers`,
          duration: Date.now() - startTime,
        });
      }
    } catch (error) {
      this.updateProgress('auto-connect', {
        status: 'failed',
        message: 'Auto-connect process failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
    }
  }

  private async attemptAutoConnections(): Promise<Array<{ broker: string; success: boolean; error?: string }>> {
    const results: Array<{ broker: string; success: boolean; error?: string }> = [];

    // Auto-connect to IBKR if Gateway is running
    try {
      const ibkrResult = await fetch('/api/broker/status?broker=ibkr');
      if (ibkrResult.ok) {
        const status = await ibkrResult.json();
        results.push({
          broker: 'ibkr',
          success: status.status === 'connected',
          error: status.error
        });
      }
    } catch (error) {
      results.push({
        broker: 'ibkr',
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }

    // Auto-connect to MT5 if configured
    try {
      const mt5Result = await fetch('/api/broker/mt5/auto-connect', { method: 'POST' });
      if (mt5Result.ok) {
        const status = await mt5Result.json();
        results.push({
          broker: 'mt5',
          success: status.status === 'connected',
          error: status.error
        });
      }
    } catch (error) {
      results.push({
        broker: 'mt5',
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }

    return results;
  }

  private async syncInitialData(): Promise<void> {
    const startTime = Date.now();
    this.updateProgress('data-sync', { status: 'running', message: 'Syncing initial market data...' });

    try {
      // Try to fetch some initial data to warm up the system
      const testSymbol = 'AAPL';
      
      const response = await fetch(`/api/market-data?broker=ibkr&symbol=${testSymbol}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        this.updateProgress('data-sync', {
          status: 'completed',
          message: 'Initial data sync completed',
          duration: Date.now() - startTime,
        });
      } else {
        // Not critical - mark as skipped
        this.updateProgress('data-sync', {
          status: 'skipped',
          message: 'Initial data sync skipped (no broker connections)',
          duration: Date.now() - startTime,
        });
      }
    } catch (error) {
      this.updateProgress('data-sync', {
        status: 'skipped',
        message: 'Initial data sync skipped',
        duration: Date.now() - startTime,
      });
    }
  }

  getProgress(): StartupProgress {
    return { ...this.progress };
  }

  isCompleted(): boolean {
    return this.progress.overallStatus === 'completed';
  }

  hasFailed(): boolean {
    return this.progress.overallStatus === 'failed';
  }
}

// Global instance
export const autoStartupService = new AutoStartupService();