import { Search } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useAccountStore } from '@/stores/useAccountStore';

export interface FilterState {
  search: string;
  type: string;
  categoryId: string;
  accountId: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface TransactionFiltersProps {
  filters: FilterState;
  setFilters: (f: FilterState | ((prev: FilterState) => FilterState)) => void;
}

export function TransactionFilters({ filters, setFilters }: TransactionFiltersProps) {
  const { categories } = useCategoryStore();
  const { accounts } = useAccountStore();

  const handleUpdate = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by notes or ID..." 
            className="pl-9"
            value={filters.search}
            onChange={(e) => handleUpdate('search', e.target.value)}
          />
        </div>
        
        {/* Type Filter */}
        <div className="w-full md:w-48">
          <select 
            value={filters.type}
            onChange={(e) => handleUpdate('type', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <select 
            value={filters.status}
            onChange={(e) => handleUpdate('status', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Category */}
        <div className="flex-1">
          <select 
            value={filters.categoryId}
            onChange={(e) => handleUpdate('categoryId', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={filters.type === 'transfer'}
          >
            <option value="all">All Categories</option>
            {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Account */}
        <div className="flex-1">
          <select 
            value={filters.accountId}
            onChange={(e) => handleUpdate('accountId', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Accounts</option>
            {[...accounts].sort((a, b) => a.name.localeCompare(b.name)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex flex-1 items-center gap-2">
          <Input 
            type="date" 
            value={filters.startDate} 
            onChange={(e) => handleUpdate('startDate', e.target.value)} 
            className="w-full"
            title="Start Date"
          />
          <span className="text-muted-foreground">to</span>
          <Input 
            type="date" 
            value={filters.endDate} 
            onChange={(e) => handleUpdate('endDate', e.target.value)} 
            className="w-full"
            title="End Date"
          />
        </div>
      </div>
    </div>
  );
}
