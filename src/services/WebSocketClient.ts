import ReconnectingWebSocket from 'reconnecting-websocket';
import { 
  IBKRMessage, 
  IBKRMessageType, 
  WebSocketMessage,
  MarketDataUpdate,
  IBKROrder,
  IBKRPosition,
  AccountSummary,
  IBKRError,
  ConnectionHealth,
  ExecutionReport,
  OrderRequest,
  MarketDataField
} from '../types/ibkr';

export interface WebSocketClientConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  timeout?: number;
  debug?: boolean;
}

export interface WebSocketEventHandlers {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  onMarketDataUpdate?: (data: MarketDataUpdate) => void;
  onOrderUpdate?: (order: IBKROrder) => void;
  onPositionUpdate?: (position: IBKRPosition) => void;
  onAccountUpdate?: (account: AccountSummary) => void;
  onExecutionReport?: (execution: ExecutionReport) => void;
  onConnectionStatusChange?: (status: string) => void;
  onIBKRError?: (error: IBKRError) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export class WebSocketClient {
  private ws: ReconnectingWebSocket | null = null;
  private config: WebSocketClientConfig;
  private handlers: WebSocketEventHandlers;
  private messageQueue: WebSocketMessage[] = [];
  private isAuthenticated = false;
  private authToken: string | null = null;
  private reconnectAttempts = 0;
  private lastConnectionTime: Date | null = null;
  private messageId = 1;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(config: WebSocketClientConfig, handlers: WebSocketEventHandlers = {}) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      timeout: 30000,
      debug: false,
      ...config
    };
    this.handlers = handlers;
  }

  // ===== CONNECTION MANAGEMENT =====

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.authToken = token;
        
        // Configure ReconnectingWebSocket
        this.ws = new ReconnectingWebSocket(this.config.url, [], {
          reconnectionDelayGrowFactor: 1.3,
          maxReconnectionDelay: this.config.reconnectInterval! * 4,
          minReconnectionDelay: this.config.reconnectInterval,
          maxRetries: this.config.maxReconnectAttempts,
          connectionTimeout: this.config.timeout,
          debug: this.config.debug
        });

        this.setupEventHandlers();

        // Set up connection promise resolution
        const onOpen = () => {
          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          resolve();
        };

        const onError = (error: Event) => {
          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          reject(error);
        };

        this.ws.addEventListener('open', onOpen);
        this.ws.addEventListener('error', onError);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isAuthenticated = false;
    this.authToken = null;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Clear pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();

    this.log('Disconnected from WebSocket server');
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.addEventListener('open', this.handleOpen.bind(this));
    this.ws.addEventListener('close', this.handleClose.bind(this));
    this.ws.addEventListener('error', this.handleError.bind(this));
    this.ws.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleOpen(): void {
    this.lastConnectionTime = new Date();
    this.reconnectAttempts = 0;
    
    this.log('Connected to WebSocket server');
    
    // Authenticate immediately
    this.authenticate().then(() => {
      this.processPendingMessages();
      this.handlers.onConnected?.();
    }).catch((error) => {
      this.log('Authentication failed:', error);
      this.handlers.onError?.(error);
    });
  }

  private handleClose(): void {
    this.isAuthenticated = false;
    this.log('Disconnected from WebSocket server');
    this.handlers.onDisconnected?.();
  }

  private handleError(error: Event): void {
    this.log('WebSocket error:', error);
    this.handlers.onError?.(error);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.processMessage(message);
    } catch (error) {
      this.log('Failed to parse message:', error);
    }
  }

  // ===== AUTHENTICATION =====

  private async authenticate(): Promise<void> {
    if (!this.authToken) {
      throw new Error('No authentication token provided');
    }

    return this.sendRequest('authenticate', { token: this.authToken })
      .then(() => {
        this.isAuthenticated = true;
        this.log('Successfully authenticated');
      })
      .catch((error) => {
        this.isAuthenticated = false;
        throw new Error(`Authentication failed: ${error.message}`);
      });
  }

  // ===== MESSAGE HANDLING =====

  private processMessage(message: WebSocketMessage): void {
    this.handlers.onMessage?.(message);

    // Handle responses to pending requests
    if (this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id)!;
      clearTimeout(request.timeout);
      this.pendingRequests.delete(message.id);

      if (message.type === 'error') {
        request.reject(new Error(message.payload.message || 'Request failed'));
      } else {
        request.resolve(message.payload);
      }
      return;
    }

    // Handle real-time updates
    switch (message.type) {
      case 'connection_established':
        this.log('Connection established:', message.payload);
        break;

      case 'authentication_success':
        this.log('Authentication successful:', message.payload);
        break;

      case IBKRMessageType.MARKET_DATA:
        this.handlers.onMarketDataUpdate?.(message.payload);
        break;

      case IBKRMessageType.ORDER_STATUS:
        this.handlers.onOrderUpdate?.(message.payload);
        break;

      case IBKRMessageType.POSITION_UPDATE:
        this.handlers.onPositionUpdate?.(message.payload);
        break;

      case IBKRMessageType.ACCOUNT_UPDATE:
        this.handlers.onAccountUpdate?.(message.payload);
        break;

      case IBKRMessageType.EXECUTION_REPORT:
        this.handlers.onExecutionReport?.(message.payload);
        break;

      case IBKRMessageType.CONNECTION_STATUS:
        this.handlers.onConnectionStatusChange?.(message.payload.status);
        break;

      case IBKRMessageType.ERROR:
        this.handlers.onIBKRError?.(message.payload);
        break;

      case 'pong':
        // Handle heartbeat response
        break;

      case 'error':
        this.log('Server error:', message.payload);
        break;

      default:
        this.log('Unhandled message type:', message.type);
    }
  }

  private processPendingMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.sendMessage(message);
    }
  }

  // ===== MESSAGE SENDING =====

  private sendMessage(message: Partial<WebSocketMessage>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('WebSocket not connected, queueing message');
      this.messageQueue.push(message as WebSocketMessage);
      return;
    }

    if (!this.isAuthenticated && message.type !== 'authenticate') {
      this.log('Not authenticated, queueing message');
      this.messageQueue.push(message as WebSocketMessage);
      return;
    }

    const fullMessage: WebSocketMessage = {
      id: message.id || this.generateMessageId(),
      timestamp: new Date().toISOString(),
      ...message
    } as WebSocketMessage;

    try {
      this.ws.send(JSON.stringify(fullMessage));
      this.log('Sent message:', fullMessage.type);
    } catch (error) {
      this.log('Failed to send message:', error);
      throw error;
    }
  }

  private sendRequest<T = any>(type: string, payload: any = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error('Request timeout'));
      }, this.config.timeout);

      this.pendingRequests.set(messageId, { resolve, reject, timeout });

      const message: WebSocketMessage = {
        id: messageId,
        type,
        payload,
        timestamp: new Date().toISOString()
      };

      this.sendMessage(message);
    });
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${this.messageId++}`;
  }

  // ===== PUBLIC API METHODS =====

  // Market Data
  async subscribeToMarketData(symbols: string[], fields: MarketDataField[] = [MarketDataField.LAST, MarketDataField.BID, MarketDataField.ASK]): Promise<string> {
    const response = await this.sendRequest('subscribe_market_data', {
      symbols,
      fields,
      frequency: 'streaming'
    });
    return response.subscriptionId;
  }

  async unsubscribeFromMarketData(subscriptionId: string): Promise<void> {
    await this.sendRequest('unsubscribe_market_data', { subscriptionId });
  }

  // Orders
  async placeOrder(orderRequest: OrderRequest): Promise<any> {
    return this.sendRequest('place_order', orderRequest);
  }

  async cancelOrder(orderId: number): Promise<void> {
    await this.sendRequest('cancel_order', { orderId });
  }

  // Portfolio Data
  async getPositions(): Promise<IBKRPosition[]> {
    const response = await this.sendRequest('get_positions');
    return response.positions;
  }

  async getAccountSummary(): Promise<AccountSummary> {
    const response = await this.sendRequest('get_account_summary');
    return response.accountSummary;
  }

  async getConnectionHealth(): Promise<ConnectionHealth> {
    const response = await this.sendRequest('get_connection_health');
    return response.health;
  }

  // Utility
  ping(): void {
    this.sendMessage({
      type: 'ping',
      payload: { timestamp: new Date().toISOString() }
    });
  }

  // ===== GETTERS =====

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return this.isAuthenticated ? 'connected' : 'authenticating';
      case WebSocket.CLOSING:
        return 'disconnecting';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  getConnectionInfo(): any {
    return {
      connected: this.isConnected(),
      state: this.getConnectionState(),
      authenticated: this.isAuthenticated,
      lastConnectionTime: this.lastConnectionTime?.toISOString(),
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      pendingRequests: this.pendingRequests.size
    };
  }

  // ===== UTILITY =====

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocketClient]', ...args);
    }
  }
}

// Export a factory function for easy creation
export const createWebSocketClient = (
  url: string, 
  handlers: WebSocketEventHandlers = {}, 
  config: Partial<WebSocketClientConfig> = {}
): WebSocketClient => {
  return new WebSocketClient({ url, ...config }, handlers);
};