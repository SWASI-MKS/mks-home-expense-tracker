import { useState } from 'react';
import { Palette, Globe, Database, LayoutDashboard, Info, Users, Bell, Lock } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';

// Sub-components
import { AppearanceSettings, RegionalSettings, DashboardSettings, AboutSection } from './components/SettingsComponents';
import { DataManagement } from './components/DataManagement';
import { FamilySettings } from './components/FamilySettings';
import { NotificationSettings } from './components/NotificationSettings';
import { SecuritySettings } from './components/SecuritySettings';

type Tab = 'appearance' | 'regional' | 'notifications' | 'data' | 'family' | 'dashboard' | 'security' | 'about';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('data'); // Defaulting to data for Phase 7 demonstration

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'regional', label: 'Regional', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'family', label: 'Family Sync', icon: Users },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'about', label: 'About', icon: Info },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and data.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        {/* Mobile Horizontal Nav */}
        <Card className="md:hidden p-2 bg-card border-border overflow-x-auto">
          <nav className="flex gap-2 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Desktop Sidebar Nav */}
        <Card className="hidden md:block md:w-64 shrink-0 h-max p-2 bg-card border-border">
          <nav className="flex flex-col space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content Area */}
        <div className="flex-1 bg-card rounded-xl border border-border shadow-sm p-6 overflow-y-auto">
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'regional' && <RegionalSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'data' && <DataManagement />}
          {activeTab === 'family' && <FamilySettings />}
          { activeTab === 'dashboard' && <DashboardSettings /> }
          { activeTab === 'security' && <SecuritySettings /> }
          { activeTab === 'about' && <AboutSection /> }
        </div>
      </div>
    </div>
  );
}
