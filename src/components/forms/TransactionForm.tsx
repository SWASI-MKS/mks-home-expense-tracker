import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { Transaction } from '@/types';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBalanceEngine } from '@/hooks/useBalanceEngine';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/currency';

const baseSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Amount must be greater than zero'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  notes: z.string().optional(),
});

const incomeExpenseSchema = baseSchema.extend({
  type: z.enum(['income', 'expense']),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().min(1, 'Category is required'),
});

const transferSchema = baseSchema.extend({
  type: z.literal('transfer'),
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
}).refine(data => data.fromAccountId !== data.toAccountId, {
  message: "Cannot transfer to the same account",
  path: ["toAccountId"],
});

const transactionSchema = z.discriminatedUnion('type', [
  incomeExpenseSchema,
  transferSchema
]);

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  editId?: string | null;
  initialData?: Transaction | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({ editId, initialData, onSuccess, onCancel }: TransactionFormProps) {
  const { accounts } = useAccountStore();
  const { categories } = useCategoryStore();
  const { transactions, addTransaction, updateTransaction, checkDuplicate } = useTransactionStore();
  const { currency } = useSettingsStore();
  const { getAccountBalance } = useBalanceEngine();

  const [hasWarnedDuplicate, setHasWarnedDuplicate] = useState(false);

  const existingTxn = editId ? transactions.find(t => t.id === editId) : null;
  const sourceTxn = initialData || existingTxn;

  let initialValues: any = {
    type: 'expense',
    amount: undefined,
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    accountId: '',
    categoryId: '',
  };

  if (sourceTxn) {
    initialValues = {
      type: sourceTxn.type,
      amount: sourceTxn.amount,
      date: initialData ? format(new Date(), 'yyyy-MM-dd') : format(new Date(sourceTxn.date), 'yyyy-MM-dd'),
      notes: initialData ? (sourceTxn.notes ? `${sourceTxn.notes} (Copy)` : 'Copy') : (sourceTxn.notes || ''),
      ...(sourceTxn.type === 'transfer' ? {
        fromAccountId: sourceTxn.fromAccountId,
        toAccountId: sourceTxn.toAccountId,
      } : {
        accountId: sourceTxn.accountId,
        categoryId: sourceTxn.categoryId,
      })
    };
  } else {
    const dupId = localStorage.getItem('duplicate_txn_id');
    if (dupId) {
      const dupTxn = transactions.find(t => t.id === dupId);
      if (dupTxn) {
        initialValues = {
          type: dupTxn.type,
          amount: dupTxn.amount,
          date: format(new Date(), 'yyyy-MM-dd'),
          notes: dupTxn.notes ? `${dupTxn.notes} (Copy)` : 'Copy',
          ...(dupTxn.type === 'transfer' ? {
            fromAccountId: dupTxn.fromAccountId,
            toAccountId: dupTxn.toAccountId,
          } : {
            accountId: dupTxn.accountId,
            categoryId: dupTxn.categoryId,
          })
        };
      }
      localStorage.removeItem('duplicate_txn_id');
    }
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialValues
  });

  const type = watch('type');
  const watchAccountId = watch(type === 'transfer' ? 'fromAccountId' : 'accountId' as any);
  const watchToAccountId = watch(type === 'transfer' ? 'toAccountId' : 'accountId' as any); // just mapping for types

  const selectedAccountBalance = watchAccountId ? getAccountBalance(watchAccountId).currentBalance : undefined;
  const selectedToAccountBalance = watchToAccountId ? getAccountBalance(watchToAccountId).currentBalance : undefined;

  const onSubmit = (data: TransactionFormValues) => {
    const isDuplicate = checkDuplicate(data);
    
    if (isDuplicate && !hasWarnedDuplicate && !editId) {
      toast.error('Similar transaction detected. Click Save again to confirm.', { icon: '⚠️' });
      setHasWarnedDuplicate(true);
      return;
    }

    try {
      if (editId) {
        updateTransaction(editId, data);
        toast.success('Transaction updated successfully');
      } else {
        addTransaction(data);
        toast.success('Transaction added successfully');
      }
      onSuccess?.();
    } catch {
      toast.error('Failed to save transaction');
    }
  };

  useKeyboardShortcut({ key: 's', ctrlKey: true }, () => {
    if (watch('type') && watch('amount') && watch('date')) {
      handleSubmit(onSubmit)();
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Type Selector */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => { setValue('type', 'expense'); setValue('accountId', ''); setValue('categoryId', ''); }}
          className={cn("flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors", type === 'expense' ? "bg-card shadow-sm text-rose-500" : "text-muted-foreground hover:text-foreground")}
        >
          <TrendingDown className="w-4 h-4" /> Expense
        </button>
        <button
          type="button"
          onClick={() => { setValue('type', 'income'); setValue('accountId', ''); setValue('categoryId', ''); }}
          className={cn("flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors", type === 'income' ? "bg-card shadow-sm text-emerald-500" : "text-muted-foreground hover:text-foreground")}
        >
          <TrendingUp className="w-4 h-4" /> Income
        </button>
        <button
          type="button"
          onClick={() => { setValue('type', 'transfer'); setValue('fromAccountId', ''); setValue('toAccountId', ''); }}
          className={cn("flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors", type === 'transfer' ? "bg-card shadow-sm text-blue-500" : "text-muted-foreground hover:text-foreground")}
        >
          <ArrowRightLeft className="w-4 h-4" /> Transfer
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currency}</span>
            <Input 
              type="number" 
              step="0.01" 
              className="pl-8" 
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })} 
            />
          </div>
          {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
        </div>
      </div>

      {type === 'transfer' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Account</label>
            <select 
              {...register('fromAccountId' as any)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select source</option>
              {[...accounts].sort((a, b) => a.name.localeCompare(b.name)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {/* @ts-ignore */}
            {errors.fromAccountId && <p className="text-sm text-destructive mt-1">{errors.fromAccountId.message}</p>}
            {selectedAccountBalance !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">Balance: {formatCurrency(selectedAccountBalance)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Account</label>
            <select 
              {...register('toAccountId' as any)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select destination</option>
              {[...accounts].sort((a, b) => a.name.localeCompare(b.name)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {/* @ts-ignore */}
            {errors.toAccountId && <p className="text-sm text-destructive mt-1">{errors.toAccountId.message}</p>}
            {selectedToAccountBalance !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">Balance: {formatCurrency(selectedToAccountBalance)}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Account</label>
            <select 
              {...register('accountId' as any)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select account</option>
              {[...accounts].sort((a, b) => a.name.localeCompare(b.name)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {/* @ts-ignore */}
            {errors.accountId && <p className="text-sm text-destructive mt-1">{errors.accountId.message}</p>}
            {selectedAccountBalance !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">Balance: {formatCurrency(selectedAccountBalance)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select 
              {...register('categoryId' as any)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select category</option>
              {[...categories].filter(c => c.type === type).sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {/* @ts-ignore */}
            {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea 
          {...register('notes')}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">
          {hasWarnedDuplicate && !editId ? 'Confirm Duplicate' : 'Save Transaction'}
        </Button>
      </div>
    </form>
  );
}
