/**
 * API Integration Manager
 * Orchestrates all API integration services for robust trading platform connectivity
 */

import { apiClient } from './ApiClient';
import { rateLimiter } from './RateLimiter';
import { authManager } from './AuthManager';
import { webSocketManager, WebSocketState } from './WebSocketManager';
import { realTimeDataService } from './RealTimeDataService';
import { dataSyncService } from './DataSyncService';
import { monitoringService, LogLevel } from './MonitoringService';
import { brokerService } from './brokers/BrokerService';
import type { BrokerCredentials, BrokerConnection } from './brokers/types';
import type { BrokerId, MarketData, PriceUpdate, OrderBookUpdate, TradeUpdate } from '../types';

export interface IntegrationConfig {
  enableRateLimit: boolean;
  enableAuth: boolean;
  enableWebSocket: boolean;
  enableRealTimeData: boolean;
  enableDataSync: boolean;
  enableMonitoring: boolean;
  brokers: string[];
  baseUrl: string;
  wsUrl: string;
}

export interface IntegrationStatus {
  apiClient: {
    connected: boolean;
    stats: any;
  };
  auth: {
    authenticated: Record<string, boolean>;
    status: any;
  };
  rateLimiter: {
    status: Record<string, any>;
  };
  webSocket: {
    state: WebSocketState;
    stats: any;
  };
  realTimeData: {
    subscriptions: any;
    stats: any;
  };
  dataSync: {
    stats: any;
    conflicts: number;
  };
  monitoring: {
    stats: any;
    health: any;
  };
  brokers: Record<string, BrokerConnection>;
}

export class ApiIntegrationManager {
  private config: IntegrationConfig;
  private initialized = false;
  private shutdownHandlers: Array<() => Promise<void> | void> = [];

  constructor(config: Partial<IntegrationConfig> = {}) {
    this.config = {
      enableRateLimit: true,
      enableAuth: true,
      enableWebSocket: true,
      enableRealTimeData: true,
      enableDataSync: true,
      enableMonitoring: true,
      brokers: ['ibkr', 'bybit', 'mt5'],
      baseUrl: 'http://localhost:8000',
      wsUrl: 'ws://localhost:8000/ws',
      ...config,
    };

    this.setupShutdownHandlers();
  }

  /**
   * Initialize all API integration services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const correlationId = this.generateCorrelationId();
    monitoringService.setCorrelationId(correlationId);

    try {
      monitoringService.info('integration', 'Starting API integration initialization', {
        config: this.sanitizeConfig(this.config),
      });

      // Initialize services in dependency order
      await this.initializeMonitoring();
      await this.initializeRateLimit();
      await this.initializeAuth();
      await this.initializeApiClient();
      await this.initializeWebSocket();
      await this.initializeRealTimeData();
      await this.initializeDataSync();
      await this.initializeBrokerService();

      this.initialized = true;

      monitoringService.info('integration', 'API integration initialization completed successfully', {
        correlationId,
      });

    } catch (error) {
      monitoringService.error('integration', 'Failed to initialize API integration', {
        error: error instanceof Error ? error.message : error,
        correlationId,
      });
      throw error;
    } finally {
      monitoringService.clearCorrelationId();
    }
  }

  /**
   * Connect to a broker with full integration support
   */
  async connectBroker(brokerId: BrokerId, credentials: BrokerCredentials): Promise<BrokerConnection> {
    const correlationId = this.generateCorrelationId();
    monitoringService.setCorrelationId(correlationId);

    try {
      monitoringService.info('integration', `Connecting to broker: ${brokerId}`, {
        brokerId,
        correlationId,
      });

      // Store credentials securely
      if (this.config.enableAuth) {
        await authManager.storeCredentials(brokerId, credentials);
      }

      // Connect via broker service
      const connection = await brokerService.connectBroker(brokerId, credentials);

      // Set up real-time data subscription if enabled
      if (this.config.enableRealTimeData && connection.status === 'connected') {
        await this.setupRealTimeDataForBroker(brokerId);
      }

      monitoringService.info('integration', `Successfully connected to broker: ${brokerId}`, {
        brokerId,
        status: connection.status,
        correlationId,
      });

      return connection;

    } catch (error) {
      monitoringService.error('integration', `Failed to connect to broker: ${brokerId}`, {
        brokerId,
        error: error instanceof Error ? error.message : error,
        correlationId,
      });
      throw error;
    } finally {
      monitoringService.clearCorrelationId();
    }
  }

  /**
   * Disconnect from a broker
   */
  async disconnectBroker(brokerId: BrokerId): Promise<void> {
    const correlationId = this.generateCorrelationId();
    monitoringService.setCorrelationId(correlationId);

    try {
      monitoringService.info('integration', `Disconnecting from broker: ${brokerId}`, {
        brokerId,
        correlationId,
      });

      await brokerService.disconnectBroker(brokerId);

      // Remove credentials
      if (this.config.enableAuth) {
        authManager.removeCredentials(brokerId);
      }

      monitoringService.info('integration', `Successfully disconnected from broker: ${brokerId}`, {
        brokerId,
        correlationId,
      });

    } catch (error) {
      monitoringService.error('integration', `Failed to disconnect from broker: ${brokerId}`, {
        brokerId,
        error: error instanceof Error ? error.message : error,
        correlationId,
      });
      throw error;
    } finally {
      monitoringService.clearCorrelationId();
    }
  }

  /**
   * Subscribe to real-time market data with full integration
   */
  async subscribeToMarketData(
    symbols: string[],
    callback: (data: MarketData) => void,
    errorCallback?: (error: Error) => void
  ): Promise<string> {
    if (!this.config.enableRealTimeData) {
      throw new Error('Real-time data is disabled');
    }

    const correlationId = this.generateCorrelationId();
    monitoringService.setCorrelationId(correlationId);

    try {
      monitoringService.info('integration', 'Subscribing to market data', {
        symbols,
        correlationId,
      });

      const subscriptionId = realTimeDataService.subscribe(
        {
          symbols,
          dataTypes: ['price'],
          throttleMs: 100, // Throttle to 10 updates per second
        },
        (data) => {
          // Sync data if enabled
          if (this.config.enableDataSync) {
            dataSyncService.storeData(
              `market-data-${data.symbol}`,
              data,
              'real-time-feed'
            ).catch(console.error);
          }

          // Convert to MarketData format if needed
          if ('price' in data && !('bid' in data)) {
            // Handle PriceUpdate
            const marketData: MarketData = {
              symbol: data.symbol,
              bid: data.price - 0.01,
              ask: data.price + 0.01,
              last: data.price,
              high: data.price,
              low: data.price,
              volume: 0,
              timestamp: typeof data.timestamp === 'string' ? parseInt(data.timestamp) : data.timestamp
            };
            callback(marketData);
          } else if ('bid' in data && 'ask' in data) {
            // Already MarketData format
            callback(data as unknown as MarketData);
          }
        },
        errorCallback
      );

      monitoringService.info('integration', 'Successfully subscribed to market data', {
        symbols,
        subscriptionId,
        correlationId,
      });

      return subscriptionId;

    } catch (error) {
      monitoringService.error('integration', 'Failed to subscribe to market data', {
        symbols,
        error: error instanceof Error ? error.message : error,
        correlationId,
      });
      throw error;
    } finally {
      monitoringService.clearCorrelationId();
    }
  }

  /**
   * Test all broker connections
   */
  async testAllBrokerConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const correlationId = this.generateCorrelationId();
    monitoringService.setCorrelationId(correlationId);

    try {
      monitoringService.info('integration', 'Testing all broker connections', {
        brokers: this.config.brokers,
        correlationId,
      });

      for (const brokerId of this.config.brokers) {
        try {
          const testResult = await brokerService.testBrokerConnection(brokerId as BrokerId);
          results[brokerId] = testResult.status === 'passed';

          monitoringService.info('integration', `Broker test result: ${brokerId}`, {
            brokerId,
            result: testResult.status,
            duration: testResult.duration,
            correlationId,
          });
        } catch (error) {
          results[brokerId] = false;
          monitoringService.warn('integration', `Broker test failed: ${brokerId}`, {
            brokerId,
            error: error instanceof Error ? error.message : error,
            correlationId,
          });
        }
      }

      return results;

    } finally {
      monitoringService.clearCorrelationId();
    }
  }

  /**
   * Get comprehensive integration status
   */
  async getStatus(): Promise<IntegrationStatus> {
    const timerId = monitoringService.startPerformanceTimer('get-integration-status');

    try {
      const [brokerStatuses, authStatus] = await Promise.all([
        brokerService.getAllBrokerStatuses(),
        authManager.getAuthStatus(),
      ]);

      const status: IntegrationStatus = {
        apiClient: {
          connected: true, // API client doesn't have a connected state per se
          stats: apiClient.getStats(),
        },
        auth: {
          authenticated: Object.keys(authStatus).reduce((acc, key) => {
            acc[key] = authStatus[key].hasToken && !authStatus[key].tokenExpired;
            return acc;
          }, {} as Record<string, boolean>),
          status: authStatus,
        },
        rateLimiter: {
          status: this.config.brokers.reduce((acc, brokerId) => {
            acc[brokerId] = rateLimiter.getStatus(brokerId);
            return acc;
          }, {} as Record<string, any>),
        },
        webSocket: {
          state: webSocketManager.getState(),
          stats: webSocketManager.getStats(),
        },
        realTimeData: {
          subscriptions: realTimeDataService.getSubscriptionStatus(),
          stats: realTimeDataService.getStats(),
        },
        dataSync: {
          stats: dataSyncService.getStats(),
          conflicts: dataSyncService.getUnresolvedConflicts().length,
        },
        monitoring: {
          stats: monitoringService.getStats(),
          health: monitoringService.getSystemHealth(),
        },
        brokers: brokerStatuses,
      };

      return status;

    } finally {
      monitoringService.endPerformanceTimer(timerId);
    }
  }

  /**
   * Perform health check on all services
   */
  async healthCheck(): Promise<{ healthy: boolean; services: Record<string, boolean> }> {
    const services: Record<string, boolean> = {};
    let healthy = true;

    // Check API client
    try {
      const stats = apiClient.getStats();
      services.apiClient = stats.circuitBreakers.every(cb => !cb.isOpen);
    } catch {
      services.apiClient = false;
    }

    // Check WebSocket
    services.webSocket = webSocketManager.getState() === WebSocketState.CONNECTED;

    // Check brokers
    try {
      const brokerStatuses = await brokerService.getAllBrokerStatuses();
      for (const [brokerId, status] of Object.entries(brokerStatuses)) {
        services[`broker-${brokerId}`] = status.status === 'connected';
      }
    } catch {
      for (const brokerId of this.config.brokers) {
        services[`broker-${brokerId}`] = false;
      }
    }

    // Check system health
    const systemHealth = monitoringService.getSystemHealth();
    services.monitoring = systemHealth.status !== 'unhealthy';

    // Overall health
    healthy = Object.values(services).every(status => status);

    monitoringService.info('integration', 'Health check completed', {
      healthy,
      services,
    });

    return { healthy, services };
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown(): Promise<void> {
    monitoringService.info('integration', 'Starting graceful shutdown');

    try {
      // Run shutdown handlers in reverse order
      for (const handler of this.shutdownHandlers.reverse()) {
        await handler();
      }

      // Final cleanup
      realTimeDataService.cleanup();
      dataSyncService.clear();
      apiClient.cleanup();
      monitoringService.shutdown();

      this.initialized = false;

      console.log('API integration shutdown completed');

    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  private async initializeMonitoring(): Promise<void> {
    if (!this.config.enableMonitoring) return;

    monitoringService.info('integration', 'Monitoring service initialized');
  }

  private async initializeRateLimit(): Promise<void> {
    if (!this.config.enableRateLimit) return;

    // Rate limiter is already initialized with default configs
    monitoringService.info('integration', 'Rate limiter initialized');
  }

  private async initializeAuth(): Promise<void> {
    if (!this.config.enableAuth) return;

    // Auth manager is already initialized
    monitoringService.info('integration', 'Authentication manager initialized');
  }

  private async initializeApiClient(): Promise<void> {
    // API client is already initialized with enhanced features
    monitoringService.info('integration', 'API client initialized');
  }

  private async initializeWebSocket(): Promise<void> {
    if (!this.config.enableWebSocket) return;

    try {
      await webSocketManager.connect();
      monitoringService.info('integration', 'WebSocket manager initialized');
    } catch (error) {
      monitoringService.warn('integration', 'WebSocket initialization failed', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  private async initializeRealTimeData(): Promise<void> {
    if (!this.config.enableRealTimeData) return;

    await realTimeDataService.initialize();
    monitoringService.info('integration', 'Real-time data service initialized');
  }

  private async initializeDataSync(): Promise<void> {
    if (!this.config.enableDataSync) return;

    // Data sync service is already initialized
    monitoringService.info('integration', 'Data synchronization service initialized');
  }

  private async initializeBrokerService(): Promise<void> {
    // Broker service is already initialized
    monitoringService.info('integration', 'Broker service initialized');
  }

  private async setupRealTimeDataForBroker(brokerId: BrokerId): Promise<void> {
    try {
      // This would typically set up broker-specific real-time data feeds
      monitoringService.info('integration', `Setting up real-time data for broker: ${brokerId}`);
      // Implementation would depend on broker-specific requirements
    } catch (error) {
      monitoringService.warn('integration', `Failed to setup real-time data for broker: ${brokerId}`, {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  private setupShutdownHandlers(): void {
    const cleanup = async () => {
      await this.shutdown();
    };

    // Handle different shutdown signals
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    window?.addEventListener('beforeunload', cleanup);

    this.shutdownHandlers.push(
      async () => {
        await webSocketManager.disconnect();
      },
      async () => {
        authManager.clearAll();
      },
      async () => {
        // Reset rate limits for all brokers
        for (const broker of ['bybit', 'ibkr', 'mt5', 'alpaca']) {
          rateLimiter.resetLimits(broker);
        }
      }
    );
  }

  private sanitizeConfig(config: IntegrationConfig): Partial<IntegrationConfig> {
    return {
      ...config,
      // Remove sensitive information
    };
  }

  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}

// Singleton instance
export const apiIntegrationManager = new ApiIntegrationManager();