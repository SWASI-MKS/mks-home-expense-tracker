import { Account, Category, AccountType } from '@/types';

export const DEFAULT_ACCOUNTS: Omit<Account, 'openingBalance' | 'createdAt'>[] = [
  { id: 'acc-cash', name: 'Cash', type: 'cash', accountType: 'cash_wallet', isDefault: true },
  { id: 'acc-bank', name: 'Bank Account', type: 'bank', accountType: 'bank_account', isDefault: true },
  { id: 'acc-savings', name: 'Savings Account', type: 'bank', accountType: 'bank_account', isDefault: true },
  { id: 'acc-credit', name: 'Credit Card', type: 'credit', accountType: 'credit_card', isDefault: true },
  { id: 'acc-debit', name: 'Debit Card', type: 'bank', accountType: 'debit_card', isDefault: true },
  { id: 'acc-upi', name: 'UPI', type: 'wallet', accountType: 'upi_wallet', isDefault: true },
  { id: 'acc-gpay', name: 'Google Pay', type: 'wallet', accountType: 'upi_wallet', provider: 'GPay', isDefault: true },
  { id: 'acc-phonepe', name: 'PhonePe', type: 'wallet', accountType: 'upi_wallet', provider: 'PhonePe', isDefault: true },
  { id: 'acc-paytm', name: 'Paytm Wallet', type: 'wallet', accountType: 'upi_wallet', provider: 'Paytm', isDefault: true },
];

export const ACCOUNT_TYPE_INFO: Record<AccountType, {
  icon: string;
  label: string;
  description: string;
  color: string;
}> = {
  bank_account: {
    icon: '🏦',
    label: 'Bank Accounts',
    description: 'Savings, current, and salary accounts',
    color: 'bg-blue-50 text-blue-700'
  },
  credit_card: {
    icon: '💳',
    label: 'Credit Cards',
    description: 'Credit card accounts',
    color: 'bg-purple-50 text-purple-700'
  },
  debit_card: {
    icon: '💳',
    label: 'Debit Cards',
    description: 'Debit card accounts',
    color: 'bg-cyan-50 text-cyan-700'
  },
  upi_wallet: {
    icon: '📱',
    label: 'UPI Wallets',
    description: 'GPay, PhonePe, Paytm, etc.',
    color: 'bg-emerald-50 text-emerald-700'
  },
  cash_wallet: {
    icon: '💵',
    label: 'Cash Wallets',
    description: 'Physical cash accounts',
    color: 'bg-amber-50 text-amber-700'
  },
  investment: {
    icon: '💰',
    label: 'Investments',
    description: 'Stocks, mutual funds, etc.',
    color: 'bg-violet-50 text-violet-700'
  },
  loan: {
    icon: '🏛',
    label: 'Loans',
    description: 'Personal loans, home loans, etc.',
    color: 'bg-rose-50 text-rose-700'
  }
};

// Utility function to map legacy types to new AccountType
export function mapLegacyTypeToAccountType(legacyType: string): AccountType {
  const mapping: Record<string, AccountType> = {
    'cash': 'cash_wallet',
    'bank': 'bank_account',
    'credit': 'credit_card',
    'wallet': 'upi_wallet',
    'investment': 'investment',
    'loan': 'loan',
    'other': 'cash_wallet'
  };
  return mapping[legacyType] || 'cash_wallet';
}

// Extract last 4 digits from a number or string
export function extractLastFourDigits(input?: string | number): string | undefined {
  if (!input) return undefined;
  const str = String(input);
  const digits = str.replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : undefined;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  // Income
  { id: 'cat-salary', name: 'Salary', type: 'income', isDefault: true, color: '#10b981' },
  { id: 'cat-business', name: 'Business', type: 'income', isDefault: true, color: '#059669' },
  { id: 'cat-freelance', name: 'Freelancing', type: 'income', isDefault: true, color: '#34d399' },
  { id: 'cat-interest', name: 'Interest', type: 'income', isDefault: true, color: '#6ee7b7' },
  { id: 'cat-investment', name: 'Investment', type: 'income', isDefault: true, color: '#047857' },
  { id: 'cat-dividend', name: 'Dividend', type: 'income', isDefault: true, color: '#065f46' },
  { id: 'cat-rental', name: 'Rental Income', type: 'income', isDefault: true, color: '#022c22' },
  { id: 'cat-bonus', name: 'Bonus', type: 'income', isDefault: true, color: '#10b981' },
  { id: 'cat-gift-rec', name: 'Gift Received', type: 'income', isDefault: true, color: '#34d399' },
  { id: 'cat-refund', name: 'Refund', type: 'income', isDefault: true, color: '#6ee7b7' },
  { id: 'cat-scholarship', name: 'Scholarship', type: 'income', isDefault: true, color: '#059669' },
  { id: 'cat-inc-other', name: 'Other', type: 'income', isDefault: true, color: '#94a3b8' },

  // Expense
  { id: 'cat-food', name: 'Food', type: 'expense', isDefault: true, color: '#f43f5e' },
  { id: 'cat-groceries', name: 'Groceries', type: 'expense', isDefault: true, color: '#fb923c' },
  { id: 'cat-dining', name: 'Dining Out', type: 'expense', isDefault: true, color: '#fb7185' },
  { id: 'cat-transport', name: 'Transportation', type: 'expense', isDefault: true, color: '#38bdf8' },
  { id: 'cat-fuel', name: 'Fuel', type: 'expense', isDefault: true, color: '#818cf8' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', isDefault: true, color: '#e879f9' },
  { id: 'cat-clothing', name: 'Clothing', type: 'expense', isDefault: true, color: '#c084fc' },
  { id: 'cat-rent', name: 'Rent', type: 'expense', isDefault: true, color: '#a78bfa' },
  { id: 'cat-electric', name: 'Electricity', type: 'expense', isDefault: true, color: '#facc15' },
  { id: 'cat-water', name: 'Water Bill', type: 'expense', isDefault: true, color: '#60a5fa' },
  { id: 'cat-gas', name: 'Gas Bill', type: 'expense', isDefault: true, color: '#fb923c' },
  { id: 'cat-internet', name: 'Internet', type: 'expense', isDefault: true, color: '#94a3b8' },
  { id: 'cat-mobile', name: 'Mobile Recharge', type: 'expense', isDefault: true, color: '#4ade80' },
  { id: 'cat-emi', name: 'EMI', type: 'expense', isDefault: true, color: '#f87171' },
  { id: 'cat-loan', name: 'Loan Payment', type: 'expense', isDefault: true, color: '#ef4444' },
  { id: 'cat-insurance', name: 'Insurance', type: 'expense', isDefault: true, color: '#3b82f6' },
  { id: 'cat-medical', name: 'Medical', type: 'expense', isDefault: true, color: '#ef4444' },
  { id: 'cat-pharmacy', name: 'Pharmacy', type: 'expense', isDefault: true, color: '#f87171' },
  { id: 'cat-education', name: 'Education', type: 'expense', isDefault: true, color: '#fbbf24' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', isDefault: true, color: '#a78bfa' },
  { id: 'cat-sub', name: 'Subscription', type: 'expense', isDefault: true, color: '#c084fc' },
  { id: 'cat-travel', name: 'Travel', type: 'expense', isDefault: true, color: '#2dd4bf' },
  { id: 'cat-home', name: 'Home Maintenance', type: 'expense', isDefault: true, color: '#a3a3a3' },
  { id: 'cat-electronics', name: 'Electronics', type: 'expense', isDefault: true, color: '#9ca3af' },
  { id: 'cat-personal', name: 'Personal Care', type: 'expense', isDefault: true, color: '#f472b6' },
  { id: 'cat-charity', name: 'Charity', type: 'expense', isDefault: true, color: '#10b981' },
  { id: 'cat-taxes', name: 'Taxes', type: 'expense', isDefault: true, color: '#64748b' },
  { id: 'cat-pet', name: 'Pet Care', type: 'expense', isDefault: true, color: '#fb923c' },
  { id: 'cat-gifts', name: 'Gifts', type: 'expense', isDefault: true, color: '#f43f5e' },
  { id: 'cat-misc', name: 'Miscellaneous', type: 'expense', isDefault: true, color: '#737373' },
  { id: 'cat-exp-other', name: 'Other', type: 'expense', isDefault: true, color: '#525252' },
];
