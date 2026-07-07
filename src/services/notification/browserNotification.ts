import { useSettingsStore } from '@/stores/useSettingsStore';

class BrowserNotificationService {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  checkPermission(): boolean {
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  async showNotification(title: string, options?: NotificationOptions) {
    const settings = useSettingsStore.getState();
    if (!settings.enableBrowserNotifications) return;

    // Only request permission if the user has enabled browser notifications in settings
    if (this.checkPermission() || await this.requestPermission()) {
      try {
        const notification = new Notification(title, {
          icon: '/vite.svg', // Replace with your app icon path if different
          badge: '/vite.svg',
          ...options
        });

        notification.onclick = function () {
          window.focus();
          this.close();
        };
      } catch (error) {
        console.error('Failed to show browser notification', error);
      }
    }
  }
}

export const browserNotification = new BrowserNotificationService();
