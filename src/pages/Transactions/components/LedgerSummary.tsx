import React, { useMemo } from 'react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Activity, Hash, Calendar, Maximize2, Minimize2, TrendingUp, TrendingDown } from 'lucide-react';
import { isSameDay, isSameMonth } from 'date-fns';

interface LedgerSummaryProps {
  transactions: Transaction[];
  openingBalance: number;
}

export const LedgerSummary: React.FC<LedgerSummaryProps> = React.memo(({ transactions, openingBalance }) => {
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let largestIncome = 0;
    let largestExpense = 0;
    let todaysExpense = 0;
    let thisMonthsExpense = 0;

    const today = new Date();
    
    // For daily/monthly averages, we need to know the date span
    let minDate = today.getTime();
    let maxDate = today.getTime();

    transactions.forEach(t => {
      if (t.isArchived) return;

      const tDate = new Date(t.date);
      const time = tDate.getTime();
      if (time < minDate) minDate = time;
      if (time > maxDate) maxDate = time;

      if (t.type === 'income') {
        totalIncome += t.amount;
        if (t.amount > largestIncome) largestIncome = t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
        if (t.amount > largestExpense) largestExpense = t.amount;
        
        if (isSameDay(tDate, today)) {
          todaysExpense += t.amount;
        }
        if (isSameMonth(tDate, today)) {
          thisMonthsExpense += t.amount;
        }
      }
    });

    const netSavings = totalIncome - totalExpense;
    const currentBalance = openingBalance + netSavings;
    const totalTransactions = transactions.filter(t => !t.isArchived).length;
    
    const daysDiff = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
    const monthsDiff = Math.max(1, Math.ceil(daysDiff / 30));

    const avgDailySpending = totalExpense / daysDiff;
    const avgMonthlySpending = totalExpense / monthsDiff;
    const cashFlow = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      netSavings,
      currentBalance,
      totalTransactions,
      largestIncome,
      largestExpense,
      avgDailySpending,
      avgMonthlySpending,
      cashFlow,
      todaysExpense,
      thisMonthsExpense,
    };
  }, [transactions, openingBalance]);

  const cards = [
    { title: 'Current Balance', value: stats.currentBalance, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Total Income', value: stats.totalIncome, icon: ArrowUpCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Total Expense', value: stats.totalExpense, icon: ArrowDownCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { title: 'Net Savings', value: stats.netSavings, icon: Activity, color: stats.netSavings >= 0 ? 'text-emerald-500' : 'text-rose-500', bg: stats.netSavings >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
    { title: 'Total Transactions', value: stats.totalTransactions.toString(), isString: true, icon: Hash, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: "Today's Expense", value: stats.todaysExpense, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: "This Month's Expense", value: stats.thisMonthsExpense, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Largest Income', value: stats.largestIncome, icon: Maximize2, color: 'text-lime-500', bg: 'bg-lime-500/10' },
    { title: 'Largest Expense', value: stats.largestExpense, icon: Minimize2, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
    { title: 'Avg Daily Spending', value: stats.avgDailySpending, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { title: 'Avg Monthly Spending', value: stats.avgMonthlySpending, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-600/10' },
    { title: 'Cash Flow %', value: `${stats.cashFlow.toFixed(1)}%`, isString: true, icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-card p-4 rounded-xl border border-border flex flex-col justify-between hover-lift transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-muted-foreground font-semibold tracking-wide">{card.title}</span>
            <div className={`p-1.5 rounded-lg ${card.bg} animate-pulse-soft`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <div className="text-lg font-extrabold">
            {card.isString ? card.value : formatCurrency(card.value as number)}
          </div>
        </div>
      ))}
    </div>
  );
});
