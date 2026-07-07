import { Transaction } from '@/types';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/currency';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onRowClick: (id: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

export function TransactionTable({ 
  transactions, 
  selectedIds, 
  onSelect, 
  onSelectAll, 
  onRowClick,
  sortConfig,
  onSort
}: TransactionTableProps) {
  const { categories } = useCategoryStore();
  const { accounts } = useAccountStore();
  // removed unused store

  const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name || '-';
  const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || '-';

  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < transactions.length;

  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <span className="ml-1 opacity-0 group-hover:opacity-50">↕</span>;
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="w-full overflow-auto rounded-xl border border-border bg-card shadow-sm max-h-[70vh]">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="p-4 w-12">
              <input 
                type="checkbox" 
                className="rounded border-input text-primary focus:ring-ring"
                checked={allSelected}
                ref={input => { if (input) input.indeterminate = someSelected; }}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <th className="p-4 cursor-pointer group hover:text-foreground" onClick={() => onSort('date')}>
              Date <SortIndicator columnKey="date" />
            </th>
            <th className="p-4 cursor-pointer group hover:text-foreground" onClick={() => onSort('type')}>
              Type <SortIndicator columnKey="type" />
            </th>
            <th className="p-4 cursor-pointer group hover:text-foreground" onClick={() => onSort('category')}>
              Category <SortIndicator columnKey="category" />
            </th>
            <th className="p-4 cursor-pointer group hover:text-foreground" onClick={() => onSort('account')}>
              Account <SortIndicator columnKey="account" />
            </th>
            <th className="p-4">Notes</th>
            <th className="p-4 text-right cursor-pointer group hover:text-foreground" onClick={() => onSort('amount')}>
              Amount <SortIndicator columnKey="amount" />
            </th>
            <th className="p-4 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((txn) => {
            const isSelected = selectedIds.has(txn.id);
            return (
              <tr 
                key={txn.id} 
                className={cn(
                  "hover:bg-muted/50 transition-colors",
                  isSelected ? "bg-emerald-50 dark:bg-emerald-950/20" : "",
                  txn.isArchived ? "opacity-60" : ""
                )}
              >
                <td className="p-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-input text-primary focus:ring-ring"
                    checked={isSelected}
                    onChange={(e) => onSelect(txn.id, e.target.checked)}
                  />
                </td>
                <td className="p-4 font-medium" onClick={() => onRowClick(txn.id)}>
                  {format(new Date(txn.date), 'MMM dd, yyyy')}
                </td>
                <td className="p-4" onClick={() => onRowClick(txn.id)}>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize",
                    txn.type === 'income' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    txn.type === 'expense' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  )}>
                    {txn.type === 'income' && <ArrowUp className="w-3 h-3" />}
                    {txn.type === 'expense' && <ArrowDown className="w-3 h-3" />}
                    {txn.type === 'transfer' && <ArrowRightLeft className="w-3 h-3" />}
                    {txn.type}
                  </span>
                </td>
                <td className="p-4" onClick={() => onRowClick(txn.id)}>
                  {txn.type === 'transfer' ? '-' : getCategoryName(txn.categoryId)}
                </td>
                <td className="p-4" onClick={() => onRowClick(txn.id)}>
                  {txn.type === 'transfer' 
                    ? <span className="flex items-center gap-2 text-xs"><span>{getAccountName(txn.fromAccountId)}</span><ArrowRightLeft className="w-3 h-3"/><span>{getAccountName(txn.toAccountId)}</span></span>
                    : getAccountName(txn.accountId)}
                </td>
                <td className="p-4 truncate max-w-[200px]" onClick={() => onRowClick(txn.id)}>
                  <div className="text-muted-foreground">{txn.notes || '-'}</div>
                  {txn.addedBy && (
                    <div className="text-[10px] font-medium text-primary/70 mt-0.5">
                      Added by: {txn.addedBy}
                    </div>
                  )}
                </td>
                <td className={cn(
                  "p-4 text-right font-semibold",
                  txn.type === 'income' ? "text-emerald-500" :
                  txn.type === 'expense' ? "text-rose-500" :
                  "text-muted-foreground"
                )} onClick={() => onRowClick(txn.id)}>
                  {txn.type === 'expense' ? '-' : txn.type === 'income' ? '+' : ''}
                  {formatCurrency(txn.amount)}
                </td>
                <td className="p-4 text-center" onClick={() => onRowClick(txn.id)}>
                  {txn.isArchived ? (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">Archived</span>
                  ) : (
                    <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">Active</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {transactions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No transactions found for the given criteria.
        </div>
      )}
    </div>
  );
}
