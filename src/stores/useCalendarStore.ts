import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  CalendarNote, CalendarReminder, CalendarEvent, CalendarCategory, 
  NotificationArchitecture 
} from '@/types';
import { dbService } from '@/services/firestore/dbService';
import { useFamilyStore } from './useFamilyStore';
import { notificationCenter } from '@/services/notification/notificationCenter';
import { useImageUploadStore } from './useImageUploadStore';

// Built-in Default Categories
const DEFAULT_CATEGORIES: CalendarCategory[] = [
  { id: 'cat-bills', name: 'Bills', color: '#ef4444', isCustom: false },
  { id: 'cat-salary', name: 'Salary', color: '#10b981', isCustom: false },
  { id: 'cat-emi', name: 'EMI', color: '#f59e0b', isCustom: false },
  { id: 'cat-credit', name: 'Credit Card', color: '#3b82f6', isCustom: false },
  { id: 'cat-insurance', name: 'Insurance', color: '#8b5cf6', isCustom: false },
  { id: 'cat-shopping', name: 'Shopping', color: '#ec4899', isCustom: false },
  { id: 'cat-invest', name: 'Investments', color: '#06b6d4', isCustom: false },
  { id: 'cat-medical', name: 'Medical', color: '#14b8a6', isCustom: false },
  { id: 'cat-personal', name: 'Personal', color: '#6366f1', isCustom: false },
  { id: 'cat-bday', name: 'Birthday', color: '#f43f5e', isCustom: false },
  { id: 'cat-anniv', name: 'Anniversary', color: '#d946ef', isCustom: false },
  { id: 'cat-holiday', name: 'Holiday', color: '#0ea5e9', isCustom: false },
  { id: 'cat-work', name: 'Work', color: '#64748b', isCustom: false },
  { id: 'cat-edu', name: 'Education', color: '#84cc16', isCustom: false },
  { id: 'cat-other', name: 'Other', color: '#94a3b8', isCustom: false },
];

export interface CalendarState {
  notes: CalendarNote[];
  reminders: CalendarReminder[];
  events: CalendarEvent[];
  categories: CalendarCategory[];
  notificationConfig: NotificationArchitecture;
  
  // Notes CRUD
  addNote: (note: CalendarNote) => void;
  updateNote: (id: string, note: Partial<CalendarNote>) => void;
  deleteNote: (id: string) => void;
  
  // Reminders CRUD
  addReminder: (reminder: CalendarReminder) => void;
  updateReminder: (id: string, reminder: Partial<CalendarReminder>) => void;
  deleteReminder: (id: string) => void;
  checkOverdueReminders: () => void;
  
  // Events CRUD
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  
  // Categories
  addCategory: (category: CalendarCategory) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      notes: [],
      reminders: [],
      events: [],
      categories: DEFAULT_CATEGORIES,
      notificationConfig: {
        browserEnabled: false,
        pwaEnabled: false,
        pushEnabled: false,
        emailEnabled: false
      },

      addNote: (note) => set((state) => {
        const displayName = useFamilyStore.getState().displayName;
        const noteWithUser = displayName ? { ...note, addedBy: displayName } : note;
        dbService.save('notes', noteWithUser.id, noteWithUser);
        return { notes: [...state.notes, noteWithUser] };
      }),
      updateNote: (id, updates) => set((state) => {
        const updatedNotes = state.notes.map(n => {
          if (n.id === id) {
            const updated = { ...n, ...updates };
            dbService.save('notes', updated.id, updated);
            return updated;
          }
          return n;
        });
        return { notes: updatedNotes };
      }),
      deleteNote: (id) => set((state) => {
        const note = state.notes.find(n => n.id === id);
        if (note) {
          useImageUploadStore.getState().cleanupCalendarItemImages(id, note.images);
        }
        dbService.delete('notes', id);
        return { notes: state.notes.filter(n => n.id !== id) };
      }),

      addReminder: (reminder) => set((state) => {
        const displayName = useFamilyStore.getState().displayName;
        const reminderWithUser = displayName ? { ...reminder, addedBy: displayName } : reminder;
        dbService.save('reminders', reminderWithUser.id, reminderWithUser);
        
        notificationCenter.dispatch({
          title: 'Reminder Created',
          message: `${reminderWithUser.addedBy} added a reminder: ${reminderWithUser.title}.`,
          category: 'REMINDER',
          severity: 'INFO',
          member: reminderWithUser.addedBy,
          preventEmail: true,
        });
        
        return { reminders: [...state.reminders, reminderWithUser] };
      }),
      updateReminder: (id, updates) => set((state) => {
        const updatedReminders = state.reminders.map(r => {
          if (r.id === id) {
            const updated = { ...r, ...updates };
            dbService.save('reminders', updated.id, updated);
            
            const member = useFamilyStore.getState().displayName || 'System';
            notificationCenter.dispatch({
              title: 'Reminder Updated',
              message: `${member} updated reminder: ${updated.title}.`,
              category: 'REMINDER',
              severity: 'INFO',
              member,
              preventEmail: true,
            });
            
            return updated;
          }
          return r;
        });
        return { reminders: updatedReminders };
      }),
      deleteReminder: (id) => set((state) => {
        const reminder = state.reminders.find(r => r.id === id);
        if (reminder) {
          useImageUploadStore.getState().cleanupCalendarItemImages(id, reminder.images);
        }
        dbService.delete('reminders', id);
        
        if (reminder) {
          const member = useFamilyStore.getState().displayName || 'System';
          notificationCenter.dispatch({
            title: 'Reminder Deleted',
            message: `${member} deleted reminder: ${reminder.title}.`,
            category: 'REMINDER',
            severity: 'INFO',
            member,
            preventEmail: true,
          });
        }
        return { reminders: state.reminders.filter(r => r.id !== id) };
      }),
      
      checkOverdueReminders: () => set((state) => {
        const now = new Date();
        const updated = state.reminders.map(r => {
          if (r.status === 'completed') return r;
          const dueDateTimeStr = r.dueTime ? `${r.dueDate}T${r.dueTime}` : `${r.dueDate}T23:59:59`;
          const dueDate = new Date(dueDateTimeStr);
          if (now > dueDate && r.status !== 'overdue') {
            const updatedR = { ...r, status: 'overdue' as const };
            dbService.save('reminders', updatedR.id, updatedR);
            
            notificationCenter.dispatch({
              title: 'Reminder Overdue',
              message: `The reminder "${updatedR.title}" is now overdue.`,
              category: 'REMINDER',
              severity: 'WARNING',
              member: 'System',
              forceEmail: true,
            });
            
            return updatedR;
          }
          return r;
        });
        return { reminders: updated };
      }),

      addEvent: (event) => set((state) => {
        const displayName = useFamilyStore.getState().displayName;
        const eventWithUser = displayName ? { ...event, addedBy: displayName } : event;
        dbService.save('events', eventWithUser.id, eventWithUser);
        
        notificationCenter.dispatch({
          title: 'Event Created',
          message: `${eventWithUser.addedBy} added an event: ${eventWithUser.title}.`,
          category: 'REMINDER',
          severity: 'INFO',
          member: eventWithUser.addedBy,
          preventEmail: true,
        });
        
        return { events: [...state.events, eventWithUser] };
      }),
      updateEvent: (id, updates) => set((state) => {
        const updatedEvents = state.events.map(e => {
          if (e.id === id) {
            const updated = { ...e, ...updates };
            dbService.save('events', updated.id, updated);
            return updated;
          }
          return e;
        });
        return { events: updatedEvents };
      }),
      deleteEvent: (id) => set((state) => {
        const event = state.events.find(e => e.id === id);
        if (event) {
          useImageUploadStore.getState().cleanupCalendarItemImages(id, event.images);
        }
        dbService.delete('events', id);
        return { events: state.events.filter(e => e.id !== id) };
      }),

      addCategory: (category) => set((state) => {
        // Since categories is currently a hardcoded default list in calendar store, we might not need to save it to Firestore unless users can create them.
        // Assuming users can create custom calendar categories in the future:
        dbService.save('calendar_categories', category.id, category);
        return { categories: [...state.categories, category] };
      }),
    }),
    {
      name: 'calendar-store',
      version: 1,
    }
  )
);
