import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { useUIStore } from '@/stores/useUIStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { Button } from '@/components/common/Button';
import { isSameDay, format, isPast } from 'date-fns';
import { ArrowRightLeft, Bell, CalendarIcon, FileText, Plus, TrendingDown, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { CalendarNoteForm } from './forms/CalendarNoteForm';
import { CalendarReminderForm } from './forms/CalendarReminderForm';
import { CalendarEventForm } from './forms/CalendarEventForm';
import { TransactionTable } from '@/components/tables/TransactionTable';
import { formatCurrency } from '@/utils/currency';
import { ImageGallery } from '@/components/common/ImageGallery';

export function CalendarDayModal() {
  const { isCalendarDayModalOpen, closeCalendarDayModal, calendarSelectedDate, openTransactionModal } = useUIStore();
  const { transactions } = useTransactionStore();
  const { notes, reminders, events, updateReminder } = useCalendarStore();

  const [activeTab, setActiveTab] = useState<'timeline' | 'transactions' | 'notes' | 'reminders' | 'events'>('timeline');
  const [formType, setFormType] = useState<'note' | 'reminder' | 'event' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const dateStr = calendarSelectedDate ? format(calendarSelectedDate, 'yyyy-MM-dd') : '';

  const dayData = useMemo(() => {
    if (!calendarSelectedDate) return { txns: [], notes: [], reminders: [], events: [] };
    
    return {
      txns: transactions.filter(t => !t.isArchived && isSameDay(new Date(t.date), calendarSelectedDate)),
      notes: notes.filter(n => n.date === dateStr),
      reminders: reminders.filter(r => r.dueDate === dateStr),
      events: events.filter(e => e.date === dateStr) // Simple match, expand for recurrence later
    };
  }, [calendarSelectedDate, transactions, notes, reminders, events, dateStr]);

  const timelineItems = useMemo(() => {
    const items: any[] = [];
    
    dayData.txns.forEach(t => items.push({ ...t, timelineType: 'txn', sortTime: t.createdAt }));
    dayData.notes.forEach(n => items.push({ ...n, timelineType: 'note', sortTime: n.time ? `${n.date}T${n.time}` : n.createdAt }));
    dayData.reminders.forEach(r => items.push({ ...r, timelineType: 'reminder', sortTime: r.dueTime ? `${r.dueDate}T${r.dueTime}` : r.createdAt }));
    dayData.events.forEach(e => items.push({ ...e, timelineType: 'event', sortTime: e.time ? `${e.date}T${e.time}` : e.createdAt }));

    return items.sort((a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime());
  }, [dayData]);

  const income = dayData.txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = dayData.txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = income - expense;

  if (!calendarSelectedDate) return null;

  const renderTimelineItem = (item: any) => {
    if (item.timelineType === 'txn') {
      const isIncome = item.type === 'income';
      const isExpense = item.type === 'expense';
      return (
        <div key={`txn-${item.id}`} className="flex items-start gap-4 p-3 rounded-lg border border-border bg-card shadow-sm cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openTransactionModal(item.id)}>
          <div className={cn("p-2 rounded-full", isIncome ? "bg-emerald-100 text-emerald-600" : isExpense ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600")}>
            {isIncome ? <TrendingUp className="w-4 h-4" /> : isExpense ? <TrendingDown className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm capitalize">{item.type} Transaction</p>
            {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
            {item.addedBy && <p className="text-[10px] font-medium text-primary/70 mt-1">Added by: {item.addedBy}</p>}
          </div>
          <p className={cn("font-bold", isIncome ? "text-emerald-600" : isExpense ? "text-rose-600" : "text-blue-600")}>
            {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(item.amount)}
          </p>
        </div>
      );
    }

    if (item.timelineType === 'reminder') {
      const isOverdue = item.status === 'overdue' || (item.status !== 'completed' && item.dueTime && isPast(new Date(`${item.dueDate}T${item.dueTime}`)));
      return (
        <div key={`rem-${item.id}`} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card shadow-sm cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setEditingItem(item); setFormType('reminder'); }}>
          <div className="flex items-start gap-4">
            <button onClick={(e) => { e.stopPropagation(); updateReminder(item.id, { status: item.status === 'completed' ? 'pending' : 'completed' }) }} className="mt-0.5">
              {item.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={cn("font-medium text-sm", item.status === 'completed' && "line-through text-muted-foreground")}>{item.title}</p>
                {isOverdue && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">OVERDUE</span>}
                {item.priority === 'critical' && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">CRITICAL</span>}
              </div>
              {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
              <div className="flex items-center gap-3 mt-1">
                {item.dueTime && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Bell className="w-3 h-3" /> {item.dueTime}</p>}
                {item.addedBy && <p className="text-[10px] font-medium text-primary/70">Added by: {item.addedBy}</p>}
              </div>
            </div>
          </div>
          {item.images && item.images.length > 0 && <ImageGallery images={item.images} />}
        </div>
      );
    }

    if (item.timelineType === 'note') {
      return (
        <div key={`note-${item.id}`} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-amber-50/50 dark:bg-amber-950/10 shadow-sm border-l-4 cursor-pointer hover:border-primary/50 transition-colors" style={{ borderLeftColor: item.color || '#f59e0b' }} onClick={() => { setEditingItem(item); setFormType('note'); }}>
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{item.title}</p>
              {item.description && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{item.description}</p>}
              <div className="flex items-center gap-3 mt-1">
                {item.time && <p className="text-[10px] text-muted-foreground">{item.time}</p>}
                {item.addedBy && <p className="text-[10px] font-medium text-primary/70">Added by: {item.addedBy}</p>}
              </div>
            </div>
          </div>
          {item.images && item.images.length > 0 && <ImageGallery images={item.images} />}
        </div>
      );
    }

    if (item.timelineType === 'event') {
      return (
        <div key={`evt-${item.id}`} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-purple-50/50 dark:bg-purple-950/10 shadow-sm border-l-4 cursor-pointer hover:border-primary/50 transition-colors" style={{ borderLeftColor: item.color || '#a855f7' }} onClick={() => { setEditingItem(item); setFormType('event'); }}>
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 mt-0.5">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{item.title}</p>
              {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
              <div className="flex items-center gap-3 mt-1">
                {item.time && <p className="text-[10px] text-muted-foreground">{item.time}</p>}
                {item.addedBy && <p className="text-[10px] font-medium text-primary/70">Added by: {item.addedBy}</p>}
              </div>
            </div>
          </div>
          {item.images && item.images.length > 0 && <ImageGallery images={item.images} />}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isCalendarDayModalOpen} onOpenChange={(open) => {
      if (!open) {
        closeCalendarDayModal();
        setFormType(null);
        setEditingItem(null);
        setActiveTab('timeline');
      }
    }}>
      <DialogContent className="sm:max-w-[700px] w-full h-[95vh] sm:h-auto max-h-[95vh] sm:max-h-[85vh] !p-0 gap-0 overflow-hidden flex flex-col bottom-0 sm:bottom-auto translate-y-0 sm:translate-y-[-50%] rounded-b-none sm:rounded-b-lg">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-2xl">{format(calendarSelectedDate, 'EEEE, MMMM do')}</DialogTitle>
          <div className="flex gap-2 overflow-x-auto pb-2 mt-4 scrollbar-hide">
            {(['timeline', 'transactions', 'notes', 'reminders', 'events'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setActiveTab(t); setFormType(null); setEditingItem(null); }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors",
                  activeTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
                {t === 'transactions' && dayData.txns.length > 0 && ` (${dayData.txns.length})`}
                {t === 'notes' && dayData.notes.length > 0 && ` (${dayData.notes.length})`}
                {t === 'reminders' && dayData.reminders.length > 0 && ` (${dayData.reminders.length})`}
                {t === 'events' && dayData.events.length > 0 && ` (${dayData.events.length})`}
              </button>
            ))}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-5 bg-muted/20">
          
          {/* Quick Stats Banner */}
          {activeTab === 'timeline' && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border shadow-sm mb-6">
              <div className="flex-1 text-center">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Income</p>
                <p className="text-sm font-bold text-emerald-600">{formatCurrency(income)}</p>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="flex-1 text-center">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Expense</p>
                <p className="text-sm font-bold text-rose-600">{formatCurrency(expense)}</p>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="flex-1 text-center">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Net</p>
                <p className={cn("text-sm font-bold", net > 0 ? "text-emerald-600" : net < 0 ? "text-rose-600" : "")}>{net > 0 ? '+' : ''}{formatCurrency(net)}</p>
              </div>
            </div>
          )}

          {/* Form Overlays */}
          {formType === 'note' && <CalendarNoteForm date={dateStr} initialData={editingItem} onCancel={() => { setFormType(null); setEditingItem(null); }} onSuccess={() => { setFormType(null); setEditingItem(null); }} />}
          {formType === 'reminder' && <CalendarReminderForm date={dateStr} initialData={editingItem} onCancel={() => { setFormType(null); setEditingItem(null); }} onSuccess={() => { setFormType(null); setEditingItem(null); }} />}
          {formType === 'event' && <CalendarEventForm date={dateStr} initialData={editingItem} onCancel={() => { setFormType(null); setEditingItem(null); }} onSuccess={() => { setFormType(null); setEditingItem(null); }} />}

          {/* Timeline View */}
          {!formType && activeTab === 'timeline' && (
            <div className="space-y-4">
              {timelineItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No activity on this date.</div>
              ) : (
                timelineItems.map(item => renderTimelineItem(item))
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {!formType && activeTab === 'transactions' && (
            <div className="space-y-4">
              <Button onClick={() => openTransactionModal()} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Add Transaction</Button>
              {dayData.txns.length > 0 ? (
                <TransactionTable transactions={dayData.txns} selectedIds={new Set()} onSelect={() => {}} onSelectAll={() => {}} onRowClick={openTransactionModal} sortConfig={null} onSort={() => {}} />
              ) : (
                <p className="text-center py-8 text-muted-foreground">No transactions for this day.</p>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {!formType && activeTab === 'notes' && (
            <div className="space-y-4">
              <Button onClick={() => setFormType('note')} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Add Note</Button>
              {dayData.notes.map(item => renderTimelineItem({ ...item, timelineType: 'note' }))}
            </div>
          )}

          {/* Reminders Tab */}
          {!formType && activeTab === 'reminders' && (
            <div className="space-y-4">
              <Button onClick={() => setFormType('reminder')} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Add Reminder</Button>
              {dayData.reminders.map(item => renderTimelineItem({ ...item, timelineType: 'reminder' }))}
            </div>
          )}

          {/* Events Tab */}
          {!formType && activeTab === 'events' && (
            <div className="space-y-4">
              <Button onClick={() => setFormType('event')} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
              {dayData.events.map(item => renderTimelineItem({ ...item, timelineType: 'event' }))}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
