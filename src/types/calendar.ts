export type CalendarPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReminderStatus = 'pending' | 'completed' | 'overdue';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
  isCustom: boolean;
}

export interface ImageAttachment {
  id: string;
  storagePath: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  size: number;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface CalendarItemBase {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  color?: string;
  categoryId?: string;
  createdAt: string;
  type: 'note' | 'reminder' | 'event';
  addedBy?: string;
  images?: ImageAttachment[];
}

export interface CalendarNote extends CalendarItemBase {
  type: 'note';
  isPinned: boolean;
  isFavorite: boolean;
}

export interface CalendarReminder extends CalendarItemBase {
  type: 'reminder';
  priority: CalendarPriority;
  status: ReminderStatus;
  completedDate?: string;
  dueDate: string;
  dueTime?: string;
  notificationEnabled: boolean;
  notificationOffset?: number; // Minutes before due time
  recurrence?: RecurrenceType;
  lastEmailSent?: string;
  lastBrowserNotification?: string;
}

export interface CalendarEvent extends CalendarItemBase {
  type: 'event';
  endDate?: string;
  recurrence: RecurrenceType;
}

export type CalendarItem = CalendarNote | CalendarReminder | CalendarEvent;

export interface NotificationArchitecture {
  browserEnabled: boolean;
  pwaEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}
