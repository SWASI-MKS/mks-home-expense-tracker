import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account } from '@/types';
import { DEFAULT_ACCOUNTS } from '@/constants/defaults';

interface AccountState {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'isDefault' | 'balance' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'isDefault' | 'createdAt'>>) => void;
  deleteAccount: (id: string) => void;
  updateBalance: (id: string, amountChange: number) => void;
  setBalance: (id: string, balance: number) => void;
  initializeDefaults: () => void;
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
          balance: 0,
          createdAt: new Date().toISOString(),
        };
        return { accounts: [...state.accounts, newAccount] };
      }),
      updateAccount: (id, updates) => set((state) => {
        if (updates.name) {
          const nameExists = state.accounts.some(a => a.name.toLowerCase() === updates.name!.toLowerCase() && a.id !== id);
          if (nameExists) throw new Error('Account with this name already exists.');
        }
        return {
          accounts: state.accounts.map(acc => acc.id === id ? { ...acc, ...updates } : acc)
        };
      }),
      deleteAccount: (id) => set((state) => ({
        accounts: state.accounts.filter(acc => acc.id !== id || acc.isDefault)
      })),
      updateBalance: (id, amountChange) => set((state) => ({
        accounts: state.accounts.map(acc => 
          acc.id === id ? { ...acc, balance: acc.balance + amountChange } : acc
        )
      })),
      setBalance: (id, balance) => set((state) => ({
        accounts: state.accounts.map(acc => 
          acc.id === id ? { ...acc, balance } : acc
        )
      })),
      initializeDefaults: () => set((state) => {
        if (state.accounts.length > 0) return state;
        const defaultAccounts = DEFAULT_ACCOUNTS.map(acc => ({
          ...acc,
          balance: 0,
          createdAt: new Date().toISOString(),
        }));
        return { accounts: defaultAccounts };
      }),
    }),
    {
      name: 'expense-tracker-accounts',
    }
  )
);
