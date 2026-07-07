import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Wallet, FileText, ArrowLeft, ChevronRight } from 'lucide-react';
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
import { useBalanceEngine } from '@/hooks/useBalanceEngine';
import { formatCurrency } from '@/utils/currency';
import { AccountType, Account } from '@/types';
import { ACCOUNT_TYPE_INFO, mapLegacyTypeToAccountType } from '@/constants/defaults';


// Zod schema for account form - dynamic based on type
const baseAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  accountType: z.enum(['bank_account', 'credit_card', 'debit_card', 'upi_wallet', 'cash_wallet', 'investment', 'loan']),
  openingBalance: z.coerce.number({ message: "Opening Balance must be a valid number" }),
  openingBalanceDate: z.string().optional(),
  description: z.string().optional(),
});

// Additional fields for specific types
const bankAccountSchema = baseAccountSchema.extend({
  accountType: z.literal('bank_account'),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  branch: z.string().optional(),
  ifsc: z.string().optional(),
});

const creditCardSchema = baseAccountSchema.extend({
  accountType: z.literal('credit_card'),
  bankName: z.string().optional(),
  cardNumber: z.string().optional(),
  creditLimit: z.coerce.number().optional(),
  billingDate: z.string().optional(),
  dueDate: z.string().optional(),
});

const debitCardSchema = baseAccountSchema.extend({
  accountType: z.literal('debit_card'),
  bankName: z.string().optional(),
  cardNumber: z.string().optional(),
});

const upiWalletSchema = baseAccountSchema.extend({
  accountType: z.literal('upi_wallet'),
  provider: z.string().optional(),
  linkedAccountId: z.string().optional(),
  upiId: z.string().optional(),
});

const cashWalletSchema = baseAccountSchema.extend({
  accountType: z.literal('cash_wallet'),
});

const investmentSchema = baseAccountSchema.extend({
  accountType: z.literal('investment'),
});

const loanSchema = baseAccountSchema.extend({
  accountType: z.literal('loan'),
});

const accountFormSchema = z.discriminatedUnion('accountType', [
  bankAccountSchema,
  creditCardSchema,
  debitCardSchema,
  upiWalletSchema,
  cashWalletSchema,
  investmentSchema,
  loanSchema,
]);

type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount, initializeDefaults } = useAccountStore();
  const { hasTransactionsForAccount } = useTransactionStore();
  const { getAccountBalance } = useBalanceEngine();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema as any),
    defaultValues: {
      name: '',
      accountType: 'bank_account',
      openingBalance: 0,
      openingBalanceDate: '',
      description: '',
      bankName: '',
      accountNumber: '',
      branch: '',
      ifsc: '',
      cardNumber: '',
      creditLimit: undefined,
      billingDate: '',
      dueDate: '',
      provider: '',
      linkedAccountId: '',
      upiId: '',
    } as any
  });

  const selectedFormType = watch('accountType');

  useEffect(() => {
    initializeDefaults();
  }, [initializeDefaults]);

  // Group accounts by accountType
  const groupedAccounts = useMemo(() => {
    const groups: Record<AccountType, Account[]> = {} as Record<AccountType, Account[]>;
    Object.keys(ACCOUNT_TYPE_INFO).forEach(type => {
      groups[type as AccountType] = [];
    });
    
    accounts.forEach(acc => {
      if (groups[acc.accountType]) {
        groups[acc.accountType].push(acc);
      }
    });
    
    return groups;
  }, [accounts]);

  // Filter accounts by search
  const filteredGroupedAccounts = useMemo(() => {
    if (!search) return groupedAccounts;
    
    const searchLower = search.toLowerCase();
    const filtered: Record<AccountType, Account[]> = {} as Record<AccountType, Account[]>;
    
    Object.entries(groupedAccounts).forEach(([type, typeAccounts]) => {
      filtered[type as AccountType] = typeAccounts.filter(acc => 
        acc.name.toLowerCase().includes(searchLower) ||
        (acc.lastFourDigits && acc.lastFourDigits.includes(search)) ||
        (acc.bankName && acc.bankName.toLowerCase().includes(searchLower)) ||
        (acc.provider && acc.provider.toLowerCase().includes(searchLower))
      );
    });
    
    return filtered;
  }, [groupedAccounts, search]);

  const openAddDialog = () => {
    setEditingId(null);
    reset({
      name: '',
      accountType: 'bank_account',
      openingBalance: 0,
      openingBalanceDate: '',
      description: '',
      bankName: '',
      accountNumber: '',
      branch: '',
      ifsc: '',
      cardNumber: '',
      creditLimit: undefined,
      billingDate: '',
      dueDate: '',
      provider: '',
      linkedAccountId: '',
      upiId: '',
    } as any);
    setIsDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    try {
      const acc = accounts.find(a => a.id === id);
      if (!acc) return;
      setEditingId(id);
      
      reset({
        name: acc.name,
        accountType: acc.accountType || mapLegacyTypeToAccountType(acc.type) || 'bank_account',
        openingBalance: acc.openingBalance || 0,
        openingBalanceDate: acc.openingBalanceDate || '',
        description: acc.description || '',
        bankName: acc.bankName || '',
        accountNumber: acc.accountNumber || '',
        branch: acc.branch || '',
        ifsc: acc.ifsc || '',
        cardNumber: acc.cardNumber || '',
        creditLimit: acc.creditLimit || undefined,
        billingDate: acc.billingDate || '',
        dueDate: acc.dueDate || '',
        provider: acc.provider || '',
        linkedAccountId: acc.linkedAccountId || '',
        upiId: acc.upiId || '',
      } as any);
      
      setIsDialogOpen(true);
    } catch (err: any) {
      console.error("Error in openEditDialog:", err);
      toast.error(`Error opening edit dialog: ${err.message}`);
    }
  };

  const onSubmit = (data: AccountFormValues) => {
    try {
      if (editingId) {
        updateAccount(editingId, data as any);
        toast.success('Account updated successfully');
      } else {
        addAccount({ ...data, type: data.accountType } as any);
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

  // Calculate total balance for an account type
  const getTypeTotalBalance = (type: AccountType) => {
    return filteredGroupedAccounts[type].reduce((sum, acc) => {
      const balance = getAccountBalance(acc.id).currentBalance;
      return sum + balance;
    }, 0);
  };

  // Render dynamic form fields based on selected type
  const renderDynamicFields = () => {
    switch (selectedFormType) {
      case 'bank_account':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <Input {...register('bankName')} placeholder="e.g. State Bank of India" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <Input {...register('accountNumber')} placeholder="e.g. 1234567890" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <Input {...register('branch')} placeholder="e.g. Main Branch" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IFSC Code</label>
              <Input {...register('ifsc')} placeholder="e.g. SBIN0001234" />
            </div>
          </>
        );
      case 'credit_card':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Bank/Provider</label>
              <Input {...register('bankName')} placeholder="e.g. HDFC Bank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Card Number</label>
              <Input {...register('cardNumber')} placeholder="e.g. 4111-1111-1111-1111" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Credit Limit</label>
              <Input type="number" step="0.01" {...register('creditLimit')} placeholder="e.g. 50000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Billing Date</label>
              <Input type="date" {...register('billingDate')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <Input type="date" {...register('dueDate')} />
            </div>
          </>
        );
      case 'debit_card':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <Input {...register('bankName')} placeholder="e.g. ICICI Bank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Card Number</label>
              <Input {...register('cardNumber')} placeholder="e.g. 4111-1111-1111-1111" />
            </div>
          </>
        );
      case 'upi_wallet':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select 
                {...register('provider')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Select Provider</option>
                <option value="GPay">Google Pay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="Bhim">BHIM</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Linked Bank Account</label>
              <select 
                {...register('linkedAccountId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">None</option>
                {accounts.filter(a => a.accountType === 'bank_account').map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">UPI ID</label>
              <Input {...register('upiId')} placeholder="e.g. name@upi" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // If we're viewing a specific account type
  if (selectedAccountType) {
    const typeInfo = ACCOUNT_TYPE_INFO[selectedAccountType];
    const typeAccounts = filteredGroupedAccounts[selectedAccountType];
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedAccountType(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span className="text-2xl">{typeInfo.icon}</span>
              {typeInfo.label}
            </h1>
            <p className="text-muted-foreground">{typeInfo.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {typeAccounts.map(acc => {
            const { currentBalance } = getAccountBalance(acc.id);
            return (
              <Card key={acc.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{acc.name}</h3>
                      {acc.lastFourDigits && (
                        <p className="text-muted-foreground text-sm">•••• {acc.lastFourDigits}</p>
                      )}
                      {acc.provider && (
                        <p className="text-muted-foreground text-sm">{acc.provider}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openEditDialog(acc.id); }} className="text-muted-foreground hover:text-primary p-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!acc.isDefault && (
                        <button onClick={(e) => { e.stopPropagation(); requestDelete(acc.id); }} className="text-muted-foreground hover:text-destructive p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-muted-foreground text-sm">Current Balance</p>
                    <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate(`/accounts/${acc.id}`)}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/accounts/${acc.id}/statement`)}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {typeAccounts.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Wallet className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No accounts found</h3>
              <p className="text-muted-foreground mb-4">Add your first account to get started</p>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render account type grid
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your payment sources and balances</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(ACCOUNT_TYPE_INFO).map(([type, info]) => {
          const typeAccounts = filteredGroupedAccounts[type as AccountType];
          if (typeAccounts.length === 0 && search) return null;
          
          const totalBalance = getTypeTotalBalance(type as AccountType);
          
          return (
            <Card 
              key={type} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedAccountType(type as AccountType)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${info.color}`}>
                    <span className="text-2xl">{info.icon}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <h3 className="font-semibold text-lg mb-1">{info.label}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {typeAccounts.length} {typeAccounts.length === 1 ? 'account' : 'accounts'}
                </p>
                
                <div>
                  <p className="text-muted-foreground text-sm">Total Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Account' : 'Add New Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <select 
                {...register('accountType')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {Object.entries(ACCOUNT_TYPE_INFO).map(([type, info]) => (
                  <option key={type} value={type}>{info.icon} {info.label.replace('s', '')}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Account Name</label>
              <Input {...register('name')} placeholder="e.g. HDFC Salary" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            
            {renderDynamicFields()}
            
            <div>
              <label className="block text-sm font-medium mb-1">Opening Balance</label>
              <Input type="number" step="0.01" {...register('openingBalance')} placeholder="e.g. 50000" />
              {errors.openingBalance && <p className="text-sm text-destructive mt-1">{errors.openingBalance.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Opening Balance Date (Optional)</label>
              <Input type="date" {...register('openingBalanceDate')} />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <Input {...register('description')} placeholder="e.g. Main salary account" />
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
