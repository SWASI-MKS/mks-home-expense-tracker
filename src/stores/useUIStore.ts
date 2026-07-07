import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isTransactionModalOpen: boolean;
  transactionToEditId: string | null;
  openTransactionModal: (editId?: string) => void;
  closeTransactionModal: () => void;
  
  isBudgetModalOpen: boolean;
  budgetToEditId: string | null;
  openBudgetModal: (editId?: string) => void;
  closeBudgetModal: () => void;
  
  isCalendarDayModalOpen: boolean;
  calendarSelectedDate: Date | null;
  openCalendarDayModal: (date: Date) => void;
  closeCalendarDayModal: () => void;

  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isTransactionModalOpen: false,
      transactionToEditId: null,
      openTransactionModal: (editId) => set({ isTransactionModalOpen: true, transactionToEditId: editId || null }),
      closeTransactionModal: () => set({ isTransactionModalOpen: false, transactionToEditId: null }),

      isBudgetModalOpen: false,
      budgetToEditId: null,
      openBudgetModal: (editId) => set({ isBudgetModalOpen: true, budgetToEditId: editId || null }),
      closeBudgetModal: () => set({ isBudgetModalOpen: false, budgetToEditId: null }),
      
      isCalendarDayModalOpen: false,
      calendarSelectedDate: null,
      openCalendarDayModal: (date) => set({ isCalendarDayModalOpen: true, calendarSelectedDate: date }),
      closeCalendarDayModal: () => set({ isCalendarDayModalOpen: false, calendarSelectedDate: null }),

      isSidebarOpen: false,
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      openSidebar: () => set({ isSidebarOpen: true }),
      closeSidebar: () => set({ isSidebarOpen: false }),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
    }
  )
);
