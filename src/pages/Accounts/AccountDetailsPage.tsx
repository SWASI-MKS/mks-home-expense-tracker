import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { useAccountStore } from '@/stores/useAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import { useBalanceEngine } from '@/hooks/useBalanceEngine';
import { formatCurrency } from '@/utils/currency';

import { ACCOUNT_TYPE_INFO } from '@/constants/defaults';
import { useMemo } from 'react';


export function AccountDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts } = useAccountStore();
  const { transactions } = useTransactionStore();
  const { getAccountBalance } = useBalanceEngine();


  const account = accounts.find(a => a.id === id);
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold mb-2">Account not found</h2>
        <Button onClick={() => navigate('/accounts')}>Go back to Accounts</Button>
      </div>
    );
  }

  const typeInfo = ACCOUNT_TYPE_INFO[account.accountType];
  const { openingBalance, currentBalance, netChange } = getAccountBalance(account.id);
  const accountTransactions = transactions.filter(tx => !tx.isArchived && (tx.accountId === account.id || tx.fromAccountId === account.id || tx.toAccountId === account.id));


  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...accountTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [accountTransactions]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let income = 0;
    let expense = 0;
    
    accountTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        if (tx.type === 'income') {
          income += tx.amount;
        } else if (tx.type === 'expense') {
          expense += tx.amount;
        }
      }
    });
    
    return { income, expense };
  }, [accountTransactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Accounts
        </Button>
      </div>

      {/* Account Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${typeInfo.color}`}>
                <span className="text-4xl">{typeInfo.icon}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{account.name}</h1>
                <p className="text-muted-foreground">
                  {typeInfo.label.replace('s', '')}
                  {account.lastFourDigits && <span> •••• {account.lastFourDigits}</span>}
                  {account.provider && <span> • {account.provider}</span>}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Current Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Opening Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(openingBalance)}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Net Change</p>
                <p className={`text-2xl font-bold ${netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netChange >= 0 ? '+' : ''}{formatCurrency(netChange)}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Transactions</p>
                <p className="text-2xl font-bold">{accountTransactions.length}</p>
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Account Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {account.bankName && (
                  <div>
                    <span className="text-muted-foreground">Bank:</span> {account.bankName}
                  </div>
                )}
                {account.branch && (
                  <div>
                    <span className="text-muted-foreground">Branch:</span> {account.branch}
                  </div>
                )}
                {account.ifsc && (
                  <div>
                    <span className="text-muted-foreground">IFSC:</span> {account.ifsc}
                  </div>
                )}
                {account.upiId && (
                  <div>
                    <span className="text-muted-foreground">UPI ID:</span> {account.upiId}
                  </div>
                )}
                {account.creditLimit && (
                  <div>
                    <span className="text-muted-foreground">Credit Limit:</span> {formatCurrency(account.creditLimit)}
                  </div>
                )}
                {account.description && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Description:</span> {account.description}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">This Month</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-emerald-600 font-medium">Income</span>
                    <span className="font-bold">{formatCurrency(monthlyStats.income)}</span>
                  </div>
                  <div className="h-2 bg-emerald-100 rounded-full">
                    <div 
                      className="h-2 bg-emerald-600 rounded-full" 
                      style={{ width: `${Math.min(100, (monthlyStats.income / (monthlyStats.income + monthlyStats.expense + 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-rose-600 font-medium">Expense</span>
                    <span className="font-bold">{formatCurrency(monthlyStats.expense)}</span>
                  </div>
                  <div className="h-2 bg-rose-100 rounded-full">
                    <div 
                      className="h-2 bg-rose-600 rounded-full" 
                      style={{ width: `${Math.min(100, (monthlyStats.expense / (monthlyStats.income + monthlyStats.expense + 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start" onClick={() => navigate(`/accounts/${account.id}/statement`)}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Statement
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/transactions')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Recent Transactions</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/transactions')}>
              View All
            </Button>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx: any) => (

                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{tx.notes || tx.categoryId || 'Transaction'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`font-bold ${
                    tx.type === 'income' ? 'text-emerald-600' : 
                    tx.type === 'expense' ? 'text-rose-600' : ''
                  }`}>
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
