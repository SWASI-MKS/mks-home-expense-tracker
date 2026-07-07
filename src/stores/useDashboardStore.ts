import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DateFilterType = 'today' | 'week' | 'month' | 'year' | 'last_month' | 'last_year' | 'custom';

export type WidgetType = 
  | 'summary' 
  | 'income_expense' 
  | 'cash_flow' 
  | 'categories' 
  | 'budgets' 
  | 'accounts' 
  | 'insights'
  | 'upcoming_reminders';

export interface WidgetState {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  collapsed: boolean;
}

const defaultWidgets: WidgetState[] = [
  { id: 'widget-summary', type: 'summary', title: 'Financial Summary', visible: true, collapsed: false },
  { id: 'widget-income_expense', type: 'income_expense', title: 'Income vs Expense', visible: true, collapsed: false },
  { id: 'widget-cash_flow', type: 'cash_flow', title: 'Cash Flow', visible: true, collapsed: false },
  { id: 'widget-categories', type: 'categories', title: 'Category Breakdown', visible: true, collapsed: false },
  { id: 'widget-accounts', type: 'accounts', title: 'Account Distribution', visible: true, collapsed: false },
  { id: 'widget-budgets', type: 'budgets', title: 'Budget Usage', visible: true, collapsed: false },
  { id: 'widget-insights', type: 'insights', title: 'Financial Insights', visible: true, collapsed: false },
  { id: 'widget-upcoming_reminders', type: 'upcoming_reminders', title: 'Upcoming Reminders', visible: true, collapsed: false },
];

interface DashboardStoreState {
  dateFilter: DateFilterType;
  customDateRange: { startDate: string; endDate: string };
  widgets: WidgetState[];
  
  setDateFilter: (filter: DateFilterType) => void;
  setCustomDateRange: (start: string, end: string) => void;
  
  reorderWidgets: (newOrder: WidgetState[]) => void;
  toggleWidgetVisibility: (id: string, visible: boolean) => void;
  toggleWidgetCollapse: (id: string, collapsed: boolean) => void;
  resetWidgets: () => void;
}

export const useDashboardStore = create<DashboardStoreState>()(
  persist(
    (set) => ({
      dateFilter: 'month',
      customDateRange: { startDate: '', endDate: '' },
      widgets: defaultWidgets,
      
      setDateFilter: (filter) => set({ dateFilter: filter }),
      setCustomDateRange: (startDate, endDate) => set({ customDateRange: { startDate, endDate } }),
      
      reorderWidgets: (newOrder) => set({ widgets: newOrder }),
      toggleWidgetVisibility: (id, visible) => set((state) => ({
        widgets: state.widgets.map(w => w.id === id ? { ...w, visible } : w)
      })),
      toggleWidgetCollapse: (id, collapsed) => set((state) => ({
        widgets: state.widgets.map(w => w.id === id ? { ...w, collapsed } : w)
      })),
      resetWidgets: () => set({ widgets: defaultWidgets })
    }),
    {
      name: 'expense-tracker-dashboard',
    }
  )
);
