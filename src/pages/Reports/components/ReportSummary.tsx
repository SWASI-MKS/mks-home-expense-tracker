import { Card } from '@/components/common/Card';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { formatCurrency } from '@/utils/currency';
import { 
  TrendingUp, TrendingDown, PiggyBank, Target, 
  Wallet, PieChart, ArrowUpRight, ArrowDownRight, Hash, Bell 
} from 'lucide-react';

interface ReportSummaryProps {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    averageDailySpending: number;
    highestExpenseCategory: string;
    highestExpenseCategoryAmount: number;
    largestExpense: number;
    largestIncome: number;
    totalTransactions: number;
    reminders?: {
      total: number;
      completed: number;
      pending: number;
      overdue: number;
    };
  };
}

export function ReportSummary({ summary }: ReportSummaryProps) {
  const { categories } = useCategoryStore();

  const highestCatName = categories.find(c => c.id === summary.highestExpenseCategory)?.name || 'N/A';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      <Card className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-emerald-600">
          <span className="text-sm font-medium">Total Income</span>
          <TrendingUp className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold">{formatCurrency(summary.totalIncome)}</span>
      </Card>
      
      <Card className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-rose-600">
          <span className="text-sm font-medium">Total Expenses</span>
          <TrendingDown className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</span>
      </Card>
      
      <Card className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-blue-600">
          <span className="text-sm font-medium">Net Savings</span>
          <PiggyBank className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold">{formatCurrency(summary.netSavings)}</span>
      </Card>

      <Card className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-purple-600">
          <span className="text-sm font-medium">Savings Rate</span>
          <Target className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold">{summary.savingsRate.toFixed(1)}%</span>
      </Card>
      
      <Card className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-amber-600">
          <span className="text-sm font-medium">Avg Daily Spend</span>
          <Wallet className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold">{formatCurrency(summary.averageDailySpending)}</span>
      </Card>
      
      <Card className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="text-sm font-medium">Top Category</span>
          <PieChart className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium truncate">{highestCatName}</span>
          <span className="text-sm text-muted-foreground">{formatCurrency(summary.highestExpenseCategoryAmount)}</span>
        </div>
      </Card>

      <Card className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-rose-600">
          <span className="text-sm font-medium">Largest Expense</span>
          <ArrowDownRight className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold">{formatCurrency(summary.largestExpense)}</span>
      </Card>

      <Card className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-emerald-600">
          <span className="text-sm font-medium">Largest Income</span>
          <ArrowUpRight className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold">{formatCurrency(summary.largestIncome)}</span>
      </Card>

      <Card className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="text-sm font-medium">Transactions</span>
          <Hash className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold">{summary.totalTransactions}</span>
      </Card>

      {summary.reminders && (
        <Card className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center text-amber-600">
            <span className="text-sm font-medium">Reminders</span>
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex justify-between items-end mt-1">
            <span className="text-2xl font-bold text-foreground">{summary.reminders.total}</span>
            <div className="text-right text-xs">
              <span className="text-emerald-500 block">{summary.reminders.completed} done</span>
              <span className="text-rose-500 block">{summary.reminders.overdue} late</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
