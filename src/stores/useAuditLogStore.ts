import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuditLog } from '@/types';
import { dbService } from '@/services/firestore/dbService';
import { useFamilyStore } from './useFamilyStore';

interface AuditLogState {
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  getAuditLogsByMember: (memberName: string) => AuditLog[];
  getAuditLogsByAction: (action: AuditLog['action']) => AuditLog[];
  clearAuditLogs: () => void;
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
      auditLogs: [],
      
      addAuditLog: (log) => set((state) => {
        const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;
        const newLog: AuditLog = {
          ...log,
          id: auditId,
          timestamp: new Date().toISOString(),
        };
        
        dbService.save('auditLogs', newLog.id, newLog);
        
        return { auditLogs: [newLog, ...state.auditLogs] };
      }),
      
      getAuditLogsByMember: (memberName) => {
        return get().auditLogs.filter(log => log.memberName === memberName);
      },
      
      getAuditLogsByAction: (action) => {
        return get().auditLogs.filter(log => log.action === action);
      },
      
      clearAuditLogs: () => {
        set({ auditLogs: [] });
      }
    }),
    {
      name: 'expense-tracker-audit-logs',
    }
  )
);
