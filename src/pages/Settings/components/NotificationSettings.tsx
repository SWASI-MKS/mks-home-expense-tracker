import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Card } from '@/components/common/Card';
import { Bell, Mail, Clock, ShieldAlert, Trash2, Send, MessageSquare } from 'lucide-react';
import { notificationCenter } from '@/services/notification/notificationCenter';
import { browserNotification } from '@/services/notification/browserNotification';
import toast from 'react-hot-toast';

export function NotificationSettings() {
  const settings = useSettingsStore();
  const { clearHistory } = useNotificationStore();

  const handleToggle = (key: keyof typeof settings) => {
    settings.updateNotificationSettings({ [key]: !settings[key] });
  };

  const handleTestEmail = async () => {
    if (!settings.notificationEmailAddress) {
      toast.error('Please configure an email address first.');
      return;
    }

    toast.success('Queuing test email...');
    
    await notificationCenter.dispatch({
      title: '✅ Expensify Test Email',
      message: 'Congratulations!\nYour EmailJS integration is working successfully.\nYour Expense Tracker can now send:\n• Budget Alerts\n• Reminder Emails\n• Financial Reports\nEverything has been configured correctly.',
      category: 'SYSTEM',
      severity: 'SUCCESS',
      member: 'System',
      forceEmail: true,
      preventBrowser: true,
    });
  };

  const handleTestBrowserNotification = async () => {
    if (!settings.enableBrowserNotifications) {
      toast.error('Browser notifications are disabled in settings.');
      return;
    }
    
    const hasPermission = await browserNotification.requestPermission();
    if (!hasPermission) {
      toast.error('Browser permission denied.');
      return;
    }

    await notificationCenter.dispatch({
      title: '✅ Test Browser Notification',
      message: 'Browser notifications are working correctly!',
      category: 'SYSTEM',
      severity: 'SUCCESS',
      member: 'System',
      forceBrowser: true,
      preventEmail: true,
    });
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all notification history?')) {
      clearHistory();
      toast.success('Notification history cleared.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Notification & Email Settings</h2>
        <p className="text-muted-foreground">Configure how you receive alerts and reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Delivery Methods</h3>
          </div>
          
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">Receive important alerts via EmailJS</div>
            </div>
            <input
              type="checkbox"
              className="toggle"
              checked={settings.enableEmailNotifications}
              onChange={() => handleToggle('enableEmailNotifications')}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Browser Notifications</div>
              <div className="text-sm text-muted-foreground">Receive real-time desktop alerts</div>
            </div>
            <input
              type="checkbox"
              className="toggle"
              checked={settings.enableBrowserNotifications}
              onChange={async (e) => {
                if (e.target.checked) {
                  const granted = await browserNotification.requestPermission();
                  if (!granted) {
                    toast.error('Permission denied by browser.');
                    return;
                  }
                }
                handleToggle('enableBrowserNotifications');
              }}
            />
          </label>
          
          {settings.enableEmailNotifications && (
            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              <label className="text-sm font-medium">Notification Email Address</label>
              <input
                type="email"
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                value={settings.notificationEmailAddress}
                onChange={(e) => settings.updateNotificationSettings({ notificationEmailAddress: e.target.value })}
              />
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Event Triggers</h3>
          </div>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-medium">Budget Alerts</span>
            <input
              type="checkbox"
              className="toggle"
              checked={settings.enableBudgetAlerts}
              onChange={() => handleToggle('enableBudgetAlerts')}
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-medium">Reminder Emails</span>
            <input
              type="checkbox"
              className="toggle"
              checked={settings.enableReminderEmails}
              onChange={() => handleToggle('enableReminderEmails')}
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-medium">Monthly Reports</span>
            <input
              type="checkbox"
              className="toggle"
              checked={settings.enableMonthlyReports}
              onChange={() => handleToggle('enableMonthlyReports')}
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-medium">Yearly Reports</span>
            <input
              type="checkbox"
              className="toggle"
              checked={settings.enableYearlyReports}
              onChange={() => handleToggle('enableYearlyReports')}
            />
          </label>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Thresholds & Limits</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>Budget Warning Percentage</span>
                <span>{settings.budgetWarningPercentage}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="100"
                className="w-full"
                value={settings.budgetWarningPercentage}
                onChange={(e) => settings.updateNotificationSettings({ budgetWarningPercentage: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Large Expense Threshold</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                value={settings.largeExpenseThreshold}
                onChange={(e) => settings.updateNotificationSettings({ largeExpenseThreshold: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Large Income Threshold</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                value={settings.largeIncomeThreshold}
                onChange={(e) => settings.updateNotificationSettings({ largeIncomeThreshold: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Large Transfer Threshold</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                value={settings.largeTransferThreshold}
                onChange={(e) => settings.updateNotificationSettings({ largeTransferThreshold: Number(e.target.value) })}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Quiet Hours</h3>
          </div>
          
          <label className="flex items-center justify-between cursor-pointer mb-4">
            <div>
              <div className="font-medium">Enable Quiet Hours</div>
              <div className="text-sm text-muted-foreground">Suppress browser notifications</div>
            </div>
            <input
              type="checkbox"
              className="toggle"
              checked={settings.enableQuietHours}
              onChange={() => handleToggle('enableQuietHours')}
            />
          </label>

          {settings.enableQuietHours && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  value={settings.quietHoursStart}
                  onChange={(e) => settings.updateNotificationSettings({ quietHoursStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  value={settings.quietHoursEnd}
                  onChange={(e) => settings.updateNotificationSettings({ quietHoursEnd: e.target.value })}
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Testing & Maintenance</h3>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleTestEmail}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Test Email
            </button>
            
            <button
              onClick={handleTestBrowserNotification}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Show Test Browser Notification
            </button>
            
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors flex items-center gap-2 ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Clear Notification History
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
