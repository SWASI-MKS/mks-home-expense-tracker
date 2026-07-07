// removed useSettingsStore
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/currency';

interface BudgetDashboardProps {
  stats: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    utilization: number;
    activeCount: number;
    nearLimitCount: number;
    exceededCount: number;
  };
}

export function BudgetDashboard({ stats }: BudgetDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-4 bg-card border-border shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Budget</h3>
        <p className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</p>
        <p className="text-xs text-muted-foreground mt-2">{stats.activeCount} Active Budgets</p>
      </Card>

      <Card className="p-4 bg-card border-border shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Spent</h3>
        <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
        <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className={cn("h-full rounded-full", stats.utilization >= 100 ? "bg-rose-500" : stats.utilization >= 80 ? "bg-amber-500" : "bg-emerald-500")}
            style={{ width: `${Math.min(stats.utilization, 100)}%` }}
          />
        </div>
      </Card>

      <Card className="p-4 bg-card border-border shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Remaining</h3>
        <p className={cn("text-2xl font-bold", stats.remaining < 0 ? "text-rose-500" : "text-emerald-500")}>
          {stats.remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(stats.remaining))}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Available to spend</p>
      </Card>

      <Card className="p-4 bg-card border-border shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Budget Health</h3>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex-1 text-center">
            <span className="block text-lg font-bold text-amber-500">{stats.nearLimitCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Near Limit</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex-1 text-center">
            <span className="block text-lg font-bold text-rose-500">{stats.exceededCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Exceeded</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
