import { useState, useMemo, useEffect } from 'react';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUIStore } from '@/stores/useUIStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { CalendarDayModal } from './CalendarDayModal';
import { CalendarUpcomingPanel } from './CalendarUpcomingPanel';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search, Filter } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/currency';

function normalizeSearchText(text: string | undefined | null): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterHasImages, setFilterHasImages] = useState(false);
  const [filterRemindersEnabled, setFilterRemindersEnabled] = useState(false);
  
  // Basic filtering for calendar views (optional toggles)
  const [showTxns, setShowTxns] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showReminders, setShowReminders] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  const { transactions } = useTransactionStore();
  const { openCalendarDayModal } = useUIStore();
  const { notes, reminders, events, checkOverdueReminders, categories } = useCalendarStore();

  useEffect(() => {
    checkOverdueReminders();
  }, [checkOverdueReminders]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Map data to dates for fast rendering
  const mappedData = useMemo(() => {
    const map = new Map<string, {
      income: number;
      expense: number;
      notesCount: number;
      remindersCount: number;
      eventsCount: number;
    }>();
    
    const normalizedQuery = normalizeSearchText(searchQuery);

    const matchesSearch = (fields: (string | undefined | null)[]) => {
      if (!normalizedQuery) return true;
      const normalizedFields = fields.map(normalizeSearchText).join(' ');
      return normalizedFields.includes(normalizedQuery);
    };

    // Transactions
    if (showTxns) {
      transactions.forEach(t => {
        if (t.isArchived) return;
        
        // Deep search for transactions
        if (normalizedQuery && !matchesSearch([
          t.type, t.notes, t.addedBy, t.amount.toString(), t.categoryId
        ])) {
          return;
        }

        // Apply advanced filters
        if (filterCategory && t.categoryId !== filterCategory) return;
        if (filterHasImages) return; // Transactions don't have images yet
        if (filterRemindersEnabled) return; 

        const d = format(new Date(t.date), 'yyyy-MM-dd');
        const existing = map.get(d) || { income: 0, expense: 0, notesCount: 0, remindersCount: 0, eventsCount: 0 };
        if (t.type === 'income') existing.income += t.amount;
        if (t.type === 'expense') existing.expense += t.amount;
        map.set(d, existing);
      });
    }

    // Notes
    if (showNotes) {
      notes.forEach(n => {
        if (normalizedQuery && !matchesSearch([n.title, n.description, n.addedBy])) return;
        
        // Advanced Filters
        if (filterCategory && n.categoryId !== filterCategory) return;
        if (filterPriority) return;
        if (filterStatus) return;
        if (filterHasImages && (!n.images || n.images.length === 0)) return;
        if (filterRemindersEnabled) return;

        const existing = map.get(n.date) || { income: 0, expense: 0, notesCount: 0, remindersCount: 0, eventsCount: 0 };
        existing.notesCount += 1;
        map.set(n.date, existing);
      });
    }

    // Reminders
    if (showReminders) {
      reminders.forEach(r => {
        if (normalizedQuery && !matchesSearch([r.title, r.description, r.addedBy, r.priority, r.status])) return;
        
        // Advanced Filters
        if (filterCategory && r.categoryId !== filterCategory) return;
        if (filterPriority && r.priority !== filterPriority) return;
        if (filterStatus && r.status !== filterStatus) return;
        if (filterHasImages && (!r.images || r.images.length === 0)) return;
        if (filterRemindersEnabled && !r.notificationEnabled) return;

        const existing = map.get(r.dueDate) || { income: 0, expense: 0, notesCount: 0, remindersCount: 0, eventsCount: 0 };
        existing.remindersCount += 1;
        map.set(r.dueDate, existing);
      });
    }

    // Events
    if (showEvents) {
      events.forEach(e => {
        if (normalizedQuery && !matchesSearch([e.title, e.description, e.addedBy])) return;
        
        // Advanced Filters
        if (filterCategory && e.categoryId !== filterCategory) return;
        if (filterPriority) return;
        if (filterStatus) return;
        if (filterHasImages && (!e.images || e.images.length === 0)) return;
        if (filterRemindersEnabled) return;

        const existing = map.get(e.date) || { income: 0, expense: 0, notesCount: 0, remindersCount: 0, eventsCount: 0 };
        existing.eventsCount += 1;
        map.set(e.date, existing);
      });
    }

    return map;
  }, [transactions, notes, reminders, events, showTxns, showNotes, showReminders, showEvents, searchQuery, filterCategory, filterPriority, filterStatus, filterHasImages, filterRemindersEnabled]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Planner</h1>
          <p className="text-muted-foreground">Manage your schedule, bills, and cash flow.</p>
        </div>
        
        <div className="flex-1 w-full md:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search planner..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant={showFilters ? 'default' : 'outline'} onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="p-4 rounded-lg border border-border bg-card shadow-sm animate-in slide-in-from-top-2 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm">
              <option value="">Any</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status (Reminders)</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm">
              <option value="">Any</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={filterHasImages} onChange={e => setFilterHasImages(e.target.checked)} className="rounded border-input text-primary focus:ring-primary" />
              Has Images
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={filterRemindersEnabled} onChange={e => setFilterRemindersEnabled(e.target.checked)} className="rounded border-input text-primary focus:ring-primary" />
              Has Notifications
            </label>
            {(filterCategory || filterPriority || filterStatus || filterHasImages || filterRemindersEnabled) && (
              <Button variant="ghost" size="sm" onClick={() => {
                setFilterCategory('');
                setFilterPriority('');
                setFilterStatus('');
                setFilterHasImages(false);
                setFilterRemindersEnabled(false);
              }} className="h-8 text-xs text-muted-foreground hover:text-foreground">Clear Filters</Button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        <Button variant={showTxns ? 'default' : 'outline'} size="sm" onClick={() => setShowTxns(!showTxns)}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Transactions
        </Button>
        <Button variant={showReminders ? 'default' : 'outline'} size="sm" onClick={() => setShowReminders(!showReminders)}>
          <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> Reminders
        </Button>
        <Button variant={showNotes ? 'default' : 'outline'} size="sm" onClick={() => setShowNotes(!showNotes)}>
          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Notes
        </Button>
        <Button variant={showEvents ? 'default' : 'outline'} size="sm" onClick={() => setShowEvents(!showEvents)}>
          <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span> Events
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        {/* Main Calendar Area */}
        <div className="flex-1 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Button variant="outline" onClick={handleToday} size="sm">
              <CalendarIcon className="w-4 h-4 mr-2" /> Today
            </Button>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth}><ChevronLeft className="w-5 h-5" /></Button>
              <span className="font-semibold text-lg min-w-[150px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}><ChevronRight className="w-5 h-5" /></Button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {days.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const data = mappedData.get(dateStr);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);

              return (
                <div 
                  key={dateStr}
                  onClick={() => openCalendarDayModal(day)}
                  className={cn(
                    "border-b border-r border-border p-2 flex flex-col group cursor-pointer hover:bg-muted/50 transition-colors relative",
                    !isCurrentMonth && "bg-muted/30 opacity-50 text-muted-foreground",
                    idx % 7 === 6 && "border-r-0"
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 transition-colors",
                    isTodayDate ? "bg-primary text-primary-foreground" : "group-hover:bg-accent"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <div className="flex flex-col gap-1 overflow-hidden">
                    {data?.income ? <div className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1 rounded truncate">+{formatCurrency(data.income)}</div> : null}
                    {data?.expense ? <div className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1 rounded truncate">-{formatCurrency(data.expense)}</div> : null}
                    
                    <div className="flex gap-1 flex-wrap mt-auto pt-1">
                      {data?.remindersCount ? (
                        <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] text-white font-bold" title="Reminders">
                          {data.remindersCount > 1 ? `+${data.remindersCount}` : 'R'}
                        </div>
                      ) : null}
                      {data?.notesCount ? (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold" title="Notes">
                          {data.notesCount > 1 ? `+${data.notesCount}` : 'N'}
                        </div>
                      ) : null}
                      {data?.eventsCount ? (
                        <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[9px] text-white font-bold" title="Events">
                          {data.eventsCount > 1 ? `+${data.eventsCount}` : 'E'}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <CalendarUpcomingPanel onDateSelect={openCalendarDayModal} />
        </div>
      </div>

      <CalendarDayModal />
    </div>
  );
}
