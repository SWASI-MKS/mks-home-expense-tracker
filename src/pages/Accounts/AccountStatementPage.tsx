import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStatementData, StatementFilters, DateFilterType } from '@/hooks/useStatementData';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { format } from 'date-fns';
import { ArrowLeft, Search, Filter, CheckCircle, AlertTriangle, FileBadge, FileSpreadsheet, FileArchive } from 'lucide-react';
import { exportStatementToCSV, exportStatementToExcel, exportStatementToPDF } from '@/utils/statementExport';
import { formatCurrency } from '@/utils/currency';

export function AccountStatementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories } = useCategoryStore();

  const [filters, setFilters] = useState<StatementFilters>({
    dateFilter: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const statement = useStatementData(id, filters);

  if (!statement) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Account Not Found</h2>
        <Button onClick={() => navigate('/accounts')}>Back to Accounts</Button>
      </div>
    );
  }

  const { account, rows, summary, isBalanced } = statement;

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    switch (type) {
      case 'csv':
        exportStatementToCSV(statement, categories);
        break;
      case 'excel':
        exportStatementToExcel(statement, categories);
        break;
      case 'pdf':
        exportStatementToPDF(statement, categories);
        break;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="p-2" onClick={() => navigate('/accounts')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Account Statement</h1>
            <p className="text-sm text-muted-foreground">{account.name} • {account.type.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('pdf')} title="Download PDF Report">
            <FileBadge className="w-4 h-4 mr-2 text-rose-500" /> PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')} title="Download Excel">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} title="Download CSV">
            <FileArchive className="w-4 h-4 mr-2 text-blue-500" /> CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card">
          <p className="text-sm font-medium text-muted-foreground mb-1">Opening Balance</p>
          <p className="text-xl font-bold">{formatCurrency(summary.periodOpeningBalance)}</p>
        </Card>
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total Credits</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-500">+{formatCurrency(summary.totalCredits)}</p>
        </Card>
        <Card className="p-4 bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-1">Total Debits</p>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-500">-{formatCurrency(summary.totalDebits)}</p>
        </Card>
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Closing Balance</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-500">{formatCurrency(summary.closingBalance)}</p>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by ID, Notes, Amount, Added By..." 
              className="pl-9"
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-secondary' : ''}>
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date Period</label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={filters.dateFilter}
                onChange={(e) => setFilters({ ...filters, dateFilter: e.target.value as DateFilterType })}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            {filters.dateFilter === 'custom' && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
                  <Input type="date" value={filters.customStartDate || ''} onChange={(e) => setFilters({ ...filters, customStartDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
                  <Input type="date" value={filters.customEndDate || ''} onChange={(e) => setFilters({ ...filters, customEndDate: e.target.value })} />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Transaction Type</label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={filters.type || 'all'}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={filters.categoryId || ''}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Ledger Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Debit</th>
                <th className="px-6 py-4 font-medium text-right">Credit</th>
                <th className="px-6 py-4 font-medium text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr key={row.transactionId || `opening-${i}`} className={row.isOpeningBalance ? 'bg-secondary/30' : 'hover:bg-muted/50 transition-colors'}>
                  <td className="px-6 py-4">
                    {row.isOpeningBalance ? '-' : format(new Date(row.date), 'dd-MMM-yyyy')}
                    {row.transactionId && <div className="text-[10px] text-muted-foreground mt-0.5">{row.transactionId.substring(0,8)}...</div>}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {row.description}
                    {row.addedBy && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">by {row.addedBy}</span>}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {row.categoryId ? categories.find(c => c.id === row.categoryId)?.name || '-' : '-'}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {row.isOpeningBalance ? '-' : row.type}
                  </td>
                  <td className="px-6 py-4 text-right text-rose-500">
                    {row.debit > 0 ? `${formatCurrency(row.debit)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-500">
                    {row.credit > 0 ? `${formatCurrency(row.credit)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold">
                    {formatCurrency(row.runningBalance)}
                  </td>
                </tr>
              ))}
              {rows.length === 1 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No transactions found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer & Verification */}
        <div className="bg-secondary/30 p-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm space-y-1 text-muted-foreground">
            <p><strong>Generated:</strong> {format(new Date(), 'PPpp')}</p>
            <p><strong>Transactions:</strong> {summary.transactionCount}</p>
          </div>
          
          <div className="flex items-center gap-6">
            {isBalanced ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                <CheckCircle className="w-4 h-4" /> Statement Balanced
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/30">
                <AlertTriangle className="w-4 h-4" /> Reconciliation Error
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
