import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // Server Configuration
  port: z.number().default(3001),
  host: z.string().default('localhost'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  
  // IBKR Configuration
  ibkr: z.object({
    host: z.string().default('127.0.0.1'),
    port: z.number().default(7497),
    clientId: z.number().default(1),
    timeout: z.number().default(30000),
    paper: z.object({
      host: z.string().default('127.0.0.1'),
      port: z.number().default(7497),
      clientId: z.number().default(2)
    })
  }),
  
  // Security Configuration
  security: z.object({
    jwtSecret: z.string().min(32),
    encryptionKey: z.string().min(32),
    sessionTimeout: z.number().default(24 * 60 * 60 * 1000) // 24 hours
  }),
  
  // WebSocket Configuration
  websocket: z.object({
    port: z.number().default(3002),
    heartbeatInterval: z.number().default(30000),
    maxConnections: z.number().default(100),
    pingTimeout: z.number().default(60000),
    pingInterval: z.number().default(25000)
  }),
  
  // Rate Limiting
  rateLimit: z.object({
    windowMs: z.number().default(60000),
    maxRequests: z.number().default(100),
    skipSuccessfulRequests: z.boolean().default(false)
  }),
  
  // Logging Configuration
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    file: z.string().default('./logs/app.log'),
    maxSize: z.string().default('10m'),
    maxFiles: z.number().default(5),
    colorize: z.boolean().default(true)
  }),
  
  // CORS Configuration
  cors: z.object({
    origin: z.string().default('http://localhost:5173'),
    credentials: z.boolean().default(true),
    optionsSuccessStatus: z.number().default(200)
  }),
  
  // Cache Configuration
  cache: z.object({
    ttl: z.number().default(300), // 5 minutes
    maxKeys: z.number().default(1000),
    checkPeriod: z.number().default(600) // 10 minutes
  }),
  
  // Market Data Configuration
  marketData: z.object({
    maxSubscriptions: z.number().default(100),
    snapshotDelay: z.number().default(1000),
    batchSize: z.number().default(10),
    retryAttempts: z.number().default(3),
    retryDelay: z.number().default(1000)
  }),
  
  // Order Management
  orders: z.object({
    maxOrdersPerSecond: z.number().default(5),
    orderTimeout: z.number().default(30000),
    confirmationRequired: z.boolean().default(true),
    defaultTimeInForce: z.enum(['DAY', 'GTC', 'IOC', 'FOK']).default('DAY')
  })
});

type Config = z.infer<typeof configSchema>;

const parseConfig = (): Config => {
  const rawConfig = {
    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // IBKR
    ibkr: {
      host: process.env.IBKR_HOST || '127.0.0.1',
      port: parseInt(process.env.IBKR_PORT || '7497', 10),
      clientId: parseInt(process.env.IBKR_CLIENT_ID || '1', 10),
      timeout: parseInt(process.env.IBKR_TIMEOUT || '30000', 10),
      paper: {
        host: process.env.IBKR_PAPER_HOST || '127.0.0.1',
        port: parseInt(process.env.IBKR_PAPER_PORT || '7497', 10),
        clientId: parseInt(process.env.IBKR_PAPER_CLIENT_ID || '2', 10)
      }
    },
    
    // Security
    security: {
      jwtSecret: process.env.JWT_SECRET || 'development-jwt-secret-key-not-for-production',
      encryptionKey: process.env.ENCRYPTION_KEY || '32-character-encryption-key-dev-only',
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000', 10)
    },
    
    // WebSocket
    websocket: {
      port: parseInt(process.env.WS_PORT || '3002', 10),
      heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
      maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '100', 10),
      pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '60000', 10),
      pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000', 10)
    },
    
    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true'
    },
    
    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || './logs/app.log',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
      colorize: process.env.NODE_ENV !== 'production'
    },
    
    // CORS
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: process.env.CORS_CREDENTIALS !== 'false',
      optionsSuccessStatus: parseInt(process.env.CORS_OPTIONS_STATUS || '200', 10)
    },
    
    // Cache
    cache: {
      ttl: parseInt(process.env.CACHE_TTL || '300', 10),
      maxKeys: parseInt(process.env.CACHE_MAX_KEYS || '1000', 10),
      checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10)
    },
    
    // Market Data
    marketData: {
      maxSubscriptions: parseInt(process.env.MD_MAX_SUBSCRIPTIONS || '100', 10),
      snapshotDelay: parseInt(process.env.MD_SNAPSHOT_DELAY || '1000', 10),
      batchSize: parseInt(process.env.MD_BATCH_SIZE || '10', 10),
      retryAttempts: parseInt(process.env.MD_RETRY_ATTEMPTS || '3', 10),
      retryDelay: parseInt(process.env.MD_RETRY_DELAY || '1000', 10)
    },
    
    // Orders
    orders: {
      maxOrdersPerSecond: parseInt(process.env.ORDER_MAX_PER_SEC || '5', 10),
      orderTimeout: parseInt(process.env.ORDER_TIMEOUT || '30000', 10),
      confirmationRequired: process.env.ORDER_CONFIRMATION !== 'false',
      defaultTimeInForce: process.env.ORDER_DEFAULT_TIF || 'DAY'
    }
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw new Error('Invalid configuration');
  }
};

export const config = parseConfig();

export default config;