export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  type: string; // e.g., 'cash', 'bank', 'wallet', 'credit'
  balance: number;
  isDefault: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string; // TXN-YYYYMMDD-XXXX
  type: TransactionType;
  amount: number;
  date: string;
  notes?: string;
  
  // For Income/Expense
  categoryId?: string;
  accountId?: string;
  
  // For Transfer
  fromAccountId?: string;
  toAccountId?: string;

  createdAt: string;
  isArchived: boolean;
}

export interface Budget {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  month: number; // 1-12
  year: number;
  enabled: boolean;
  createdAt: string;
}

export interface BudgetProgress extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
}
