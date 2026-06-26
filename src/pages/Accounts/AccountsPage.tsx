import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Wallet } from 'lucide-react';
import { useAccountStore } from '@/stores/useAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card, CardContent } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@/stores/useSettingsStore';

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['cash', 'bank', 'wallet', 'credit', 'investment', 'other']),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount, initializeDefaults } = useAccountStore();
  const { hasTransactionsForAccount } = useTransactionStore();
  const { currency } = useSettingsStore();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'bank',
    }
  });

  useEffect(() => {
    initializeDefaults();
  }, [initializeDefaults]);

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) || 
    acc.type.toLowerCase().includes(search.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingId(null);
    reset({ name: '', type: 'bank' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    setEditingId(id);
    setValue('name', acc.name);
    setValue('type', acc.type as AccountFormValues['type']);
    setIsDialogOpen(true);
  };

  const onSubmit = (data: AccountFormValues) => {
    try {
      if (editingId) {
        updateAccount(editingId, data);
        toast.success('Account updated successfully');
      } else {
        addAccount(data);
        toast.success('Account added successfully');
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteAccount(deleteId);
    toast.success('Account deleted successfully');
    setDeleteId(null);
  };

  const requestDelete = (id: string) => {
    if (hasTransactionsForAccount(id)) {
      toast.error('Cannot delete account with existing transactions.');
      return;
    }
    setDeleteId(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your payment sources and balances.</p>
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search accounts..." 
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No accounts found</h3>
          <p className="text-muted-foreground">Try adjusting your search or add a new account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map(acc => (
            <Card key={acc.id} className="relative group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{acc.name}</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-full capitalize">
                      {acc.type}
                    </span>
                  </div>
                  {!acc.isDefault && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditDialog(acc.id)} className="text-muted-foreground hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => requestDelete(acc.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-primary">
                    {currency}{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Account' : 'Add New Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Account Name</label>
              <Input {...register('name')} placeholder="e.g. HDFC Salary" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <select 
                {...register('type')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="bank">Bank Account</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit Card</option>
                <option value="wallet">Wallet (UPI, Paytm, etc)</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
              </select>
              {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Account"
        description="Are you sure you want to delete this account? This action cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
