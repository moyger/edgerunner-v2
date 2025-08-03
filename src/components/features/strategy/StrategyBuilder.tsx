import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../../../components/ui/breadcrumb";
import { 
  Save, 
  Copy, 
  Download, 
  Play, 
  Pause, 
  Settings,
  History,
  ChevronRight,
  Menu
} from "lucide-react";
import { EntryLogicTab } from "./EntryLogicTab";
import { ExitRiskTab } from "./ExitRiskTab";
import { BacktestTab } from "./BacktestTab";
import { UniverseFiltersTab } from "./UniverseFiltersTab";

interface StrategyBuilderProps {
  strategyName?: string;
  status?: "live" | "paused" | "backtesting" | "draft";
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export function StrategyBuilder({ 
  strategyName = "Gap & Go Morning Breakout", 
  status = "draft",
  sidebarCollapsed = false,
  onSidebarToggle
}: StrategyBuilderProps) {
  const [activeTab, setActiveTab] = useState("universe");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "backtesting":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "live":
        return <Play className="h-3 w-3" />;
      case "paused":
        return <Pause className="h-3 w-3" />;
      case "backtesting":
        return <Settings className="h-3 w-3 animate-spin" />;
      default:
        return <Settings className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Strategy Sidebar */}
      <div className="w-80 border-r border-border bg-card p-6 space-y-6">
        {/* Strategy Info */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium mb-2">{strategyName}</h2>
            <Badge variant="outline" className={getStatusColor(status)}>
              {getStatusIcon(status)}
              <span className="ml-1.5 capitalize">{status}</span>
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Run</span>
              <span>2 hours ago</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="text-green-600">67.3%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Trades</span>
              <span>143</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg R-Multiple</span>
              <span className="text-green-600">+1.42R</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Strategy
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-1.5" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <History className="h-4 w-4 mr-2" />
            View Trade History
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Play className="h-4 w-4 mr-2" />
            Replay Trades
          </Button>
        </div>

        {/* Strategy Versions */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Versions</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-2 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <span className="text-sm">v1.2 (Current)</span>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer">
              <span className="text-sm text-muted-foreground">v1.1</span>
              <span className="text-xs text-muted-foreground">67.1%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer">
              <span className="text-sm text-muted-foreground">v1.0</span>
              <span className="text-xs text-muted-foreground">62.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-4">
            {sidebarCollapsed && onSidebarToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSidebarToggle}
                className="h-8 w-8 p-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" className="text-muted-foreground hover:text-foreground">
                    Strategies
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground">
                    {strategyName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="universe" className="text-sm">Universe & Filters</TabsTrigger>
              <TabsTrigger value="entry" className="text-sm">Entry Logic</TabsTrigger>
              <TabsTrigger value="exit" className="text-sm">Exit & Risk</TabsTrigger>
              <TabsTrigger value="backtest" className="text-sm">Backtest & Deployment</TabsTrigger>
            </TabsList>

            <div className="h-full overflow-auto">
              <TabsContent value="universe" className="mt-0 h-full">
                <UniverseFiltersTab />
              </TabsContent>
              
              <TabsContent value="entry" className="mt-0 h-full">
                <EntryLogicTab />
              </TabsContent>
              
              <TabsContent value="exit" className="mt-0 h-full">
                <ExitRiskTab />
              </TabsContent>
              
              <TabsContent value="backtest" className="mt-0 h-full">
                <BacktestTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}