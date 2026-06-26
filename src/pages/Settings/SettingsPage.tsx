import { useState } from 'react';
import { Palette, Globe, Database, LayoutDashboard, Info } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';

// Sub-components
import { AppearanceSettings, RegionalSettings, DashboardSettings, AboutSection } from './components/SettingsComponents';
import { DataManagement } from './components/DataManagement';

type Tab = 'appearance' | 'regional' | 'data' | 'dashboard' | 'about';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('data'); // Defaulting to data for Phase 7 demonstration

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'regional', label: 'Regional', icon: Globe },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'about', label: 'About', icon: Info },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and data.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        {/* Sidebar Nav */}
        <Card className="md:w-64 shrink-0 h-max p-2 bg-card border-border">
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
          {activeTab === 'data' && <DataManagement />}
          {activeTab === 'dashboard' && <DashboardSettings />}
          {activeTab === 'about' && <AboutSection />}
        </div>
      </div>
    </div>
  );
}
