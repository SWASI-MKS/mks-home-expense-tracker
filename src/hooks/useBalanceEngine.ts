import { useMemo } from 'react';
import { useAccountStore } from '@/stores/useAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';

export interface AccountBalanceData {
  openingBalance: number;
  currentBalance: number;
  netChange: number;
}

export function useBalanceEngine() {
  const accounts = useAccountStore((state) => state.accounts);
  const transactions = useTransactionStore((state) => state.transactions);

  const balanceData = useMemo(() => {
    const balances: Record<string, AccountBalanceData> = {};

    // Initialize with opening balances
    accounts.forEach(acc => {
      balances[acc.id] = {
        openingBalance: acc.openingBalance || 0,
        currentBalance: acc.openingBalance || 0,
        netChange: 0
      };
    });

    // Apply transactions
    transactions.forEach(t => {
      if (t.isArchived) return;

      if (t.type === 'income' && t.accountId && balances[t.accountId]) {
        balances[t.accountId].currentBalance += t.amount;
        balances[t.accountId].netChange += t.amount;
      } else if (t.type === 'expense' && t.accountId && balances[t.accountId]) {
        balances[t.accountId].currentBalance -= t.amount;
        balances[t.accountId].netChange -= t.amount;
      } else if (t.type === 'transfer' && t.fromAccountId && t.toAccountId) {
        if (balances[t.fromAccountId]) {
          balances[t.fromAccountId].currentBalance -= t.amount;
          balances[t.fromAccountId].netChange -= t.amount;
        }
        if (balances[t.toAccountId]) {
          balances[t.toAccountId].currentBalance += t.amount;
          balances[t.toAccountId].netChange += t.amount;
        }
      }
    });

    return balances;
  }, [accounts, transactions]);

  const netWorth = useMemo(() => {
    return Object.values(balanceData).reduce((sum, data) => sum + data.currentBalance, 0);
  }, [balanceData]);

  const getAccountBalance = (accountId: string): AccountBalanceData => {
    return balanceData[accountId] || { openingBalance: 0, currentBalance: 0, netChange: 0 };
  };

  return {
    balanceData,
    netWorth,
    getAccountBalance
  };
}
