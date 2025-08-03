import winston from 'winston';
import config from '../config';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  const stackStr = stack ? `\n${stack}` : '';
  return `${timestamp} [${level}]: ${message}${stackStr}${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'edgerunner-ibkr-proxy' },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: parseInt(config.logging.maxSize) * 1024 * 1024, // Convert to bytes
      maxFiles: config.logging.maxFiles,
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
      )
    }),
    
    // Error file transport
    new winston.transports.File({
      filename: config.logging.file.replace('.log', '.error.log'),
      level: 'error',
      maxsize: parseInt(config.logging.maxSize) * 1024 * 1024,
      maxFiles: config.logging.maxFiles,
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
      )
    })
  ]
});

// Add console transport for development
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    )
  }));
}

// Create specific loggers for different components
export const ibkrLogger = logger.child({ component: 'ibkr' });
export const wsLogger = logger.child({ component: 'websocket' });
export const orderLogger = logger.child({ component: 'orders' });
export const marketDataLogger = logger.child({ component: 'market-data' });
export const authLogger = logger.child({ component: 'auth' });
export const apiLogger = logger.child({ component: 'api' });

// Export default logger
export default logger;

// Error handling for logger itself
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// Utility functions for structured logging
export const logIBKREvent = (event: string, data: any = {}) => {
  ibkrLogger.info('IBKR Event', { event, ...data });
};

export const logOrderEvent = (event: string, orderId: number, data: any = {}) => {
  orderLogger.info('Order Event', { event, orderId, ...data });
};

export const logMarketDataEvent = (event: string, symbol: string, data: any = {}) => {
  marketDataLogger.info('Market Data Event', { event, symbol, ...data });
};

export const logWSEvent = (event: string, clientId?: string, data: any = {}) => {
  wsLogger.info('WebSocket Event', { event, clientId, ...data });
};

export const logAuthEvent = (event: string, userId?: string, data: any = {}) => {
  authLogger.info('Auth Event', { event, userId, ...data });
};

export const logAPIRequest = (method: string, path: string, userId?: string, duration?: number) => {
  apiLogger.info('API Request', { method, path, userId, duration });
};

export const logError = (error: Error, context: any = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};