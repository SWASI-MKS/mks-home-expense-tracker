import { Moon, Sun, Plus } from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/common/Button';

export function Header() {
  const { theme, setTheme } = useSettingsStore();
  const { openTransactionModal } = useUIStore();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 md:px-8">
      <h2 className="text-lg font-semibold md:hidden">Expensify</h2>
      <div className="hidden md:block">{/* Placeholder for search or breadcrumbs */}</div>
      
      <div className="flex items-center gap-4">
        <Button onClick={() => openTransactionModal()} className="hidden md:flex" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Transaction
        </Button>
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
