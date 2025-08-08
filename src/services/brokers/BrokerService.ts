/**
 * Broker Service Manager
 * Manages multiple broker connections and provides unified API
 */

import { IBKRAdapter } from './IBKRAdapter';
import { MT5Adapter } from './MT5Adapter';
import { ByBitAdapter } from './ByBitAdapter';
import { credentialsValidator, type ValidationResult } from '../CredentialsValidator';
import { enhancedApiClient } from '../ApiClientWithFallback';
import { connectionDiagnostics } from '../ConnectionDiagnostics';
import type { 
  BrokerAdapter, 
  BrokerConnection, 
  BrokerCredentials, 
  TestResult 
} from './types';

import type { BrokerId } from '../../types';

export class BrokerService {
  private adapters: Map<BrokerId, BrokerAdapter> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    // Initialize IBKR adapter
    this.adapters.set('ibkr', new IBKRAdapter(this.baseUrl));
    
    // Initialize MT5 adapter
    this.adapters.set('mt5', new MT5Adapter(this.baseUrl));
    
    // Initialize ByBit adapter
    this.adapters.set('bybit', new ByBitAdapter(this.baseUrl));
  }

  getAdapter(brokerId: BrokerId): BrokerAdapter {
    const adapter = this.adapters.get(brokerId);
    if (!adapter) {
      throw new Error(`Broker adapter not found: ${brokerId}`);
    }
    return adapter;
  }

  async connectBroker(brokerId: BrokerId, credentials: BrokerCredentials): Promise<BrokerConnection> {
    // Validate credentials first
    const validation = credentialsValidator.validate(brokerId, credentials);
    if (!validation.isValid) {
      throw new Error(`Invalid credentials: ${validation.errors.join(', ')}`);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn(`Broker ${brokerId} warnings:`, validation.warnings);
    }

    const adapter = this.getAdapter(brokerId);
    return await adapter.connect(credentials);
  }

  async disconnectBroker(brokerId: BrokerId): Promise<void> {
    const adapter = this.getAdapter(brokerId);
    return await adapter.disconnect();
  }

  async getBrokerStatus(brokerId: BrokerId): Promise<BrokerConnection> {
    const adapter = this.getAdapter(brokerId);
    return await adapter.getConnectionStatus();
  }

  async getAllBrokerStatuses(): Promise<Record<BrokerId, BrokerConnection>> {
    const statuses: Record<string, BrokerConnection> = {};
    
    for (const [brokerId, adapter] of this.adapters.entries()) {
      try {
        statuses[brokerId] = await adapter.getConnectionStatus();
      } catch (error) {
        statuses[brokerId] = {
          id: brokerId,
          name: this.getBrokerName(brokerId),
          status: 'error',
          lastChecked: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Status check failed',
        };
      }
    }
    
    return statuses as Record<BrokerId, BrokerConnection>;
  }

  async testBrokerConnection(brokerId: BrokerId): Promise<TestResult> {
    const adapter = this.getAdapter(brokerId);
    
    if (brokerId === 'ibkr') {
      const ibkrAdapter = adapter as IBKRAdapter;
      return await ibkrAdapter.testConnection();
    }
    
    if (brokerId === 'bybit') {
      const bybitAdapter = adapter as ByBitAdapter;
      return await bybitAdapter.testConnection();
    }
    
    // For other brokers, use generic test method
    const tests = await adapter.runTests(['authentication']);
    return tests[0] || {
      testId: `${brokerId}-connection`,
      category: 'authentication',
      name: 'Connection Test',
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: 'Test not implemented',
    };
  }

  async runAllTests(brokerId: BrokerId, categories?: string[]): Promise<TestResult[]> {
    const adapter = this.getAdapter(brokerId);
    return await adapter.runTests(categories);
  }

  async runCategoryTests(brokerId: BrokerId, category: string): Promise<TestResult[]> {
    const adapter = this.getAdapter(brokerId);
    
    if (brokerId === 'ibkr') {
      const ibkrAdapter = adapter as IBKRAdapter;
      
      switch (category) {
        case 'authentication':
          return [await ibkrAdapter.testConnection()];
        case 'market-data':
          return [await ibkrAdapter.testMarketData()];
        case 'account-data':
          return [await ibkrAdapter.testAccountData()];
        default:
          return await adapter.runTests([category]);
      }
    }
    
    if (brokerId === 'bybit') {
      const bybitAdapter = adapter as ByBitAdapter;
      
      switch (category) {
        case 'authentication':
          return [await bybitAdapter.testConnection()];
        case 'market-data':
          return [await bybitAdapter.testMarketData()];
        case 'account-data':
          return [await bybitAdapter.testAccountData()];
        default:
          return await adapter.runTests([category]);
      }
    }
    
    return await adapter.runTests([category]);
  }

  private getBrokerName(brokerId: BrokerId): string {
    switch (brokerId) {
      case 'ibkr':
        return 'Interactive Brokers';
      case 'mt5':
        return 'MetaTrader 5';
      case 'bybit':
        return 'ByBit';
      default:
        return 'Unknown Broker';
    }
  }

  // Utility methods for the API testing page
  async validateCredentials(brokerId: BrokerId, credentials: BrokerCredentials): Promise<ValidationResult> {
    return credentialsValidator.validate(brokerId, credentials);
  }

  async testCredentialsConnection(brokerId: BrokerId, credentials: BrokerCredentials): Promise<boolean> {
    try {
      const connection = await this.connectBroker(brokerId, credentials);
      if (connection.status === 'connected') {
        await this.disconnectBroker(brokerId);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Credential validation failed for ${brokerId}:`, credentialsValidator.sanitizeForLogging(credentials));
      return false;
    }
  }

  async isBackendAvailable(): Promise<boolean> {
    return await connectionDiagnostics.quickHealthCheck();
  }

  // Enhanced diagnostics
  async runConnectionDiagnostics() {
    return await connectionDiagnostics.runFullDiagnostics();
  }

  // Get backend status with details
  async getBackendStatus() {
    const status = enhancedApiClient.getBackendStatus();
    const envInfo = connectionDiagnostics.getEnvironmentInfo();
    
    return {
      backend: status,
      environment: envInfo,
      fallbackEnabled: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Get supported broker IDs
  getSupportedBrokers(): BrokerId[] {
    return Array.from(this.adapters.keys());
  }

  // Check if a broker is implemented
  isBrokerImplemented(brokerId: BrokerId): boolean {
    return this.adapters.has(brokerId);
  }

  // Get credentials requirements for a broker
  getCredentialsRequirements(brokerId: BrokerId): { required: string[]; optional: string[]; sample: Record<string, any> } {
    return {
      required: credentialsValidator.getRequiredFields(brokerId),
      optional: credentialsValidator.getOptionalFields(brokerId),
      sample: credentialsValidator.getSampleCredentials(brokerId),
    };
  }

  // Check production readiness
  isProductionReady(brokerId: BrokerId, credentials: BrokerCredentials): { ready: boolean; issues: string[] } {
    return credentialsValidator.isProductionReady(brokerId, credentials);
  }
}

// Singleton instance
export const brokerService = new BrokerService();