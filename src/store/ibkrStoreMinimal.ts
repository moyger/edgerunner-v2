import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Minimal IBKR store to isolate the infinite loop issue
interface MinimalIBKRState {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastError: { message: string } | null;
  connectionHealth: any | null;
  
  // Actions
  connect: (credentials: any) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useMinimalIBKRStore = create<MinimalIBKRState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isConnected: false,
      connectionStatus: 'disconnected',
      lastError: null,
      connectionHealth: null,
      
      // Actions
      connect: async (credentials: any) => {
        console.log('MinimalIBKRStore: connect called');
        set({ connectionStatus: 'connecting' });
        
        // Simulate connection
        setTimeout(() => {
          set({ 
            isConnected: true, 
            connectionStatus: 'connected',
            connectionHealth: {
              dataQuality: 'good',
              reconnectAttempts: 0,
              lastHeartbeat: new Date().toISOString(),
              connectionDuration: 0
            }
          });
        }, 1000);
      },
      
      disconnect: async () => {
        console.log('MinimalIBKRStore: disconnect called');
        set({ 
          isConnected: false, 
          connectionStatus: 'disconnected',
          connectionHealth: null 
        });
      }
    }),
    { name: 'MinimalIBKRStore' }
  )
);

// Minimal selector hook
export const useMinimalIBKRConnection = () => {
  return useMinimalIBKRStore(state => ({
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    connectionHealth: state.connectionHealth,
    lastError: state.lastError,
    connect: state.connect,
    disconnect: state.disconnect
  }));
};