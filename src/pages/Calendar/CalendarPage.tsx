import { useState, useMemo } from 'react';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Button } from '@/components/common/Button';
import { CalendarDayModal } from './CalendarDayModal';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { transactions } = useTransactionStore();
  const { openCalendarDayModal } = useUIStore();
  const { currency } = useSettingsStore();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group transactions by date for fast lookup
  const txnsByDate = useMemo(() => {
    const map = new Map<string, { income: number, expense: number }>();
    
    // Only process transactions in the current visible calendar window
    const visibleTxns = transactions.filter(t => 
      !t.isArchived && 
      new Date(t.date) >= startDate && 
      new Date(t.date) <= endDate
    );

    visibleTxns.forEach(t => {
      const d = format(new Date(t.date), 'yyyy-MM-dd');
      const existing = map.get(d) || { income: 0, expense: 0 };
      if (t.type === 'income') existing.income += t.amount;
      if (t.type === 'expense') existing.expense += t.amount;
      map.set(d, existing);
    });
    
    return map;
  }, [transactions, startDate, endDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Visualize your cash flow over time.</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
        <Button variant="outline" onClick={handleToday}>
          <CalendarIcon className="w-4 h-4 mr-2" /> Today
        </Button>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handlePrevMonth}><ChevronLeft className="w-5 h-5" /></Button>
          <span className="font-semibold text-lg min-w-[150px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" onClick={handleNextMonth}><ChevronRight className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const data = txnsByDate.get(dateStr);
            const net = data ? data.income - data.expense : 0;
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            const hasData = data && (data.income > 0 || data.expense > 0);

            return (
              <div 
                key={dateStr}
                onClick={() => openCalendarDayModal(day)}
                className={cn(
                  "border-b border-r border-border p-2 min-h-[100px] flex flex-col group cursor-pointer hover:bg-muted/50 transition-colors",
                  !isCurrentMonth && "bg-muted/30 opacity-50",
                  idx % 7 === 6 && "border-r-0"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                    isTodayDate ? "bg-primary text-primary-foreground" : "group-hover:bg-accent"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {hasData && (
                    <span className={cn(
                      "text-xs font-bold px-1.5 rounded-sm",
                      net > 0 ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40" : 
                      net < 0 ? "text-rose-600 bg-rose-100 dark:bg-rose-900/40" : "text-muted-foreground bg-secondary"
                    )}>
                      {net > 0 ? '+' : ''}{currency}{net.toLocaleString('en-IN', { notation: 'compact' })}
                    </span>
                  )}
                </div>

                <div className="mt-auto space-y-1">
                  {data?.income ? (
                    <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1 rounded truncate">
                      +{currency}{data.income.toLocaleString('en-IN')}
                    </div>
                  ) : null}
                  {data?.expense ? (
                    <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1 rounded truncate">
                      -{currency}{data.expense.toLocaleString('en-IN')}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CalendarDayModal />
    </div>
  );
}
