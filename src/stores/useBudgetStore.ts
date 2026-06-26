import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Budget, BudgetProgress } from '@/types';
import { useTransactionStore } from './useTransactionStore';
import { isSameMonth } from 'date-fns';

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
        return { budgets: [...state.budgets, newBudget] };
      }),
      
      updateBudget: (id, updates) => set((state) => ({
        budgets: state.budgets.map(b => b.id === id ? { ...b, ...updates } : b)
      })),
      
      deleteBudget: (id) => set((state) => ({
        budgets: state.budgets.filter(b => b.id !== id)
      })),
      
      toggleBudget: (id, enabled) => set((state) => ({
        budgets: state.budgets.map(b => b.id === id ? { ...b, enabled } : b)
      })),
      
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
      }
    }),
    {
      name: 'expense-tracker-budgets',
    }
  )
);
