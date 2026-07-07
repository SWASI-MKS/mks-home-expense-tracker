import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { Transaction } from '@/types';
import { Search, FileBadge, FileSpreadsheet, FileArchive, ArrowUpDown } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/dataManagement';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/currency';

interface ReportTableProps {
  transactions: Transaction[];
  summary: any;
}

type SortField = 'date' | 'amount' | 'category' | 'account';
type SortOrder = 'asc' | 'desc';

export function ReportTable({ transactions, summary }: ReportTableProps) {
  const { numberFormat } = useSettingsStore();
  const { categories } = useCategoryStore();
  const { accounts } = useAccountStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');



  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';

  const filteredAndSorted = transactions
    .filter(t => {
      const search = searchTerm.toLowerCase();
      return (
        (t.notes || '').toLowerCase().includes(search) ||
        getCategoryName(t.categoryId || '').toLowerCase().includes(search) ||
        getAccountName(t.accountId || '').toLowerCase().includes(search) ||
        t.amount.toString().includes(search)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortField === 'amount') comparison = a.amount - b.amount;
      if (sortField === 'category') comparison = getCategoryName(a.categoryId || '').localeCompare(getCategoryName(b.categoryId || ''));
      if (sortField === 'account') comparison = getAccountName(a.accountId || '').localeCompare(getAccountName(b.accountId || ''));
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <Card className="flex flex-col">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-medium">Transactions Report</h3>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportToPDF(filteredAndSorted, summary)} title="Download PDF Report"><FileBadge className="w-4 h-4 text-rose-500" /></Button>
            <Button variant="outline" size="sm" onClick={() => exportToExcel(filteredAndSorted)} title="Download Excel"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /></Button>
            <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredAndSorted)} title="Download CSV"><FileArchive className="w-4 h-4 text-blue-500" /></Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted" onClick={() => toggleSort('date')}>
                <div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted" onClick={() => toggleSort('category')}>
                <div className="flex items-center gap-1">Category <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted" onClick={() => toggleSort('account')}>
                <div className="flex items-center gap-1">Account <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-muted text-right" onClick={() => toggleSort('amount')}>
                <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="w-3 h-3" /></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No transactions found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((t) => (
                <tr key={t.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Intl.DateTimeFormat(numberFormat, { 
                      year: 'numeric', month: 'short', day: '2-digit' 
                    }).format(new Date(t.date))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      t.type === 'income' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                    )}>
                      {getCategoryName(t.categoryId || '')}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getAccountName(t.accountId || '')}</td>
                  <td className="px-4 py-3 truncate max-w-[150px]">{t.notes || '-'}</td>
                  <td className={cn(
                    "px-4 py-3 text-right font-medium whitespace-nowrap",
                    t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
