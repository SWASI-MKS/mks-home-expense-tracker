import { Routes, Route, Navigate } from 'react-router-dom';
import { AccountsPage } from '@/pages/Accounts/AccountsPage';
import { Layout } from '@/components/layout/Layout';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { CategoriesPage } from '@/pages/Categories/CategoriesPage';
import { TransactionsPage } from '@/pages/Transactions/TransactionsPage';
import { BudgetsPage } from '@/pages/Budgets/BudgetsPage';
import { CalendarPage } from '@/pages/Calendar/CalendarPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          
          {/* Placeholders for other routes until implemented */}
          <Route path="reports" element={<div className="p-4 animate-in fade-in">Reports Page</div>} />
          <Route path="settings" element={<div className="p-4 animate-in fade-in">Settings Page</div>} />
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
