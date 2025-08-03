import { 
  BarChart3, 
  Brain, 
  TrendingUp, 
  BookOpen, 
  Settings, 
  Bell,
  FileText,
  Home,
  Menu,
  ChevronLeft
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "strategies", label: "Strategies", icon: Brain },
  { id: "backtest", label: "Backtest", icon: TrendingUp },
  { id: "journal", label: "Trade Journal", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "docs", label: "About / Docs", icon: FileText },
];

export function Sidebar({ activeTab, onTabChange, isCollapsed = false, onToggle }: SidebarProps) {
  return (
    <TooltipProvider>
      <div className={cn(
        "bg-card border-r border-border h-full flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "border-b border-border flex items-center",
          isCollapsed ? "p-4 justify-center" : "p-6"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-xl font-medium">Edgerunner</h1>
                  <p className="text-sm text-muted-foreground">Algorithmic Trading OS</p>
                </div>
              </div>
              {onToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              {onToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-6 w-6 p-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        <nav className={cn("flex-1", isCollapsed ? "p-2" : "p-4")}>
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              const buttonContent = (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "h-10",
                    isCollapsed ? "w-10 p-0 justify-center" : "w-full justify-start gap-3",
                    isActive && "bg-accent"
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && item.label}
                </Button>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      {buttonContent}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return buttonContent;
            })}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}