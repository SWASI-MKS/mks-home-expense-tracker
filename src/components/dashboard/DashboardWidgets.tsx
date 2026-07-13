import { useDashboardData } from '@/hooks/useDashboardData';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';
import { 
  Wallet, TrendingUp, TrendingDown, Target, 
  AlertTriangle, PieChart as PieChartIcon, 
  Activity, Lightbulb, CreditCard, ArrowUpCircle, Bell
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function SummaryCardsWidget() {
  const { summary, budgetStats } = useDashboardData();

  const cards = [
    { title: 'Net Worth', value: summary.netWorth, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Period Income', value: summary.income, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Period Expenses', value: summary.expense, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
    { title: 'Period Savings', value: summary.savings, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ];

  const secondaryCards = [
    { title: 'Savings Rate', value: `${summary.savingsRate.toFixed(1)}%`, icon: PieChartIcon, color: 'text-teal-500' },
    { title: 'Avg Daily Spend', value: `${formatCurrency(Math.round(summary.avgDailySpend))}`, icon: Activity, color: 'text-amber-500' },
    { title: 'Active Budgets', value: budgetStats.active, icon: Target, color: 'text-blue-500' },
    { title: 'Budgets Warning', value: budgetStats.nearLimit + budgetStats.exceeded, icon: AlertTriangle, color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="p-4 bg-card">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("p-2 rounded-lg", c.bg, c.color)}>
                <c.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{c.title}</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(c.value)}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryCards.map((c, i) => (
          <Card key={i} className="p-3 flex items-center justify-between bg-muted/50">
            <div className="flex items-center gap-2">
              <c.icon className={cn("w-4 h-4", c.color)} />
              <span className="text-sm text-muted-foreground">{c.title}</span>
            </div>
            <span className="font-semibold">{c.value}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function IncomeExpenseChartWidget() {
  const { timeSeriesData } = useDashboardData();

  if (timeSeriesData.length === 0) return <EmptyChart message="No data for selected period" />;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${formatCurrency(val)}`} />
          <Tooltip 
            cursor={{ fill: '#334155', opacity: 0.1 }}
            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
            formatter={(value: any) => [`${formatCurrency(Number(value))}`, undefined]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashFlowChartWidget() {
  const { timeSeriesData } = useDashboardData();

  if (timeSeriesData.length === 0) return <EmptyChart message="No data for selected period" />;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${formatCurrency(val)}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
            formatter={(value: any) => [`${formatCurrency(Number(value))}`, 'Running Balance']}
          />
          <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBreakdownWidget() {
  const { categoryChartData } = useDashboardData();

  if (categoryChartData.length === 0) return <EmptyChart message="No expenses to categorize" />;

  return (
    <div className="h-[300px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryChartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {categoryChartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
            formatter={(value: any) => [`${formatCurrency(Number(value))}`, 'Amount']}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccountDistributionWidget() {
  const { accountChartData } = useDashboardData();
  const navigate = useNavigate();

  if (accountChartData.length === 0) return <EmptyChart message="No accounts with balance" />;

  return (
    <div className="h-[300px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={accountChartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            paddingAngle={1}
            dataKey="value"
            onClick={(data) => {
              // Recharts onClick provides data.payload
              if (data && data.payload && data.payload.id) {
                navigate(`/accounts/${data.payload.id}/statement`);
              }
            }}
            className="cursor-pointer"
          >
            {accountChartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
            formatter={(value: any) => [`${formatCurrency(Number(value))}`, 'Balance']}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetUsageWidget() {
  const { budgetStats } = useDashboardData();

  if (budgetStats.progresses.length === 0) return <EmptyChart message="No active budgets for this month" />;

  // Take top 5 budgets to save space
  const topBudgets = [...budgetStats.progresses].sort((a,b) => b.percentage - a.percentage).slice(0, 5);

  return (
    <div className="space-y-4 pt-2">
      {topBudgets.map(b => (
        <div key={b.id}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{b.name}</span>
            <span className="text-muted-foreground">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full", b.status === 'exceeded' ? "bg-rose-500" : b.status === 'warning' ? "bg-amber-500" : "bg-emerald-500")}
              style={{ width: `${Math.min(b.percentage, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InsightsWidget() {
  const { summary, accountChartData, timeSeriesData } = useDashboardData();

  const topAccount = accountChartData.length > 0 ? accountChartData[0] : null;
  const savingsTrend = timeSeriesData.length >= 2 
    ? (timeSeriesData[timeSeriesData.length-1].income - timeSeriesData[timeSeriesData.length-1].expense) > 
      (timeSeriesData[timeSeriesData.length-2].income - timeSeriesData[timeSeriesData.length-2].expense) 
    : true;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Top Spending Category</h4>
          <p className="text-sm text-blue-600/80 dark:text-blue-300/80 mt-1">
            Your highest expense category in this period is <strong>{summary.highestCategory}</strong>.
          </p>
        </div>
      </div>
      
      {topAccount && (
        <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <CreditCard className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Primary Account</h4>
            <p className="text-sm text-emerald-600/80 dark:text-emerald-300/80 mt-1">
              Most of your wealth is stored in <strong>{topAccount.name}</strong> ({formatCurrency(topAccount.value)}).
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <ArrowUpCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400">Savings Trend</h4>
          <p className="text-sm text-purple-600/80 dark:text-purple-300/80 mt-1">
            Your savings rate is <strong>{summary.savingsRate.toFixed(1)}%</strong>. {savingsTrend ? 'You are saving more than the previous period!' : 'Your savings dipped compared to the previous period.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[300px] w-full flex items-center justify-center border-2 border-dashed border-border rounded-xl">
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
}

export function UpcomingRemindersWidget() {
  const { reminders } = useCalendarStore();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pending = reminders.filter(r => r.status !== 'completed');
  const overdue = pending.filter(r => r.status === 'overdue' || (r.dueDate && new Date(`${r.dueDate}T23:59:59`) < today));
  const dueToday = pending.filter(r => r.dueDate === today.toISOString().split('T')[0]);
  const dueTomorrow = pending.filter(r => r.dueDate === tomorrow.toISOString().split('T')[0]);

  const allRelevant = [...overdue, ...dueToday, ...dueTomorrow].slice(0, 5);

  if (allRelevant.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border rounded-xl">
        <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No upcoming reminders</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2 h-[300px] overflow-y-auto pr-2">
      {overdue.length > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/30">
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1 uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </p>
          <div className="space-y-1">
            {overdue.slice(0, 2).map(r => (
              <p key={r.id} className="text-sm font-medium">{r.title}</p>
            ))}
            {overdue.length > 2 && <p className="text-xs text-rose-500 font-medium">+{overdue.length - 2} more</p>}
          </div>
        </div>
      )}
      
      {dueToday.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">Today</p>
          <div className="space-y-1">
            {dueToday.slice(0, 3).map(r => (
              <p key={r.id} className="text-sm font-medium">{r.title}</p>
            ))}
          </div>
        </div>
      )}

      {dueTomorrow.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wider">Tomorrow</p>
          <div className="space-y-1">
            {dueTomorrow.slice(0, 3).map(r => (
              <p key={r.id} className="text-sm font-medium">{r.title}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
