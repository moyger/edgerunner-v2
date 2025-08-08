import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  testsCount: number;
  status: 'not-run' | 'running' | 'passed' | 'failed' | 'partial';
}

interface TestCategoryCardProps {
  category: TestCategory;
  onRunTests?: (categoryId: string) => void;
}

export function TestCategoryCard({ category, onRunTests }: TestCategoryCardProps) {
  const getStatusBadge = () => {
    switch (category.status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">All Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">Partial</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">Running</Badge>;
      default:
        return <Badge variant="secondary">Not Run</Badge>;
    }
  };

  const getStatusColor = () => {
    switch (category.status) {
      case 'passed':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'failed':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'partial':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'running':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return '';
    }
  };

  const IconComponent = category.icon;

  return (
    <Card className={getStatusColor()}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <IconComponent className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {category.description}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {category.testsCount} tests available
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRunTests?.(category.id)}
            disabled={category.status === 'running'}
          >
            {category.status === 'running' ? 'Running...' : 'Run Tests'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}