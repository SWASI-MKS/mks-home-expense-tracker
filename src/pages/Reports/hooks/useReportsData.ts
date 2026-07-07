import { useState, useMemo } from 'react';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, startOfYear, endOfYear, 
  subDays, subWeeks, subMonths, subYears,
  isWithinInterval 
} from 'date-fns';

export type DateFilterType = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export function useReportsData() {
  const { transactions } = useTransactionStore();
  const { reminders } = useCalendarStore();
  const [filterType, setFilterType] = useState<DateFilterType>('this_month');
  const [customRange, setCustomRange] = useState<DateRange>({ startDate: null, endDate: null });

  // Compute active date range
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (filterType) {
      case 'today':
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case 'yesterday': {
        const yesterday = subDays(now, 1);
        return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
      }
      case 'this_week':
        return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'last_week': {
        const lastWeek = subWeeks(now, 1);
        return { startDate: startOfWeek(lastWeek, { weekStartsOn: 1 }), endDate: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
      }
      case 'this_month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      }
      case 'this_year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'last_year': {
        const lastYear = subYears(now, 1);
        return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear) };
      }
      case 'custom':
        return customRange;
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [filterType, customRange]);

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return transactions;
    return transactions.filter(t => {
      const date = new Date(t.date);
      return isWithinInterval(date, { start: dateRange.startDate!, end: dateRange.endDate! });
    });
  }, [transactions, dateRange]);

  // Calculations for Summary Cards
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let largestExpense = 0;
    let largestIncome = 0;
    const categoryTotals: Record<string, number> = {};
    const incomeCategoryTotals: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        if (t.amount > largestIncome) largestIncome = t.amount;
        if (t.categoryId) incomeCategoryTotals[t.categoryId] = (incomeCategoryTotals[t.categoryId] || 0) + t.amount;
      } else if (t.type === 'expense') {
        totalExpenses += t.amount;
        if (t.amount > largestExpense) largestExpense = t.amount;
        if (t.categoryId) categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    // Average Daily Spending
    const days = dateRange.startDate && dateRange.endDate 
      ? Math.max(1, Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    const averageDailySpending = totalExpenses / days;

    // Highest Expense Category
    let highestExpenseCategory = '';
    let maxExpense = 0;
    Object.entries(categoryTotals).forEach(([catId, amount]) => {
      if (amount > maxExpense) {
        maxExpense = amount;
        highestExpenseCategory = catId;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      averageDailySpending,
      highestExpenseCategory,
      highestExpenseCategoryAmount: maxExpense,
      largestExpense,
      largestIncome,
      totalTransactions: filteredTransactions.length,
      categoryTotals,
      incomeCategoryTotals,
      reminders: {
        total: reminders.length,
        completed: reminders.filter(r => r.status === 'completed').length,
        pending: reminders.filter(r => r.status === 'pending').length,
        overdue: reminders.filter(r => r.status === 'overdue').length,
      }
    };
  }, [filteredTransactions, dateRange, reminders]);

  return {
    filterType,
    setFilterType,
    customRange,
    setCustomRange,
    dateRange,
    filteredTransactions,
    summary
  };
}
