import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PendingOp {
  id: string;
  type: 'save' | 'delete';
  collection: string;
  docId: string;
  data: any;
  timestamp: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncState {
  queue: PendingOp[];
  status: SyncStatus;
  isOnline: boolean;
  interruptionStartTime: number | null;
  lastSyncedTime: string | null;
  addOp: (type: 'save' | 'delete', collection: string, docId: string, data: any) => void;
  removeOp: (id: string) => void;
  setStatus: (status: SyncStatus) => void;
  setIsOnline: (isOnline: boolean) => void;
  setInterruptionStartTime: (time: number | null) => void;
  setLastSyncedTime: (time: string | null) => void;
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
          data,
          timestamp: Date.now()
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
        console.log('[useSyncStore] Queue length before removeOp:', state.queue.length);
        console.log('[useSyncStore] Removing operation ID:', id);
        
        const newQueue = state.queue.filter((op) => op.id !== id);
        
        console.log('[useSyncStore] Queue after removeOp:', newQueue.map(op => op.id));
        console.log('[useSyncStore] Queue length after removeOp:', newQueue.length);
        
        return {
          queue: newQueue
        };
      }),
      setStatus: (status) => set({ status }),
      setIsOnline: (isOnline) => set({ isOnline }),
      setInterruptionStartTime: (time) => set({ interruptionStartTime: time }),
      setLastSyncedTime: (lastSyncedTime) => set({ lastSyncedTime }),
      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'expense-tracker-sync-queue',
      partialize: (state) => ({ 
        queue: state.queue,
        interruptionStartTime: state.interruptionStartTime,
        lastSyncedTime: state.lastSyncedTime
      }),
    }
  )
);
