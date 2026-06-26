import { useMemo } from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, startOfYear, endOfYear, 
  subMonths, subYears, isWithinInterval, differenceInDays, format
} from 'date-fns';

export function useDashboardData() {
  const { dateFilter, customDateRange } = useDashboardStore();
  const { transactions } = useTransactionStore();
  const { accounts } = useAccountStore();
  const { categories } = useCategoryStore();
  const { getBudgetsProgress } = useBudgetStore();

  // 1. Determine Date Range
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (dateFilter) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'last_year':
        const lastYear = subYears(now, 1);
        start = startOfYear(lastYear);
        end = endOfYear(lastYear);
        break;
      case 'custom':
        start = customDateRange.startDate ? startOfDay(new Date(customDateRange.startDate)) : startOfMonth(now);
        end = customDateRange.endDate ? endOfDay(new Date(customDateRange.endDate)) : endOfMonth(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }
    return { start, end };
  }, [dateFilter, customDateRange]);

  // 2. Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      !t.isArchived && 
      isWithinInterval(new Date(t.date), { start: dateRange.start, end: dateRange.end })
    );
  }, [transactions, dateRange]);

  // 3. Summary Stats
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    // Category Breakdown map
    const categoryTotals: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') {
        expense += t.amount;
        categoryTotals[t.categoryId!] = (categoryTotals[t.categoryId!] || 0) + t.amount;
      }
    });

    const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    
    const daysInPeriod = Math.max(1, differenceInDays(dateRange.end, dateRange.start) + 1);
    const avgDailySpend = expense / daysInPeriod;

    let highestCatId = '';
    let highestCatAmt = 0;
    Object.entries(categoryTotals).forEach(([id, amt]) => {
      if (amt > highestCatAmt) {
        highestCatAmt = amt;
        highestCatId = id;
      }
    });

    const highestCategory = categories.find(c => c.id === highestCatId)?.name || 'None';

    return {
      netWorth,
      income,
      expense,
      savings,
      savingsRate,
      avgDailySpend,
      highestCategory
    };
  }, [filteredTransactions, accounts, categories, dateRange]);

  // 4. Budgets Data (Current Month regardless of date filter, or mapped to date filter if desired. Prompt says "Current Month Income/Expenses" inside summary cards, meaning budgets are usually monthly. Let's just use current month for budget summary to be safe).
  const budgetStats = useMemo(() => {
    const now = new Date();
    const progresses = getBudgetsProgress(now.getMonth() + 1, now.getFullYear());
    
    let active = 0;
    let nearLimit = 0;
    let exceeded = 0;

    progresses.forEach(p => {
      active++;
      if (p.status === 'warning') nearLimit++;
      if (p.status === 'exceeded') exceeded++;
    });

    return { active, nearLimit, exceeded, progresses };
  }, [getBudgetsProgress]);

  // 5. Chart Data: Category Breakdown
  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        const name = categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
        map.set(name, (map.get(name) || 0) + t.amount);
      }
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  // 6. Chart Data: Account Distribution
  const accountChartData = useMemo(() => {
    return accounts
      .filter(a => a.balance > 0)
      .map(a => ({ name: a.name, value: a.balance }))
      .sort((a,b) => b.value - a.value);
  }, [accounts]);

  // 7. Chart Data: Income vs Expense & Cash Flow (Aggregated by day or month)
  const timeSeriesData = useMemo(() => {
    const daysDiff = differenceInDays(dateRange.end, dateRange.start);
    const formatStr = daysDiff > 60 ? 'MMM yyyy' : 'MMM dd';
    
    const map = new Map<string, { date: string, dateObj: Date, income: number, expense: number }>();

    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      // For > 60 days, group by month, otherwise group by day
      const key = daysDiff > 60 ? format(startOfMonth(d), 'yyyy-MM') : format(startOfDay(d), 'yyyy-MM-dd');
      
      const existing = map.get(key) || { 
        date: format(d, formatStr), 
        dateObj: daysDiff > 60 ? startOfMonth(d) : startOfDay(d),
        income: 0, 
        expense: 0 
      };

      if (t.type === 'income') existing.income += t.amount;
      if (t.type === 'expense') existing.expense += t.amount;
      map.set(key, existing);
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    // Calculate running balance based on all-time initial balance + flow
    // To be perfectly accurate, we'd need the balance at `dateRange.start`.
    // Since calculating historical balance accurately requires traversing all past transactions, 
    // we will approximate running balance by tracking net flow delta from a 0 baseline, 
    // or just show net flow. The prompt asked for "Running balance over time". 
    // To do this simply, we will calculate the balance *before* the start date.
    
    let historicalBalance = accounts.reduce((sum, a) => sum + a.balance, 0); // Current total
    
    // We want the balance at the START of the graph.
    // Actually, working backwards:
    const txnsAfterStart = transactions.filter(t => !t.isArchived && new Date(t.date) > dateRange.start);
    let startBalance = historicalBalance;
    txnsAfterStart.forEach(t => {
      if (t.type === 'income') startBalance -= t.amount;
      if (t.type === 'expense') startBalance += t.amount;
      // Transfers don't affect total net worth
    });

    let currentRun = startBalance;
    const finalSeries = sorted.map(item => {
      currentRun += (item.income - item.expense);
      return {
        ...item,
        balance: currentRun
      };
    });

    return finalSeries;
  }, [filteredTransactions, transactions, dateRange, accounts]);

  return {
    dateRange,
    summary,
    budgetStats,
    categoryChartData,
    accountChartData,
    timeSeriesData,
    filteredTransactions
  };
}
