import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  dateFormat: string;
  numberFormat: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  accentColor: string;
  fontSize: string;
  lastBackupDate: string | null;
  
  // Notification Settings
  enableEmailNotifications: boolean;
  enableBrowserNotifications: boolean;
  enableBudgetAlerts: boolean;
  enableReminderEmails: boolean;
  enableMonthlyReports: boolean;
  enableYearlyReports: boolean;
  enableQuietHours: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  notificationEmailAddress: string;
  largeExpenseThreshold: number;
  largeIncomeThreshold: number;
  largeTransferThreshold: number;
  budgetWarningPercentage: number;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrency: (currency: string) => void;
  setLanguage: (language: string) => void;
  setDateFormat: (format: string) => void;
  setNumberFormat: (format: string) => void;
  setFirstDayOfWeek: (day: number) => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: string) => void;
  setLastBackupDate: (date: string) => void;
  
  // Notification Setters
  updateNotificationSettings: (settings: Partial<Pick<SettingsState, 'enableEmailNotifications' | 'enableBrowserNotifications' | 'enableBudgetAlerts' | 'enableReminderEmails' | 'enableMonthlyReports' | 'enableYearlyReports' | 'enableQuietHours' | 'quietHoursStart' | 'quietHoursEnd' | 'notificationEmailAddress' | 'largeExpenseThreshold' | 'largeIncomeThreshold' | 'largeTransferThreshold' | 'budgetWarningPercentage'>>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      currency: '₹',
      language: 'en',
      dateFormat: 'MMM dd, yyyy',
      numberFormat: 'en-IN',
      firstDayOfWeek: 1, // Default Monday
      accentColor: 'blue',
      fontSize: 'medium',
      lastBackupDate: null,
      
      // Notification Defaults
      enableEmailNotifications: false,
      enableBrowserNotifications: false,
      enableBudgetAlerts: true,
      enableReminderEmails: true,
      enableMonthlyReports: true,
      enableYearlyReports: true,
      enableQuietHours: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      notificationEmailAddress: 'msushadevi05@gmail.com',
      largeExpenseThreshold: 5000,
      largeIncomeThreshold: 10000,
      largeTransferThreshold: 20000,
      budgetWarningPercentage: 80,
      
      setTheme: (theme) => set({ theme }),
      toggleTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setNumberFormat: (numberFormat) => set({ numberFormat }),
      setFirstDayOfWeek: (firstDayOfWeek) => set({ firstDayOfWeek }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLastBackupDate: (lastBackupDate) => set({ lastBackupDate }),
      updateNotificationSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'expense-tracker-settings',
    }
  )
);
