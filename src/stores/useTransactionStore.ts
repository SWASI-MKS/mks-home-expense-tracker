import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, AuditHistoryEntry } from '@/types';
import { generateTxnId } from '@/utils/generateTxnId';
import { isSameDay } from 'date-fns';
import { dbService } from '@/services/firestore/dbService';
import { useFamilyStore } from './useFamilyStore';
import { notificationCenter } from '@/services/notification/notificationCenter';
import { useSettingsStore } from './useSettingsStore';
import { useBudgetStore } from './useBudgetStore';
import { NotificationRateLimiter } from '@/services/notification/notificationRateLimiter';

const generateAuditId = () => `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'isArchived'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'isArchived'>>, auditDescription?: string) => void;
  deleteTransaction: (id: string) => void;
  archiveTransaction: (id: string) => void;
  restoreTransaction: (id: string) => void;
  duplicateTransaction: (id: string) => void;
  hasTransactionsForAccount: (accountId: string) => boolean;
  hasTransactionsForCategory: (categoryId: string) => boolean;
  checkDuplicate: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'isArchived'>) => boolean;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      
      addTransaction: (transaction) => set((state) => {
        const id = generateTxnId(state.transactions.map(t => t.id));
        const displayName = useFamilyStore.getState().displayName;
        const member = displayName || 'System';
        
        const auditEntry: AuditHistoryEntry = {
          id: generateAuditId(),
          action: 'transaction_created',
          timestamp: new Date().toISOString(),
          memberName: member,
          description: `${member} created the transaction`,
        };
        
        const newTxn: Transaction = {
          ...transaction,
          id,
          isArchived: false,
          createdAt: new Date().toISOString(),
          auditHistory: [auditEntry],
          ...(displayName ? { addedBy: displayName } : {})
        };
        
        dbService.save('transactions', newTxn.id, newTxn);
        
        // Notifications
        const settings = useSettingsStore.getState();
        
        notificationCenter.dispatch({
          title: 'Transaction Added',
          message: `${member} added a ${newTxn.type} of ₹${newTxn.amount.toLocaleString('en-IN')}.`,
          category: 'FINANCE',
          severity: 'INFO',
          member,
          preventEmail: true,
        });

        if (newTxn.type === 'expense' && newTxn.amount >= settings.largeExpenseThreshold) {
          notificationCenter.dispatch({
            title: 'Large Expense Detected',
            message: `${member} added an expense of ₹${newTxn.amount.toLocaleString('en-IN')}.`,
            category: 'EXPENSE',
            severity: 'WARNING',
            member,
            metadata: { amount: newTxn.amount },
            rateLimitKey: 'LARGE_EXPENSE',
            rateLimitMs: NotificationRateLimiter.LIMITS.LARGE_EXPENSE,
            forceEmail: true,
            preventBrowser: true,
          });
        } else if (newTxn.type === 'income' && newTxn.amount >= settings.largeIncomeThreshold) {
          notificationCenter.dispatch({
            title: 'Large Income Detected',
            message: `${member} added an income of ₹${newTxn.amount.toLocaleString('en-IN')}.`,
            category: 'INCOME',
            severity: 'INFO',
            member,
            metadata: { amount: newTxn.amount },
            rateLimitKey: 'LARGE_INCOME',
            rateLimitMs: NotificationRateLimiter.LIMITS.LARGE_INCOME,
            forceEmail: true,
            preventBrowser: true,
          });
        } else if (newTxn.type === 'transfer' && newTxn.amount >= settings.largeTransferThreshold) {
          notificationCenter.dispatch({
            title: 'Large Transfer Detected',
            message: `${member} transferred ₹${newTxn.amount.toLocaleString('en-IN')}.`,
            category: 'TRANSFER',
            severity: 'INFO',
            member,
            metadata: { amount: newTxn.amount },
            rateLimitKey: 'LARGE_TRANSFER',
            rateLimitMs: NotificationRateLimiter.LIMITS.LARGE_TRANSFER,
            forceEmail: true,
            preventBrowser: true,
          });
        }
        
        useBudgetStore.getState().checkBudgets();

        return { transactions: [newTxn, ...state.transactions] };
      }),
      
      updateTransaction: (id, updates, auditDescription) => set((state) => {
        const existingTxn = state.transactions.find(t => t.id === id);
        if (!existingTxn) return state;

        const member = useFamilyStore.getState().displayName || 'System';
        const auditEntry: AuditHistoryEntry = {
          id: generateAuditId(),
          action: 'transaction_edited',
          timestamp: new Date().toISOString(),
          memberName: member,
          description: auditDescription || `${member} edited the transaction`,
        };

        const updatedTxn: Transaction = {
          ...existingTxn,
          ...updates,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: member,
          auditHistory: [...(existingTxn.auditHistory || []), auditEntry],
        };
        dbService.save('transactions', updatedTxn.id, updatedTxn);

        notificationCenter.dispatch({
          title: 'Transaction Edited',
          message: `${member} updated a transaction.`,
          category: 'FINANCE',
          severity: 'INFO',
          member,
          preventEmail: true,
        });
        
        useBudgetStore.getState().checkBudgets();

        return {
          transactions: state.transactions.map(t => t.id === id ? updatedTxn : t)
        };
      }),
      
      deleteTransaction: (id) => set((state) => {
        const txn = state.transactions.find(t => t.id === id);
        const member = useFamilyStore.getState().displayName || 'System';
        
        if (txn) {
          // Add audit entry
          const auditEntry: AuditHistoryEntry = {
            id: generateAuditId(),
            action: 'transaction_deleted',
            timestamp: new Date().toISOString(),
            memberName: member,
            description: `${member} deleted the transaction`,
          };
          
          // We don't actually delete from DB for audit, just mark as archived and add entry
          const updatedTxn = { 
            ...txn, 
            isArchived: true, 
            auditHistory: [...(txn.auditHistory || []), auditEntry] 
          };
          dbService.save('transactions', updatedTxn.id, updatedTxn);
          
          notificationCenter.dispatch({
            title: 'Transaction Deleted',
            message: `${member} deleted a ${txn.type}.`,
            category: 'FINANCE',
            severity: 'INFO',
            member,
            preventEmail: true,
          });
        }
        
        useBudgetStore.getState().checkBudgets();
        
        return {
          transactions: state.transactions.filter(t => t.id !== id)
        };
      }),
      
      archiveTransaction: (id) => set((state) => {
        const existingTxn = state.transactions.find(t => t.id === id);
        const member = useFamilyStore.getState().displayName || 'System';
        
        if (existingTxn && !existingTxn.isArchived) {
          const auditEntry: AuditHistoryEntry = {
            id: generateAuditId(),
            action: 'transaction_archived',
            timestamp: new Date().toISOString(),
            memberName: member,
            description: `${member} archived the transaction`,
          };
          
          const updatedTxn = { 
            ...existingTxn, 
            isArchived: true,
            auditHistory: [...(existingTxn.auditHistory || []), auditEntry]
          };
          dbService.save('transactions', updatedTxn.id, updatedTxn);
          return {
            transactions: state.transactions.map(t => t.id === id ? updatedTxn : t)
          };
        }
        return state;
      }),
      
      restoreTransaction: (id) => set((state) => {
        const existingTxn = state.transactions.find(t => t.id === id);
        const member = useFamilyStore.getState().displayName || 'System';
        
        if (existingTxn && existingTxn.isArchived) {
          const auditEntry: AuditHistoryEntry = {
            id: generateAuditId(),
            action: 'transaction_restored',
            timestamp: new Date().toISOString(),
            memberName: member,
            description: `${member} restored the transaction from archive`,
          };
          
          const updatedTxn = { 
            ...existingTxn, 
            isArchived: false,
            auditHistory: [...(existingTxn.auditHistory || []), auditEntry]
          };
          dbService.save('transactions', updatedTxn.id, updatedTxn);
          return {
            transactions: state.transactions.map(t => t.id === id ? updatedTxn : t)
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
      
      duplicateTransaction: (id) => set((state) => {
        const txn = state.transactions.find(t => t.id === id);
        if (!txn) return state;
        
        const { id: _id, createdAt: _createdAt, ...rest } = txn;
        const newId = generateTxnId(state.transactions.map(t => t.id));
        const displayName = useFamilyStore.getState().displayName;
        const member = displayName || 'System';
        
        const auditEntry: AuditHistoryEntry = {
          id: generateAuditId(),
          action: 'transaction_created',
          timestamp: new Date().toISOString(),
          memberName: member,
          description: `${member} duplicated transaction ${txn.id}`,
        };
        
        const newTxn: Transaction = {
          ...rest,
          id: newId,
          isArchived: false,
          createdAt: new Date().toISOString(),
          auditHistory: [auditEntry],
          ...(displayName ? { addedBy: displayName } : {})
        };
        
        dbService.save('transactions', newTxn.id, newTxn);
        
        return { transactions: [newTxn, ...state.transactions] };
      })
    }),
    {
      name: 'expense-tracker-transactions',
    }
  )
);
