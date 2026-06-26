import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction } from '@/types';
import { useAccountStore } from './useAccountStore';
import { generateTxnId } from '@/utils/generateTxnId';
import { isSameDay } from 'date-fns';

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'isArchived'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'isArchived'>>) => void;
  deleteTransaction: (id: string) => void;
  archiveTransaction: (id: string) => void;
  restoreTransaction: (id: string) => void;
  recalculateAllBalances: () => void;
  hasTransactionsForAccount: (accountId: string) => boolean;
  hasTransactionsForCategory: (categoryId: string) => boolean;
  checkDuplicate: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'isArchived'>) => boolean;
}

const applyBalanceChange = (t: Transaction, reverse: boolean = false) => {
  const { updateBalance } = useAccountStore.getState();
  const multiplier = reverse ? -1 : 1;

  if (t.type === 'income') {
    if (t.accountId) updateBalance(t.accountId, t.amount * multiplier);
  } else if (t.type === 'expense') {
    if (t.accountId) updateBalance(t.accountId, -t.amount * multiplier);
  } else if (t.type === 'transfer') {
    if (t.fromAccountId) updateBalance(t.fromAccountId, -t.amount * multiplier);
    if (t.toAccountId) updateBalance(t.toAccountId, t.amount * multiplier);
  }
};

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      
      addTransaction: (transaction) => set((state) => {
        const id = generateTxnId(state.transactions.map(t => t.id));
        const newTxn: Transaction = {
          ...transaction,
          id,
          isArchived: false,
          createdAt: new Date().toISOString(),
        };
        
        applyBalanceChange(newTxn);
        
        return { transactions: [newTxn, ...state.transactions] };
      }),
      
      updateTransaction: (id, updates) => set((state) => {
        const existingTxn = state.transactions.find(t => t.id === id);
        if (!existingTxn) return state;

        // Reverse old balance impact
        if (!existingTxn.isArchived) {
          applyBalanceChange(existingTxn, true);
        }

        const updatedTxn: Transaction = { ...existingTxn, ...updates };

        // Apply new balance impact
        if (!updatedTxn.isArchived) {
          applyBalanceChange(updatedTxn, false);
        }

        return {
          transactions: state.transactions.map(t => t.id === id ? updatedTxn : t)
        };
      }),
      
      deleteTransaction: (id) => set((state) => {
        const existingTxn = state.transactions.find(t => t.id === id);
        if (existingTxn && !existingTxn.isArchived) {
          applyBalanceChange(existingTxn, true);
        }
        return {
          transactions: state.transactions.filter(t => t.id !== id)
        };
      }),
      
      archiveTransaction: (id) => set((state) => {
        const existingTxn = state.transactions.find(t => t.id === id);
        if (existingTxn && !existingTxn.isArchived) {
          applyBalanceChange(existingTxn, true);
          return {
            transactions: state.transactions.map(t => t.id === id ? { ...t, isArchived: true } : t)
          };
        }
        return state;
      }),
      
      restoreTransaction: (id) => set((state) => {
        const existingTxn = state.transactions.find(t => t.id === id);
        if (existingTxn && existingTxn.isArchived) {
          applyBalanceChange(existingTxn, false);
          return {
            transactions: state.transactions.map(t => t.id === id ? { ...t, isArchived: false } : t)
          };
        }
        return state;
      }),
      
      hasTransactionsForAccount: (accountId) => {
        return get().transactions.some(t => 
          !t.isArchived && (t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId)
        );
      },
      
      hasTransactionsForCategory: (categoryId) => {
        return get().transactions.some(t => !t.isArchived && t.categoryId === categoryId);
      },
      
      checkDuplicate: (transaction) => {
        const txns = get().transactions;
        const txnDate = new Date(transaction.date);
        
        return txns.some(t => {
          if (t.isArchived) return false;
          const isSameType = t.type === transaction.type;
          const isSameAmount = t.amount === transaction.amount;
          const isSameDate = isSameDay(new Date(t.date), txnDate);
          
          if (transaction.type === 'transfer') {
            return isSameType && isSameAmount && isSameDate && 
                   t.fromAccountId === transaction.fromAccountId && 
                   t.toAccountId === transaction.toAccountId;
          } else {
            return isSameType && isSameAmount && isSameDate && 
                   t.accountId === transaction.accountId && 
                   t.categoryId === transaction.categoryId;
          }
        });
      },
      
      recalculateAllBalances: () => {
        const { accounts, setBalance } = useAccountStore.getState();
        const txns = get().transactions;
        
        // Reset local map
        const balances = new Map(accounts.map(a => [a.id, 0]));
        
        // Replay active transactions
        txns.forEach(t => {
          if (t.isArchived) return;
          if (t.type === 'income' && t.accountId) {
            balances.set(t.accountId, (balances.get(t.accountId) || 0) + t.amount);
          } else if (t.type === 'expense' && t.accountId) {
            balances.set(t.accountId, (balances.get(t.accountId) || 0) - t.amount);
          } else if (t.type === 'transfer' && t.fromAccountId && t.toAccountId) {
            balances.set(t.fromAccountId, (balances.get(t.fromAccountId) || 0) - t.amount);
            balances.set(t.toAccountId, (balances.get(t.toAccountId) || 0) + t.amount);
          }
        });

        // Update the account store
        balances.forEach((balance, id) => {
          setBalance(id, balance);
        });
      }
    }),
    {
      name: 'expense-tracker-transactions',
    }
  )
);
