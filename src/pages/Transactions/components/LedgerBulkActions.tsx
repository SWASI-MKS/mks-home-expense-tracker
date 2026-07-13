import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Trash2, RotateCcw, FolderOpen, CreditCard, Download, X, CheckCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Category, Account } from '@/types';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`} {...props} />
));
Select.displayName = "Select";

interface LedgerBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkRestore: () => void;
  onBulkChangeCategory: (categoryId: string) => void;
  onBulkChangeAccount: (accountId: string) => void;
  onBulkExport: (format: 'csv' | 'excel' | 'pdf') => void;
  onBulkMarkCleared: () => void;
  categories: Category[];
  accounts: Account[];
}

export const LedgerBulkActions: React.FC<LedgerBulkActionsProps> = ({
  selectedCount, onClearSelection, onBulkDelete, onBulkRestore, onBulkChangeCategory, onBulkChangeAccount, onBulkExport, onBulkMarkCleared, categories, accounts
}) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  if (selectedCount === 0) return null;

  const handleCategoryConfirm = () => {
    if (selectedCategory) {
      onBulkChangeCategory(selectedCategory);
      setCategoryOpen(false);
      setSelectedCategory('');
    }
  };

  const handleAccountConfirm = () => {
    if (selectedAccount) {
      onBulkChangeAccount(selectedAccount);
      setAccountOpen(false);
      setSelectedAccount('');
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 no-print">
        <div className="bg-popover text-popover-foreground shadow-2xl rounded-full border border-border px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-border pr-4">
            <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {selectedCount}
            </span>
            <span className="text-sm font-medium">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setCategoryOpen(true)} className="hover:text-primary">
              <FolderOpen className="w-4 h-4 mr-2" /> Category
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAccountOpen(true)} className="hover:text-primary">
              <CreditCard className="w-4 h-4 mr-2" /> Account
            </Button>
            <Button size="sm" variant="ghost" onClick={onBulkMarkCleared} className="hover:text-emerald-500">
              <CheckCircle className="w-4 h-4 mr-2" /> Mark Cleared
            </Button>
            <div className="relative">
              <Button size="sm" variant="ghost" onClick={() => setExportOpen(!exportOpen)} className="hover:text-emerald-500">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              {exportOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg shadow-lg py-1 w-32 z-50">
                  <button onClick={() => { onBulkExport('csv'); setExportOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-muted text-sm">CSV</button>
                  <button onClick={() => { onBulkExport('excel'); setExportOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-muted text-sm">Excel</button>
                  <button onClick={() => { onBulkExport('pdf'); setExportOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-muted text-sm">PDF</button>
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={onBulkRestore} className="hover:text-amber-500">
              <RotateCcw className="w-4 h-4 mr-2" /> Restore
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)} className="hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>

          <button onClick={onClearSelection} className="ml-2 p-1.5 hover:bg-muted rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Selected"
        description={`Are you sure you want to permanently delete ${selectedCount} selected transactions? This cannot be undone.`}
        onConfirm={() => {
          onBulkDelete();
          setDeleteOpen(false);
        }}
        variant="destructive"
        confirmText="Permanently Delete"
      />

      <ConfirmDialog
        open={categoryOpen}
        onOpenChange={setCategoryOpen}
        title="Change Category"
        description="Select a new category to apply to all selected transactions."
        onConfirm={handleCategoryConfirm}
        confirmText="Apply Category"
      >
        <div className="mt-4">
          <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="" disabled>Select a category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        title="Change Account"
        description="Select a new account to apply to all selected transactions."
        onConfirm={handleAccountConfirm}
        confirmText="Apply Account"
      >
        <div className="mt-4">
          <Select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
            <option value="" disabled>Select an account...</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </div>
      </ConfirmDialog>
    </>
  );
};
