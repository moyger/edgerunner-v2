/**
 * WebSocket Connection Manager
 * Handles real-time data streaming with auto-reconnect, message queuing, and resilience
 */

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageQueueMaxSize: number;
  connectionTimeout: number;
  backoffMultiplier: number;
  maxBackoffInterval: number;
}

export interface WebSocketMessage {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  retry?: number;
}

export interface WebSocketSubscription {
  id: string;
  channel: string;
  callback: (message: WebSocketMessage) => void;
  errorCallback?: (error: Error) => void;
}

export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  CLOSED = 'closed',
}

export class WebSocketManager {
  private config: WebSocketConfig;
  private socket: WebSocket | null = null;
  private state: WebSocketState = WebSocketState.DISCONNECTED;
  private subscriptions = new Map<string, WebSocketSubscription>();
  private messageQueue: WebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  private lastPongTime = 0;
  private connectionPromise: Promise<void> | null = null;
  private connectionResolver: ((value: void) => void) | null = null;
  private connectionRejecter: ((reason: Error) => void) | null = null;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: 'ws://localhost:8000/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageQueueMaxSize: 1000,
      connectionTimeout: 10000,
      backoffMultiplier: 1.5,
      maxBackoffInterval: 60000,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === WebSocketState.CONNECTED || this.state === WebSocketState.CONNECTING) {
      return this.connectionPromise || Promise.resolve();
    }

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.connectionResolver = resolve;
      this.connectionRejecter = reject;
    });

    this.setState(WebSocketState.CONNECTING);
    this.clearTimers();

    try {
      this.socket = new WebSocket(this.config.url, this.config.protocols);
      this.setupEventHandlers();
      this.startConnectionTimeout();

      return this.connectionPromise;
    } catch (error) {
      this.handleConnectionError(error instanceof Error ? error : new Error('Connection failed'));
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    this.clearTimers();
    this.setState(WebSocketState.DISCONNECTED);

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }

    this.messageQueue = [];
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to a channel
   */
  subscribe(
    channel: string,
    callback: (message: WebSocketMessage) => void,
    errorCallback?: (error: Error) => void
  ): string {
    const subscriptionId = this.generateId();
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      channel,
      callback,
      errorCallback,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message if connected
    if (this.state === WebSocketState.CONNECTED) {
      this.sendMessage({
        id: this.generateId(),
        type: 'subscribe',
        data: { channel },
        timestamp: new Date().toISOString(),
      });
    } else {
      // Queue subscription for when connected
      this.queueMessage({
        id: this.generateId(),
        type: 'subscribe',
        data: { channel },
        timestamp: new Date().toISOString(),
      });
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);

    // Send unsubscribe message if connected
    if (this.state === WebSocketState.CONNECTED) {
      this.sendMessage({
        id: this.generateId(),
        type: 'unsubscribe',
        data: { channel: subscription.channel },
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  }

  /**
   * Send a message to the server
   */
  sendMessage(message: WebSocketMessage): boolean {
    if (this.state !== WebSocketState.CONNECTED || !this.socket) {
      this.queueMessage(message);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.queueMessage(message);
      return false;
    }
  }

  /**
   * Get current connection state
   */
  getState(): WebSocketState {
    return this.state;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    state: WebSocketState;
    reconnectAttempts: number;
    queuedMessages: number;
    activeSubscriptions: number;
    lastPongTime: number;
    uptime: number;
  } {
    return {
      state: this.state,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      activeSubscriptions: this.subscriptions.size,
      lastPongTime: this.lastPongTime,
      uptime: this.lastPongTime > 0 ? Date.now() - this.lastPongTime : 0,
    };
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.handleConnectionOpen();
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.socket.onclose = (event) => {
      this.handleConnectionClose(event);
    };

    this.socket.onerror = (event) => {
      this.handleConnectionError(new Error('WebSocket error'));
    };
  }

  private handleConnectionOpen(): void {
    this.setState(WebSocketState.CONNECTED);
    this.reconnectAttempts = 0;
    this.clearTimers();

    // Start heartbeat
    this.startHeartbeat();

    // Process message queue
    this.processMessageQueue();

    // Resubscribe to all channels
    this.resubscribeAll();

    // Resolve connection promise
    if (this.connectionResolver) {
      this.connectionResolver();
      this.connectionResolver = null;
      this.connectionRejecter = null;
    }

    console.log('WebSocket connected to', this.config.url);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Handle pong responses
      if (message.type === 'pong') {
        this.lastPongTime = Date.now();
        return;
      }

      // Route message to appropriate subscription
      for (const subscription of this.subscriptions.values()) {
        if (this.messageMatchesSubscription(message, subscription)) {
          try {
            subscription.callback(message);
          } catch (error) {
            console.error('Error in subscription callback:', error);
            if (subscription.errorCallback) {
              subscription.errorCallback(error instanceof Error ? error : new Error('Callback error'));
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleConnectionClose(event: CloseEvent): void {
    this.clearTimers();
    this.socket = null;

    if (event.wasClean || event.code === 1000) {
      this.setState(WebSocketState.CLOSED);
      console.log('WebSocket connection closed cleanly');
    } else {
      this.setState(WebSocketState.DISCONNECTED);
      console.warn('WebSocket connection closed unexpectedly:', event.code, event.reason);
      this.attemptReconnect();
    }
  }

  private handleConnectionError(error: Error): void {
    console.error('WebSocket connection error:', error);
    this.setState(WebSocketState.ERROR);
    this.clearTimers();

    // Reject connection promise if pending
    if (this.connectionRejecter) {
      this.connectionRejecter(error);
      this.connectionResolver = null;
      this.connectionRejecter = null;
    }

    // Notify all subscriptions of the error
    for (const subscription of this.subscriptions.values()) {
      if (subscription.errorCallback) {
        subscription.errorCallback(error);
      }
    }

    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached, giving up');
      this.setState(WebSocketState.ERROR);
      return;
    }

    this.setState(WebSocketState.RECONNECTING);
    this.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(this.config.backoffMultiplier, this.reconnectAttempts - 1),
      this.config.maxBackoffInterval
    );

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection attempt failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.state === WebSocketState.CONNECTED) {
        this.sendMessage({
          id: this.generateId(),
          type: 'ping',
          data: {},
          timestamp: new Date().toISOString(),
        });

        // Check if we received pong recently
        if (this.lastPongTime > 0 && Date.now() - this.lastPongTime > this.config.heartbeatInterval * 2) {
          console.warn('Heartbeat timeout, reconnecting');
          this.socket?.close();
        }
      }
    }, this.config.heartbeatInterval);
  }

  private startConnectionTimeout(): void {
    this.connectionTimer = setTimeout(() => {
      if (this.state === WebSocketState.CONNECTING) {
        const error = new Error(`Connection timeout after ${this.config.connectionTimeout}ms`);
        this.handleConnectionError(error);
      }
    }, this.config.connectionTimeout);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  private setState(newState: WebSocketState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      console.log(`WebSocket state changed: ${oldState} -> ${newState}`);
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.config.messageQueueMaxSize) {
      this.messageQueue.shift(); // Remove oldest message
    }
    this.messageQueue.push(message);
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.state === WebSocketState.CONNECTED) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private resubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      this.sendMessage({
        id: this.generateId(),
        type: 'subscribe',
        data: { channel: subscription.channel },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private messageMatchesSubscription(message: WebSocketMessage, subscription: WebSocketSubscription): boolean {
    // Basic channel matching - can be extended for more complex routing
    return message.data?.channel === subscription.channel || 
           subscription.channel === '*' || // Wildcard subscription
           message.type === subscription.channel;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}

// Default WebSocket manager instance
export const webSocketManager = new WebSocketManager();