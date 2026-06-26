import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { useUIStore } from '@/stores/useUIStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { TransactionTable } from '@/components/tables/TransactionTable';
import { isSameDay, format } from 'date-fns';

export function CalendarDayModal() {
  const { isCalendarDayModalOpen, closeCalendarDayModal, calendarSelectedDate, openTransactionModal } = useUIStore();
  const { transactions } = useTransactionStore();
  const { currency } = useSettingsStore();

  if (!calendarSelectedDate) return null;

  const dayTransactions = transactions.filter(t => !t.isArchived && isSameDay(new Date(t.date), calendarSelectedDate));
  
  const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const transfers = dayTransactions.filter(t => t.type === 'transfer').reduce((sum, t) => sum + t.amount, 0);
  const net = income - expense;

  return (
    <Dialog open={isCalendarDayModalOpen} onOpenChange={(open) => !open && closeCalendarDayModal()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{format(calendarSelectedDate, 'EEEE, MMMM do, yyyy')}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-700 dark:text-emerald-400">
            <span className="block text-xs font-semibold uppercase tracking-wider opacity-80">Income</span>
            <span className="text-xl font-bold">{currency}{income.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-rose-700 dark:text-rose-400">
            <span className="block text-xs font-semibold uppercase tracking-wider opacity-80">Expense</span>
            <span className="text-xl font-bold">{currency}{expense.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-700 dark:text-blue-400">
            <span className="block text-xs font-semibold uppercase tracking-wider opacity-80">Transfers</span>
            <span className="text-xl font-bold">{currency}{transfers.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <span className="block text-xs font-semibold uppercase tracking-wider opacity-80 text-muted-foreground">Net Flow</span>
            <span className={`text-xl font-bold ${net > 0 ? 'text-emerald-500' : net < 0 ? 'text-rose-500' : ''}`}>
              {net > 0 ? '+' : ''}{currency}{net.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-lg mb-3">Transactions</h3>
          {dayTransactions.length > 0 ? (
            <TransactionTable 
              transactions={dayTransactions}
              selectedIds={new Set()}
              onSelect={() => {}}
              onSelectAll={() => {}}
              onRowClick={(id) => openTransactionModal(id)}
              sortConfig={null}
              onSort={() => {}}
            />
          ) : (
            <div className="text-center py-8 bg-card rounded-xl text-muted-foreground">
              No transactions for this day.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
