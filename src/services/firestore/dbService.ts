import { doc, setDoc, deleteDoc as firestoreDeleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { notificationCenter } from '@/services/notification/notificationCenter';
import { format } from 'date-fns';

let isSyncing = false;
let backoffDelay = 1000;
let retryTimeoutId: any = null;
let consecutiveFailures = 0;
let hadRepeatedFailures = false;
let hadPermanentFailure = false;

export const dbService = {
  getFamilyCode: () => {
    return useFamilyStore.getState().familyCode;
  },

  save: async (collectionName: string, id: string, data: any) => {
    const familyCode = dbService.getFamilyCode();
    if (!familyCode) return; // Do nothing if not connected to a family
    
    const caller = new Error().stack?.split('\n')[2] || 'unknown';
    console.log(`[dbService.save] CALLED: collection=${collectionName}, id=${id}, timestamp=${new Date().toISOString()}, caller=${caller}`);
    console.log('[dbService.save] Data:', data);
    
    // Add operation to offline-first queue
    useSyncStore.getState().addOp('save', collectionName, id, data);
    
    // Trigger synchronization in the background
    dbService.triggerBackgroundSync();
  },

  delete: async (collectionName: string, id: string) => {
    const familyCode = dbService.getFamilyCode();
    if (!familyCode) return; // Do nothing if not connected to a family
    
    const caller = new Error().stack?.split('\n')[2] || 'unknown';
    console.log(`[dbService.delete] CALLED: collection=${collectionName}, id=${id}, timestamp=${new Date().toISOString()}, caller=${caller}`);
    
    // Add operation to offline-first queue
    useSyncStore.getState().addOp('delete', collectionName, id, null);
    
    // Trigger synchronization in the background
    dbService.triggerBackgroundSync();
  },

  triggerBackgroundSync: async () => {
    console.log('[dbService] triggerBackgroundSync called');
    
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    }

    if (isSyncing) {
      console.log('[dbService] Already syncing, skipping');
      return;
    }
    
    // Helper to get fresh store state
    const getFreshState = () => useSyncStore.getState();

    let syncStore = getFreshState();
    console.log('[dbService] Initial queue length:', syncStore.queue.length);
    
    if (syncStore.queue.length === 0) {
      syncStore.setStatus('synced');
      console.log('[dbService] Queue is empty, setting status to synced');
      return;
    }
    
    if (!navigator.onLine) {
      syncStore.setStatus('offline');
      console.log('[dbService] Offline, setting status to offline');
      return;
    }
    
    isSyncing = true;
    syncStore.setStatus('syncing');
    console.log('[dbService] Starting sync process');
    
    const familyCode = dbService.getFamilyCode();
    if (!familyCode) {
      isSyncing = false;
      console.log('[dbService] No family code, exiting');
      return;
    }

    // Use a while loop that checks fresh state each time
    while (true) {
      syncStore = getFreshState(); // Get latest state before checking queue
      console.log('[dbService] Loop iteration - current queue length:', syncStore.queue.length);
      
      if (syncStore.queue.length === 0) {
        console.log('[dbService] Queue is empty, breaking loop');
        break; // Exit if queue is empty
      }
      
      const op = syncStore.queue[0]; // Always process first item
      console.log('[dbService] Processing operation:', { id: op.id, collection: op.collection, docId: op.docId, type: op.type });
      
      try {
        const docRef = doc(db, `families/${familyCode}/${op.collection}`, op.docId);
        
        if (op.type === 'save') {
          console.log('[dbService] Saving document to Firestore');
          await setDoc(docRef, op.data, { merge: true });
        } else if (op.type === 'delete') {
          console.log('[dbService] Deleting document from Firestore');
          await firestoreDeleteDoc(docRef);
        }
        
        console.log('[dbService] Operation successful, removing from queue:', op.id);
        console.log('[dbService] Op details:', { type: op.type, collection: op.collection, docId: op.docId });
        
        // Remove from queue upon success
        getFreshState().removeOp(op.id);
        
        backoffDelay = 1000; // Reset backoff delay on successful write
        consecutiveFailures = 0; // Reset consecutive failures
      } catch (error: any) {
        console.error('[dbService] Failed to sync operation:', op, error);
        
        const isTransient = error.code === 'unavailable' || error.code === 'deadline-exceeded' || !navigator.onLine;
        
        if (isTransient) {
          consecutiveFailures++;
          console.log('[dbService] Transient error, consecutive failures:', consecutiveFailures);
          
          if (consecutiveFailures >= 5) {
            hadRepeatedFailures = true;
          }
          
          syncStore = getFreshState();
          if (!syncStore.interruptionStartTime) {
            syncStore.setInterruptionStartTime(Date.now());
          }
          
          syncStore.setStatus('error');
          isSyncing = false;
          
          // Retry automatically using exponential backoff
          retryTimeoutId = setTimeout(() => {
            dbService.triggerBackgroundSync();
          }, backoffDelay);
          backoffDelay = Math.min(backoffDelay * 2, 60000); // Caps at 1 minute
          
          if (consecutiveFailures === 5) {
            notificationCenter.dispatch({
              title: 'System Notice',
              message: 'Some changes could not be synchronized. Please check your internet connection or contact the administrator.',
              category: 'SYNC',
              severity: 'ERROR',
              member: 'System',
            });
          }
          console.log('[dbService] Scheduling retry in', backoffDelay, 'ms');
          return; // Stop queue processing on transient network failure
        } else {
          // Permanent permission or format error: remove to unblock queue, alert member
          hadPermanentFailure = true;
          notificationCenter.dispatch({
            title: 'Sync Action Rejected',
            message: `Could not save changes to ${op.collection}. Error: ${error.message}`,
            category: 'SYNC',
            severity: 'WARNING',
            member: 'System',
          });
          console.log('[dbService] Permanent error, removing operation:', op.id);
          getFreshState().removeOp(op.id);
        }
      }
    }
    
    isSyncing = false;
    
    // Check if new operations were added during the sync run
    syncStore = getFreshState();
    console.log('[dbService] Sync loop complete, final queue length:', syncStore.queue.length);
    
    if (syncStore.queue.length > 0) {
      console.log('[dbService] New operations added during sync, triggering again');
      dbService.triggerBackgroundSync();
    } else {
      syncStore.setStatus('synced');
      const nowStr = format(new Date(), 'dd MMM yyyy, hh:mm a');
      syncStore.setLastSyncedTime(nowStr);
      console.log('[dbService] All operations synced, status set to synced at', nowStr);
      
      // If we recovered from repeated/permanent failures or long interruption, publish system notice
      if (hadRepeatedFailures || hadPermanentFailure) {
        const sysNoticeId = `NOTIF-sys-${Date.now()}`;
        let title = 'System Notice';
        let message = '';
        let severity: any = 'INFO';
        
        if (hadPermanentFailure) {
          message = 'Some changes could not be synchronized. Please check your internet connection or contact the administrator.';
          severity = 'ERROR';
        } else {
          syncStore = getFreshState();
          const startStr = format(new Date(syncStore.interruptionStartTime || Date.now() - 300000), 'hh:mm a');
          const endStr = format(new Date(), 'hh:mm a');
          message = `Synchronization was interrupted between ${startStr} and ${endStr}. All pending changes have now been synchronized successfully.`;
        }
        
        const sysNotice = {
          id: sysNoticeId,
          title,
          message,
          category: 'SYNC',
          severity,
          timestamp: new Date().toISOString(),
          read: false,
          emailSent: false,
          browserSent: false,
          source: 'System',
          member: 'System'
        };
        
        try {
          const docRef = doc(db, `families/${familyCode}/notifications`, sysNoticeId);
          await setDoc(docRef, sysNotice);
        } catch (err) {
          console.error('Failed to publish system notice:', err);
        }
        
        // Reset recovery tracking flags
        hadRepeatedFailures = false;
        hadPermanentFailure = false;
        getFreshState().setInterruptionStartTime(null);
      } else {
        getFreshState().setInterruptionStartTime(null);
      }
    }
  },

  importLocalData: async () => {
    const familyCode = dbService.getFamilyCode();
    if (!familyCode) return;

    const transactions = useTransactionStore.getState().transactions;
    const accounts = useAccountStore.getState().accounts;
    const categories = useCategoryStore.getState().categories;
    const budgets = useBudgetStore.getState().budgets;
    const { notes, reminders, events } = useCalendarStore.getState();

    // Import all local documents into the sync queue to ensure offline-first safety
    transactions.forEach(t => useSyncStore.getState().addOp('save', 'transactions', t.id, t));
    accounts.forEach(a => useSyncStore.getState().addOp('save', 'accounts', a.id, a));
    categories.forEach(c => useSyncStore.getState().addOp('save', 'categories', c.id, c));
    budgets.forEach(b => useSyncStore.getState().addOp('save', 'budgets', b.id, b));
    notes.forEach(n => useSyncStore.getState().addOp('save', 'notes', n.id, n));
    reminders.forEach(r => useSyncStore.getState().addOp('save', 'reminders', r.id, r));
    events.forEach(e => useSyncStore.getState().addOp('save', 'events', e.id, e));

    // Import shared settings
    const settings = useSettingsStore.getState();
    const sharedKeys = [
      'currency', 'numberFormat', 'dateFormat',
      'largeExpenseThreshold', 'largeIncomeThreshold', 'largeTransferThreshold',
      'budgetWarningPercentage', 'enableBudgetAlerts', 'enableReminderEmails',
      'enableMonthlyReports', 'enableYearlyReports', 'notificationEmailAddress'
    ];
    const settingsData: any = { id: 'global' };
    sharedKeys.forEach(key => {
      if (settings[key as keyof typeof settings] !== undefined) {
        settingsData[key] = settings[key as keyof typeof settings];
      }
    });
    useSyncStore.getState().addOp('save', 'settings', 'global', settingsData);

    await dbService.triggerBackgroundSync();
  }
};
