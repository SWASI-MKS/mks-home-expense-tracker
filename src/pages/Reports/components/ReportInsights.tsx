import { Card } from '@/components/common/Card';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { Transaction } from '@/types';
import { Lightbulb } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface ReportInsightsProps {
  filteredTransactions: Transaction[];
  summary: any;
}

export function ReportInsights({ filteredTransactions, summary }: ReportInsightsProps) {
  const { accounts } = useAccountStore();
  const { categories } = useCategoryStore();



  // Calculate Most Frequently Used Account
  const accountFrequency: Record<string, number> = {};
  filteredTransactions.forEach(t => {
    const accId = t.accountId || 'unknown';
    accountFrequency[accId] = (accountFrequency[accId] || 0) + 1;
  });
  let mostUsedAccountId = '';
  let maxFreq = 0;
  Object.entries(accountFrequency).forEach(([id, freq]) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      mostUsedAccountId = id;
    }
  });
  const mostUsedAccountName = accounts.find(a => a.id === mostUsedAccountId)?.name || 'N/A';

  // Calculate Largest Transaction
  let largestTrans: any = null;
  filteredTransactions.forEach(t => {
    if (!largestTrans || t.amount > largestTrans.amount) {
      largestTrans = t;
    }
  });

  return (
    <Card className="p-6 mb-8 border-l-4 border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10">
      <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-500">
        <Lightbulb className="w-5 h-5" />
        <h3 className="text-lg font-medium">Financial Insights</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Highest Spending Category</p>
          <p className="font-medium text-foreground">
            {categories.find(c => c.id === summary.highestExpenseCategory)?.name || 'N/A'} 
            {' '}({formatCurrency(summary.highestExpenseCategoryAmount)})
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Most Used Account</p>
          <p className="font-medium text-foreground">
            {mostUsedAccountName} ({maxFreq} transactions)
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Largest Transaction</p>
          <p className="font-medium text-foreground">
            {largestTrans ? `${formatCurrency(largestTrans.amount)} (${categories.find(c => c.id === largestTrans?.categoryId)?.name})` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Savings Rate</p>
          <p className="font-medium text-foreground">
            {summary.savingsRate.toFixed(1)}% of Income
          </p>
        </div>
      </div>
    </Card>
  );
}
