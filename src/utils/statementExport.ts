import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currency';

export function exportStatementToCSV(statementData: any, categories: any[]) {
  const { account, rows, summary, isBalanced } = statementData;
  const now = new Date();
  
  const header = [
    ['Account Statement'],
    [`Account: ${account.name}`],
    [`Type: ${account.type.toUpperCase()}`],
    [`Generated: ${format(now, 'PPpp')}`],
    [],
    ['Summary'],
    [`Opening Balance: ${summary.periodOpeningBalance}`],
    [`Total Credits: +${summary.totalCredits}`],
    [`Total Debits: -${summary.totalDebits}`],
    [`Closing Balance: ${summary.closingBalance}`],
    [`Statement Balanced: ${isBalanced ? 'Yes' : 'No'}`],
    []
  ];

  const tableData = rows.map((r: any) => ({
    Date: r.isOpeningBalance ? '-' : format(new Date(r.date), 'yyyy-MM-dd'),
    ID: r.transactionId || '-',
    Description: r.description,
    Category: r.categoryId ? categories.find(c => c.id === r.categoryId)?.name || '-' : '-',
    Type: r.isOpeningBalance ? '-' : r.type.toUpperCase(),
    Debit: r.debit > 0 ? r.debit : '',
    Credit: r.credit > 0 ? r.credit : '',
    'Running Balance': r.runningBalance,
    'Added By': r.addedBy || '-'
  }));

  const csvContent = Papa.unparse(tableData);
  const headerCsv = Papa.unparse(header, { header: false });
  const finalCsv = `${headerCsv}\n${csvContent}`;

  const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${account.name.replace(/\s+/g, '_')}_statement_${format(now, 'yyyyMMdd')}.csv`);
}

export function exportStatementToExcel(statementData: any, categories: any[]) {
  const { account, rows, summary, isBalanced } = statementData;
  const now = new Date();

  // Create summary rows
  const summaryRows = [
    ['Account Statement', ''],
    ['Account', account.name],
    ['Type', account.type.toUpperCase()],
    ['Generated', format(now, 'PPpp')],
    ['', ''],
    ['Summary', ''],
    ['Opening Balance', summary.periodOpeningBalance],
    ['Total Credits', summary.totalCredits],
    ['Total Debits', summary.totalDebits],
    ['Closing Balance', summary.closingBalance],
    ['Statement Balanced', isBalanced ? 'Yes' : 'No'],
    ['', '']
  ];

  const tableData = rows.map((r: any) => ({
    Date: r.isOpeningBalance ? '-' : format(new Date(r.date), 'yyyy-MM-dd'),
    ID: r.transactionId || '-',
    Description: r.description,
    Category: r.categoryId ? categories.find(c => c.id === r.categoryId)?.name || '-' : '-',
    Type: r.isOpeningBalance ? '-' : r.type.toUpperCase(),
    Debit: r.debit || '',
    Credit: r.credit || '',
    'Running Balance': r.runningBalance,
    'Added By': r.addedBy || '-'
  }));

  const ws = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.sheet_add_json(ws, tableData, { origin: -1, skipHeader: false });
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Statement");
  XLSX.writeFile(wb, `${account.name.replace(/\s+/g, '_')}_statement_${format(now, 'yyyyMMdd')}.xlsx`);
}

export function exportStatementToPDF(statementData: any, categories: any[]) {
  const { account, rows, summary, isBalanced } = statementData;
  const now = new Date();
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("Account Statement", 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Account: ${account.name} (${account.type.toUpperCase()})`, 14, 32);
  doc.text(`Generated: ${format(now, 'PPpp')}`, 14, 38);

  // Summary
  doc.setFontSize(14);
  doc.text("Summary", 14, 50);
  doc.setFontSize(10);
  doc.text(`Opening Balance: ${formatCurrency(summary.periodOpeningBalance)}`, 14, 58);
  doc.text(`Total Credits: +${formatCurrency(summary.totalCredits)}`, 14, 64);
  doc.text(`Total Debits: -${formatCurrency(summary.totalDebits)}`, 14, 70);
  doc.text(`Closing Balance: ${formatCurrency(summary.closingBalance)}`, 14, 76);
  doc.text(`Statement Balanced: ${isBalanced ? 'Yes' : 'No'}`, 14, 82);

  // Table
  const tableColumn = ["Date", "Description", "Category", "Type", "Debit", "Credit", "Balance"];
  const tableRows = rows.map((r: any) => [
    r.isOpeningBalance ? '-' : format(new Date(r.date), 'dd-MMM-yyyy'),
    r.description,
    r.categoryId ? categories.find((c: any) => c.id === r.categoryId)?.name || '-' : '-',
    r.isOpeningBalance ? '-' : r.type.toUpperCase(),
    r.debit ? `${formatCurrency(r.debit)}` : '',
    r.credit ? `${formatCurrency(r.credit)}` : '',
    `${formatCurrency(r.runningBalance)}`
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 90,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] } // Blue 500
  });

  doc.save(`${account.name.replace(/\s+/g, '_')}_statement_${format(now, 'yyyyMMdd')}.pdf`);
}

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
