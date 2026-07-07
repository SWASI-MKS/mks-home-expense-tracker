import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { Button } from '@/components/common/Button';

export function AppearanceSettings() {
  const { theme, toggleTheme, accentColor, setAccentColor, fontSize, setFontSize } = useSettingsStore();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">Customize how the application looks.</p>
      </div>
      
      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
          </div>
          <select 
            value={theme}
            onChange={(e) => toggleTheme(e.target.value as 'light' | 'dark' | 'system')}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System Default</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="font-medium">Accent Color</p>
            <p className="text-sm text-muted-foreground">Primary application color</p>
          </div>
          <select 
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="blue">Blue</option>
            <option value="emerald">Emerald</option>
            <option value="orange">Orange</option>
            <option value="purple">Purple</option>
            <option value="rose">Rose</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="font-medium">Font Size</p>
            <p className="text-sm text-muted-foreground">Application text size</p>
          </div>
          <select 
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="large">Large</option>
            <option value="medium">Medium</option>
            <option value="small">Small</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function RegionalSettings() {
  const { 
    currency, language, dateFormat, numberFormat, firstDayOfWeek,
    setCurrency, setLanguage, setDateFormat, setNumberFormat, setFirstDayOfWeek 
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Regional</h3>
        <p className="text-sm text-muted-foreground">Set your language and formatting preferences.</p>
      </div>
      
      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="font-medium">Language</p>
            <p className="text-sm text-muted-foreground">Application display language</p>
          </div>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="font-medium">Currency Symbol</p>
            <p className="text-sm text-muted-foreground">Used for all financial displays</p>
          </div>
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="€">€ (EUR)</option>
            <option value="£">£ (GBP)</option>
            <option value="₹">₹ (INR)</option>
            <option value="¥">¥ (JPY)</option>
            <option value="$">$ (USD)</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="font-medium">Date Format</p>
            <p className="text-sm text-muted-foreground">How dates are displayed</p>
          </div>
          <select 
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="MM/dd/yyyy">01/01/2026</option>
            <option value="dd/MM/yyyy">01/01/2026</option>
            <option value="yyyy-MM-dd">2026-01-01</option>
            <option value="MMM dd, yyyy">Jan 01, 2026</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="font-medium">Number Format</p>
            <p className="text-sm text-muted-foreground">Number formatting style</p>
          </div>
          <select 
            value={numberFormat}
            onChange={(e) => setNumberFormat(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="en-US">US (1,234.56)</option>
            <option value="en-IN">India (1,234.56)</option>
            <option value="de-DE">Europe (1.234,56)</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="font-medium">First Day of Week</p>
            <p className="text-sm text-muted-foreground">Calendar starting day</p>
          </div>
          <select 
            value={firstDayOfWeek.toString()}
            onChange={(e) => setFirstDayOfWeek(parseInt(e.target.value, 10))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="1">Monday</option>
            <option value="0">Sunday</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function DashboardSettings() {
  const { resetWidgets, widgets, toggleWidgetVisibility } = useDashboardStore();
  const hiddenCount = widgets.filter(w => !w.visible).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Dashboard Preferences</h3>
        <p className="text-sm text-muted-foreground">Manage your widgets and layout.</p>
      </div>
      
      <div className="space-y-4 max-w-md">
        <div className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3">
          <div>
            <p className="font-medium">Reset Layout</p>
            <p className="text-sm text-muted-foreground">Restore the default widget order and visibility.</p>
          </div>
          <Button variant="outline" onClick={resetWidgets}>Reset Dashboard</Button>
        </div>

        {hiddenCount > 0 && (
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="font-medium mb-2">Hidden Widgets ({hiddenCount})</p>
            <div className="space-y-2">
              {widgets.filter(w => !w.visible).map(w => (
                <div key={w.id} className="flex justify-between items-center bg-card p-2 rounded border border-border">
                  <span className="text-sm">{w.title}</span>
                  <Button size="sm" variant="ghost" onClick={() => toggleWidgetVisibility(w.id, true)}>Show</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AboutSection() {
  const { transactions } = useTransactionStore();
  const { accounts } = useAccountStore();
  const { categories } = useCategoryStore();
  const { budgets } = useBudgetStore();
  const { lastBackupDate } = useSettingsStore();

  const getStorageSize = () => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('expense-tracker')) {
        total += (localStorage.getItem(key)?.length || 0) * 2; // Approx bytes
      }
    }
    return (total / 1024).toFixed(2); // KB
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">About & Storage</h3>
        <p className="text-sm text-muted-foreground">Application details and storage usage.</p>
      </div>
      
      <div className="space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-sm text-muted-foreground">Version</p>
            <p className="font-medium text-lg">1.0.0</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-sm text-muted-foreground">Local Storage</p>
            <p className="font-medium text-lg">{getStorageSize()} KB</p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <h4 className="font-medium mb-3">Database Records</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transactions</span>
              <span className="font-medium">{transactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Archived Transactions</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accounts</span>
              <span className="font-medium">{accounts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categories</span>
              <span className="font-medium">{categories.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Budgets</span>
              <span className="font-medium">{budgets.length}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <h4 className="font-medium mb-1">Backup Status</h4>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Last JSON Backup</span>
            <span className="font-medium">{lastBackupDate ? new Date(lastBackupDate).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
