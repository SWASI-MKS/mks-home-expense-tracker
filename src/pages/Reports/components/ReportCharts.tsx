import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { formatCurrency } from '@/utils/currency';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useBalanceEngine } from '@/hooks/useBalanceEngine';

interface ReportChartsProps {
  summary: any;
  transactions: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function ReportCharts({ summary, transactions }: ReportChartsProps) {
  const { categories } = useCategoryStore();
  const { accounts } = useAccountStore();
  const { budgets } = useBudgetStore();
  const { getAccountBalance } = useBalanceEngine();
  const navigate = useNavigate();

  // Income vs Expense Data
  const incomeVsExpenseData = [
    { name: 'Income', value: summary.totalIncome },
    { name: 'Expense', value: summary.totalExpenses }
  ];

  // Category Expense Data
  const expenseCategoryData = Object.entries(summary.categoryTotals).map(([catId, amount]) => {
    return {
      name: categories.find(c => c.id === catId)?.name || 'Unknown',
      value: amount as number
    };
  }).sort((a, b) => b.value - a.value).slice(0, 5); // top 5

  // Category Income Data - REMOVED since unused
  // const incomeCategoryData = Object.entries(summary.incomeCategoryTotals).map(([catId, amount]) => {
  //   return {
  //     name: categories.find(c => c.id === catId)?.name || 'Unknown',
  //     value: amount as number
  //   };
  // }).sort((a, b) => b.value - a.value).slice(0, 5); // top 5

  // Account Balances
  const accountBalanceData = accounts.map(a => ({
    id: a.id,
    name: a.name,
    value: getAccountBalance(a.id).currentBalance
  })).sort((a, b) => b.value - a.value);

  // Budget Usage Data
  const budgetUsageData = budgets.map(b => {
    const spent = transactions
      .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: categories.find(c => c.id === b.categoryId)?.name || 'Unknown',
      limit: b.amount,
      spent: spent
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Income vs Expense */}
      <Card className="p-4 flex flex-col h-80">
        <h3 className="text-lg font-medium mb-4">Income vs Expense</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpenseData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${formatCurrency(v)}`} />
              <RechartsTooltip 
                cursor={{ fill: 'var(--accent)' }}
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '8px' }} 
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {incomeVsExpenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Income' ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Expenses by Category */}
      <Card className="p-4 flex flex-col h-80">
        <h3 className="text-lg font-medium mb-4">Top Expense Categories</h3>
        <div className="flex-1 min-h-0">
          {expenseCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseCategoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
          )}
        </div>
      </Card>

      {/* Account Balances */}
      <Card className="p-4 flex flex-col h-80">
        <h3 className="text-lg font-medium mb-4">Account Balances</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={accountBalanceData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                onClick={(data) => {
                  if (data && data.payload && data.payload.id) {
                    navigate(`/accounts/${data.payload.id}/statement`);
                  }
                }}
                className="cursor-pointer"
              >
                {accountBalanceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Budget Usage */}
      <Card className="p-4 flex flex-col h-80">
        <h3 className="text-lg font-medium mb-4">Budget Usage</h3>
        <div className="flex-1 min-h-0">
          {budgetUsageData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetUsageData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--accent)' }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '8px' }} 
                />
                <Bar dataKey="spent" name="Spent" fill="#ef4444" radius={[0, 4, 4, 0]} />
                <Bar dataKey="limit" name="Limit" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-muted-foreground">No budgets configured</div>
          )}
        </div>
      </Card>
    </div>
  );
}
