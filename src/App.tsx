import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AccountsPage } from '@/pages/Accounts/AccountsPage';
import { AccountStatementPage } from '@/pages/Accounts/AccountStatementPage';
import { AccountDetailsPage } from '@/pages/Accounts/AccountDetailsPage';
import { Layout } from '@/components/layout/Layout';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { CategoriesPage } from '@/pages/Categories/CategoriesPage';
import { TransactionsPage } from '@/pages/Transactions/TransactionsPage';
import { BudgetsPage } from '@/pages/Budgets/BudgetsPage';
import { CalendarPage } from '@/pages/Calendar/CalendarPage';
import { SettingsPage } from '@/pages/Settings/SettingsPage';
import { ReportsPage } from '@/pages/Reports/ReportsPage';
import { WelcomePage } from '@/pages/Welcome/WelcomePage';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { initializeSync } from '@/services/firestore/syncManager';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { theme, accentColor, fontSize } = useSettingsStore();

  // Apply theme, accent, and font size
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply theme (dark/light/system)
    if (theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Listen for system theme changes if in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Apply accent color
    root.setAttribute('data-accent', accentColor);

    // Apply font size
    root.setAttribute('data-font-size', fontSize);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, accentColor, fontSize]);

  useEffect(() => {
    initializeSync();
  }, []);

  if (!isAuthenticated) {
    return (
      <>
        <WelcomePage />
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:id" element={<AccountDetailsPage />} />
          <Route path="accounts/:id/statement" element={<AccountStatementPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'bg-card text-card-foreground border-border',
          style: {
            borderRadius: '10px',
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
        }} 
      />
    </>
  );
}

export default App;
