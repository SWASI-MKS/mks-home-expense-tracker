import { useCalendarStore } from '@/stores/useCalendarStore';
import { addDays, isPast, format, isAfter, isBefore } from 'date-fns';
import { Bell, Calendar as CalendarIcon, AlertCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';

interface CalendarUpcomingPanelProps {
  onDateSelect: (date: Date) => void;
}

export function CalendarUpcomingPanel({ onDateSelect }: CalendarUpcomingPanelProps) {
  const { reminders } = useCalendarStore();

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  const pendingReminders = reminders.filter(r => r.status !== 'completed');
  
  const overdue = pendingReminders.filter(r => r.status === 'overdue' || (r.dueDate && isPast(new Date(`${r.dueDate}T23:59:59`))));
  const dueToday = pendingReminders.filter(r => r.dueDate === format(today, 'yyyy-MM-dd'));
  const dueTomorrow = pendingReminders.filter(r => r.dueDate === format(tomorrow, 'yyyy-MM-dd'));
  
  const upcomingBills = pendingReminders.filter(r => 
    isAfter(new Date(r.dueDate), tomorrow) && 
    isBefore(new Date(r.dueDate), nextWeek)
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Helper to render an item
  const renderItem = (title: string, dateStr: string, icon: React.ReactNode, colorClass: string, priority?: string) => (
    <div 
      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
      onClick={() => onDateSelect(new Date(dateStr))}
    >
      <div className={`mt-0.5 ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{format(new Date(dateStr), 'MMM dd')}</span>
          {priority && priority === 'critical' && <span className="text-rose-500 font-medium">Critical</span>}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="flex flex-col h-full shadow-sm">
      <CardHeader className="py-4 border-b border-border">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" /> Upcoming
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {overdue.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" /> Overdue
            </h4>
            <div className="space-y-1">
              {overdue.map(r => (
                <div key={r.id}>{renderItem(r.title, r.dueDate, <Bell className="w-4 h-4" />, "text-rose-500", r.priority)}</div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Today</h4>
          {dueToday.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-2">Nothing due today.</p>
          ) : (
            <div className="space-y-1">
              {dueToday.map(r => (
                <div key={r.id}>{renderItem(r.title, r.dueDate, <Bell className="w-4 h-4" />, "text-blue-500", r.priority)}</div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Tomorrow</h4>
          {dueTomorrow.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-2">Nothing due tomorrow.</p>
          ) : (
            <div className="space-y-1">
              {dueTomorrow.map(r => (
                <div key={r.id}>{renderItem(r.title, r.dueDate, <Bell className="w-4 h-4" />, "text-amber-500", r.priority)}</div>
              ))}
            </div>
          )}
        </div>

        {upcomingBills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">This Week</h4>
            <div className="space-y-1">
              {upcomingBills.map(r => (
                <div key={r.id}>{renderItem(r.title, r.dueDate, <CalendarIcon className="w-4 h-4" />, "text-emerald-500", r.priority)}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
