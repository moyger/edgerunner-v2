import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export function TopBar({ title, subtitle, children, sidebarCollapsed, onSidebarToggle }: TopBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4">
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
        <div>
          <h1 className="text-xl font-medium">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {children}
        <ThemeToggle />
      </div>
    </div>
  );
}