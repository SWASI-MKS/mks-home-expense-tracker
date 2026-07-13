import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account } from '@/types';
import { DEFAULT_ACCOUNTS, mapLegacyTypeToAccountType, extractLastFourDigits } from '@/constants/defaults';
import { dbService } from '@/services/firestore/dbService';

interface AccountState {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'isDefault' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'isDefault' | 'createdAt'>>) => void;
  deleteAccount: (id: string) => void;
  initializeDefaults: () => void;
}

function migrateAccount(account: any): Account {
  const migrated: Account = {
    ...account,
    accountType: account.accountType || mapLegacyTypeToAccountType(account.type),
    lastFourDigits: account.lastFourDigits || extractLastFourDigits(account.accountNumber || account.cardNumber)
  };
  return migrated;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({

      accounts: [],
      addAccount: (account) => set((state) => {
        const nameExists = state.accounts.some(a => a.name.toLowerCase() === account.name.toLowerCase());
        if (nameExists) throw new Error('Account with this name already exists.');
        
        const newAccount: Account = {
          ...account,
          id: `acc-${Date.now()}`,
          isDefault: false,
          createdAt: new Date().toISOString(),
          lastFourDigits: extractLastFourDigits(account.accountNumber || account.cardNumber)
        };
        dbService.save('accounts', newAccount.id, newAccount);
        return { accounts: [...state.accounts, newAccount] };
      }),
      updateAccount: (id, updates) => set((state) => {
        if (updates.name) {
          const nameExists = state.accounts.some(a => a.name.toLowerCase() === updates.name!.toLowerCase() && a.id !== id);
          if (nameExists) throw new Error('Account with this name already exists.');
        }
        
        const updatedAccounts = state.accounts.map(acc => {
          if (acc.id === id) {
            const updated: Account = { 
              ...acc, 
              ...updates,
              lastFourDigits: extractLastFourDigits(
                (updates as any).accountNumber || (updates as any).cardNumber || acc.accountNumber || acc.cardNumber
              )
            };
            dbService.save('accounts', updated.id, updated);
            return updated;
          }
          return acc;
        });

        return { accounts: updatedAccounts };
      }),
      deleteAccount: (id) => set((state) => {
        dbService.delete('accounts', id);
        return { accounts: state.accounts.filter(acc => acc.id !== id || acc.isDefault) };
      }),
      initializeDefaults: () => set((state) => {
        // Migrate existing accounts if needed
        const migratedAccounts = state.accounts.length > 0 
          ? state.accounts.map(migrateAccount)
          : [];
          
        // If no accounts yet, initialize defaults
        if (migratedAccounts.length === 0) {
          const defaultAccounts = DEFAULT_ACCOUNTS.map(acc => ({
            ...acc,
            openingBalance: 0,
            createdAt: new Date().toISOString(),
          }));
          
          defaultAccounts.forEach(acc => dbService.save('accounts', acc.id, acc));
          
          return { accounts: defaultAccounts };
        }
        
        // Otherwise, save migrated accounts if needed
        const accountsToSave = migratedAccounts.filter((acc, idx) => 
          JSON.stringify(acc) !== JSON.stringify(state.accounts[idx])
        );
        accountsToSave.forEach(acc => dbService.save('accounts', acc.id, acc));
        
        return { accounts: migratedAccounts };
      }),
    }),
    {
      name: 'expense-tracker-accounts',
      migrate: (persistedState: any) => {

        if (!persistedState) return persistedState;
        const migratedAccounts = (persistedState.accounts || []).map(migrateAccount);
        return { ...persistedState, accounts: migratedAccounts };
      }
    }
  )
);
