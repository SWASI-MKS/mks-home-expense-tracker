import { useMemo } from 'react';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { Transaction } from '@/types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, isAfter, isBefore, parseISO } from 'date-fns';

export type StatementRow = {
  isOpeningBalance?: boolean;
  date: string;
  transactionId?: string;
  description: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer' | 'opening';
  credit: number;
  debit: number;
  runningBalance: number;
  addedBy?: string;
  rawTransaction?: Transaction;
};

export type DateFilterType = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface StatementFilters {
  dateFilter: DateFilterType;
  customStartDate?: string;
  customEndDate?: string;
  type?: 'all' | 'income' | 'expense' | 'transfer';
  categoryId?: string;
  addedBy?: string;
  searchQuery?: string;
}

export function useStatementData(accountId: string | undefined, filters: StatementFilters) {
  const { transactions } = useTransactionStore();
  const { accounts } = useAccountStore();

  return useMemo(() => {
    if (!accountId) return null;

    const account = accounts.find(a => a.id === accountId);
    if (!account) return null;

    // 1. Determine Date Range boundaries based on DateFilter
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();

    switch (filters.dateFilter) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case 'this_week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'last_week':
        startDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        endDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case 'this_month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last_month':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'this_year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'custom':
        if (filters.customStartDate) startDate = startOfDay(new Date(filters.customStartDate));
        if (filters.customEndDate) endDate = endOfDay(new Date(filters.customEndDate));
        break;
      case 'all':
      default:
        break;
    }

    // 2. Separate transactions into "Before Range" and "In Range"
    // We only consider transactions relevant to THIS account
    const relevantTransactions = transactions.filter(t => !t.isArchived && (t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId));
    
    // Sort chronologically for accurate running balance
    relevantTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id));

    let periodOpeningBalance = account.openingBalance || 0;
    const inRangeTransactions: Transaction[] = [];

    relevantTransactions.forEach(t => {
      const tDate = parseISO(t.date);
      let isBeforeRange = false;
      
      if (startDate && isBefore(tDate, startDate)) {
        isBeforeRange = true;
      }

      if (isBeforeRange) {
        // Apply to periodOpeningBalance
        if (t.type === 'income' && t.accountId === accountId) periodOpeningBalance += t.amount;
        if (t.type === 'expense' && t.accountId === accountId) periodOpeningBalance -= t.amount;
        if (t.type === 'transfer') {
          if (t.fromAccountId === accountId) periodOpeningBalance -= t.amount;
          if (t.toAccountId === accountId) periodOpeningBalance += t.amount;
        }
      } else {
        // It's inside the start boundary. Check end boundary.
        if (endDate && isAfter(tDate, endDate)) {
          // ignore, it's after the range
        } else {
          inRangeTransactions.push(t);
        }
      }
    });

    // 3. Generate Rows
    const rows: StatementRow[] = [];
    let currentBalance = periodOpeningBalance;
    let totalCredits = 0;
    let totalDebits = 0;

    // Push the Opening Balance row
    rows.push({
      isOpeningBalance: true,
      date: startDate ? startDate.toISOString() : (account.createdAt || new Date().toISOString()),
      description: 'Opening Balance (as of period start)',
      type: 'opening',
      credit: periodOpeningBalance >= 0 ? periodOpeningBalance : 0,
      debit: periodOpeningBalance < 0 ? Math.abs(periodOpeningBalance) : 0,
      runningBalance: currentBalance,
    });

    // Process each transaction to generate running balance
    const rawRows: StatementRow[] = [];
    inRangeTransactions.forEach(t => {
      let credit = 0;
      let debit = 0;

      if (t.type === 'income' && t.accountId === accountId) {
        credit = t.amount;
        currentBalance += t.amount;
      } else if (t.type === 'expense' && t.accountId === accountId) {
        debit = t.amount;
        currentBalance -= t.amount;
      } else if (t.type === 'transfer') {
        if (t.fromAccountId === accountId) {
          debit = t.amount;
          currentBalance -= t.amount;
        }
        if (t.toAccountId === accountId) {
          credit = t.amount;
          currentBalance += t.amount;
        }
      }

      totalCredits += credit;
      totalDebits += debit;

      rawRows.push({
        date: t.date,
        transactionId: t.id,
        description: t.notes || (t.type === 'transfer' ? `Transfer ${t.fromAccountId === accountId ? 'to' : 'from'} another account` : ''),
        categoryId: t.categoryId,
        type: t.type,
        credit,
        debit,
        runningBalance: currentBalance,
        addedBy: t.addedBy,
        rawTransaction: t
      });
    });

    // Apply secondary filters (type, category, search, addedBy) 
    // We apply these AFTER calculating running balance so the running balance shown in the row remains chronologically accurate.
    const filteredRows = rawRows.filter(row => {
      if (filters.type && filters.type !== 'all' && row.type !== filters.type) return false;
      if (filters.categoryId && row.categoryId !== filters.categoryId) return false;
      if (filters.addedBy && row.addedBy !== filters.addedBy) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesDesc = row.description.toLowerCase().includes(q);
        const matchesId = row.transactionId?.toLowerCase().includes(q);
        const matchesAmount = row.credit.toString().includes(q) || row.debit.toString().includes(q);
        const matchesAddedBy = row.addedBy?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesId && !matchesAmount && !matchesAddedBy) return false;
      }
      return true;
    });

    // We ALWAYS show the opening balance row for context, then the filtered rows
    rows.push(...filteredRows);

    const largestIncome = Math.max(0, ...rawRows.map(r => r.credit));
    const largestExpense = Math.max(0, ...rawRows.map(r => r.debit));

    // Verification
    // Opening Balance + Total Credits - Total Debits = Closing Balance
    const calculatedClosingBalance = periodOpeningBalance + totalCredits - totalDebits;
    const isBalanced = Math.abs(calculatedClosingBalance - currentBalance) < 0.01;

    return {
      account,
      rows,
      summary: {
        periodOpeningBalance,
        totalCredits,
        totalDebits,
        closingBalance: currentBalance,
        transactionCount: rawRows.length,
        largestIncome,
        largestExpense,
      },
      isBalanced
    };

  }, [accountId, accounts, transactions, filters]);
}
