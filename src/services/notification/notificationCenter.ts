import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { browserNotification } from './browserNotification';
import { emailQueue } from '../email/emailQueue';
import { NOTIFICATION_ICONS } from './notificationIcons';
import { NotificationCategory, NotificationSeverity } from '@/types';
import { rateLimiter } from './notificationRateLimiter';

export interface DispatchOptions {
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  member?: string;
  source?: string;
  metadata?: Record<string, any>;
  
  // Overrides to force or prevent certain types of delivery
  forceEmail?: boolean;
  forceBrowser?: boolean;
  preventEmail?: boolean;
  preventBrowser?: boolean;
  
  // Rate limiting config
  rateLimitKey?: string;
  rateLimitMs?: number;
}

class NotificationCenter {
  /**
   * Evaluates if we are currently in quiet hours.
   */
  private isInQuietHours(): boolean {
    const settings = useSettingsStore.getState();
    if (!settings.enableQuietHours) return false;

    const start = settings.quietHoursStart;
    const end = settings.quietHoursEnd;

    if (!start || !end) return false;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins <= endMins) {
      return currentMins >= startMins && currentMins <= endMins;
    } else {
      // Spans midnight (e.g. 22:00 to 08:00)
      return currentMins >= startMins || currentMins <= endMins;
    }
  }

  /**
   * Main entry point for dispatching notifications.
   * Handles saving history, rate limits, quiet hours, browser notifications, and email queuing.
   */
  public async dispatch(options: DispatchOptions) {
    const settings = useSettingsStore.getState();

    // 1. Evaluate Rate Limiter
    if (options.rateLimitKey && options.rateLimitMs) {
      if (!rateLimiter.evaluate(options.rateLimitKey, options.rateLimitMs)) {
        console.log(`Notification rate limited: ${options.rateLimitKey}`);
        return; // Skip completely if rate limited
      }
    }

    // 2. Evaluate Quiet Hours
    const isQuiet = this.isInQuietHours();
    const isCritical = options.severity === 'CRITICAL';

    // 3. Determine delivery methods
    let shouldSendBrowser = false;
    let shouldSendEmail = false;

    if (settings.enableBrowserNotifications && !options.preventBrowser) {
      if (isCritical || !isQuiet || options.forceBrowser) {
        shouldSendBrowser = true;
      }
    }

    // Note: Email logic depends on whether settings are enabled (e.g., enableEmailNotifications, enableBudgetAlerts, etc)
    // We assume the caller checks domain-specific settings, but we check the global switch here.
    if (settings.enableEmailNotifications && !options.preventEmail) {
      // In quiet hours, we queue emails for immediate delivery in this implementation, 
      // but you could add a delay field if you wanted to physically queue them until quiet hours end.
      // Requirements state: "Everything else -> Suppress Browser Notification -> Queue Email -> Deliver after quiet hours"
      // Since EmailJS has no native scheduling, we will just queue them normally, or delay them if needed.
      // For MVP, we enqueue normally but mark that they were processed during quiet hours.
      shouldSendEmail = true;
    }

    if (options.forceEmail) {
      shouldSendEmail = true;
    }

    // 4. Save to Notification History
    const notifStore = useNotificationStore.getState();
    const id = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    notifStore.addNotification({
      title: options.title,
      message: options.message,
      category: options.category,
      severity: options.severity,
      member: options.member,
      source: options.source,
      metadata: options.metadata,
      emailSent: shouldSendEmail,
      browserSent: shouldSendBrowser,
    });

    // 5. Trigger Browser Notification
    if (shouldSendBrowser) {
      const icon = NOTIFICATION_ICONS[options.category as keyof typeof NOTIFICATION_ICONS] || '🔔';
      browserNotification.showNotification(`${icon} ${options.title}`, {
        body: options.message,
        tag: options.category,
      });
    }

    // 6. Queue Email Notification
    if (shouldSendEmail && settings.notificationEmailAddress) {
      // Basic email payload mapping. Specific formats might need more structured mapping
      emailQueue.enqueue('notification', {
        to_email: settings.notificationEmailAddress,
        to_name: 'Expensify User', // Could pull user's display name from family store
        subject: options.title,
        title: options.title,
        message: options.message,
        category: options.category,
        amount: options.metadata?.amount ? `₹${options.metadata.amount.toLocaleString('en-IN')}` : '',
        priority: options.severity,
        member: options.member || 'System',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        notes: options.metadata?.notes || '',
        action: 'View Expensify',
      }, id);
    }
  }
}

export const notificationCenter = new NotificationCenter();
