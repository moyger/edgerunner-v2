import { Sidebar } from "./src/components/layout/Sidebar";
import { Dashboard } from "./src/components/features/dashboard/Dashboard";
import { TradeJournalPage } from "./src/components/features/journal/TradeJournalPage";
import { StrategyBuilder } from "./src/components/features/strategy/StrategyBuilder";
import { Settings } from "./src/components/features/settings/Settings";
import { Documentation } from "./src/components/shared/Documentation";
import { TopBar } from "./src/components/layout/TopBar";
import { ThemeProvider } from "./src/components/shared/ThemeProvider";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { Button } from "./components/ui/button";
import { Download, BarChart3 } from "lucide-react";
import { useUIStore } from "./src/store/uiStore";
import type { TabId } from "./src/types";

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

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        );
      case "strategies":
        return (
          <ErrorBoundary>
            <StrategyBuilder 
              sidebarCollapsed={sidebarCollapsed}
              onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </ErrorBoundary>
        );
      case "backtest":
        return (
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Backtesting engine coming soon...</p>
          </div>
        );
      case "journal":
        return (
          <ErrorBoundary>
            <TradeJournalPage />
          </ErrorBoundary>
        );
      case "settings":
        return (
          <ErrorBoundary>
            <Settings />
          </ErrorBoundary>
        );
      case "notifications":
        return (
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Notifications center coming soon...</p>
          </div>
        );
      case "docs":
        return (
          <ErrorBoundary>
            <Documentation />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        );
    }
  };

  return (
    <ThemeProvider>
      <div className="h-screen flex bg-background">
        <Sidebar 
          activeTab={activeTab as TabId} 
          onTabChange={(tab) => setActiveTab(tab as TabId)}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col">
          {activeTab !== "strategies" && (
            <TopBar 
              title={getPageTitle()} 
              subtitle={getPageSubtitle()}
              sidebarCollapsed={sidebarCollapsed}
              onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {activeTab === "journal" && (
                <>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </>
              )}
            </TopBar>
          )}
          {renderContent()}
        </div>
      </div>
    </ThemeProvider>
  );
}