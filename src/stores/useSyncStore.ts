import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PendingOp {
  id: string;
  type: 'save' | 'delete';
  collection: string;
  docId: string;
  documentId: string; // Alias of docId for Part 5/6 compatibility
  data: any;
  timestamp: number;
  
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  failedAt?: string;
  lastAttempt?: string;
  queueVersion: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncState {
  queue: PendingOp[];
  status: SyncStatus;
  isOnline: boolean;
  interruptionStartTime: number | null;
  lastSyncedTime: string | null;
  lastSuccessfulSync: Record<string, string>;
  lastSyncDuration: Record<string, number>;
  averageSyncDuration: Record<string, number>;
  syncCount: Record<string, number>;
  
  addOp: (type: 'save' | 'delete', collection: string, docId: string, data: any) => void;
  removeOp: (id: string) => void;
  removeSuccessfulOp: (id: string) => void;
  updateOpState: (id: string, updates: Partial<PendingOp>) => void;
  retryFailedOps: () => void;
  setStatus: (status: SyncStatus) => void;
  setIsOnline: (isOnline: boolean) => void;
  setInterruptionStartTime: (time: number | null) => void;
  setLastSyncedTime: (time: string | null) => void;
  setLastSuccessfulSync: (collection: string, time: string) => void;
  setOpDuration: (collection: string, duration: number) => void;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      queue: [],
      status: 'synced',
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      interruptionStartTime: null,
      lastSyncedTime: null,
      lastSuccessfulSync: {},
      lastSyncDuration: {},
      averageSyncDuration: {},
      syncCount: {},

      addOp: (type, collection, docId, data) => set((state) => {
        console.log('[useSyncStore] Queue before addOp:', state.queue.map(op => op.id));
        console.log('[useSyncStore] Queue length before addOp:', state.queue.length);
        
        // Conflict resolution: remove duplicate pending operations for the same doc to preserve integrity
        const filtered = state.queue.filter(
          (op) => !(op.collection === collection && op.docId === docId)
        );
        
        const newOp: PendingOp = {
          id: `${collection}_${docId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type,
          collection,
          docId,
          documentId: docId,
          data,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          queueVersion: '1.0.0'
        };
        
        console.log('[useSyncStore] Adding operation ID:', newOp.id);
        
        // If we are currently interrupted (offline or error) and queue is starting or growing, set interruption time if not set
        let interruptionStartTime = state.interruptionStartTime;
        if (!state.isOnline && !interruptionStartTime) {
          interruptionStartTime = Date.now();
        }

        const newQueue = [...filtered, newOp];
        console.log('[useSyncStore] Queue after addOp:', newQueue.map(op => op.id));
        console.log('[useSyncStore] Queue length after addOp:', newQueue.length);
        
        return {
          queue: newQueue,
          interruptionStartTime
        };
      }),
      
      removeOp: (id) => set((state) => {
        console.log('[useSyncStore] Queue before removeOp:', state.queue.map(op => op.id));
        const newQueue = state.queue.filter((op) => op.id !== id);
        console.log('[useSyncStore] Queue after removeOp:', newQueue.map(op => op.id));
        return { queue: newQueue };
      }),
      
      removeSuccessfulOp: (id) => set((state) => {
        console.log('[useSyncStore] Removing successful operation ID:', id);
        return { queue: state.queue.filter((op) => op.id !== id) };
      }),
      
      updateOpState: (id, updates) => set((state) => ({
        queue: state.queue.map((op) =>
          op.id === id ? { ...op, ...updates } : op
        )
      })),
      
      retryFailedOps: () => set((state) => ({
        queue: state.queue.map((op) =>
          op.status === 'failed' 
            ? { 
                ...op, 
                status: 'pending' as const, 
                errorCode: undefined, 
                errorMessage: undefined, 
                failedAt: undefined,
                lastAttempt: undefined,
                retryCount: 0 
              } 
            : op
        ),
        status: 'syncing' as const
      })),
      
      setStatus: (status) => set({ status }),
      setIsOnline: (isOnline) => set({ isOnline }),
      setInterruptionStartTime: (time) => set({ interruptionStartTime: time }),
      setLastSyncedTime: (lastSyncedTime) => set({ lastSyncedTime }),
      
      setLastSuccessfulSync: (collection, time) => set((state) => ({
        lastSuccessfulSync: {
          ...state.lastSuccessfulSync,
          [collection]: time
        }
      })),
      
      setOpDuration: (collection, duration) => set((state) => {
        const currentCount = state.syncCount[collection] || 0;
        const currentAvg = state.averageSyncDuration[collection] || 0;
        const newCount = currentCount + 1;
        const newAvg = Math.round((currentAvg * currentCount + duration) / newCount);
        
        return {
          lastSyncDuration: {
            ...state.lastSyncDuration,
            [collection]: duration
          },
          averageSyncDuration: {
            ...state.averageSyncDuration,
            [collection]: newAvg
          },
          syncCount: {
            ...state.syncCount,
            [collection]: newCount
          }
        };
      }),
      
      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'expense-tracker-sync-queue',
      partialize: (state) => ({ 
        queue: state.queue,
        interruptionStartTime: state.interruptionStartTime,
        lastSyncedTime: state.lastSyncedTime,
        lastSuccessfulSync: state.lastSuccessfulSync,
        lastSyncDuration: state.lastSyncDuration,
        averageSyncDuration: state.averageSyncDuration,
        syncCount: state.syncCount,
      }),
    }
  )
);
