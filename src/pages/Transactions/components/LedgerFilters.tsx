import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar as CalendarIcon, DollarSign, User, Tag, CreditCard, Wallet, Activity, Download, Printer } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Category, Account } from '@/types';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`} {...props} />
));
Select.displayName = "Select";

export interface LedgerFilterState {
  search: string;
  type: string;
  categoryId: string;
  accountId: string;
  accountType: string;
  addedBy: string;
  status: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  quickDate: string;
}

interface LedgerFiltersProps {
  filters: LedgerFilterState;
  setFilters: (filters: LedgerFilterState) => void;
  categories: Category[];
  accounts: Account[];
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  onPrint?: () => void;
}

const MEMBERS = ['Dad', 'Mom', 'Shruti', 'Swasi'];
const STATUSES = ['all', 'completed', 'deleted'];
const TYPES = ['all', 'income', 'expense', 'transfer'];
const ACCOUNT_TYPES = ['all', 'cash', 'bank', 'wallet', 'credit'];
const QUICK_DATES = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Last Week', value: 'lastWeek' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Custom Range', value: 'custom' },
];

export const LedgerFilters: React.FC<LedgerFiltersProps> = React.memo(({ filters, setFilters, categories, accounts, onExport, onPrint }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== searchTerm) {
        setFilters({ ...filters, search: searchTerm });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, setFilters]);

  useEffect(() => {
    const handleClose = () => setIsExportOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const handleChange = (key: keyof LedgerFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Handle quick date logic
    if (key === 'quickDate') {
      const today = new Date();
      switch (value) {
        case 'today':
          newFilters.startDate = startOfDay(today).toISOString();
          newFilters.endDate = endOfDay(today).toISOString();
          break;
        case 'yesterday':
          const yesterday = subDays(today, 1);
          newFilters.startDate = startOfDay(yesterday).toISOString();
          newFilters.endDate = endOfDay(yesterday).toISOString();
          break;
        case 'last7':
          newFilters.startDate = startOfDay(subDays(today, 7)).toISOString();
          newFilters.endDate = endOfDay(today).toISOString();
          break;
        case 'thisWeek':
          newFilters.startDate = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
          newFilters.endDate = endOfWeek(today, { weekStartsOn: 1 }).toISOString();
          break;
        case 'lastWeek':
          const lastWeek = subDays(today, 7);
          newFilters.startDate = startOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();
          newFilters.endDate = endOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString();
          break;
        case 'thisMonth':
          newFilters.startDate = startOfMonth(today).toISOString();
          newFilters.endDate = endOfMonth(today).toISOString();
          break;
        case 'lastMonth':
          const lastMonth = subDays(startOfMonth(today), 1);
          newFilters.startDate = startOfMonth(lastMonth).toISOString();
          newFilters.endDate = endOfMonth(lastMonth).toISOString();
          break;
        case 'thisYear':
          newFilters.startDate = startOfYear(today).toISOString();
          newFilters.endDate = endOfYear(today).toISOString();
          break;
        case 'all':
          newFilters.startDate = '';
          newFilters.endDate = '';
          break;
        case 'custom':
          // keep existing custom dates if any
          break;
      }
    }

    setFilters(newFilters);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      search: '',
      type: 'all',
      categoryId: 'all',
      accountId: 'all',
      accountType: 'all',
      addedBy: 'all',
      status: 'completed',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
      quickDate: 'all'
    });
  };

  const hasActiveFilters = 
    filters.type !== 'all' || 
    filters.categoryId !== 'all' || 
    filters.accountId !== 'all' || 
    filters.accountType !== 'all' ||
    filters.addedBy !== 'all' ||
    filters.status !== 'completed' ||
    filters.minAmount !== '' ||
    filters.maxAmount !== '' ||
    filters.quickDate !== 'all' ||
    searchTerm !== '';

  return (
    <div className="bg-card p-4 rounded-xl border border-border space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, notes, category, account..."
            className="pl-9 w-full"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap items-center">
          <Select 
            value={filters.quickDate}
            onChange={(e) => handleChange('quickDate', e.target.value)}
            className="w-full md:w-[160px]"
          >
            {QUICK_DATES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
          </Select>
          <Button 
            variant={showAdvanced ? "default" : "outline"}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            {showAdvanced ? 'Hide Filters' : 'Advanced Filters'}
          </Button>

          {/* Export Dropdown */}
          <div className="relative inline-block text-left">
            <Button 
              variant="outline"
              onClick={(e) => { e.stopPropagation(); setIsExportOpen(!isExportOpen); }}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-popover ring-1 ring-black ring-opacity-5 z-50 p-1 border border-border">
                <button 
                  type="button"
                  onClick={() => { onExport?.('excel'); setIsExportOpen(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-popover-foreground rounded-sm flex items-center"
                >
                  Excel (.xlsx)
                </button>
                <button 
                  type="button"
                  onClick={() => { onExport?.('csv'); setIsExportOpen(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-popover-foreground rounded-sm flex items-center"
                >
                  CSV
                </button>
                <button 
                  type="button"
                  onClick={() => { onExport?.('pdf'); setIsExportOpen(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-popover-foreground rounded-sm flex items-center"
                >
                  PDF
                </button>
              </div>
            )}
          </div>

          {/* Print Button */}
          <Button 
            variant="outline"
            onClick={onPrint}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              Clear
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border animate-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3"/> Transaction Type</label>
            <Select value={filters.type} onChange={(e) => handleChange('type', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3"/> Category</label>
            <Select value={filters.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Wallet className="w-3 h-3"/> Account</label>
            <Select value={filters.accountId} onChange={(e) => handleChange('accountId', e.target.value)}>
              <option value="all">All Accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3"/> Account Type</label>
            <Select value={filters.accountType} onChange={(e) => handleChange('accountType', e.target.value)}>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><User className="w-3 h-3"/> Added By</label>
            <Select value={filters.addedBy} onChange={(e) => handleChange('addedBy', e.target.value)}>
              <option value="all">Anyone</option>
              {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3"/> Status</label>
            <Select value={filters.status} onChange={(e) => handleChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3"/> Amount Range</label>
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="Min" value={filters.minAmount} onChange={(e) => handleChange('minAmount', e.target.value)} />
              <span>-</span>
              <Input type="number" placeholder="Max" value={filters.maxAmount} onChange={(e) => handleChange('maxAmount', e.target.value)} />
            </div>
          </div>

          {filters.quickDate === 'custom' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> Custom Date Range</label>
              <div className="flex items-center gap-2">
                <Input type="date" value={filters.startDate ? format(new Date(filters.startDate), 'yyyy-MM-dd') : ''} onChange={(e) => handleChange('startDate', e.target.value ? startOfDay(new Date(e.target.value)).toISOString() : '')} />
                <span>-</span>
                <Input type="date" value={filters.endDate ? format(new Date(filters.endDate), 'yyyy-MM-dd') : ''} onChange={(e) => handleChange('endDate', e.target.value ? endOfDay(new Date(e.target.value)).toISOString() : '')} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
