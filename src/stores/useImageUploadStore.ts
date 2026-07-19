import { create } from 'zustand';
import { QueuedImage, saveQueuedImage, getQueuedImages, deleteQueuedImage } from '@/utils/indexedDB';
import { storage } from '@/firebase/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useFamilyStore } from './useFamilyStore';
import { useCalendarStore } from './useCalendarStore';
import { CalendarItemBase, ImageAttachment } from '@/types';
import toast from 'react-hot-toast';

export interface ImageUploadState {
  queue: QueuedImage[];
  isProcessing: boolean;
  loadQueue: () => Promise<void>;
  enqueueImage: (image: Omit<QueuedImage, 'status' | 'retryCount' | 'createdAt'>) => Promise<void>;
  processQueue: () => Promise<void>;
  retryImage: (id: string) => Promise<void>;
  removeImage: (id: string) => Promise<void>;
  cleanupCalendarItemImages: (calendarItemId: string, images?: ImageAttachment[]) => Promise<void>;
}

const RETRY_DELAYS = [1000, 2000, 5000, 15000, 30000];
let processTimeoutId: any = null;

export const useImageUploadStore = create<ImageUploadState>((set, get) => ({
  queue: [],
  isProcessing: false,

  loadQueue: async () => {
    try {
      const items = await getQueuedImages();
      set({ queue: items });
      if (items.some(i => i.status === 'queued' || i.status === 'uploading')) {
        get().processQueue();
      }
    } catch (e) {
      console.error('Failed to load image queue', e);
    }
  },

  enqueueImage: async (image) => {
    const newImage: QueuedImage = {
      ...image,
      status: 'queued',
      retryCount: 0,
      createdAt: new Date().toISOString()
    };
    await saveQueuedImage(newImage);
    set(state => ({ queue: [...state.queue, newImage] }));
    get().processQueue();
  },

  removeImage: async (id) => {
    await deleteQueuedImage(id);
    set(state => ({ queue: state.queue.filter(i => i.id !== id) }));
  },

  retryImage: async (id) => {
    const item = get().queue.find(i => i.id === id);
    if (!item) return;
    
    const updated = { ...item, status: 'queued' as const, retryCount: 0 };
    await saveQueuedImage(updated);
    set(state => ({ queue: state.queue.map(i => i.id === id ? updated : i) }));
    get().processQueue();
  },

  cleanupCalendarItemImages: async (calendarItemId, images) => {
    // 1. Delete from IndexedDB queue
    const queuedItems = get().queue.filter(i => i.calendarItemId === calendarItemId);
    for (const item of queuedItems) {
      await deleteQueuedImage(item.id);
    }
    set(state => ({ queue: state.queue.filter(i => i.calendarItemId !== calendarItemId) }));

    // 2. Delete from Firebase Storage
    if (images && images.length > 0) {
      for (const img of images) {
        try {
          const storageRef = ref(storage, img.storagePath);
          await deleteObject(storageRef);
        } catch (e) {
          console.error(`Failed to delete storage object ${img.storagePath}`, e);
        }
      }
    }
  },

  processQueue: async () => {
    if (get().isProcessing) return;
    if (!navigator.onLine) return;

    const pending = get().queue.filter(i => i.status === 'queued' || i.status === 'uploading');
    if (pending.length === 0) return;

    set({ isProcessing: true });
    const familyCode = useFamilyStore.getState().familyCode;

    for (const item of pending) {
      if (!familyCode) break;
      if (!navigator.onLine) break;

      const attempt = item.retryCount + 1;
      const updatedItem: QueuedImage = { 
        ...item, 
        status: 'uploading', 
        lastAttempt: new Date().toISOString() 
      };
      
      set(state => ({ queue: state.queue.map(i => i.id === item.id ? updatedItem : i) }));
      await saveQueuedImage(updatedItem);

      try {
        const storagePath = `families/${familyCode}/calendar/${item.calendarItemId}/${item.fileName}`;
        const storageRef = ref(storage, storagePath);
        
        // Upload
        await uploadBytes(storageRef, item.blob);
        const url = await getDownloadURL(storageRef);

        const attachment: ImageAttachment = {
          id: item.id,
          storagePath,
          url,
          fileName: item.fileName,
          size: item.size,
          uploadedBy: useFamilyStore.getState().displayName || 'System',
          uploadedAt: new Date().toISOString()
        };

        // Update Firestore Document
        const calStore = useCalendarStore.getState();
        
        // Find existing item
        let existingItem: CalendarItemBase | undefined;
        if (item.collectionName === 'notes') {
          existingItem = calStore.notes.find(n => n.id === item.calendarItemId);
          if (existingItem) {
            calStore.updateNote(existingItem.id, { images: [...(existingItem.images || []), attachment] });
          }
        } else if (item.collectionName === 'reminders') {
          existingItem = calStore.reminders.find(r => r.id === item.calendarItemId);
          if (existingItem) {
            calStore.updateReminder(existingItem.id, { images: [...(existingItem.images || []), attachment] });
          }
        } else if (item.collectionName === 'events') {
          existingItem = calStore.events.find(e => e.id === item.calendarItemId);
          if (existingItem) {
            calStore.updateEvent(existingItem.id, { images: [...(existingItem.images || []), attachment] });
          }
        }

        // Cleanup local queue
        await deleteQueuedImage(item.id);
        set(state => ({ queue: state.queue.filter(i => i.id !== item.id) }));

      } catch (error: any) {
        console.error('Image upload failed:', error);
        toast.error(`Upload failed for ${item.fileName}: ${error?.message || error?.code || 'Unknown error'}`);
        
        if (attempt >= 5) {
          const failedItem: QueuedImage = { ...updatedItem, status: 'failed', retryCount: attempt };
          await saveQueuedImage(failedItem);
          set(state => ({ queue: state.queue.map(i => i.id === item.id ? failedItem : i) }));
        } else {
          const retryItem: QueuedImage = { ...updatedItem, status: 'queued', retryCount: attempt };
          await saveQueuedImage(retryItem);
          set(state => ({ queue: state.queue.map(i => i.id === item.id ? retryItem : i) }));
          
          if (processTimeoutId) clearTimeout(processTimeoutId);
          processTimeoutId = setTimeout(() => {
            get().processQueue();
          }, RETRY_DELAYS[attempt - 1] || 30000);
          break; // Stop loop, wait for timeout
        }
      }
    }

    set({ isProcessing: false });
  }
}));

// Setup network listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useImageUploadStore.getState().processQueue();
  });
}
