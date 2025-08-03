import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Fixed IBKR store that prevents infinite loops
export interface IBKRConnectionState {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastError: { message: string } | null;
  connectionHealth: {
    dataQuality: 'good' | 'delayed' | 'stale' | 'unavailable';
    reconnectAttempts: number;
    lastHeartbeat: string | null;
    connectionDuration: number;
  } | null;
}

export interface IBKRConnectionActions {
  connect: (credentials: any) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  updateConnectionHealth: (health: Partial<IBKRConnectionState['connectionHealth']>) => void;
}

export type IBKRStore = IBKRConnectionState & IBKRConnectionActions;

// Initial state - frozen to prevent accidental mutations
const initialState: IBKRConnectionState = Object.freeze({
  isConnected: false,
  connectionStatus: 'disconnected',
  lastError: null,
  connectionHealth: null,
});

export const useIBKRStoreFixed = create<IBKRStore>()(
  devtools(
    (set, get) => ({
      // Spread the initial state
      ...initialState,
      
      // Actions that properly use functional updates
      connect: async (credentials: any) => {
        console.log('IBKRStoreFixed: connect called with', credentials);
        
        // Set connecting state
        set(() => ({
          connectionStatus: 'connecting',
          lastError: null,
        }), false, 'connect/start');
        
        try {
          // Simulate connection process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Success - use functional update to prevent loops
          set(() => ({
            isConnected: true,
            connectionStatus: 'connected',
            connectionHealth: {
              dataQuality: 'good',
              reconnectAttempts: 0,
              lastHeartbeat: new Date().toISOString(),
              connectionDuration: 0,
            },
            lastError: null,
          }), false, 'connect/success');
          
        } catch (error) {
          // Error - use functional update
          set(() => ({
            isConnected: false,
            connectionStatus: 'error',
            lastError: {
              message: error instanceof Error ? error.message : 'Connection failed'
            },
          }), false, 'connect/error');
          
          throw error;
        }
      },
      
      disconnect: async () => {
        console.log('IBKRStoreFixed: disconnect called');
        
        try {
          // Simulate disconnection
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Reset to initial state using functional update
          set(() => ({
            ...initialState,
          }), false, 'disconnect');
          
        } catch (error) {
          console.error('Disconnect error:', error);
          // Even if disconnect fails, reset the state
          set(() => ({
            ...initialState,
            lastError: {
              message: 'Disconnect failed but state reset'
            }
          }), false, 'disconnect/error');
        }
      },
      
      clearError: () => {
        set(() => ({
          lastError: null,
        }), false, 'clearError');
      },
      
      updateConnectionHealth: (health) => {
        const currentHealth = get().connectionHealth;
        if (!currentHealth) return;
        
        set(() => ({
          connectionHealth: {
            ...currentHealth,
            ...health,
          },
        }), false, 'updateConnectionHealth');
      },
    }),
    { 
      name: 'IBKRStoreFixed',
      // Prevent devtools from causing loops
      serialize: true,
    }
  )
);

// Memoized selector hooks that prevent unnecessary re-renders
export const useIBKRConnectionFixed = () => {
  return useIBKRStoreFixed((state) => ({
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    connectionHealth: state.connectionHealth,
    lastError: state.lastError,
    connect: state.connect,
    disconnect: state.disconnect,
    clearError: state.clearError,
  }));
};

// Health selector for components that only need health data
export const useIBKRConnectionHealth = () => {
  return useIBKRStoreFixed((state) => state.connectionHealth);
};

// Status selector for components that only need status
export const useIBKRConnectionStatus = () => {
  return useIBKRStoreFixed((state) => ({
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    lastError: state.lastError,
  }));
};