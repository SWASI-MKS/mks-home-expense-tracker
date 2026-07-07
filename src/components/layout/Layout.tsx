import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { useTheme } from '@/hooks/useTheme';
import { TransactionModal } from '@/components/forms/TransactionModal';
import { BudgetModal } from '@/components/forms/BudgetModal';
import { useUIStore } from '@/stores/useUIStore';

export function Layout() {
  useTheme(); // Initialize theme
  const { openTransactionModal, setSidebarCollapsed } = useUIStore();

  useEffect(() => {
    // Check if tablet on initial load
    if (window.innerWidth >= 768 && window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, [setSidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        {/* Floating Action Button (Mobile Only) */}
        <button 
          onClick={() => openTransactionModal()}
          className="md:hidden fixed right-6 bottom-24 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95 z-40"
          aria-label="Add Transaction"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <BottomNav />
      <TransactionModal />
      <BudgetModal />
    </div>
  );
}
