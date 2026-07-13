import { useState, useMemo, useCallback } from 'react';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useUIStore } from '@/stores/useUIStore';

import { useAuthStore } from '@/stores/useAuthStore';
import { useEditRequestStore } from '@/stores/useEditRequestStore';
import { exportToCSV, exportToExcel, exportToPDF, prepareExportData } from '@/utils/exportUtils';

import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { LedgerSummary } from './components/LedgerSummary';
import { LedgerFilters, LedgerFilterState } from './components/LedgerFilters';
import { LedgerTable } from './components/LedgerTable';
import { LedgerBulkActions } from './components/LedgerBulkActions';
import { TransactionDetailsDialog } from './components/TransactionDetailsDialog';
import { RequestDialog } from './components/RequestDialog';

const PAGE_SIZE = 50;

export function TransactionsPage() {
  const { transactions, archiveTransaction, restoreTransaction, updateTransaction } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { accounts } = useAccountStore();
  const familyMembers: any[] = [];



  const { currentMember } = useAuthStore();
  const { openTransactionModal } = useUIStore();
  const { addEditRequest } = useEditRequestStore();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<LedgerFilterState>({
    search: '',
    type: 'all',
    categoryId: 'all',
    accountId: 'all',
    accountType: 'all',
    addedBy: 'all',
    status: 'completed',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    quickDate: 'all'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewTransactionId, setViewTransactionId] = useState<string | null>(null);
  
  // Request dialog state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<'edit' | 'delete'>('edit');
  const [requestTransactionId, setRequestTransactionId] = useState('');
  const [requestTransactionOwner, setRequestTransactionOwner] = useState('');

  // 1. Calculate Running Balances (Chronological, Absolute)
  const runningBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    const sortedAll = [...transactions]
      .filter(t => !t.isArchived)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (filters.accountId !== 'all') {
      const acc = accounts.find(a => a.id === filters.accountId);
      let currentBalance = acc ? acc.openingBalance : 0;
      
      sortedAll.forEach(t => {
        let involved = false;
        if (t.type === 'income' && t.accountId === filters.accountId) {
          currentBalance += t.amount;
          involved = true;
        } else if (t.type === 'expense' && t.accountId === filters.accountId) {
          currentBalance -= t.amount;
          involved = true;
        } else if (t.type === 'transfer') {
          if (t.toAccountId === filters.accountId) {
            currentBalance += t.amount;
            involved = true;
          }
          if (t.fromAccountId === filters.accountId) {
            currentBalance -= t.amount;
            involved = true;
          }
        }
        if (involved) {
          balances[t.id] = currentBalance;
        }
      });
    } else {
      let currentBalance = accounts.reduce((sum, a) => sum + a.openingBalance, 0);
      
      sortedAll.forEach(t => {
        if (t.type === 'income') {
          currentBalance += t.amount;
        } else if (t.type === 'expense') {
          currentBalance -= t.amount;
        }
        balances[t.id] = currentBalance;
      });
    }
    
    return balances;
  }, [transactions, accounts, filters.accountId]);

  // 2. Filter & Sort Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (filters.status === 'completed' && t.isArchived) return false;
        if (filters.status === 'deleted' && !t.isArchived) return false;

        if (filters.type !== 'all' && t.type !== filters.type) return false;
        
        if (filters.categoryId !== 'all' && t.categoryId !== filters.categoryId) return false;
        
        if (filters.accountId !== 'all') {
          if (t.accountId !== filters.accountId && t.fromAccountId !== filters.accountId && t.toAccountId !== filters.accountId) return false;
        }

        if (filters.accountType !== 'all') {
          const accs = accounts.filter(a => a.type === filters.accountType).map(a => a.id);
          if (t.type === 'transfer') {
            if (!accs.includes(t.fromAccountId || '') && !accs.includes(t.toAccountId || '')) return false;
          } else {
            if (!accs.includes(t.accountId || '')) return false;
          }
        }

        if (filters.addedBy !== 'all' && t.addedBy !== filters.addedBy) return false;

        if (filters.minAmount !== '' && t.amount < parseFloat(filters.minAmount)) return false;
        if (filters.maxAmount !== '' && t.amount > parseFloat(filters.maxAmount)) return false;

        if (filters.startDate && new Date(t.date) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(t.date) > new Date(filters.endDate)) return false;

        if (filters.search) {
          const query = filters.search.toLowerCase();
          const categoryName = categories.find(c => c.id === t.categoryId)?.name?.toLowerCase() || '';
          const accountName = accounts.find(a => a.id === t.accountId)?.name?.toLowerCase() || '';
          const fromAccountName = accounts.find(a => a.id === t.fromAccountId)?.name?.toLowerCase() || '';
          const toAccountName = accounts.find(a => a.id === t.toAccountId)?.name?.toLowerCase() || '';
          const addedBy = (t.addedBy || '').toLowerCase();
          const notes = (t.notes || '').toLowerCase();

          if (
            !t.id.toLowerCase().includes(query) &&
            !notes.includes(query) &&
            !categoryName.includes(query) &&
            !accountName.includes(query) &&
            !fromAccountName.includes(query) &&
            !toAccountName.includes(query) &&
            !addedBy.includes(query) &&
            !t.amount.toString().includes(query)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff === 0) {
           return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
        }
        return dateDiff;
      });
  }, [transactions, filters, categories, accounts]);

  const openingBalanceForSummary = useMemo(() => {
    if (filters.accountId !== 'all') {
      return accounts.find(a => a.id === filters.accountId)?.openingBalance || 0;
    }
    return accounts.reduce((sum, a) => sum + a.openingBalance, 0);
  }, [accounts, filters.accountId]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [paginatedTransactions]);

  const handleBulkDelete = useCallback(() => {
    Array.from(selectedIds).forEach(id => archiveTransaction(id));
    toast.success(`Deleted ${selectedIds.size} transactions.`);
    setSelectedIds(new Set());
  }, [selectedIds, archiveTransaction]);

  const handleBulkRestore = useCallback(() => {
    Array.from(selectedIds).forEach(id => restoreTransaction(id));
    toast.success(`Restored ${selectedIds.size} transactions.`);
    setSelectedIds(new Set());
  }, [selectedIds, restoreTransaction]);

  const handleBulkChangeCategory = useCallback((categoryId: string) => {
    Array.from(selectedIds).forEach(id => updateTransaction(id, { categoryId }));
    toast.success(`Updated category for ${selectedIds.size} transactions.`);
    setSelectedIds(new Set());
  }, [selectedIds, updateTransaction]);

  const handleBulkChangeAccount = useCallback((accountId: string) => {
    Array.from(selectedIds).forEach(id => {
      const t = transactions.find(tx => tx.id === id);
      if (t && t.type !== 'transfer') {
        updateTransaction(id, { accountId });
      }
    });
    toast.success(`Updated account for non-transfer transactions.`);
    setSelectedIds(new Set());
  }, [selectedIds, transactions, updateTransaction]);

  const handleBulkExport = useCallback((format: 'csv'|'excel'|'pdf') => {
    const dataToExport = filteredTransactions.filter(t => selectedIds.has(t.id));
    if (dataToExport.length === 0) return;

    const formattedData = prepareExportData(dataToExport, categories, accounts, runningBalances);
    const filename = `Transactions_Export_${new Date().getTime()}`;
    
    if (format === 'csv') exportToCSV(formattedData, filename);
    else if (format === 'excel') exportToExcel(formattedData, filename);
    else if (format === 'pdf') {
      exportToPDF({
        transactions: dataToExport,
        categories,
        accounts,
        familyMembers: [],

        generatedBy: currentMember || 'User',
        openingBalance: openingBalanceForSummary,
        closingBalance: dataToExport.length > 0 
          ? runningBalances[dataToExport[dataToExport.length - 1].id] || 0 
          : 0,
        runningBalances
      }, filename);
    }
    
    toast.success(`Exported ${dataToExport.length} transactions as ${format.toUpperCase()}`);
    setSelectedIds(new Set());
  }, [filteredTransactions, selectedIds, categories, accounts, familyMembers, runningBalances, openingBalanceForSummary, currentMember]);


  const handleDuplicate = useCallback((id: string) => {
    localStorage.setItem('duplicate_txn_id', id);
    openTransactionModal();
  }, [openTransactionModal]);

  const handleViewStatement = useCallback((accountId: string) => {
    navigate(`/accounts/${accountId}/statement`);
  }, [navigate]);

  const handleExport = useCallback((format: 'csv' | 'excel' | 'pdf') => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export.');
      return;
    }
    const formattedData = prepareExportData(filteredTransactions, categories, accounts, runningBalances);
    const filename = `Ledger_Export_${new Date().getTime()}`;
    
    if (format === 'csv') exportToCSV(formattedData, filename);
    else if (format === 'excel') exportToExcel(formattedData, filename);
    else if (format === 'pdf') {
      const pdfFilters = {
        member: filters.addedBy !== 'all' ? filters.addedBy : undefined,
        account: filters.accountId !== 'all' 
          ? accounts.find(a => a.id === filters.accountId)?.name 
          : undefined,
        category: filters.categoryId !== 'all' 
          ? categories.find(c => c.id === filters.categoryId)?.name 
          : undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        dateRange: (filters.startDate && filters.endDate) 
          ? { start: new Date(filters.startDate), end: new Date(filters.endDate) } 
          : undefined
      };
      
      exportToPDF({
        transactions: filteredTransactions,
        categories,
        accounts,
        familyMembers: [],

        filters: pdfFilters,
        generatedBy: currentMember || 'User',
        openingBalance: openingBalanceForSummary,
        closingBalance: filteredTransactions.length > 0 
          ? runningBalances[filteredTransactions[0].id] || 0 
          : 0,
        runningBalances
      }, filename);
    }
    
    toast.success(`Exported ${filteredTransactions.length} transactions as ${format.toUpperCase()}`);
  }, [filteredTransactions, categories, accounts, familyMembers, filters, runningBalances, openingBalanceForSummary, currentMember]);


  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleBulkMarkCleared = useCallback(() => {
    Array.from(selectedIds).forEach(id => updateTransaction(id, { isCleared: true }));
    toast.success(`Marked ${selectedIds.size} transactions as cleared.`);
    setSelectedIds(new Set());
  }, [selectedIds, updateTransaction]);
  
  const handleRequestEdit = useCallback((id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    setRequestType('edit');
    setRequestTransactionId(id);
    setRequestTransactionOwner(transaction.addedBy || 'Unknown');
    setRequestDialogOpen(true);
  }, [transactions]);
  
  const handleRequestDelete = useCallback((id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    setRequestType('delete');
    setRequestTransactionId(id);
    setRequestTransactionOwner(transaction.addedBy || 'Unknown');
    setRequestDialogOpen(true);
  }, [transactions]);
  
  const handleRequestSubmit = useCallback((data: { reason: string; priority: any }) => {
    addEditRequest({
      transactionId: requestTransactionId,
      owner: requestTransactionOwner,
      requestedBy: currentMember || 'Unknown',
      requestType,
      reason: data.reason,
      priority: data.priority,
    });
    toast.success(`${requestType.charAt(0).toUpperCase() + requestType.slice(1)} request sent!`);
  }, [addEditRequest, requestTransactionId, requestTransactionOwner, requestType, currentMember]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="no-print">
        <h1 className="text-3xl font-bold text-gradient-emerald-amber">Ledger</h1>
        <p className="text-muted-foreground">Professional banking-style transactions overview.</p>
      </div>

      <div className="no-print">
        <LedgerSummary 
          transactions={filteredTransactions} 
          openingBalance={openingBalanceForSummary} 
        />
      </div>

      <div className="no-print">
        <LedgerFilters 
          filters={filters} 
          setFilters={(f) => { setFilters(f); setCurrentPage(1); }} 
          categories={categories} 
          accounts={accounts} 
          onExport={handleExport}
          onPrint={handlePrint}
        />
      </div>

      <LedgerTable 
        transactions={paginatedTransactions}
        categories={categories}
        accounts={accounts}
        runningBalances={runningBalances}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onView={setViewTransactionId}
        onEdit={(id) => openTransactionModal(id)}
        onDuplicate={handleDuplicate}
        onDelete={(id) => { archiveTransaction(id); toast.success('Transaction deleted'); }}
        onRequestEdit={handleRequestEdit}
        onRequestDelete={handleRequestDelete}
        onViewStatement={handleViewStatement}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        currentMemberName={currentMember || null}
      />

      <LedgerBulkActions 
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkDelete={handleBulkDelete}
        onBulkRestore={handleBulkRestore}
        onBulkChangeCategory={handleBulkChangeCategory}
        onBulkChangeAccount={handleBulkChangeAccount}
        onBulkExport={handleBulkExport}
        onBulkMarkCleared={handleBulkMarkCleared}
        categories={categories}
        accounts={accounts}
      />

      <TransactionDetailsDialog
        open={!!viewTransactionId}
        onOpenChange={(open) => !open && setViewTransactionId(null)}
        transaction={
          viewTransactionId
            ? transactions.find(t => t.id === viewTransactionId) || null
            : null
        }
        categories={categories}
        accounts={accounts}
        runningBalance={
          viewTransactionId
            ? runningBalances[viewTransactionId] || 0
            : 0
        }
      />
      <RequestDialog 
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        requestType={requestType}
        transactionId={requestTransactionId}
        transactionOwner={requestTransactionOwner}
        onSubmit={handleRequestSubmit}
      />
    </div>
  );
}
