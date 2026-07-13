import { Moon, Sun, Plus, Menu } from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/common/Button';
import { NotificationBell } from './NotificationBell';
import { useSyncStore } from '@/stores/useSyncStore';
import { dbService } from '@/services/firestore/dbService';

export function Header() {
  const { theme, setTheme } = useSettingsStore();
  const { openTransactionModal, toggleSidebar, isSidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { status, queue, lastSyncedTime, retryFailedOps } = useSyncStore();
  
  const failedOps = queue.filter(op => op.status === 'failed');
  const failedCount = failedOps.length;

  // Debug log to verify Header sees the correct queue length
  console.log('[Header] Current sync status:', status);
  console.log('[Header] Current queue length:', queue.length);
  console.log('[Header] Failed count:', failedCount);
  console.log('[Header] Queue contents:', queue.map(op => op.id));

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleMenuClick = () => {
    if (window.innerWidth >= 768) {
      setSidebarCollapsed(!isSidebarCollapsed);
    } else {
      toggleSidebar();
    }
  };

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    retryFailedOps();
    dbService.triggerBackgroundSync();
  };

  const getStatusConfig = () => {
    if (failedCount > 0) {
      return {
        dotColor: 'bg-red-500 animate-pulse',
        title: 'Sync Error',
        subtitle: `${failedCount} Failed Sync${failedCount > 1 ? 's' : ''}`,
        bgColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
      };
    }

    switch (status) {
      case 'synced':
        return {
          dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
          title: 'Synced',
          subtitle: lastSyncedTime ? `Last synced:\n${lastSyncedTime}` : 'All changes saved',
          bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
        };
      case 'syncing':
        return {
          dotColor: 'bg-amber-500 animate-pulse',
          title: 'Syncing...',
          subtitle: `Pending changes:\n${queue.length}`,
          bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
        };
      case 'offline':
        return {
          dotColor: 'bg-orange-500',
          title: 'Offline',
          subtitle: `Changes queued:\n${queue.length}`,
          bgColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25'
        };
      case 'error':
        return {
          dotColor: 'bg-red-500 animate-ping',
          title: 'Synchronization failed.',
          subtitle: 'Retrying automatically...',
          bgColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
        };
      default:
        return {
          dotColor: 'bg-emerald-500',
          title: 'Synced',
          subtitle: 'All changes saved',
          bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 z-20 relative">
      <div className="flex items-center gap-3">
        <button
          onClick={handleMenuClick}
          className="p-2 -ml-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors w-12 h-12 flex items-center justify-center"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold md:hidden">Expensify</h2>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        {/* Connection Status indicator */}
        <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-[10px] sm:text-xs leading-tight font-medium ${statusConfig.bgColor} transition-colors duration-300`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dotColor}`} />
          <div className="flex flex-col text-left">
            <span className="font-semibold">{statusConfig.title}</span>
            <span className="text-[9px] opacity-80 font-normal whitespace-pre-line mt-0.5">
              {statusConfig.subtitle}
            </span>
          </div>
          {failedCount > 0 && (
            <button 
              onClick={handleRetryClick}
              className="ml-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold shadow-sm transition-all transform active:scale-95"
            >
              Retry
            </button>
          )}
        </div>

        <Button onClick={() => openTransactionModal()} className="hidden md:flex" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Transaction
        </Button>
        <NotificationBell />
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors w-10 h-10 flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
