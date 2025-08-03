import WebSocket from 'ws';
import { Server as HTTPServer } from 'http';
import { EventEmitter } from 'events';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  IBKRMessage,
  IBKRMessageType,
  WebSocketMessage,
  MarketDataUpdate,
  Order,
  IBKRPosition,
  AccountSummary,
  IBKRError,
  ConnectionHealth,
  ExecutionReport
} from '../types/ibkr';
import { wsLogger, logWSEvent, logError } from '../utils/logger';
import config from '../config';

interface Client {
  id: string;
  ws: WebSocket;
  userId?: string;
  authenticated: boolean;
  subscriptions: Set<string>;
  lastPing: Date;
  connectionTime: Date;
}

interface AuthenticatedMessage {
  type: string;
  payload: any;
  token?: string;
}

export class WebSocketService extends EventEmitter {
  private wss: WebSocket.Server | null = null;
  private clients = new Map<string, Client>();
  private pingInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private messageQueue = new Map<string, IBKRMessage[]>();
  private maxQueueSize = 100;

  constructor() {
    super();
    this.setupCleanup();
  }

  // ===== SERVER MANAGEMENT =====

  initialize(server: HTTPServer): void {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.setupServerEventHandlers();
    this.startPingInterval();
    this.startCleanupInterval();

    logWSEvent('server_initialized', undefined, { port: config.websocket.port });
  }

  private setupServerEventHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', this.handleConnection.bind(this));
    
    this.wss.on('error', (error) => {
      logError(error, { context: 'WebSocketService.server' });
      this.emit('serverError', error);
    });

    this.wss.on('close', () => {
      logWSEvent('server_closed');
      this.cleanup();
    });
  }

  private verifyClient(info: any): boolean {
    // Basic verification - in production, add more sophisticated checks
    const origin = info.origin;
    const allowedOrigins = [config.cors.origin, 'http://localhost:5173'];
    
    if (!allowedOrigins.includes(origin)) {
      logWSEvent('connection_rejected', undefined, { origin, reason: 'invalid_origin' });
      return false;
    }

    if (this.clients.size >= config.websocket.maxConnections) {
      logWSEvent('connection_rejected', undefined, { reason: 'max_connections_reached' });
      return false;
    }

    return true;
  }

  // ===== CONNECTION MANAGEMENT =====

  private handleConnection(ws: WebSocket, request: any): void {
    const clientId = uuidv4();
    const client: Client = {
      id: clientId,
      ws,
      authenticated: false,
      subscriptions: new Set(),
      lastPing: new Date(),
      connectionTime: new Date()
    };

    this.clients.set(clientId, client);
    
    logWSEvent('client_connected', clientId, { 
      userAgent: request.headers['user-agent'],
      ip: request.connection.remoteAddress 
    });

    this.setupClientEventHandlers(client);
    this.sendMessage(client, {
      type: 'connection_established',
      payload: { clientId },
      timestamp: new Date().toISOString()
    });

    this.emit('clientConnected', clientId);
  }

  private setupClientEventHandlers(client: Client): void {
    client.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as AuthenticatedMessage;
        this.handleClientMessage(client, message);
      } catch (error) {
        logError(error as Error, { context: 'WebSocketService.parseMessage', clientId: client.id });
        this.sendError(client, 'invalid_message_format', 'Message must be valid JSON');
      }
    });

    client.ws.on('pong', () => {
      client.lastPing = new Date();
    });

    client.ws.on('close', (code, reason) => {
      this.handleClientDisconnect(client, code, reason.toString());
    });

    client.ws.on('error', (error) => {
      logError(error, { context: 'WebSocketService.client', clientId: client.id });
      this.handleClientDisconnect(client, 1011, 'Connection error');
    });
  }

  private handleClientDisconnect(client: Client, code: number, reason: string): void {
    logWSEvent('client_disconnected', client.id, { code, reason, userId: client.userId });
    
    this.clients.delete(client.id);
    this.messageQueue.delete(client.id);
    
    this.emit('clientDisconnected', client.id, client.userId);
  }

  // ===== MESSAGE HANDLING =====

  private async handleClientMessage(client: Client, message: AuthenticatedMessage): Promise<void> {
    try {
      // Handle authentication first
      if (message.type === 'authenticate') {
        await this.handleAuthentication(client, message);
        return;
      }

      // Require authentication for all other messages
      if (!client.authenticated) {
        this.sendError(client, 'authentication_required', 'Must authenticate before sending messages');
        return;
      }

      switch (message.type) {
        case 'ping':
          this.handlePing(client);
          break;
        
        case 'subscribe_market_data':
          await this.handleMarketDataSubscription(client, message.payload);
          break;
        
        case 'unsubscribe_market_data':
          await this.handleMarketDataUnsubscription(client, message.payload);
          break;
        
        case 'place_order':
          await this.handleOrderPlacement(client, message.payload);
          break;
        
        case 'cancel_order':
          await this.handleOrderCancellation(client, message.payload);
          break;
        
        case 'get_positions':
          await this.handlePositionsRequest(client);
          break;
        
        case 'get_account_summary':
          await this.handleAccountSummaryRequest(client);
          break;

        case 'get_connection_health':
          await this.handleConnectionHealthRequest(client);
          break;
        
        default:
          this.sendError(client, 'unknown_message_type', `Unknown message type: ${message.type}`);
      }

    } catch (error) {
      logError(error as Error, { context: 'handleClientMessage', clientId: client.id, messageType: message.type });
      this.sendError(client, 'message_processing_error', 'Failed to process message');
    }
  }

  private async handleAuthentication(client: Client, message: AuthenticatedMessage): Promise<void> {
    try {
      const { token } = message.payload;
      
      if (!token) {
        this.sendError(client, 'missing_token', 'Authentication token is required');
        return;
      }

      const decoded = jwt.verify(token, config.security.jwtSecret) as any;
      client.userId = decoded.userId;
      client.authenticated = true;

      logWSEvent('client_authenticated', client.id, { userId: client.userId });
      
      this.sendMessage(client, {
        type: 'authentication_success',
        payload: { userId: client.userId },
        timestamp: new Date().toISOString()
      });

      // Send any queued messages
      await this.sendQueuedMessages(client);

    } catch (error) {
      logError(error as Error, { context: 'authentication', clientId: client.id });
      this.sendError(client, 'authentication_failed', 'Invalid or expired token');
      client.ws.close(1008, 'Authentication failed');
    }
  }

  private handlePing(client: Client): void {
    client.lastPing = new Date();
    this.sendMessage(client, {
      type: 'pong',
      payload: { timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString()
    });
  }

  private async handleMarketDataSubscription(client: Client, payload: any): Promise<void> {
    const { symbols, subscriptionId } = payload;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      this.sendError(client, 'invalid_symbols', 'Symbols must be a non-empty array');
      return;
    }

    client.subscriptions.add(subscriptionId);
    
    logWSEvent('market_data_subscription', client.id, { symbols, subscriptionId });
    
    this.sendMessage(client, {
      type: 'subscription_confirmed',
      payload: { subscriptionId, symbols },
      timestamp: new Date().toISOString()
    });

    // Forward to IBKR service
    this.emit('subscribeMarketData', symbols, subscriptionId, client.id);
  }

  private async handleMarketDataUnsubscription(client: Client, payload: any): Promise<void> {
    const { subscriptionId } = payload;
    
    client.subscriptions.delete(subscriptionId);
    
    logWSEvent('market_data_unsubscription', client.id, { subscriptionId });
    
    this.sendMessage(client, {
      type: 'unsubscription_confirmed',
      payload: { subscriptionId },
      timestamp: new Date().toISOString()
    });

    // Forward to IBKR service
    this.emit('unsubscribeMarketData', subscriptionId, client.id);
  }

  private async handleOrderPlacement(client: Client, payload: any): Promise<void> {
    logWSEvent('order_placement_request', client.id, { symbol: payload.symbol, action: payload.action });
    
    // Forward to IBKR service
    this.emit('placeOrder', payload, client.id);
  }

  private async handleOrderCancellation(client: Client, payload: any): Promise<void> {
    const { orderId } = payload;
    
    logWSEvent('order_cancellation_request', client.id, { orderId });
    
    // Forward to IBKR service
    this.emit('cancelOrder', orderId, client.id);
  }

  private async handlePositionsRequest(client: Client): Promise<void> {
    logWSEvent('positions_request', client.id);
    
    // Forward to IBKR service
    this.emit('getPositions', client.id);
  }

  private async handleAccountSummaryRequest(client: Client): Promise<void> {
    logWSEvent('account_summary_request', client.id);
    
    // Forward to IBKR service
    this.emit('getAccountSummary', client.id);
  }

  private async handleConnectionHealthRequest(client: Client): Promise<void> {
    logWSEvent('connection_health_request', client.id);
    
    // Forward to IBKR service
    this.emit('getConnectionHealth', client.id);
  }

  // ===== BROADCASTING =====

  broadcast(message: IBKRMessage, excludeClientId?: string): void {
    const wsMessage: WebSocketMessage = {
      id: uuidv4(),
      type: message.type,
      payload: message.payload,
      timestamp: message.timestamp
    };

    this.clients.forEach((client, clientId) => {
      if (clientId === excludeClientId) return;
      
      if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client, wsMessage);
      } else if (client.authenticated) {
        // Queue message for later delivery
        this.queueMessage(client, message);
      }
    });
  }

  broadcastToUser(userId: string, message: IBKRMessage): void {
    const wsMessage: WebSocketMessage = {
      id: uuidv4(),
      type: message.type,
      payload: message.payload,
      timestamp: message.timestamp
    };

    this.clients.forEach((client) => {
      if (client.userId === userId && client.authenticated && client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client, wsMessage);
      } else if (client.userId === userId && client.authenticated) {
        // Queue message for later delivery
        this.queueMessage(client, message);
      }
    });
  }

  // ===== IBKR EVENT HANDLERS =====

  handleMarketDataUpdate(data: MarketDataUpdate): void {
    const message: IBKRMessage = {
      id: uuidv4(),
      type: IBKRMessageType.MARKET_DATA,
      timestamp: new Date().toISOString(),
      payload: data
    };

    this.broadcast(message);
  }

  handleOrderUpdate(order: Order): void {
    const message: IBKRMessage = {
      id: uuidv4(),
      type: IBKRMessageType.ORDER_STATUS,
      timestamp: new Date().toISOString(),
      payload: order
    };

    this.broadcast(message);
  }

  handlePositionUpdate(position: IBKRPosition): void {
    const message: IBKRMessage = {
      id: uuidv4(),
      type: IBKRMessageType.POSITION_UPDATE,
      timestamp: new Date().toISOString(),
      payload: position
    };

    this.broadcast(message);
  }

  handleAccountUpdate(accountSummary: AccountSummary): void {
    const message: IBKRMessage = {
      id: uuidv4(),
      type: IBKRMessageType.ACCOUNT_UPDATE,
      timestamp: new Date().toISOString(),
      payload: accountSummary
    };

    this.broadcast(message);
  }

  handleExecutionReport(execution: ExecutionReport): void {
    const message: IBKRMessage = {
      id: uuidv4(),
      type: IBKRMessageType.EXECUTION_REPORT,
      timestamp: new Date().toISOString(),
      payload: execution
    };

    this.broadcast(message);
  }

  handleConnectionStatusChange(status: string): void {
    const message: IBKRMessage = {
      id: uuidv4(),
      type: IBKRMessageType.CONNECTION_STATUS,
      timestamp: new Date().toISOString(),
      payload: { status }
    };

    this.broadcast(message);
  }

  handleIBKRError(error: IBKRError): void {
    const message: IBKRMessage = {
      id: uuidv4(),
      type: IBKRMessageType.ERROR,
      timestamp: new Date().toISOString(),
      payload: error
    };

    this.broadcast(message);
  }

  // ===== RESPONSE HANDLERS =====

  sendPositionsResponse(clientId: string, positions: IBKRPosition[]): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.sendMessage(client, {
      type: 'positions_response',
      payload: { positions },
      timestamp: new Date().toISOString()
    });
  }

  sendAccountSummaryResponse(clientId: string, accountSummary: AccountSummary): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.sendMessage(client, {
      type: 'account_summary_response',
      payload: { accountSummary },
      timestamp: new Date().toISOString()
    });
  }

  sendConnectionHealthResponse(clientId: string, health: ConnectionHealth): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.sendMessage(client, {
      type: 'connection_health_response',
      payload: { health },
      timestamp: new Date().toISOString()
    });
  }

  sendOrderResponse(clientId: string, response: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.sendMessage(client, {
      type: 'order_response',
      payload: response,
      timestamp: new Date().toISOString()
    });
  }

  // ===== UTILITY METHODS =====

  private sendMessage(client: Client, message: any): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        logError(error as Error, { context: 'sendMessage', clientId: client.id });
      }
    }
  }

  private sendError(client: Client, code: string, message: string): void {
    this.sendMessage(client, {
      type: 'error',
      payload: { code, message },
      timestamp: new Date().toISOString()
    });
  }

  private queueMessage(client: Client, message: IBKRMessage): void {
    if (!this.messageQueue.has(client.id)) {
      this.messageQueue.set(client.id, []);
    }

    const queue = this.messageQueue.get(client.id)!;
    
    if (queue.length >= this.maxQueueSize) {
      queue.shift(); // Remove oldest message
    }
    
    queue.push(message);
  }

  private async sendQueuedMessages(client: Client): Promise<void> {
    const queue = this.messageQueue.get(client.id);
    if (!queue || queue.length === 0) return;

    for (const message of queue) {
      const wsMessage: WebSocketMessage = {
        id: uuidv4(),
        type: message.type,
        payload: message.payload,
        timestamp: message.timestamp
      };
      
      this.sendMessage(client, wsMessage);
    }

    this.messageQueue.delete(client.id);
  }

  // ===== HEALTH MONITORING =====

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      });
    }, config.websocket.pingInterval);
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      const timeout = config.websocket.pingTimeout;

      this.clients.forEach((client, clientId) => {
        const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
        
        if (timeSinceLastPing > timeout) {
          logWSEvent('client_timeout', clientId, { timeSinceLastPing });
          client.ws.close(1001, 'Ping timeout');
        }
      });
    }, 30000); // Check every 30 seconds
  }

  private setupCleanup(): void {
    const cleanup = () => {
      this.shutdown();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }

  // ===== LIFECYCLE =====

  shutdown(): void {
    logWSEvent('server_shutdown');

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.ws.close(1001, 'Server shutdown');
    });

    // Close server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.cleanup();
  }

  private cleanup(): void {
    this.clients.clear();
    this.messageQueue.clear();
  }

  // ===== PUBLIC GETTERS =====

  getConnectedClientCount(): number {
    return this.clients.size;
  }

  getAuthenticatedClientCount(): number {
    return Array.from(this.clients.values()).filter(client => client.authenticated).length;
  }

  getClientInfo(clientId: string): any {
    const client = this.clients.get(clientId);
    if (!client) return null;

    return {
      id: client.id,
      userId: client.userId,
      authenticated: client.authenticated,
      connectionTime: client.connectionTime,
      lastPing: client.lastPing,
      subscriptions: Array.from(client.subscriptions)
    };
  }

  getAllClientsInfo(): any[] {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      userId: client.userId,
      authenticated: client.authenticated,
      connectionTime: client.connectionTime,
      lastPing: client.lastPing,
      subscriptions: Array.from(client.subscriptions)
    }));
  }
}