import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppNotification } from '@/types';

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearHistory: () => void;
  getUnreadCount: () => number;
}

const MAX_HISTORY = 500;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => set((state) => {
        const newNotification: AppNotification = {
          ...notification,
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        const newNotifications = [newNotification, ...state.notifications].slice(0, MAX_HISTORY);
        return { notifications: newNotifications };
      }),

      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      })),

      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),

      deleteNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      clearHistory: () => set({ notifications: [] }),

      getUnreadCount: () => get().notifications.filter(n => !n.read).length,
    }),
    {
      name: 'expense-tracker-notifications',
    }
  )
);
