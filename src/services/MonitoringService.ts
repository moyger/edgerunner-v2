/**
 * Monitoring and Logging Service
 * Provides comprehensive logging, metrics collection, and debugging capabilities
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  source: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
}

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: any;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: number;
  uptime: number;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration: number;
  timestamp: number;
}

export interface MonitoringConfig {
  logLevel: LogLevel;
  maxLogEntries: number;
  maxMetrics: number;
  flushInterval: number;
  enableRemoteLogging: boolean;
  enablePerformanceMetrics: boolean;
  remoteEndpoint?: string;
  categories: string[];
  correlationIdHeader?: string;
}

export class MonitoringService {
  private config: MonitoringConfig;
  private logs: LogEntry[] = [];
  private metrics: Metric[] = [];
  private performanceMetrics = new Map<string, PerformanceMetric>();
  private healthChecks = new Map<string, HealthCheck>();
  private startTime = Date.now();
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private correlationId: string | null = null;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      logLevel: LogLevel.INFO,
      maxLogEntries: 10000,
      maxMetrics: 5000,
      flushInterval: 30000, // 30 seconds
      enableRemoteLogging: false,
      enablePerformanceMetrics: true,
      categories: ['api', 'broker', 'auth', 'websocket', 'data-sync', 'rate-limit'],
      ...config,
    };

    this.sessionId = this.generateId();
    this.initializeDefaultHealthChecks();
    this.startPeriodicFlush();
  }

  /**
   * Log a message
   */
  log(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    source: string = 'unknown'
  ): void {
    if (level < this.config.logLevel) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data: data ? this.sanitizeLogData(data) : undefined,
      source,
      correlationId: this.correlationId,
      sessionId: this.sessionId,
    };

    this.logs.push(entry);
    
    // Maintain log size limit
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-Math.floor(this.config.maxLogEntries * 0.8));
    }

    // Console output for immediate visibility
    this.outputToConsole(entry);

    // Remote logging if enabled
    if (this.config.enableRemoteLogging) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Debug log
   */
  debug(category: string, message: string, data?: any, source?: string): void {
    this.log(LogLevel.DEBUG, category, message, data, source);
  }

  /**
   * Info log
   */
  info(category: string, message: string, data?: any, source?: string): void {
    this.log(LogLevel.INFO, category, message, data, source);
  }

  /**
   * Warning log
   */
  warn(category: string, message: string, data?: any, source?: string): void {
    this.log(LogLevel.WARN, category, message, data, source);
  }

  /**
   * Error log
   */
  error(category: string, message: string, data?: any, source?: string): void {
    this.log(LogLevel.ERROR, category, message, data, source);
  }

  /**
   * Fatal log
   */
  fatal(category: string, message: string, data?: any, source?: string): void {
    this.log(LogLevel.FATAL, category, message, data, source);
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: number,
    type: Metric['type'] = 'gauge',
    labels: Record<string, string> = {}
  ): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      labels,
      type,
    };

    this.metrics.push(metric);

    // Maintain metrics size limit
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-Math.floor(this.config.maxMetrics * 0.8));
    }
  }

  /**
   * Start performance measurement
   */
  startPerformanceTimer(name: string, metadata?: any): string {
    if (!this.config.enablePerformanceMetrics) {
      return '';
    }

    const timerId = `${name}_${this.generateId()}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.performanceMetrics.set(timerId, metric);
    return timerId;
  }

  /**
   * End performance measurement
   */
  endPerformanceTimer(timerId: string): number | null {
    if (!this.config.enablePerformanceMetrics || !timerId) {
      return null;
    }

    const metric = this.performanceMetrics.get(timerId);
    if (!metric) {
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Record as metric
    this.recordMetric(
      `performance.${metric.name}`,
      metric.duration,
      'timer',
      { operation: metric.name }
    );

    // Log if significant
    if (metric.duration > 1000) {
      this.warn('performance', `Slow operation detected: ${metric.name}`, {
        duration: metric.duration,
        metadata: metric.metadata,
      });
    }

    this.performanceMetrics.delete(timerId);
    return metric.duration;
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const timerId = this.startPerformanceTimer(name, metadata);
    try {
      const result = await fn();
      this.endPerformanceTimer(timerId);
      return result;
    } catch (error) {
      this.endPerformanceTimer(timerId);
      this.error('performance', `Function ${name} failed`, {
        error: error instanceof Error ? error.message : error,
        metadata,
      });
      throw error;
    }
  }

  /**
   * Set correlation ID for request tracking
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Clear correlation ID
   */
  clearCorrelationId(): void {
    this.correlationId = null;
  }

  /**
   * Add health check
   */
  addHealthCheck(name: string, checkFn: () => Promise<boolean> | boolean): void {
    const check = async (): Promise<void> => {
      const startTime = performance.now();
      try {
        const result = await checkFn();
        const duration = performance.now() - startTime;
        
        this.healthChecks.set(name, {
          name,
          status: result ? 'pass' : 'fail',
          message: result ? undefined : 'Health check failed',
          duration,
          timestamp: Date.now(),
        });
      } catch (error) {
        const duration = performance.now() - startTime;
        this.healthChecks.set(name, {
          name,
          status: 'fail',
          message: error instanceof Error ? error.message : 'Health check error',
          duration,
          timestamp: Date.now(),
        });
      }
    };

    // Run initial check
    check().catch(console.error);

    // Schedule periodic checks
    setInterval(() => {
      check().catch(console.error);
    }, 60000); // Every minute
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const checks = Array.from(this.healthChecks.values());
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warnChecks = checks.filter(c => c.status === 'warn');

    let status: SystemHealth['status'];
    if (failedChecks.length > 0) {
      status = 'unhealthy';
    } else if (warnChecks.length > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      checks,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get logs with filtering
   */
  getLogs(options: {
    level?: LogLevel;
    category?: string;
    limit?: number;
    since?: number;
    correlationId?: string;
  } = {}): LogEntry[] {
    let filtered = this.logs;

    if (options.level !== undefined) {
      filtered = filtered.filter(log => log.level >= options.level!);
    }

    if (options.category) {
      filtered = filtered.filter(log => log.category === options.category);
    }

    if (options.since) {
      filtered = filtered.filter(log => log.timestamp >= options.since!);
    }

    if (options.correlationId) {
      filtered = filtered.filter(log => log.correlationId === options.correlationId);
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get metrics with filtering
   */
  getMetrics(options: {
    name?: string;
    type?: Metric['type'];
    since?: number;
    limit?: number;
  } = {}): Metric[] {
    let filtered = this.metrics;

    if (options.name) {
      filtered = filtered.filter(m => m.name.includes(options.name!));
    }

    if (options.type) {
      filtered = filtered.filter(m => m.type === options.type);
    }

    if (options.since) {
      filtered = filtered.filter(m => m.timestamp >= options.since!);
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get monitoring statistics
   */
  getStats(): {
    logs: { total: number; byLevel: Record<string, number>; byCategory: Record<string, number> };
    metrics: { total: number; byType: Record<string, number> };
    performance: { activeTimers: number; avgDuration: Record<string, number> };
    health: { status: string; passedChecks: number; failedChecks: number };
    uptime: number;
    sessionId: string;
  } {
    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const log of this.logs) {
      const levelName = LogLevel[log.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    }

    const byType: Record<string, number> = {};
    for (const metric of this.metrics) {
      byType[metric.type] = (byType[metric.type] || 0) + 1;
    }

    const avgDuration: Record<string, number> = {};
    const durationMetrics = this.metrics.filter(m => m.type === 'timer');
    const groupedByName = new Map<string, number[]>();
    
    for (const metric of durationMetrics) {
      const name = metric.name.replace('performance.', '');
      if (!groupedByName.has(name)) {
        groupedByName.set(name, []);
      }
      groupedByName.get(name)!.push(metric.value);
    }

    for (const [name, durations] of groupedByName.entries()) {
      avgDuration[name] = durations.reduce((a, b) => a + b, 0) / durations.length;
    }

    const health = this.getSystemHealth();
    const passedChecks = health.checks.filter(c => c.status === 'pass').length;
    const failedChecks = health.checks.filter(c => c.status === 'fail').length;

    return {
      logs: {
        total: this.logs.length,
        byLevel,
        byCategory,
      },
      metrics: {
        total: this.metrics.length,
        byType,
      },
      performance: {
        activeTimers: this.performanceMetrics.size,
        avgDuration,
      },
      health: {
        status: health.status,
        passedChecks,
        failedChecks,
      },
      uptime: Date.now() - this.startTime,
      sessionId: this.sessionId,
    };
  }

  /**
   * Export logs and metrics
   */
  exportData(since?: number): {
    logs: LogEntry[];
    metrics: Metric[];
    health: SystemHealth;
    stats: any;
  } {
    return {
      logs: this.getLogs({ since }),
      metrics: this.getMetrics({ since }),
      health: this.getSystemHealth(),
      stats: this.getStats(),
    };
  }

  /**
   * Clear old data
   */
  cleanup(olderThan: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan;
    
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
    
    // Clean up expired performance timers
    for (const [timerId, metric] of this.performanceMetrics.entries()) {
      if (metric.startTime < cutoff) {
        this.performanceMetrics.delete(timerId);
      }
    }

    this.info('monitoring', 'Cleanup completed', {
      remainingLogs: this.logs.length,
      remainingMetrics: this.metrics.length,
    });
  }

  private initializeDefaultHealthChecks(): void {
    // API connectivity check
    this.addHealthCheck('api-connectivity', async () => {
      try {
        const response = await fetch('/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      } catch {
        return false;
      }
    });

    // Memory usage check
    this.addHealthCheck('memory-usage', () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        const usage = usedMB / totalMB;
        return usage < 0.9; // Warn if using more than 90% of heap
      }
      return true;
    });

    // Local storage check
    this.addHealthCheck('local-storage', () => {
      try {
        const testKey = 'health-check-test';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    });
  }

  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] ${levelName} [${entry.category}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.data);
        break;
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: [entry],
          sessionId: this.sessionId,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      // Don't log remote logging failures to avoid infinite loops
      console.warn('Failed to send log to remote endpoint:', error);
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      // Record periodic metrics
      this.recordMetric('monitoring.logs.count', this.logs.length);
      this.recordMetric('monitoring.metrics.count', this.metrics.length);
      this.recordMetric('monitoring.performance.active_timers', this.performanceMetrics.size);
      
      // Cleanup old data periodically
      if (Math.random() < 0.1) { // 10% chance each flush
        this.cleanup();
      }
    }, this.config.flushInterval);
  }

  private sanitizeLogData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeLogData(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Redact sensitive fields
        if (['password', 'token', 'secret', 'key', 'authorization'].some(sensitive => 
          key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeLogData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  /**
   * Cleanup on service shutdown
   */
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush of important logs
    const importantLogs = this.logs.filter(log => log.level >= LogLevel.WARN);
    if (importantLogs.length > 0 && this.config.enableRemoteLogging) {
      importantLogs.forEach(log => this.sendToRemote(log));
    }
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();