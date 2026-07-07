import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Budget, BudgetProgress } from '@/types';
import { useTransactionStore } from './useTransactionStore';
import { isSameMonth } from 'date-fns';
import { dbService } from '@/services/firestore/dbService';
import { notificationCenter } from '@/services/notification/notificationCenter';
import { useFamilyStore } from './useFamilyStore';
import { useSettingsStore } from './useSettingsStore';
import { NotificationRateLimiter } from '@/services/notification/notificationRateLimiter';

interface BudgetState {
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  updateBudget: (id: string, updates: Partial<Omit<Budget, 'id' | 'createdAt'>>) => void;
  deleteBudget: (id: string) => void;
  toggleBudget: (id: string, enabled: boolean) => void;
  getBudgetsProgress: (month: number, year: number) => BudgetProgress[];
  getDashboardStats: (month: number, year: number) => {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    utilization: number;
    activeCount: number;
    nearLimitCount: number;
    exceededCount: number;
  };
  checkBudgets: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      
      addBudget: (budget) => set((state) => {
        const id = crypto.randomUUID();
        const newBudget: Budget = {
          ...budget,
          id,
          createdAt: new Date().toISOString(),
        };
        dbService.save('budgets', newBudget.id, newBudget);
        
        const member = useFamilyStore.getState().displayName || 'System';
        notificationCenter.dispatch({
          title: 'Budget Created',
          message: `${member} created a budget: ${newBudget.name}.`,
          category: 'FINANCE',
          severity: 'INFO',
          member,
          preventEmail: true,
        });
        
        return { budgets: [...state.budgets, newBudget] };
      }),
      
      updateBudget: (id, updates) => set((state) => {
        const updatedBudgets = state.budgets.map(b => {
          if (b.id === id) {
            const updated = { ...b, ...updates };
            dbService.save('budgets', updated.id, updated);
            
            const member = useFamilyStore.getState().displayName || 'System';
            notificationCenter.dispatch({
              title: 'Budget Updated',
              message: `${member} updated budget: ${updated.name}.`,
              category: 'FINANCE',
              severity: 'INFO',
              member,
              preventEmail: true,
            });
            
            return updated;
          }
          return b;
        });
        return { budgets: updatedBudgets };
      }),
      
      deleteBudget: (id) => set((state) => {
        const budget = state.budgets.find(b => b.id === id);
        dbService.delete('budgets', id);
        
        if (budget) {
          const member = useFamilyStore.getState().displayName || 'System';
          notificationCenter.dispatch({
            title: 'Budget Deleted',
            message: `${member} deleted budget: ${budget.name}.`,
            category: 'FINANCE',
            severity: 'INFO',
            member,
            preventEmail: true,
          });
        }
        return { budgets: state.budgets.filter(b => b.id !== id) };
      }),
      
      toggleBudget: (id, enabled) => set((state) => {
        const updatedBudgets = state.budgets.map(b => {
          if (b.id === id) {
            const updated = { ...b, enabled };
            dbService.save('budgets', updated.id, updated);
            return updated;
          }
          return b;
        });
        return { budgets: updatedBudgets };
      }),
      
      getBudgetsProgress: (month, year) => {
        const state = get();
        const targetBudgets = state.budgets.filter(b => b.month === month && b.year === year && b.enabled);
        
        // Get all transactions
        const transactions = useTransactionStore.getState().transactions;
        const targetDate = new Date(year, month - 1, 1); // JS months are 0-indexed internally, but our UI uses 1-12
        
        // Filter transactions for this month/year and expense type
        const monthExpenses = transactions.filter(t => 
          !t.isArchived && 
          t.type === 'expense' &&
          isSameMonth(new Date(t.date), targetDate)
        );

        return targetBudgets.map(budget => {
          const spent = monthExpenses
            .filter(t => t.categoryId === budget.categoryId)
            .reduce((sum, t) => sum + t.amount, 0);
          
          const remaining = budget.amount - spent;
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          
          let status: BudgetProgress['status'] = 'safe';
          if (percentage >= 100) status = 'exceeded';
          else if (percentage >= 80) status = 'warning';

          return {
            ...budget,
            spent,
            remaining,
            percentage,
            status,
          };
        });
      },
      
      getDashboardStats: (month, year) => {
        const progresses = get().getBudgetsProgress(month, year);
        
        let totalBudget = 0;
        let totalSpent = 0;
        let activeCount = progresses.length;
        let nearLimitCount = 0;
        let exceededCount = 0;

        progresses.forEach(p => {
          totalBudget += p.amount;
          totalSpent += p.spent;
          if (p.status === 'warning') nearLimitCount++;
          if (p.status === 'exceeded') exceededCount++;
        });

        const remaining = totalBudget - totalSpent;
        const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        return {
          totalBudget,
          totalSpent,
          remaining,
          utilization,
          activeCount,
          nearLimitCount,
          exceededCount
        };
      },
      
      checkBudgets: () => {
        const state = get();
        const settings = useSettingsStore.getState();
        if (!settings.enableBudgetAlerts) return;

        const now = new Date();
        const progresses = state.getBudgetsProgress(now.getMonth() + 1, now.getFullYear());
        const member = useFamilyStore.getState().displayName || 'System';
        
        let budgetsUpdated = false;
        const newBudgets = state.budgets.map(budget => {
          const progress = progresses.find(p => p.id === budget.id);
          if (!progress) return budget;

          let updatedBudget = { ...budget };

          if (progress.status === 'exceeded') {
            if (!budget.exceededEmailSent || (budget.exceededSentAt && Date.now() - new Date(budget.exceededSentAt).getTime() > NotificationRateLimiter.LIMITS.BUDGET_EXCEEDED)) {
              notificationCenter.dispatch({
                title: `Budget Exceeded: ${budget.name}`,
                message: `${member} caused the budget "${budget.name}" to exceed its limit.`,
                category: 'FINANCE',
                severity: 'CRITICAL',
                member,
                rateLimitKey: `BUDGET_EXCEEDED_${budget.id}`,
                rateLimitMs: NotificationRateLimiter.LIMITS.BUDGET_EXCEEDED,
                forceEmail: true,
                metadata: { amount: budget.amount }
              });
              updatedBudget.exceededEmailSent = true;
              updatedBudget.exceededSentAt = new Date().toISOString();
              budgetsUpdated = true;
            }
          } else if (progress.status === 'warning' && progress.percentage >= settings.budgetWarningPercentage) {
            if (!budget.warningEmailSent || (budget.warningSentAt && Date.now() - new Date(budget.warningSentAt).getTime() > NotificationRateLimiter.LIMITS.BUDGET_WARNING)) {
              notificationCenter.dispatch({
                title: `Budget Warning: ${budget.name}`,
                message: `${member} caused the budget "${budget.name}" to reach ${Math.round(progress.percentage)}% of its limit.`,
                category: 'FINANCE',
                severity: 'WARNING',
                member,
                rateLimitKey: `BUDGET_WARNING_${budget.id}`,
                rateLimitMs: NotificationRateLimiter.LIMITS.BUDGET_WARNING,
                forceEmail: true,
                metadata: { amount: budget.amount }
              });
              updatedBudget.warningEmailSent = true;
              updatedBudget.warningSentAt = new Date().toISOString();
              budgetsUpdated = true;
            }
          }

          if (updatedBudget.exceededEmailSent !== budget.exceededEmailSent || updatedBudget.warningEmailSent !== budget.warningEmailSent) {
            dbService.save('budgets', updatedBudget.id, updatedBudget);
          }
          return updatedBudget;
        });

        if (budgetsUpdated) {
          set({ budgets: newBudgets });
        }
      }
    }),
    {
      name: 'expense-tracker-budgets',
    }
  )
);
