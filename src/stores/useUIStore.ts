import { create } from 'zustand';

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
}

export const useUIStore = create<UIState>((set) => ({
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
}));
