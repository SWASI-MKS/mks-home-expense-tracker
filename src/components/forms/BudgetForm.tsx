import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

const budgetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  enabled: z.boolean(),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  editId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetForm({ editId, onSuccess, onCancel }: BudgetFormProps) {
  const { budgets, addBudget, updateBudget } = useBudgetStore();
  const { categories } = useCategoryStore();
  const { currency } = useSettingsStore();

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const existingBudget = editId ? budgets.find(b => b.id === editId) : null;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { register, handleSubmit, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: existingBudget ? {
      name: existingBudget.name,
      categoryId: existingBudget.categoryId,
      amount: existingBudget.amount,
      month: existingBudget.month,
      year: existingBudget.year,
      enabled: existingBudget.enabled,
    } : {
      name: '',
      categoryId: '',
      amount: undefined,
      month: currentMonth,
      year: currentYear,
      enabled: true,
    }
  });

  const onSubmit = (data: BudgetFormValues) => {
    // Prevent duplicate category budget for the same month/year
    const duplicate = budgets.find(
      b => b.categoryId === data.categoryId && b.month === data.month && b.year === data.year && b.id !== editId
    );

    if (duplicate) {
      toast.error('A budget for this category already exists for the selected month.');
      return;
    }

    try {
      if (editId) {
        updateBudget(editId, data);
        toast.success('Budget updated successfully');
      } else {
        addBudget(data);
        toast.success('Budget created successfully');
      }
      onSuccess?.();
    } catch {
      toast.error('Failed to save budget');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Budget Name</label>
        <Input placeholder="e.g., Monthly Groceries" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Expense Category</label>
        <select 
          {...register('categoryId')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select category...</option>
          {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Monthly Amount</label>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <select 
            {...register('month', { valueAsNumber: true })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <Input type="number" {...register('year', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input 
          type="checkbox" 
          id="enabled" 
          {...register('enabled')} 
          className="rounded border-input text-primary focus:ring-ring"
        />
        <label htmlFor="enabled" className="text-sm font-medium">Enable this budget</label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
        <Button type="submit">Save Budget</Button>
      </div>
    </form>
  );
}
