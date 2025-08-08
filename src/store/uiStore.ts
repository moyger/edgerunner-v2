import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { TabId, UIState } from '../types';

interface UIStore extends UIState {
  // Actions that preserve all existing component behaviors
  setActiveTab: (tab: TabId) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Helper methods for component compatibility
  getPageTitle: () => string;
  getPageSubtitle: () => string;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - matches existing App.tsx defaults
        activeTab: 'dashboard',
        sidebarCollapsed: false,
        theme: 'system',

        // Actions that maintain exact same behavior as before
        setActiveTab: (tab: TabId) => set({ activeTab: tab }, false, 'setActiveTab'),
        
        toggleSidebar: () => set(
          (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }), 
          false, 
          'toggleSidebar'
        ),
        
        setSidebarCollapsed: (collapsed: boolean) => set(
          { sidebarCollapsed: collapsed }, 
          false, 
          'setSidebarCollapsed'
        ),
        
        setTheme: (theme: 'light' | 'dark' | 'system') => set(
          { theme }, 
          false, 
          'setTheme'
        ),

        // Helper methods to maintain existing component logic
        getPageTitle: () => {
          const activeTab = get().activeTab;
          switch (activeTab) {
            case 'dashboard': return 'Dashboard';
            case 'strategies': return 'Strategies';
            case 'backtest': return 'Backtest';
            case 'journal': return 'Trade Journal';
            case 'api-testing': return 'API Testing';
            case 'settings': return 'Settings';
            case 'notifications': return 'Notifications';
            case 'docs': return 'Documentation';
            default: return 'Dashboard';
          }
        },

        getPageSubtitle: () => {
          const activeTab = get().activeTab;
          switch (activeTab) {
            case 'dashboard': return 'Real-time overview of your trading performance';
            case 'strategies': return 'Create and manage your algorithmic trading strategies';
            case 'backtest': return 'Test your strategies against historical market data';
            case 'journal': return 'Complete trading history and performance analytics';
            case 'api-testing': return 'Validate broker connections and API integrity before integration';
            case 'settings': return 'Configure your trading environment and preferences';
            case 'notifications': return 'Stay informed with real-time alerts and updates';
            case 'docs': return 'Learn how to maximize your trading performance';
            default: return 'Real-time overview of your trading performance';
          }
        },
      }),
      {
        name: 'edgerunner-ui-state',
        partialize: (state) => ({ 
          theme: state.theme, 
          sidebarCollapsed: state.sidebarCollapsed 
        }),
      }
    ),
    { name: 'UIStore' }
  )
);