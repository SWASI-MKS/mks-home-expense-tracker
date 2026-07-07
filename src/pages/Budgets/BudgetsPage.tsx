import { useState } from 'react';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useUIStore } from '@/stores/useUIStore';
import { BudgetDashboard } from './BudgetDashboard';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, Copy, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/currency';

export function BudgetsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { openBudgetModal } = useUIStore();
  const { getBudgetsProgress, getDashboardStats, deleteBudget, toggleBudget, addBudget } = useBudgetStore();
  const { categories } = useCategoryStore();

  const progresses = getBudgetsProgress(currentMonth, currentYear);
  const stats = getDashboardStats(currentMonth, currentYear);

  const handlePrevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
    else { setCurrentMonth(m => m - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
    else { setCurrentMonth(m => m + 1); }
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteBudget(deleteId);
      toast.success('Budget deleted');
      setDeleteId(null);
    }
  };

  const handleDuplicate = (b: any) => {
    // Duplicate to current selected month/year
    try {
      addBudget({
        name: b.name,
        categoryId: b.categoryId,
        amount: b.amount,
        month: currentMonth,
        year: currentYear,
        enabled: true
      });
      toast.success('Budget duplicated');
    } catch {
      toast.error('Could not duplicate budget');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">Plan and track your monthly spending.</p>
        </div>
        <Button onClick={() => openBudgetModal()} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Create Budget
        </Button>
      </div>

      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
        <Button variant="ghost" onClick={handlePrevMonth}><ChevronLeft className="w-5 h-5" /></Button>
        <span className="font-semibold text-lg">
          {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <Button variant="ghost" onClick={handleNextMonth}><ChevronRight className="w-5 h-5" /></Button>
      </div>

      <BudgetDashboard stats={stats} />

      {progresses.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No budgets set</h3>
          <p className="text-muted-foreground mt-1 mb-4">Create a budget to start tracking your spending.</p>
          <Button onClick={() => openBudgetModal()}>Create Budget</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progresses.map(budget => (
            <Card key={budget.id} className={cn("p-5 flex flex-col justify-between border-border", !budget.enabled && "opacity-60")}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{budget.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{categories.find(c => c.id === budget.categoryId)?.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleBudget(budget.id, !budget.enabled)} className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors">
                    {budget.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDuplicate(budget)} title="Duplicate to this month" className="p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => openBudgetModal(budget.id)} className="p-1.5 text-muted-foreground hover:bg-accent hover:text-primary rounded-md transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(budget.id)} className="p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Spent {formatCurrency(budget.spent)}</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(budget.amount)}
                  </span>
                </div>
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500", 
                      budget.status === 'exceeded' ? "bg-rose-500" : budget.status === 'warning' ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    budget.status === 'exceeded' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : 
                    budget.status === 'warning' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : 
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>
                    {budget.percentage.toFixed(0)}% Used
                  </span>
                  
                  {budget.status === 'exceeded' && (
                    <span className="text-xs flex items-center text-rose-500 font-medium">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Exceeded by {formatCurrency(Math.abs(budget.remaining))}
                    </span>
                  )}
                  {budget.status !== 'exceeded' && (
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(budget.remaining)} left
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Budget"
        description="Are you sure you want to delete this budget? This action cannot be undone."
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
