import React from 'react';
import { Transaction, Account, Category } from '@/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { MoreHorizontal, Edit, Copy, Trash2, Eye, User, ArrowRight, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { onCheckedChange?: (c: boolean) => void }>(({ className, onCheckedChange, ...props }, ref) => (
  <input type="checkbox" ref={ref} onChange={(e) => onCheckedChange?.(e.target.checked)} className={`h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`} {...props} />
));
Checkbox.displayName = "Checkbox";

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' | 'outline' | 'secondary' }>(({ className, variant: _variant = 'default', ...props }, ref) => (
  <div ref={ref} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className || ''}`} {...props} />
));
Badge.displayName = "Badge";

const DropdownMenu = ({ children, isOpen, onToggle }: { children: React.ReactNode; isOpen: boolean; onToggle: (e: React.MouseEvent) => void }) => {
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, { onClick: onToggle });
          }
          if (child.type === DropdownMenuContent) {
            return isOpen ? child : null;
          }
        }
        return child;
      })}
    </div>
  );
};

const DropdownMenuTrigger = ({ children, onClick }: any) => (
  <div onClick={(e) => { e.stopPropagation(); onClick?.(e); }} className="cursor-pointer">
    {children}
  </div>
);

const DropdownMenuContent = ({ children, align }: any) => (
  <div className={`absolute ${align === 'end' ? 'right-0' : 'left-0'} mt-2 w-48 rounded-md shadow-lg bg-popover ring-1 ring-black ring-opacity-5 z-50 p-1 border border-border`} onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

const DropdownMenuItem = ({ children, onClick, className }: any) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }} 
    className={`w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-muted rounded-sm flex items-center ${className || ''}`}
  >
    {children}
  </button>
);

export interface LedgerTableProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  runningBalances: Record<string, number>;
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRequestEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onViewStatement: (accountId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  currentMemberName: string | null;
}

export const LedgerTable: React.FC<LedgerTableProps> = React.memo(({
  transactions, categories, accounts, runningBalances, selectedIds,
  onSelect, onSelectAll, onView, onEdit, onDuplicate, onDelete, 
  onRequestEdit, onRequestDelete, onViewStatement,
  currentPage, totalPages, onPageChange, currentMemberName
}) => {
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleClose = () => setActiveMenuId(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);
  
  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;
  
  const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name || '-';
  const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || '-';
  
  const renderAccount = (t: Transaction) => {
    if (t.type === 'transfer') {
      return (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">{getAccountName(t.fromAccountId)}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span>{getAccountName(t.toAccountId)}</span>
        </div>
      );
    }
    return getAccountName(t.accountId);
  };

  const getStatusBadge = (t: Transaction) => {
    if (t.isArchived) return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Deleted</Badge>;
    if (t.type === 'transfer') return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Transfer</Badge>;
    // Future Scheduled
    return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/20">Completed</Badge>;
  };

  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="p-4 w-12"><Checkbox checked={allSelected} onCheckedChange={(c) => onSelectAll(c as boolean)} /></th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Transaction ID</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Account</th>
                <th className="p-4 font-medium text-right text-emerald-500">Credit</th>
                <th className="p-4 font-medium text-right text-red-500">Debit</th>
                <th className="p-4 font-medium text-right">Balance</th>
                <th className="p-4 font-medium">Added By</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium w-12 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-muted-foreground">
                    No transactions found in this ledger.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className={cn("border-b border-border hover:bg-muted/30 transition-colors", selectedIds.has(t.id) && "bg-muted/50")}>
                    <td className="p-4"><Checkbox checked={selectedIds.has(t.id)} onCheckedChange={(c) => onSelect(t.id, c as boolean)} /></td>
                    <td className="p-4 whitespace-nowrap">{format(new Date(t.date), 'dd MMM yyyy')}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{t.id}</td>
                    <td className="p-4 capitalize">{t.type}</td>
                    <td className="p-4">{getCategoryName(t.categoryId)}</td>
                    <td className="p-4">{renderAccount(t)}</td>
                    <td className="p-4 text-right text-emerald-500 font-medium">
                      {t.type === 'income' ? formatCurrency(t.amount) : t.type === 'transfer' ? formatCurrency(t.amount) : '-'}
                    </td>
                    <td className="p-4 text-right text-red-500 font-medium">
                      {t.type === 'expense' ? formatCurrency(t.amount) : t.type === 'transfer' ? formatCurrency(t.amount) : '-'}
                    </td>
                    <td className="p-4 text-right font-medium">{formatCurrency(runningBalances[t.id] || 0)}</td>
                    <td className="p-4">{t.addedBy || 'System'}</td>
                    <td className="p-4">{getStatusBadge(t)}</td>
                    <td className="p-4 text-center">
                      <DropdownMenu 
                        isOpen={activeMenuId === t.id} 
                        onToggle={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === t.id ? null : t.id);
                        }}
                      >
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(t.id)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
          {(() => {
            const transactionOwner = (t.addedBy || '').trim().toLowerCase();
            const currentMember = (currentMemberName || '').trim().toLowerCase();
            console.log('Transaction ID:', t.id);
            console.log('Transaction owner (raw):', t.addedBy);
            console.log('Transaction owner (normalized):', transactionOwner);
            console.log('Current member name (raw):', currentMemberName);
            console.log('Current member name (normalized):', currentMember);
            console.log('Is owner:', transactionOwner === currentMember);
            return transactionOwner === currentMember;
          })() ? (
            <>
              <DropdownMenuItem onClick={() => onEdit(t.id)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(t.id)}><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
              {t.type !== 'transfer' && t.accountId && (
                <DropdownMenuItem onClick={() => onViewStatement(t.accountId!)}><FileText className="w-4 h-4 mr-2" /> View Statement</DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(t.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => onDuplicate(t.id)}><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRequestEdit(t.id)}><Edit className="w-4 h-4 mr-2" /> Request Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onRequestDelete(t.id)}><Trash2 className="w-4 h-4 mr-2" /> Request Delete</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {transactions.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-xl border border-border text-muted-foreground">
            No transactions found.
          </div>
        ) : (
          transactions.map(t => {
            const isExpanded = expandedCards.has(t.id);
            return (
              <div key={t.id} className={cn("bg-card rounded-xl border border-border p-4 space-y-3", selectedIds.has(t.id) && "border-primary")}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedIds.has(t.id)} onCheckedChange={(c) => onSelect(t.id, c as boolean)} />
                    <div>
                      <div className="font-medium">{getCategoryName(t.categoryId)}</div>
                      <div className="text-xs text-muted-foreground">{renderAccount(t)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("font-bold", t.type === 'income' ? 'text-emerald-500' : t.type === 'expense' ? 'text-red-500' : 'text-blue-500')}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}{formatCurrency(t.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">{format(new Date(t.date), 'dd MMM yyyy')}</div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="pt-3 border-t border-border space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span>{t.notes || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{format(new Date(t.date), 'hh:mm a')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Running Balance</span><span className="font-medium">{formatCurrency(runningBalances[t.id] || 0)}</span></div>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <div className="flex gap-2 items-center">
                    {getStatusBadge(t)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> {t.addedBy || 'System'}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onView(t.id)}><Eye className="w-4 h-4" /></Button>
                    {(() => {
                      const transactionOwner = (t.addedBy || '').trim().toLowerCase();
                      const currentMember = (currentMemberName || '').trim().toLowerCase();
                      return transactionOwner === currentMember;
                    })() ? (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(t.id)}><Edit className="w-4 h-4" /></Button>
                    ) : null}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleCard(t.id)}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
});
