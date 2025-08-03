import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { TradeJournalPage } from "./components/TradeJournalPage";
import { StrategyBuilder } from "./components/StrategyBuilder";
import { Settings } from "./components/Settings";
import { Documentation } from "./components/Documentation";
import { TopBar } from "./components/TopBar";
import { ThemeProvider } from "./components/ThemeProvider";
import { Button } from "./components/ui/button";
import { Download, BarChart3 } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard";
      case "strategies":
        return "Strategies";
      case "backtest":
        return "Backtest";
      case "journal":
        return "Trade Journal";
      case "settings":
        return "Settings";
      case "notifications":
        return "Notifications";
      case "docs":
        return "Documentation";
      default:
        return "Dashboard";
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Real-time overview of your trading performance";
      case "strategies":
        return "Create and manage your algorithmic trading strategies";
      case "backtest":
        return "Test your strategies against historical market data";
      case "journal":
        return "Complete trading history and performance analytics";
      case "settings":
        return "Configure your trading environment and preferences";
      case "notifications":
        return "Stay informed with real-time alerts and updates";
      case "docs":
        return "Learn how to maximize your trading performance";
      default:
        return "Real-time overview of your trading performance";
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "strategies":
        return (
          <StrategyBuilder 
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
        return <TradeJournalPage />;
      case "settings":
        return <Settings />;
      case "notifications":
        return (
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Notifications center coming soon...</p>
          </div>
        );
      case "docs":
        return <Documentation />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <div className="h-screen flex bg-background">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
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