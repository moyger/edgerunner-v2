import React from "react";
import { Sidebar } from "./src/components/layout/Sidebar";
import { TopBar } from "./src/components/layout/TopBar";
import { ThemeProvider } from "./src/components/shared/ThemeProvider";
import { Button } from "./src/components/ui/button";
import { Download, BarChart3 } from "lucide-react";
import { useUIStore } from "./src/store/uiStore";
import { KeyboardShortcuts } from "./src/lib/accessibility";
import { autoStartupService } from "./src/services/AutoStartupService";
import { StartupProgress } from "./src/components/StartupProgress";
import type { TabId } from "./src/types";
import type { StartupProgress as StartupProgressType } from "./src/services/AutoStartupService";

// Lazy-loaded components for performance
import {
  LazyDashboard,
  LazyStrategyBuilder,
  LazyTradeJournalPage,
  LazySettings,
  LazyDocumentation,
  LazyApiTestingPage,
  LazyFlexTester,
  preloadCriticalComponents
} from "./src/components/lazy";

export default function App() {
  // Use Zustand store instead of local state - preserves exact same behavior
  const { 
    activeTab, 
    sidebarCollapsed, 
    setActiveTab, 
    setSidebarCollapsed,
    getPageTitle,
    getPageSubtitle 
  } = useUIStore();

  // Auto-startup state
  const [startupProgress, setStartupProgress] = React.useState<StartupProgressType | null>(null);
  const [startupCompleted, setStartupCompleted] = React.useState(false);

  // Auto-startup initialization
  React.useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      // Set up progress monitoring
      autoStartupService.onProgress((progress) => {
        if (mounted) {
          setStartupProgress(progress);
        }
      });

      try {
        // Start automatic initialization
        const finalProgress = await autoStartupService.startAutoInitialization();
        
        if (mounted) {
          setStartupProgress(finalProgress);
          
          // Mark as completed after a short delay
          setTimeout(() => {
            if (mounted) {
              setStartupCompleted(true);
            }
          }, 1500);
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        if (mounted) {
          // Still allow user to continue even if startup fails
          setTimeout(() => {
            if (mounted) {
              setStartupCompleted(true);
            }
          }, 3000);
        }
      }
    };

    initializeApp();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Preload critical components and initialize trading shortcuts after startup
  React.useEffect(() => {
    if (startupCompleted) {
      preloadCriticalComponents();
      
      // Initialize trading-specific keyboard shortcuts with UI store
      KeyboardShortcuts.initializeTradingShortcuts({
        setActiveTab,
        toggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed)
      });
    }
  }, [startupCompleted, setActiveTab, setSidebarCollapsed, sidebarCollapsed]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <LazyDashboard />;
      case "strategies":
        return (
          <LazyStrategyBuilder 
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        );
      case "backtest":
        return (
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Backtesting engine coming soon...</p>
          </div>
        );
      case "journal":
        return <LazyTradeJournalPage />;
      case "settings":
        return <LazySettings />;
      case "notifications":
        return (
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Notifications center coming soon...</p>
          </div>
        );
      case "docs":
        return <LazyDocumentation />;
      case "api-testing":
        return <LazyApiTestingPage />;
      case "flex-tester":
        return <LazyFlexTester />;
      default:
        return <LazyDashboard />;
    }
  };

  // Show startup progress if not completed
  if (!startupCompleted && startupProgress) {
    return (
      <ThemeProvider>
        <StartupProgress 
          progress={startupProgress} 
          onComplete={() => setStartupCompleted(true)}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="h-screen flex bg-background">
        <nav id="navigation" role="navigation" aria-label="Main navigation">
          <Sidebar 
            activeTab={activeTab as TabId} 
            onTabChange={(tab) => setActiveTab(tab as TabId)}
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </nav>
        <div className="flex-1 flex flex-col">
          {activeTab !== "strategies" && (
            <header role="banner">
              <TopBar 
                title={getPageTitle()} 
                subtitle={getPageSubtitle()}
                sidebarCollapsed={sidebarCollapsed}
                onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {activeTab === "journal" && (
                  <>
                    <Button variant="outline" size="sm" aria-label="Export trade journal to CSV">
                      <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" aria-label="View trade analytics">
                      <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
                      Analytics
                    </Button>
                  </>
                )}
              </TopBar>
            </header>
          )}
          <main id="main-content" role="main" className="flex-1">
            {renderContent()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}