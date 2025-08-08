import * as Sentry from '@sentry/react'

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Trading-specific error types
export enum TradingErrorType {
  CONNECTION_ERROR = 'connection_error',
  VALIDATION_ERROR = 'validation_error',
  ORDER_ERROR = 'order_error',
  DATA_ERROR = 'data_error',
  CALCULATION_ERROR = 'calculation_error',
  STRATEGY_ERROR = 'strategy_error',
  PORTFOLIO_ERROR = 'portfolio_error',
  API_ERROR = 'api_error'
}

// Error context interface
export interface ErrorContext {
  userId?: string
  sessionId?: string
  strategy?: string
  symbol?: string
  action?: string
  amount?: number
  timestamp: number
  userAgent: string
  url: string
  [key: string]: any
}

// Initialize Sentry monitoring
export function initializeMonitoring() {
  const isDevelopment = import.meta.env.DEV
  const dsn = import.meta.env.VITE_SENTRY_DSN
  
  if (!dsn) {
    console.warn('Sentry DSN not configured - error monitoring disabled')
    return
  }

  Sentry.init({
    dsn,
    environment: isDevelopment ? 'development' : 'production',
    
    // Performance monitoring
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    
    // Error sampling
    sampleRate: 1.0,
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    
    // Additional configuration for trading platform
    beforeSend(event, hint) {
      // Filter out sensitive trading data
      if (event.extra) {
        event.extra = sanitizeErrorData(event.extra)
      }
      
      if (event.contexts?.state) {
        event.contexts.state = sanitizeErrorData(event.contexts.state)
      }
      
      // Don't send errors in development unless explicitly enabled
      if (isDevelopment && !import.meta.env.VITE_SENTRY_ENABLED) {
        console.error('Development Error:', event, hint)
        return null
      }
      
      return event
    },
    
    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Mask all text for privacy
        maskAllInputs: true, // Mask all inputs for security
        blockAllMedia: true, // Block media recording
      }),
    ],
    
    // Session replay sampling
    replaysSessionSampleRate: isDevelopment ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

// Sanitize sensitive data from error reports
function sanitizeErrorData(data: any): any {
  if (!data || typeof data !== 'object') return data
  
  const sanitized = { ...data }
  const sensitiveKeys = [
    'password', 'token', 'key', 'secret', 'auth',
    'accountNumber', 'routing', 'ssn', 'balance',
    'netWorth', 'income', 'pnl', 'profit', 'loss'
  ]
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeErrorData(sanitized[key])
    }
  }
  
  return sanitized
}

// Enhanced error logging for trading platform
export class TradingErrorLogger {
  private static instance: TradingErrorLogger
  private errorQueue: Array<{ error: Error; context: ErrorContext; severity: ErrorSeverity }> = []
  private isOnline = navigator.onLine
  
  private constructor() {
    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushErrorQueue()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
    
    // Flush errors periodically
    setInterval(() => this.flushErrorQueue(), 30000) // Every 30 seconds
  }
  
  public static getInstance(): TradingErrorLogger {
    if (!TradingErrorLogger.instance) {
      TradingErrorLogger.instance = new TradingErrorLogger()
    }
    return TradingErrorLogger.instance
  }
  
  // Log trading-specific errors
  public logError(
    error: Error,
    type: TradingErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {}
  ) {
    const fullContext: ErrorContext = {
      ...context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorType: type,
      severity,
    }
    
    // Add to queue if offline
    if (!this.isOnline) {
      this.errorQueue.push({ error, context: fullContext, severity })
      return
    }
    
    // Log immediately if online
    this.sendError(error, fullContext, severity)
  }
  
  // Log trading events (non-errors)
  public logEvent(
    name: string,
    data: Record<string, any> = {},
    severity: ErrorSeverity = ErrorSeverity.LOW
  ) {
    if (!this.isOnline) return
    
    Sentry.addBreadcrumb({
      message: name,
      category: 'trading',
      level: severity as any,
      data: sanitizeErrorData(data),
      timestamp: Date.now() / 1000,
    })
  }
  
  // Log performance metrics
  public logPerformance(
    operation: string,
    duration: number,
    context: Record<string, any> = {}
  ) {
    if (!this.isOnline) return
    
    // Add performance metrics as breadcrumb since Sentry.metrics is not available
    Sentry.addBreadcrumb({
      message: `Performance: ${operation}`,
      category: 'performance',
      level: 'info',
      data: {
        duration,
        unit: 'millisecond',
        operation,
        ...context,
      },
      timestamp: Date.now() / 1000,
    })
  }
  
  // Set user context
  public setUserContext(user: {
    id?: string
    email?: string
    plan?: string
    registrationDate?: string
  }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      plan: user.plan,
      registrationDate: user.registrationDate,
    })
  }
  
  // Set trading session context
  public setTradingContext(context: {
    sessionId?: string
    activeStrategies?: string[]
    tradingMode?: 'live' | 'paper' | 'backtest'
    connectedBrokers?: string[]
  }) {
    Sentry.setContext('trading', sanitizeErrorData(context))
  }
  
  private sendError(error: Error, context: ErrorContext, severity: ErrorSeverity) {
    Sentry.withScope(scope => {
      scope.setLevel(severity as any)
      scope.setContext('trading', context)
      
      // Add tags for filtering
      scope.setTag('errorType', context.errorType)
      scope.setTag('severity', severity)
      
      if (context.strategy) scope.setTag('strategy', context.strategy)
      if (context.symbol) scope.setTag('symbol', context.symbol)
      if (context.action) scope.setTag('action', context.action)
      
      Sentry.captureException(error)
    })
  }
  
  private flushErrorQueue() {
    if (!this.isOnline || this.errorQueue.length === 0) return
    
    const errors = [...this.errorQueue]
    this.errorQueue = []
    
    errors.forEach(({ error, context, severity }) => {
      this.sendError(error, context, severity)
    })
  }
}

// Convenience functions
export const errorLogger = TradingErrorLogger.getInstance()

// Pre-configured error logging functions
export const logTradingError = (
  error: Error,
  type: TradingErrorType,
  context?: Partial<ErrorContext>
) => errorLogger.logError(error, type, ErrorSeverity.HIGH, context)

export const logValidationError = (
  error: Error,
  field: string,
  value: any,
  context?: Partial<ErrorContext>
) => errorLogger.logError(
  error,
  TradingErrorType.VALIDATION_ERROR,
  ErrorSeverity.MEDIUM,
  { ...context, field, value }
)

export const logConnectionError = (
  error: Error,
  endpoint: string,
  context?: Partial<ErrorContext>
) => errorLogger.logError(
  error,
  TradingErrorType.CONNECTION_ERROR,
  ErrorSeverity.HIGH,
  { ...context, endpoint }
)

export const logCalculationError = (
  error: Error,
  calculation: string,
  inputs: any,
  context?: Partial<ErrorContext>
) => errorLogger.logError(
  error,
  TradingErrorType.CALCULATION_ERROR,
  ErrorSeverity.CRITICAL,
  { ...context, calculation, inputs: sanitizeErrorData(inputs) }
)

// Performance monitoring
export class PerformanceMonitor {
  private static measurements = new Map<string, number>()
  
  static startMeasurement(operation: string): void {
    this.measurements.set(operation, performance.now())
  }
  
  static endMeasurement(operation: string, context?: Record<string, any>): number {
    const startTime = this.measurements.get(operation)
    if (!startTime) return 0
    
    const duration = performance.now() - startTime
    this.measurements.delete(operation)
    
    errorLogger.logPerformance(operation, duration, context)
    return duration
  }
  
  static measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startMeasurement(operation)
      
      try {
        const result = await fn()
        this.endMeasurement(operation, { ...context, success: true })
        resolve(result)
      } catch (error) {
        this.endMeasurement(operation, { ...context, success: false })
        reject(error)
      }
    })
  }
}

// React Error Boundary with Sentry integration
export const SentryErrorBoundary = Sentry.withErrorBoundary

// Global error handlers
export function setupGlobalErrorHandlers() {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    errorLogger.logError(
      new Error(event.reason),
      TradingErrorType.API_ERROR,
      ErrorSeverity.HIGH,
      { 
        type: 'unhandled_promise_rejection',
        reason: event.reason 
      }
    )
  })
  
  // Global errors
  window.addEventListener('error', event => {
    errorLogger.logError(
      event.error || new Error(event.message),
      TradingErrorType.API_ERROR,
      ErrorSeverity.HIGH,
      {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    )
  })
  
  // Network errors
  window.addEventListener('offline', () => {
    errorLogger.logEvent('network_offline', { timestamp: Date.now() }, ErrorSeverity.MEDIUM)
  })
  
  window.addEventListener('online', () => {
    errorLogger.logEvent('network_online', { timestamp: Date.now() }, ErrorSeverity.LOW)
  })
}