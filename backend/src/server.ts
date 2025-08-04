import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { RealPnLIBKRService } from './services/RealPnLIBKRService';
import { WebSocketService } from './services/WebSocketService';
import { IBKRCredentialsSchema, OrderRequestSchema, MarketDataSubscriptionSchema } from './types/ibkr';
import logger, { apiLogger, logAPIRequest, logError } from './utils/logger';
import config from './config';
import './types/express'; // Extend Express request types
import { AuthService, User } from './services/AuthService';
import { ErrorHandler } from './utils/ErrorHandler';
import { CircuitBreakerManager } from './utils/CircuitBreaker';
import { RetryMechanism } from './utils/RetryMechanism';

class EdgerunnerIBKRProxy {
  private app: express.Application;
  private server: http.Server;
  private ibkrService: RealPnLIBKRService;
  private wsService: WebSocketService;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.ibkrService = new RealPnLIBKRService();
    this.wsService = new WebSocketService();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupIBKREventHandlers();
    this.setupWebSocketEventHandlers();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      optionsSuccessStatus: config.cors.optionsSuccessStatus
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP',
      skip: (req) => {
        // Skip rate limiting for authenticated requests if configured
        return config.rateLimit.skipSuccessfulRequests && !!req.headers.authorization;
      }
    });

    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logAPIRequest(req.method, req.path, req.headers['user-id'] as string, duration);
      });
      
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        ibkr: {
          connected: this.ibkrService.isConnected(),
          connectionStatus: this.ibkrService.getConnectionStatus(),
          marketDataStatus: this.ibkrService.getMarketDataStatus()
        },
        websocket: {
          connectedClients: this.wsService.getConnectedClientCount(),
          authenticatedClients: this.wsService.getAuthenticatedClientCount()
        }
      };

      res.json(health);
    });

    // Authentication Routes
    this.app.post('/api/auth/login', async (req, res) => {
      try {
        const correlationId = ErrorHandler.generateCorrelationId();
        req.correlationId = correlationId;

        const { email, password } = req.body;
        
        if (!email || !password) {
          const error = ErrorHandler.badRequest('Email and password are required');
          return ErrorHandler.sendError(res, error);
        }

        const authResult = await AuthService.login(email, password);
        
        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', authResult.refreshToken, {
          httpOnly: true,
          secure: config.nodeEnv === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        ErrorHandler.sendSuccess(res, {
          user: authResult.user,
          accessToken: authResult.accessToken,
          expiresIn: authResult.expiresIn
        }, 200, correlationId);

      } catch (error) {
        const structuredError = ErrorHandler.handleError(error, req);
        ErrorHandler.sendError(res, structuredError);
      }
    });

    this.app.post('/api/auth/refresh', async (req, res) => {
      try {
        const correlationId = ErrorHandler.generateCorrelationId();
        req.correlationId = correlationId;

        const refreshToken = req.cookies?.refreshToken;
        
        if (!refreshToken) {
          const error = ErrorHandler.unauthorized('Refresh token required');
          return ErrorHandler.sendError(res, error);
        }

        const result = await AuthService.refreshAccessToken(refreshToken);
        
        ErrorHandler.sendSuccess(res, result, 200, correlationId);

      } catch (error) {
        const structuredError = ErrorHandler.handleError(error, req);
        ErrorHandler.sendError(res, structuredError);
      }
    });

    this.app.post('/api/auth/logout', async (req, res) => {
      try {
        const correlationId = ErrorHandler.generateCorrelationId();
        req.correlationId = correlationId;

        const refreshToken = req.cookies?.refreshToken;
        
        if (refreshToken) {
          await AuthService.logout(refreshToken);
        }

        res.clearCookie('refreshToken');
        ErrorHandler.sendSuccess(res, { message: 'Logged out successfully' }, 200, correlationId);

      } catch (error) {
        const structuredError = ErrorHandler.handleError(error, req);
        ErrorHandler.sendError(res, structuredError);
      }
    });

    this.app.get('/api/auth/me', this.authenticateToken, async (req, res) => {
      try {
        const correlationId = ErrorHandler.generateCorrelationId();
        req.correlationId = correlationId;

        const user = await AuthService.getUserById(req.user!.id);
        
        if (!user) {
          const error = ErrorHandler.notFound('User');
          return ErrorHandler.sendError(res, error);
        }

        ErrorHandler.sendSuccess(res, user, 200, correlationId);

      } catch (error) {
        const structuredError = ErrorHandler.handleError(error, req);
        ErrorHandler.sendError(res, structuredError);
      }
    });

    // IBKR connection management
    this.app.post('/api/ibkr/connect', async (req, res) => {
      try {
        const credentials = IBKRCredentialsSchema.parse(req.body);
        await this.ibkrService.connect(credentials);
        
        res.json({
          success: true,
          message: 'Connected to IBKR',
          connectionStatus: this.ibkrService.getConnectionStatus()
        });

      } catch (error) {
        logError(error as Error, { context: 'ibkr/connect' });
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : 'Connection failed'
        });
      }
    });

    this.app.post('/api/ibkr/disconnect', this.authenticateToken, async (req, res) => {
      try {
        await this.ibkrService.disconnect();
        
        res.json({
          success: true,
          message: 'Disconnected from IBKR'
        });

      } catch (error) {
        logError(error as Error, { context: 'ibkr/disconnect' });
        res.status(500).json({
          success: false,
          message: 'Disconnection failed'
        });
      }
    });

    // Market data management
    this.app.post('/api/market-data/subscribe', this.authenticateToken, async (req, res) => {
      try {
        const { symbols, fields } = MarketDataSubscriptionSchema.parse(req.body);
        const subscriptionId = await this.ibkrService.subscribeToMarketData(symbols);
        
        res.json({
          success: true,
          subscriptionId,
          symbols
        });

      } catch (error) {
        logError(error as Error, { context: 'market-data/subscribe' });
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : 'Subscription failed'
        });
      }
    });

    this.app.delete('/api/market-data/subscribe/:id', this.authenticateToken, async (req, res) => {
      try {
        const subscriptionId = req.params.id;
        await this.ibkrService.unsubscribeFromMarketData(subscriptionId);
        
        res.json({
          success: true,
          message: 'Unsubscribed from market data'
        });

      } catch (error) {
        logError(error as Error, { context: 'market-data/unsubscribe' });
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : 'Unsubscription failed'
        });
      }
    });

    // Order management
    this.app.post('/api/orders', this.authenticateToken, async (req, res) => {
      try {
        const orderRequest = OrderRequestSchema.parse(req.body);
        const orderResponse = await this.ibkrService.placeOrder(orderRequest);
        
        res.json({
          success: true,
          order: orderResponse
        });

      } catch (error) {
        logError(error as Error, { context: 'orders/place' });
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : 'Order placement failed'
        });
      }
    });

    this.app.delete('/api/orders/:id', this.authenticateToken, async (req, res) => {
      try {
        const orderId = parseInt(req.params.id);
        await this.ibkrService.cancelOrder(orderId);
        
        res.json({
          success: true,
          message: 'Order cancellation requested'
        });

      } catch (error) {
        logError(error as Error, { context: 'orders/cancel' });
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : 'Order cancellation failed'
        });
      }
    });

    this.app.get('/api/orders', this.authenticateToken, (req, res) => {
      try {
        const orders = this.ibkrService.getOrders();
        res.json({
          success: true,
          orders
        });

      } catch (error) {
        logError(error as Error, { context: 'orders/get' });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve orders'
        });
      }
    });

    // Portfolio data
    this.app.get('/api/positions', (req, res) => {
      try {
        const positions = this.ibkrService.getPositionsForAPI();
        res.json({
          success: true,
          positions
        });

      } catch (error) {
        logError(error as Error, { context: 'positions/get' });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve positions'
        });
      }
    });

    // Real P&L positions endpoint
    this.app.get('/api/positions/real-pnl', this.authenticateToken, (req, res) => {
      try {
        const positions = this.ibkrService.getPositionsWithRealPnL();
        res.json({
          success: true,
          positions,
          hasRealPnLData: this.ibkrService.hasPortfolioPnLData(),
          totalPositions: positions.length,
          positionsWithPnL: positions.filter(p => p.hasRealPnL).length
        });

      } catch (error) {
        logError(error as Error, { context: 'positions/real-pnl/get' });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve real P&L positions'
        });
      }
    });

    // P&L diagnostics endpoint
    this.app.get('/api/pnl/diagnostics', this.authenticateToken, (req, res) => {
      try {
        const diagnostics = {
          receivedEvents: this.ibkrService.getReceivedEvents(),
          portfolioUpdates: Array.from(this.ibkrService.getPortfolioUpdates().entries()),
          accountPnL: Array.from(this.ibkrService.getAllAccountPnL().entries()),
          hasPortfolioPnL: this.ibkrService.hasPortfolioPnLData(),
          connectionHealth: this.ibkrService.getConnectionHealth(),
          timestamp: new Date().toISOString()
        };

        res.json({
          success: true,
          diagnostics
        });

      } catch (error) {
        logError(error as Error, { context: 'pnl/diagnostics/get' });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve P&L diagnostics'
        });
      }
    });

    this.app.get('/api/account', (req, res) => {
      try {
        const accountSummary = this.ibkrService.getAccountSummaryForAPI();
        res.json({
          success: true,
          account: accountSummary
        });

      } catch (error) {
        logError(error as Error, { context: 'account/get' });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve account summary'
        });
      }
    });

    // Connection health (no auth for dev data viewing)
    this.app.get('/api/connection-health', (req, res) => {
      try {
        const health = this.ibkrService.getConnectionHealth();
        res.json({
          success: true,
          health
        });

      } catch (error) {
        logError(error as Error, { context: 'connection-health/get' });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve connection health'
        });
      }
    });

    // Portfolio performance endpoint (for dashboard)
    this.app.get('/api/portfolio/performance', (req, res) => {
      try {
        const positions = this.ibkrService.getPositions();
        const accountSummary = this.ibkrService.getAccountSummary();
        
        // Calculate portfolio performance metrics
        const totalMarketValue = positions.reduce((sum, pos) => sum + (pos.marketValue || 0), 0);
        const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0);
        const totalRealizedPnL = positions.reduce((sum, pos) => sum + (pos.realizedPnL || 0), 0);
        
        const performance = {
          totalValue: accountSummary.totalEquity || totalMarketValue,
          dayPnL: accountSummary.dayPnL || 0,
          totalPnL: totalUnrealizedPnL + totalRealizedPnL,
          unrealizedPnL: totalUnrealizedPnL,
          realizedPnL: totalRealizedPnL,
          cash: accountSummary.totalCashValue || 0,
          positionCount: positions.length,
          lastUpdate: new Date().toISOString()
        };

        res.json({
          success: true,
          performance
        });

      } catch (error) {
        logError(error as Error, { context: 'portfolio/performance' });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve portfolio performance'
        });
      }
    });

    // Market data endpoint (for dashboard)
    this.app.get('/api/market-data', this.authenticateToken, (req, res) => {
      try {
        const positions = this.ibkrService.getPositions();
        
        // Create market data from positions
        const marketData = positions.map(pos => ({
          symbol: pos.symbol,
          lastPrice: pos.marketPrice || (pos.marketValue / pos.quantity) || 0,
          change: pos.unrealizedPnL || 0,
          changePercent: pos.avgCost > 0 ? ((pos.unrealizedPnL || 0) / (pos.avgCost * pos.quantity)) * 100 : 0,
          volume: 0, // Not available from IBKR position data
          marketValue: pos.marketValue || 0,
          timestamp: new Date().toISOString()
        }));

        res.json({
          success: true,
          marketData,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        logError(error as Error, { context: 'market-data/get' });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve market data'
        });
      }
    });

    // WebSocket client information (for debugging)
    this.app.get('/api/websocket/clients', this.authenticateToken, (req, res) => {
      try {
        const clients = this.wsService.getAllClientsInfo();
        res.json({
          success: true,
          clients,
          summary: {
            total: this.wsService.getConnectedClientCount(),
            authenticated: this.wsService.getAuthenticatedClientCount()
          }
        });

      } catch (error) {
        logError(error as Error, { context: 'websocket/clients' });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve client information'
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    });
  }

  private async authenticateToken(req: express.Request & { user?: any }, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        const error = ErrorHandler.unauthorized('Access token required');
        ErrorHandler.sendError(res, error);
        return;
      }

      // Verify token using AuthService
      const tokenPayload = await AuthService.verifyAccessToken(token);
      
      // Get full user details
      const user = await AuthService.getUserById(tokenPayload.userId);
      if (!user) {
        const error = ErrorHandler.unauthorized('User not found');
        ErrorHandler.sendError(res, error);
        return;
      }

      // Attach user to request
      req.user = user;
      next();
      
    } catch (error) {
      const structuredError = ErrorHandler.handleError(error, req);
      ErrorHandler.sendError(res, structuredError);
    }
  }

  private setupIBKREventHandlers(): void {
    // Connection events
    this.ibkrService.on('connected', () => {
      logger.info('IBKR connected successfully');
      this.wsService.handleConnectionStatusChange('connected');
    });

    this.ibkrService.on('disconnected', () => {
      logger.warn('IBKR disconnected');
      this.wsService.handleConnectionStatusChange('disconnected');
    });

    this.ibkrService.on('connectionStatusChanged', (status) => {
      logger.info(`IBKR connection status changed: ${status}`);
      this.wsService.handleConnectionStatusChange(status);
    });

    this.ibkrService.on('error', (error) => {
      logger.error('IBKR error:', error);
      this.wsService.handleIBKRError(error);
    });

    // Market data events
    this.ibkrService.on('marketDataUpdate', (data) => {
      this.wsService.handleMarketDataUpdate(data);
    });

    // Order events
    this.ibkrService.on('orderUpdate', (order) => {
      this.wsService.handleOrderUpdate(order);
    });

    this.ibkrService.on('orderFilled', (order) => {
      logger.info(`Order filled: ${order.orderId}`);
      this.wsService.handleOrderUpdate(order);
    });

    this.ibkrService.on('executionReport', (execution) => {
      this.wsService.handleExecutionReport(execution);
    });

    // Portfolio events
    this.ibkrService.on('positionUpdate', (position) => {
      this.wsService.handlePositionUpdate(position);
    });

    this.ibkrService.on('accountUpdate', (accountSummary) => {
      this.wsService.handleAccountUpdate(accountSummary);
    });

    // Real P&L specific events
    this.ibkrService.on('positionPnLUpdate', (position) => {
      logger.info(`Real P&L update for ${position.symbol}: $${position.unrealizedPnL}`);
      this.wsService.handlePositionUpdate(position);
    });
  }

  private setupWebSocketEventHandlers(): void {
    // Client events
    this.wsService.on('clientConnected', (clientId) => {
      logger.info(`WebSocket client connected: ${clientId}`);
    });

    this.wsService.on('clientDisconnected', (clientId, userId) => {
      logger.info(`WebSocket client disconnected: ${clientId} (user: ${userId})`);
    });

    // IBKR service requests from WebSocket clients
    this.wsService.on('subscribeMarketData', async (symbols, subscriptionId, clientId) => {
      try {
        await this.ibkrService.subscribeToMarketData(symbols);
        logger.info(`Market data subscription created for client ${clientId}: ${symbols.join(', ')}`);
      } catch (error) {
        logError(error as Error, { context: 'ws.subscribeMarketData', clientId });
      }
    });

    this.wsService.on('unsubscribeMarketData', async (subscriptionId, clientId) => {
      try {
        await this.ibkrService.unsubscribeFromMarketData(subscriptionId);
        logger.info(`Market data subscription cancelled for client ${clientId}: ${subscriptionId}`);
      } catch (error) {
        logError(error as Error, { context: 'ws.unsubscribeMarketData', clientId });
      }
    });

    this.wsService.on('placeOrder', async (orderRequest, clientId) => {
      try {
        const response = await this.ibkrService.placeOrder(orderRequest);
        this.wsService.sendOrderResponse(clientId, response);
        logger.info(`Order placed for client ${clientId}: ${response.orderId}`);
      } catch (error) {
        logError(error as Error, { context: 'ws.placeOrder', clientId });
        this.wsService.sendOrderResponse(clientId, { 
          success: false, 
          message: error instanceof Error ? error.message : 'Order placement failed' 
        });
      }
    });

    this.wsService.on('cancelOrder', async (orderId, clientId) => {
      try {
        await this.ibkrService.cancelOrder(orderId);
        logger.info(`Order cancellation requested for client ${clientId}: ${orderId}`);
      } catch (error) {
        logError(error as Error, { context: 'ws.cancelOrder', clientId });
      }
    });

    this.wsService.on('getPositions', (clientId) => {
      try {
        const positions = this.ibkrService.getPositionsForAPI();
        this.wsService.sendPositionsResponse(clientId, positions);
      } catch (error) {
        logError(error as Error, { context: 'ws.getPositions', clientId });
      }
    });

    this.wsService.on('getAccountSummary', (clientId) => {
      try {
        const accountSummary = this.ibkrService.getAccountSummaryForAPI();
        if (accountSummary) {
          this.wsService.sendAccountSummaryResponse(clientId, accountSummary);
        }
      } catch (error) {
        logError(error as Error, { context: 'ws.getAccountSummary', clientId });
      }
    });

    this.wsService.on('getConnectionHealth', (clientId) => {
      try {
        const health = this.ibkrService.getConnectionHealth();
        this.wsService.sendConnectionHealthResponse(clientId, health);
      } catch (error) {
        logError(error as Error, { context: 'ws.getConnectionHealth', clientId });
      }
    });
  }

  private setupErrorHandling(): void {
    // Express error handler - use structured error handling
    this.app.use(ErrorHandler.middleware());

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });

    // Graceful shutdown signals
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, starting graceful shutdown');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, starting graceful shutdown');
      this.gracefulShutdown();
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize Authentication Service
      await AuthService.initialize();
      AuthService.startTokenCleanup();
      logger.info('Authentication service initialized');

      // Initialize WebSocket service
      this.wsService.initialize(this.server);

      // Start HTTP server
      this.server.listen(config.port, config.host, () => {
        logger.info(`🚀 Edgerunner IBKR Proxy Server started`);
        logger.info(`📡 HTTP Server: http://${config.host}:${config.port}`);
        logger.info(`🔌 WebSocket Server: ws://${config.host}:${config.port}/ws`);
        logger.info(`🌍 Environment: ${config.nodeEnv}`);
        logger.info(`📊 CORS Origin: ${config.cors.origin}`);
        logger.info(`🔐 Default admin: admin@edgerunner.com / admin123`);
      });

    } catch (error) {
      logError(error as Error, { context: 'server.start' });
      throw error;
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Starting graceful shutdown...');

    try {
      // Stop accepting new connections
      this.server.close(() => {
        logger.info('HTTP server closed');
      });

      // Disconnect from IBKR
      if (this.ibkrService.isConnected()) {
        await this.ibkrService.disconnect();
        logger.info('IBKR service disconnected');
      }

      // Shutdown WebSocket service
      this.wsService.shutdown();
      logger.info('WebSocket service shutdown');

      logger.info('Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      logError(error as Error, { context: 'gracefulShutdown' });
      process.exit(1);
    }
  }
}

// Start the server
const server = new EdgerunnerIBKRProxy();

server.start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});