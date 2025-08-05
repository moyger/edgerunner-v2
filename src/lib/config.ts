/**
 * Application configuration management
 * Centralized configuration with environment variable validation and type safety
 */

// Environment validation schema
interface AppConfig {
  app: {
    name: string
    version: string
    environment: 'development' | 'staging' | 'production'
  }
  monitoring: {
    sentryDsn?: string
    sentryEnabled: boolean
  }
  api: {
    baseUrl: string
    timeout: number
    retryAttempts: number
  }
  websocket: {
    url: string
    reconnectInterval: number
    maxReconnectAttempts: number
  }
  features: {
    liveTrading: boolean
    paperTrading: boolean
    backtesting: boolean
    socialTrading: boolean
  }
  security: {
    cspReportUri: string
    sessionTimeout: number
  }
  trading: {
    defaultCurrency: string
    defaultTimezone: string
    maxConcurrentOrders: number
    maxPositionSize: number
  }
  development: {
    mockApi: boolean
    debugMode: boolean
    showDebugPanel: boolean
  }
}

// Validate and parse environment variables
function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getBoolEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = import.meta.env[key]
  if (value === undefined) return defaultValue
  return value === 'true' || value === '1'
}

function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = import.meta.env[key]
  if (value === undefined) return defaultValue
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${key}: ${value}`)
  }
  return parsed
}

// Build configuration object
export const config: AppConfig = {
  app: {
    name: getEnvVar('VITE_APP_NAME', 'Edgerunner v2'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    environment: getEnvVar('VITE_APP_ENVIRONMENT', 'development') as AppConfig['app']['environment'],
  },
  
  monitoring: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    sentryEnabled: getBoolEnvVar('VITE_SENTRY_ENABLED', false),
  },
  
  api: {
    baseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000/api'),
    timeout: getNumberEnvVar('VITE_API_TIMEOUT', 30000),
    retryAttempts: getNumberEnvVar('VITE_API_RETRY_ATTEMPTS', 3),
  },
  
  websocket: {
    url: getEnvVar('VITE_WS_URL', 'ws://localhost:8001'),
    reconnectInterval: getNumberEnvVar('VITE_WS_RECONNECT_INTERVAL', 5000),
    maxReconnectAttempts: getNumberEnvVar('VITE_WS_MAX_RECONNECT_ATTEMPTS', 10),
  },
  
  features: {
    liveTrading: getBoolEnvVar('VITE_FEATURE_LIVE_TRADING', false),
    paperTrading: getBoolEnvVar('VITE_FEATURE_PAPER_TRADING', true),
    backtesting: getBoolEnvVar('VITE_FEATURE_BACKTESTING', true),
    socialTrading: getBoolEnvVar('VITE_FEATURE_SOCIAL_TRADING', false),
  },
  
  security: {
    cspReportUri: getEnvVar('VITE_CSP_REPORT_URI', '/api/csp-report'),
    sessionTimeout: getNumberEnvVar('VITE_SESSION_TIMEOUT', 3600000), // 1 hour
  },
  
  trading: {
    defaultCurrency: getEnvVar('VITE_DEFAULT_CURRENCY', 'USD'),
    defaultTimezone: getEnvVar('VITE_DEFAULT_TIMEZONE', 'America/New_York'),
    maxConcurrentOrders: getNumberEnvVar('VITE_MAX_CONCURRENT_ORDERS', 50),
    maxPositionSize: parseFloat(getEnvVar('VITE_MAX_POSITION_SIZE', '0.1')),
  },
  
  development: {
    mockApi: getBoolEnvVar('VITE_MOCK_API', true),
    debugMode: getBoolEnvVar('VITE_DEBUG_MODE', true),
    showDebugPanel: getBoolEnvVar('VITE_SHOW_DEBUG_PANEL', false),
  },
}

// Configuration validation
export function validateConfig(): void {
  const errors: string[] = []
  
  // Validate environment
  if (!['development', 'staging', 'production'].includes(config.app.environment)) {
    errors.push(`Invalid environment: ${config.app.environment}`)
  }
  
  // Validate URLs
  try {
    new URL(config.api.baseUrl)
  } catch {
    errors.push(`Invalid API base URL: ${config.api.baseUrl}`)
  }
  
  try {
    new URL(config.websocket.url)
  } catch {
    errors.push(`Invalid WebSocket URL: ${config.websocket.url}`)
  }
  
  // Validate trading configuration
  if (config.trading.maxPositionSize <= 0 || config.trading.maxPositionSize > 1) {
    errors.push(`Invalid max position size: ${config.trading.maxPositionSize} (must be between 0 and 1)`)
  }
  
  if (config.trading.maxConcurrentOrders <= 0 || config.trading.maxConcurrentOrders > 1000) {
    errors.push(`Invalid max concurrent orders: ${config.trading.maxConcurrentOrders} (must be between 1 and 1000)`)
  }
  
  // Validate production requirements
  if (config.app.environment === 'production') {
    if (!config.monitoring.sentryDsn) {
      errors.push('Sentry DSN is required in production')
    }
    
    if (config.development.mockApi) {
      errors.push('Mock API must be disabled in production')
    }
    
    if (config.development.debugMode) {
      errors.push('Debug mode must be disabled in production')
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
  }
}

// Feature flag utilities
export const featureFlags = {
  isEnabled: (feature: keyof AppConfig['features']): boolean => {
    return config.features[feature]
  },
  
  requireFeature: (feature: keyof AppConfig['features']): void => {
    if (!config.features[feature]) {
      throw new Error(`Feature "${feature}" is not enabled`)
    }
  },
  
  // Trading feature guards
  canTradeLive: (): boolean => {
    return config.features.liveTrading && config.app.environment === 'production'
  },
  
  canTradePaper: (): boolean => {
    return config.features.paperTrading
  },
  
  canBacktest: (): boolean => {
    return config.features.backtesting
  },
}

// Environment utilities
export const isProduction = config.app.environment === 'production'
export const isDevelopment = config.app.environment === 'development'
export const isStaging = config.app.environment === 'staging'

// Debug utilities
export const debug = {
  log: (...args: any[]) => {
    if (config.development.debugMode) {
      console.log('[DEBUG]', ...args)
    }
  },
  
  warn: (...args: any[]) => {
    if (config.development.debugMode) {
      console.warn('[DEBUG WARN]', ...args)
    }
  },
  
  error: (...args: any[]) => {
    if (config.development.debugMode) {
      console.error('[DEBUG ERROR]', ...args)
    }
  },
  
  table: (data: any) => {
    if (config.development.debugMode) {
      console.table(data)
    }
  },
}

// Configuration export for debugging (with sensitive data removed)
export const getPublicConfig = () => {
  const publicConfig = { ...config }
  
  // Remove sensitive information
  if (publicConfig.monitoring.sentryDsn) {
    publicConfig.monitoring.sentryDsn = '[REDACTED]'
  }
  
  return publicConfig
}

// Initialize and validate configuration on module load
try {
  validateConfig()
  debug.log('Configuration loaded successfully:', getPublicConfig())
} catch (error) {
  console.error('Configuration validation failed:', error)
  if (isProduction) {
    throw error // Fail fast in production
  }
}