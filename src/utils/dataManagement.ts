import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Transaction } from '@/types';
import { format } from 'date-fns';

// ==========================================
// JSON BACKUP & RESTORE
// ==========================================

export function generateBackupJSON(): string {
  const data = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    transactions: useTransactionStore.getState().transactions,
    accounts: useAccountStore.getState().accounts,
    categories: useCategoryStore.getState().categories,
    budgets: useBudgetStore.getState().budgets,
    dashboard: useDashboardStore.getState().widgets,
    settings: {
      currency: useSettingsStore.getState().currency,
      language: useSettingsStore.getState().language,
      theme: useSettingsStore.getState().theme,
    }
  };
  return JSON.stringify(data, null, 2);
}

export function validateBackupJSON(jsonString: string): any {
  try {
    const data = JSON.parse(jsonString);
    if (!data.transactions || !data.accounts || !data.categories) {
      throw new Error('Invalid backup file format');
    }
    return data;
  } catch (err) {
    throw new Error('Failed to parse JSON file');
  }
}

export function restoreFromBackup(data: any, mode: 'replace' | 'merge') {
  const txStore = useTransactionStore.getState();
  const accStore = useAccountStore.getState();
  const catStore = useCategoryStore.getState();
  const budStore = useBudgetStore.getState();
  const dashStore = useDashboardStore.getState();

  if (mode === 'replace') {
    useTransactionStore.setState({ transactions: data.transactions || [] });
    useAccountStore.setState({ accounts: data.accounts || [] });
    useCategoryStore.setState({ categories: data.categories || [] });
    useBudgetStore.setState({ budgets: data.budgets || [] });
    if (data.dashboard) dashStore.reorderWidgets(data.dashboard);
  } else {
    // Merge logic: avoid duplicate IDs
    const mergeArrays = (existing: any[], incoming: any[]) => {
      const existingIds = new Set(existing.map(e => e.id));
      const newItems = (incoming || []).filter(i => !existingIds.has(i.id));
      return [...existing, ...newItems];
    };

    useTransactionStore.setState({ transactions: mergeArrays(txStore.transactions, data.transactions) });
    useAccountStore.setState({ accounts: mergeArrays(accStore.accounts, data.accounts) });
    useCategoryStore.setState({ categories: mergeArrays(catStore.categories, data.categories) });
    useBudgetStore.setState({ budgets: mergeArrays(budStore.budgets, data.budgets) });
  }
  
  // Force a full balance recalculation just to be safe
  txStore.recalculateAllBalances();
}

export function clearAllData() {
  useTransactionStore.setState({ transactions: [] });
  // Don't clear accounts/categories completely, maybe leave defaults, but for now wipe them
  useAccountStore.setState({ accounts: [] });
  useCategoryStore.setState({ categories: [] });
  useBudgetStore.setState({ budgets: [] });
}

// ==========================================
// EXPORTS (CSV, EXCEL, PDF)
// ==========================================

function getExportData(txns: Transaction[]) {
  const accounts = useAccountStore.getState().accounts;
  const categories = useCategoryStore.getState().categories;

  return txns.map(t => ({
    ID: t.id,
    Date: format(new Date(t.date), 'yyyy-MM-dd'),
    Type: t.type.toUpperCase(),
    Category: categories.find(c => c.id === t.categoryId)?.name || '-',
    Account: accounts.find(a => a.id === t.accountId)?.name || '-',
    'From Account': accounts.find(a => a.id === t.fromAccountId)?.name || '-',
    'To Account': accounts.find(a => a.id === t.toAccountId)?.name || '-',
    Amount: t.amount,
    Notes: t.notes || '',
    Status: t.isArchived ? 'Archived' : 'Active'
  }));
}

export function exportToCSV(txns: Transaction[]) {
  const data = getExportData(txns);
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `transactions_${format(new Date(), 'yyyyMMdd')}.csv`);
}

export function exportToExcel(txns: Transaction[]) {
  const data = getExportData(txns);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  XLSX.writeFile(workbook, `transactions_${format(new Date(), 'yyyyMMdd')}.xlsx`);
}

export function exportToPDF(txns: Transaction[], summary: any) {
  const doc = new jsPDF();
  const data = getExportData(txns);
  const currency = useSettingsStore.getState().currency;

  // Cover Page / Header
  doc.setFontSize(22);
  doc.text("Financial Report", 14, 22);
  
  doc.setFontSize(12);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 32);

  // Summary Stats
  doc.setFontSize(14);
  doc.text("Summary", 14, 45);
  doc.setFontSize(10);
  doc.text(`Total Income: ${currency}${summary.income.toLocaleString('en-IN')}`, 14, 55);
  doc.text(`Total Expense: ${currency}${summary.expense.toLocaleString('en-IN')}`, 14, 62);
  doc.text(`Net Savings: ${currency}${summary.savings.toLocaleString('en-IN')}`, 14, 69);
  
  // Table
  const tableColumn = Object.keys(data[0] || {});
  const tableRows = data.map(obj => Object.values(obj));

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] } // Emerald 500
  });

  doc.save(`report_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

// ==========================================
// CSV IMPORT
// ==========================================

export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}

// Basic file downloader helper
function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
