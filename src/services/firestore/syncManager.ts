import { collection, onSnapshot, query, setDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useEditRequestStore } from '@/stores/useEditRequestStore';
import { dbService } from './dbService';
import { notificationCenter } from '@/services/notification/notificationCenter';
import { sanitizeForFirestore } from '@/utils/firestoreUtils';
import toast from 'react-hot-toast';

let activeUnsubscribers: (() => void)[] = [];
let isInitialized = false;
export let isUpdatingSettingsFromSync = false;
let lastSyncedSettings: any = null;

// Keep track of reconciled collections for startup reconciliation (runs once)
const reconciledCollections = new Set<string>();

export function reconcileCollection<T extends { id: string }>(
  collectionName: string,
  localRecords: T[],
  cloudRecords: T[]
) {
  if (reconciledCollections.has(collectionName)) return;
  reconciledCollections.add(collectionName);

  const cloudIds = new Set(cloudRecords.map(r => r.id));
  const queue = useSyncStore.getState().queue;
  const queuedIds = new Set(
    queue.filter(op => op.collection === collectionName).map(op => op.docId)
  );

  let repairCount = 0;
  localRecords.forEach(record => {
    if (!cloudIds.has(record.id) && !queuedIds.has(record.id)) {
      console.log(`[reconcileCollection] Auto-repair: Enqueuing missing local record for ${collectionName}:`, record.id);
      dbService.save(collectionName, record.id, record);
      repairCount++;
    }
  });

  if (repairCount > 0) {
    console.log(`[reconcileCollection] Auto-repair completed: enqueued ${repairCount} records for ${collectionName}.`);
  }
}

// Helper to merge cloud data with local pending queue operations
function mergeCloudAndPending(collectionName: string, cloudData: any[]): any[] {
  const queue = useSyncStore.getState().queue;
  const pendingOps = queue.filter(op => op.collection === collectionName);
  
  if (pendingOps.length === 0) {
    return cloudData;
  }
  
  const merged = [...cloudData];
  
  pendingOps.forEach(op => {
    if (op.type === 'save') {
      const index = merged.findIndex(item => item.id === op.docId);
      if (index !== -1) {
        merged[index] = { ...merged[index], ...op.data };
      } else {
        merged.push(op.data);
      }
    } else if (op.type === 'delete') {
      const index = merged.findIndex(item => item.id === op.docId);
      if (index !== -1) {
        merged.splice(index, 1);
      }
    }
  });
  
  return merged;
}

// Category Conflict Reference Updates
function updateCategoryReferences(oldId: string, newId: string) {
  const txnStore = useTransactionStore.getState();
  let txnChanged = false;
  const updatedTxns = txnStore.transactions.map(t => {
    if (t.categoryId === oldId) {
      txnChanged = true;
      const updated = { ...t, categoryId: newId };
      dbService.save('transactions', updated.id, updated);
      return updated;
    }
    return t;
  });
  if (txnChanged) {
    useTransactionStore.setState({ transactions: updatedTxns });
  }

  const budgetStore = useBudgetStore.getState();
  let budgetChanged = false;
  const updatedBudgets = budgetStore.budgets.map(b => {
    if (b.categoryId === oldId) {
      budgetChanged = true;
      const updated = { ...b, categoryId: newId };
      dbService.save('budgets', updated.id, updated);
      return updated;
    }
    return b;
  });
  if (budgetChanged) {
    useBudgetStore.setState({ budgets: updatedBudgets });
  }
}

function updateQueueCategoryReferences(oldId: string, newId: string) {
  const syncStore = useSyncStore.getState();
  let queueChanged = false;
  const updatedQueue = syncStore.queue.map(op => {
    if (op.collection === 'categories' && op.docId === oldId) {
      queueChanged = true;
      return {
        ...op,
        docId: newId,
        documentId: newId,
        id: op.id.replace(oldId, newId),
        data: op.data ? { ...op.data, id: newId } : null
      };
    }
    if (op.collection === 'transactions' && op.data?.categoryId === oldId) {
      queueChanged = true;
      return {
        ...op,
        data: { ...op.data, categoryId: newId }
      };
    }
    if (op.collection === 'budgets' && op.data?.categoryId === oldId) {
      queueChanged = true;
      return {
        ...op,
        data: { ...op.data, categoryId: newId }
      };
    }
    return op;
  });
  if (queueChanged) {
    useSyncStore.setState({ queue: updatedQueue });
  }
}

export function initializeSettingsSync() {
  useSettingsStore.subscribe((state, prevState) => {
    console.log('[initializeSettingsSync] Zustand subscribe fired!');
    console.log('[initializeSettingsSync] isUpdatingSettingsFromSync:', isUpdatingSettingsFromSync);
    console.log('[initializeSettingsSync] lastSyncedSettings:', lastSyncedSettings);
    console.log('[initializeSettingsSync] Current state:', state);
    console.log('[initializeSettingsSync] Previous state:', prevState);
    
    // Find what changed!
    const changes: any = {};
    (Object.keys(state) as Array<keyof typeof state>).forEach(key => {
      if (state[key] !== prevState[key]) {
        changes[key] = { from: prevState[key], to: state[key] };
      }
    });
    console.log('[initializeSettingsSync] Changes detected:', changes);
    
    if (isUpdatingSettingsFromSync) {
      console.log('[initializeSettingsSync] isUpdatingSettingsFromSync is true, returning');
      return;
    }
    
    const familyCode = useFamilyStore.getState().familyCode;
    console.log('[initializeSettingsSync] familyCode:', familyCode);
    if (!familyCode) return;
    
    const sharedKeys = [
      'currency', 'numberFormat', 'dateFormat',
      'largeExpenseThreshold', 'largeIncomeThreshold', 'largeTransferThreshold',
      'budgetWarningPercentage', 'enableBudgetAlerts', 'enableReminderEmails',
      'enableMonthlyReports', 'enableYearlyReports', 'notificationEmailAddress'
    ];
    
    let changed = false;
    if (!lastSyncedSettings) {
      changed = true;
      console.log('[initializeSettingsSync] lastSyncedSettings is null, changed=true');
    } else {
      for (const key of sharedKeys) {
        const stateVal = state[key as keyof typeof state];
        const lastVal = lastSyncedSettings[key];
        if (stateVal !== lastVal) {
          console.log('[initializeSettingsSync] Change detected for key:', key, 'stateVal=', stateVal, 'lastVal=', lastVal);
          changed = true;
          break;
        }
      }
    }
    
    if (changed) {
      const data: any = { id: 'global' };
      sharedKeys.forEach(key => {
        data[key] = state[key as keyof typeof state];
      });
      console.log('[initializeSettingsSync] Calling dbService.save with data:', data);
      lastSyncedSettings = data;
      dbService.save('settings', 'global', data);
    } else {
      console.log('[initializeSettingsSync] No changes detected');
    }
  });
}

export function initializeSync() {
  if (isInitialized) return;
  isInitialized = true;

  // Listen for changes to the family code
  useFamilyStore.subscribe((state, prevState) => {
    if (state.familyCode !== prevState.familyCode) {
      if (state.familyCode) {
        startSync(state.familyCode);
      } else {
        stopSync();
      }
    }
  });

  // Setup connection event listeners
  if (typeof window !== 'undefined') {
    const handleOnline = () => {
      const syncStore = useSyncStore.getState();
      syncStore.setIsOnline(true);
      dbService.triggerBackgroundSync();
    };

    const handleOffline = () => {
      const syncStore = useSyncStore.getState();
      syncStore.setIsOnline(false);
      syncStore.setStatus('offline');
      toast.error(
        "You are offline. Your changes are being saved locally and will automatically synchronize.",
        { id: 'offline-warning-toast', duration: 6000 }
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    const syncStore = useSyncStore.getState();
    syncStore.setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      syncStore.setStatus('offline');
    }
  }

  // Initialize Settings Sync
  initializeSettingsSync();

  // Check initial state
  const currentCode = useFamilyStore.getState().familyCode;
  if (currentCode) {
    startSync(currentCode);
    
    // Part 12 requirement: Only call triggerBackgroundSync() if queue.length > 0
    const queue = useSyncStore.getState().queue;
    if (queue.length > 0) {
      console.log('[initializeSync] Startup queue has items, triggering sync');
      dbService.triggerBackgroundSync();
    }
  }
}

export function stopSync() {
  activeUnsubscribers.forEach(unsub => unsub());
  activeUnsubscribers = [];
}

export function startSync(familyCode: string) {
  stopSync();

  const collections = [
    {
      name: 'transactions',
      storeUpdate: (data: any[]) => {
        const merged = mergeCloudAndPending('transactions', data);
        useTransactionStore.setState({ transactions: merged });
      }
    },
    {
      name: 'accounts',
      storeUpdate: (data: any[]) => {
        // Part 9 requirement: Reconcile Accounts
        const local = useAccountStore.getState().accounts;
        reconcileCollection('accounts', local, data);
        
        const merged = mergeCloudAndPending('accounts', data);
        useAccountStore.setState({ accounts: merged });
      }
    },
    {
      name: 'budgets',
      storeUpdate: (data: any[]) => {
        // Part 9 requirement: Reconcile Budgets
        const local = useBudgetStore.getState().budgets;
        reconcileCollection('budgets', local, data);
        
        const merged = mergeCloudAndPending('budgets', data);
        useBudgetStore.setState({ budgets: merged });
      }
    },
    {
      name: 'categories',
      storeUpdate: (data: any[]) => {
        // Part 9 requirement: Reconcile Categories
        const local = useCategoryStore.getState().categories;
        reconcileCollection('categories', local, data);
        
        const mergedWithPending = mergeCloudAndPending('categories', data);
        const uniqueCategories: any[] = [];
        const seenKeys = new Set<string>();
        
        mergedWithPending.forEach(cat => {
          const key = `${cat.type}_${cat.name.trim().toLowerCase()}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueCategories.push(cat);
          } else {
            const existing = uniqueCategories.find(c => `${c.type}_${c.name.trim().toLowerCase()}` === key);
            if (existing && existing.id !== cat.id) {
              updateCategoryReferences(cat.id, existing.id);
              updateQueueCategoryReferences(cat.id, existing.id);
              
              // Publish a conflict resolved notification to Firestore
              const sysNoticeId = `NOTIF-conflict-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              const conflictNotice = {
                id: sysNoticeId,
                title: 'System Notice',
                message: `Category conflict resolved: "${cat.name}" existed with different IDs. Records have been merged successfully.`,
                category: 'SYNC',
                severity: 'WARNING',
                timestamp: new Date().toISOString(),
                read: false,
                emailSent: false,
                browserSent: false,
                source: 'System',
                member: 'System'
              };
              // Sanitize before setDoc write
              const sanitizedConflict = sanitizeForFirestore(conflictNotice);
              setDoc(doc(db, `families/${familyCode}/notifications`, sysNoticeId), sanitizedConflict).catch(e => {
                console.error("Failed to publish conflict notice:", e);
              });
            }
          }
        });
        useCategoryStore.setState({ categories: uniqueCategories });
      }
    },
    {
      name: 'reminders',
      storeUpdate: (data: any[]) => {
        const merged = mergeCloudAndPending('reminders', data);
        useCalendarStore.setState({ reminders: merged });
      }
    },
    {
      name: 'notes',
      storeUpdate: (data: any[]) => {
        const merged = mergeCloudAndPending('notes', data);
        useCalendarStore.setState({ notes: merged });
      }
    },
    {
      name: 'events',
      storeUpdate: (data: any[]) => {
        const merged = mergeCloudAndPending('events', data);
        useCalendarStore.setState({ events: merged });
      }
    },
    {
      name: 'settings',
      storeUpdate: (data: any[]) => {
        console.log('[settings storeUpdate] Firestore snapshot received! Data:', data);
        
        const globalSettings = data.find(d => d.id === 'global');
        if (globalSettings) {
          const { id: _id, ...sharedData } = globalSettings;
          console.log('[settings storeUpdate] globalSettings:', globalSettings);
          
          const queue = useSyncStore.getState().queue;
          const pendingSettings = queue.find(op => op.collection === 'settings' && op.docId === 'global');
          console.log('[settings storeUpdate] pendingSettings:', pendingSettings);
          
          const finalSharedData = pendingSettings && pendingSettings.type === 'save' 
            ? { ...sharedData, ...pendingSettings.data }
            : sharedData;
            
          isUpdatingSettingsFromSync = true;
          const sharedKeys = [
            'currency', 'numberFormat', 'dateFormat',
            'largeExpenseThreshold', 'largeIncomeThreshold', 'largeTransferThreshold',
            'budgetWarningPercentage', 'enableBudgetAlerts', 'enableReminderEmails',
            'enableMonthlyReports', 'enableYearlyReports', 'notificationEmailAddress'
          ];
          
          const mergedSettings: any = {};
          sharedKeys.forEach(key => {
            if (finalSharedData[key] !== undefined) {
              mergedSettings[key] = finalSharedData[key];
            }
          });
          
          console.log('[settings storeUpdate] Calling useSettingsStore.setState with:', mergedSettings);
          
          useSettingsStore.setState(mergedSettings);
          lastSyncedSettings = { id: 'global', ...sharedData, ...mergedSettings };
          isUpdatingSettingsFromSync = false;
        }
      }
    },
    {
      name: 'notifications',
      storeUpdate: (data: any[]) => {
        const localNotifs = useNotificationStore.getState().notifications;
        const localNotifsMap = new Map(localNotifs.map(n => [n.id, n]));
        let changed = false;
        
        data.forEach(dbNotif => {
          if (!localNotifsMap.has(dbNotif.id)) {
            localNotifsMap.set(dbNotif.id, dbNotif);
            changed = true;
          }
        });
        
        if (changed || localNotifs.length !== localNotifsMap.size) {
          const sorted = Array.from(localNotifsMap.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          useNotificationStore.setState({ notifications: sorted });
        }
      }
    },
    {
      name: 'editRequests',
      storeUpdate: (data: any[]) => {
        console.log('[syncManager.editRequests] Realtime update received! Data:', data);
        const merged = mergeCloudAndPending('editRequests', data);
        useEditRequestStore.setState({ editRequests: merged });
        console.log('[syncManager.editRequests] editRequests store updated!');
      }
    }
  ];

  collections.forEach(col => {
    const q = query(collection(db, `families/${familyCode}/${col.name}`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      col.storeUpdate(data);
    }, (error) => {
      console.error(`Error syncing ${col.name}:`, error);
      const member = useFamilyStore.getState().displayName || 'System';
      notificationCenter.dispatch({
        title: 'Firestore Sync Failure',
        message: `Failed to sync ${col.name}. Error: ${error.message}`,
        category: 'SYNC',
        severity: 'CRITICAL',
        member,
        forceEmail: true,
      });
    });
    
    activeUnsubscribers.push(unsubscribe);
  });
}
