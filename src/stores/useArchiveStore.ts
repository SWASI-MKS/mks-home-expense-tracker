import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ArchiveMonth } from '@/types';

interface ArchiveState {
  currentMonth: number;
  currentYear: number;
  archiveMonths: ArchiveMonth[];
  setCurrentMonth: (year: number, month: number) => void;
  archivePreviousMonth: () => void;
  unlockMonth: (year: number, month: number, memberName: string) => void;
  lockMonth: (year: number, month: number) => void;
  isMonthArchived: (year: number, month: number) => boolean;
  isMonthLocked: (year: number, month: number) => boolean;
  setArchiveMonths: (months: ArchiveMonth[]) => void;
}

export const useArchiveStore = create<ArchiveState>()(
  persist(
    (set, get) => {
      const now = new Date();
      const initialYear = now.getFullYear();
      const initialMonth = now.getMonth();
      
      return {
        currentMonth: initialMonth,
        currentYear: initialYear,
        archiveMonths: [],
        
        setCurrentMonth: (year, month) => set({ currentYear: year, currentMonth: month }),
        
        archivePreviousMonth: () => set((state) => {
          let prevYear = state.currentYear;
          let prevMonth = state.currentMonth - 1;
          
          if (prevMonth < 0) {
            prevMonth = 11;
            prevYear -= 1;
          }
          
          const alreadyArchived = state.archiveMonths.some(
            m => m.year === prevYear && m.month === prevMonth
          );
          
          if (!alreadyArchived) {
            const newArchiveMonth: ArchiveMonth = {
              year: prevYear,
              month: prevMonth,
              isLocked: true,
            };
            
            return { archiveMonths: [...state.archiveMonths, newArchiveMonth] };
          }
          
          return state;
        }),
        
        unlockMonth: (year, month, memberName) => set((state) => {
          const updatedMonths = state.archiveMonths.map(m => {
            if (m.year === year && m.month === month) {
              return {
                ...m,
                isLocked: false,
                unlockedAt: new Date().toISOString(),
                unlockedBy: memberName,
              };
            }
            return m;
          });
          
          return { archiveMonths: updatedMonths };
        }),
        
        lockMonth: (year, month) => set((state) => {
          const updatedMonths = state.archiveMonths.map(m => {
            if (m.year === year && m.month === month) {
              return {
                ...m,
                isLocked: true,
                lockedAt: new Date().toISOString(),
              };
            }
            return m;
          });
          
          return { archiveMonths: updatedMonths };
        }),
        
        isMonthArchived: (year, month) => {
          return get().archiveMonths.some(m => m.year === year && m.month === month);
        },
        
        isMonthLocked: (year, month) => {
          const monthData = get().archiveMonths.find(m => m.year === year && m.month === month);
          return monthData?.isLocked ?? false;
        },
        
        setArchiveMonths: (months) => set({ archiveMonths: months })
      };
    },
    {
      name: 'expense-tracker-archive',
    }
  )
);
