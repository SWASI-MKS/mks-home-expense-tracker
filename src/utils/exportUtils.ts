import { Transaction, Account, Category, FamilyMember } from '@/types';

import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable, { CellHookData } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { formatCurrency } from './currency';

interface ExportData {
  Date: string;
  Time: string;
  'Transaction ID': string;
  Type: string;
  Category: string;
  Subcategory?: string;
  Merchant: string;
  Account: string;
  'Payment Method': string;
  'Reference No'?: string;
  Credit: string;
  Debit: string;
  'Running Balance': string;
  'Added By': string;
  'Approved By'?: string;
  Status: string;
  Remarks: string;
  Attachments?: string;
  Tags?: string;
  transactionType: string;
}

interface PDFExportOptions {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  familyMembers: FamilyMember[];
  filters?: {
    member?: string;
    account?: string;
    category?: string;
    type?: string;
    dateRange?: { start: Date; end: Date };
  };
  generatedBy?: string;
  openingBalance?: number;
  closingBalance?: number;
  runningBalances?: Record<string, number>;
}

// Page dimensions and margins
const PAGE_WIDTH = 297; // A4 Landscape
const PAGE_HEIGHT = 210;
const MARGIN_LEFT = 10;
const MARGIN_RIGHT = 10;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const HEADER_HEIGHT = 12;
const FOOTER_HEIGHT = 12;

// State management for PDF generation
interface PDFState {
  doc: jsPDF;
  currentPage: number;
  totalPages: number;
  reportId: string;
  generatedOn: string;
  generatedBy: string;
  yPos: number;
}

// Prepare export data with all fields
export function prepareExportData(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  runningBalances: Record<string, number>
): ExportData[] {
  return transactions.map((t) => {
    let accountName = '';
    if (t.type === 'transfer') {
      const fromAcc = accounts.find((a) => a.id === t.fromAccountId)?.name || 'Unknown';
      const toAcc = accounts.find((a) => a.id === t.toAccountId)?.name || 'Unknown';
      accountName = `${fromAcc} → ${toAcc}`;
    } else {
      accountName = accounts.find((a) => a.id === t.accountId)?.name || 'Unknown';
    }

    const categoryName = categories.find((c) => c.id === t.categoryId)?.name || '-';
    const merchant = (t as any).merchant || '-';
    const paymentMethod = (t as any).paymentMethod || '-';
    const referenceNo = (t as any).referenceNo || '';
    const subcategory = (t as any).subcategory || '';
    const approvedBy = (t as any).approvedBy || '';
    const attachments = (t as any).attachments?.length > 0 ? '📎 Yes' : '';
    const tags = (t as any).tags?.join(', ') || '';
    
    let credit = '';
    let debit = '';
    
    if (t.type === 'income') credit = formatCurrency(t.amount);
    else if (t.type === 'expense') debit = formatCurrency(t.amount);
    else if (t.type === 'transfer') {
      debit = formatCurrency(t.amount);
      credit = formatCurrency(t.amount);
    }

    let typeLabel = t.type.charAt(0).toUpperCase() + t.type.slice(1);

    return {
      Date: format(new Date(t.date), 'dd MMM yyyy'),
      Time: format(new Date(t.date), 'hh:mm a'),
      'Transaction ID': t.id.substring(0, 8),
      Type: typeLabel,
      Category: categoryName,
      Subcategory: subcategory,
      Merchant: merchant,
      Account: accountName,
      'Payment Method': paymentMethod,
      'Reference No': referenceNo,
      Credit: credit,
      Debit: debit,
      'Running Balance': runningBalances[t.id] !== undefined ? formatCurrency(runningBalances[t.id]) : '-',
      'Added By': t.addedBy || '-',
      'Approved By': approvedBy,
      Status: (t as any).status || 'Completed',
      Remarks: t.notes || '-',
      Attachments: attachments,
      Tags: tags,
      transactionType: t.type,
    };
  });
}

// CSV export
export function exportToCSV(data: ExportData[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Excel export
export function exportToExcel(data: ExportData[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Helper functions
function drawWatermark(state: PDFState) {
  // Use light gray text instead of GState for better compatibility
  state.doc.setFontSize(50);
  state.doc.setTextColor(240, 240, 240);
  state.doc.text('MKS FAMILY', PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { 
    align: 'center', 
    angle: 45 
  });
}

function drawHeader(state: PDFState) {
  state.doc.setFillColor(0, 51, 102);
  state.doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');
  
  state.doc.setFontSize(8);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(255, 255, 255);
  state.doc.text('MKS FAMILY EXPENSE TRACKER', MARGIN_LEFT, 6);
  
  state.doc.setFontSize(6);
  state.doc.setFont('helvetica', 'normal');
  state.doc.text('Transactions Ledger Report', PAGE_WIDTH - MARGIN_RIGHT, 6, { align: 'right' });
  state.doc.text(`Family Code: MKS-FAMILY | ${format(new Date(), 'dd MMM yyyy')}`, PAGE_WIDTH - MARGIN_RIGHT, 10, { align: 'right' });
}

function drawFooter(state: PDFState) {
  const footerY = PAGE_HEIGHT - 8;
  
  state.doc.setDrawColor(200, 200, 200);
  state.doc.setLineWidth(0.1);
  state.doc.line(MARGIN_LEFT, PAGE_HEIGHT - FOOTER_HEIGHT, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - FOOTER_HEIGHT);
  
  state.doc.setFontSize(6);
  state.doc.setTextColor(100, 100, 100);
  state.doc.text(
    `Generated By: ${state.generatedBy} | On: ${state.generatedOn} | ID: ${state.reportId} | Confidential | Page ${state.currentPage} of ${state.totalPages}`,
    PAGE_WIDTH / 2,
    footerY,
    { align: 'center' }
  );
}

function ensurePageSpace(state: PDFState, requiredHeight: number) {
  const maxY = PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_HEIGHT;
  if (state.yPos + requiredHeight > maxY) {
    addNewPage(state);
  }
}

function addNewPage(state: PDFState) {
  state.doc.addPage();
  state.currentPage++;
  drawWatermark(state);
  drawHeader(state);
  drawFooter(state);
  state.yPos = MARGIN_TOP + HEADER_HEIGHT;
}

// Main PDF export function
export function exportToPDF(options: PDFExportOptions, filename: string) {
  try {
    const {
      transactions,
      categories,
      accounts,
      filters,
      generatedBy = 'User',
      openingBalance = 0,
      closingBalance = 0,
      runningBalances = {}
    } = options;

    const summaries = precomputeSummaries(transactions, categories, accounts);
    
    const state: PDFState = {
      doc: new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }),
      currentPage: 1,
      totalPages: 1, // We'll update this at the end
      reportId: `RPT-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
      generatedOn: format(new Date(), 'dd MMM yyyy HH:mm'),
      generatedBy: generatedBy,
      yPos: MARGIN_TOP
    };

    // Start with first page
    drawWatermark(state);
    drawHeader(state);
    drawFooter(state);

    // ===== COVER PAGE =====
    drawCoverPage(state, summaries, filters, closingBalance);
    
    // ===== EXECUTIVE SUMMARY =====
    addNewPage(state);
    drawExecutiveSummary(state, summaries, openingBalance, closingBalance);
    
    // ===== CHARTS =====
    ensurePageSpace(state, 80);
    drawCharts(state, summaries);
    
    // ===== REPORT CONFIGURATION =====
    ensurePageSpace(state, 25);
    drawReportConfiguration(state, filters, transactions.length, generatedBy, state.generatedOn);
    
    // ===== TRANSACTION TABLE =====
    const exportData = prepareExportData(transactions, categories, accounts, runningBalances);
    drawTransactionTable(state, exportData);
    
    // ===== CATEGORY SUMMARY TABLE =====
    ensurePageSpace(state, 80);
    drawCategorySummaryTable(state, summaries);
    
    // ===== MEMBER SUMMARY TABLE =====
    ensurePageSpace(state, 80);
    drawMemberSummaryTable(state, summaries);
    
    // ===== ACCOUNT SUMMARY TABLE =====
    ensurePageSpace(state, 80);
    drawAccountSummaryTable(state, accounts, transactions);
    
    // ===== MONTHLY ANALYSIS TABLE =====
    ensurePageSpace(state, 80);
    drawMonthlyAnalysisTable(state, summaries);
    
    // ===== ANALYTICS =====
    ensurePageSpace(state, 80);
    drawAnalytics(state, summaries);
    
    // ===== FINAL PAGE =====
    addNewPage(state);
    drawFinalPage(state);
    
    // Update total pages
    state.totalPages = state.doc.getNumberOfPages();
    // Now go back and update all page numbers in footers
    for (let i = 1; i <= state.totalPages; i++) {
      state.doc.setPage(i);
      state.currentPage = i;
      drawFooter(state);
    }
    
    state.doc.save(`${filename}.pdf`);
    
  } catch (err) {
    console.error('Error exporting PDF:', err);
    exportToPDFLegacy(
      prepareExportData(
        options.transactions,
        options.categories,
        options.accounts,
        options.runningBalances || {}
      ),
      filename
    );
  }
}

// Cover Page
function drawCoverPage(state: PDFState, summaries: any, filters: any, closingBalance: number) {
  state.yPos = MARGIN_TOP + HEADER_HEIGHT + 15;
  
  // Title
  state.doc.setFontSize(24);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('MKS FAMILY EXPENSE TRACKER', PAGE_WIDTH / 2, state.yPos, { align: 'center' });
  state.yPos += 12;
  
  state.doc.setFontSize(16);
  state.doc.text('Transactions Ledger Report', PAGE_WIDTH / 2, state.yPos, { align: 'center' });
  state.yPos += 20;
  
  // Decorative line
  state.doc.setDrawColor(0, 51, 102);
  state.doc.setLineWidth(0.7);
  state.doc.line(PAGE_WIDTH / 4, state.yPos, PAGE_WIDTH * 3 / 4, state.yPos);
  state.yPos += 15;
  
  // Details
  state.doc.setFontSize(11);
  state.doc.setTextColor(51, 51, 51);
  
  const details = [
    { label: 'Family Code:', value: 'MKS-FAMILY' },
    { label: 'Generated By:', value: state.generatedBy },
    { label: 'Generated Date:', value: state.generatedOn },
    { label: 'Report Period:', value: filters?.dateRange ? 
      `${format(filters.dateRange.start, 'dd MMM yyyy')} - ${format(filters.dateRange.end, 'dd MMM yyyy')}` : 
      'All Time' },
    { label: 'Total Transactions:', value: summaries.totalTransactions.toString() },
    { label: 'Total Income:', value: formatCurrency(summaries.totalIncome) },
    { label: 'Total Expense:', value: formatCurrency(summaries.totalExpense) },
    { label: 'Net Savings:', value: formatCurrency(summaries.netSavings) },
    { label: 'Closing Balance:', value: formatCurrency(closingBalance) },
  ];
  
  const startX = PAGE_WIDTH / 2 - 50;
  details.forEach(detail => {
    state.doc.setFont('helvetica', 'bold');
    state.doc.text(detail.label, startX, state.yPos);
    state.doc.setFont('helvetica', 'normal');
    state.doc.text(detail.value, startX + 60, state.yPos);
    state.yPos += 8;
  });
  
  state.yPos = PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_HEIGHT - 20;
  state.doc.setFontSize(12);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(150, 150, 150);
  state.doc.text('CONFIDENTIAL', PAGE_WIDTH / 2, state.yPos, { align: 'center' });
}

// Executive Summary
function drawExecutiveSummary(state: PDFState, summaries: any, openingBalance: number, closingBalance: number) {
  state.yPos = MARGIN_TOP + HEADER_HEIGHT + 5;
  
  state.doc.setFontSize(13);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Executive Summary', MARGIN_LEFT, state.yPos);
  state.yPos += 10;
  
  // Top KPI Cards
  const kpis = [
    { label: 'Opening Balance', value: formatCurrency(openingBalance), color: [100, 100, 100] },
    { label: 'Income', value: formatCurrency(summaries.totalIncome), color: [34, 197, 94] },
    { label: 'Expense', value: formatCurrency(summaries.totalExpense), color: [239, 68, 68] },
    { label: 'Transfers', value: formatCurrency(summaries.totalTransfers), color: [59, 130, 246] },
    { label: 'Net Savings', value: formatCurrency(summaries.netSavings), color: [16, 185, 129] },
    { label: 'Closing Balance', value: formatCurrency(closingBalance), color: [0, 51, 102] },
  ];
  
  const cardWidth = (CONTENT_WIDTH - 15) / 6;
  let cardX = MARGIN_LEFT;
  
  kpis.forEach(kpi => {
    state.doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    state.doc.roundedRect(cardX, state.yPos, cardWidth - 2, 18, 2, 2, 'F');
    
    state.doc.setFontSize(5);
    state.doc.setTextColor(255, 255, 255);
    state.doc.text(kpi.label, cardX + 2, state.yPos + 5);
    
    state.doc.setFontSize(7);
    state.doc.setFont('helvetica', 'bold');
    state.doc.text(kpi.value, cardX + 2, state.yPos + 13);
    
    cardX += cardWidth;
  });
  
  state.yPos += 28;
  
  // Metrics grid
  state.doc.setFontSize(11);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Key Metrics', MARGIN_LEFT, state.yPos);
  state.yPos += 8;
  
  const metrics = [
    { label: 'Transaction Count', value: summaries.totalTransactions.toString() },
    { label: 'Average Transaction', value: formatCurrency(summaries.avgTransaction) },
    { label: 'Largest Expense', value: `${summaries.largestExpense.category || 'N/A'}: ${formatCurrency(summaries.largestExpense.amount || 0)}` },
    { label: 'Largest Income', value: `${summaries.largestIncome.category || 'N/A'}: ${formatCurrency(summaries.largestIncome.amount || 0)}` },
    { label: 'Largest Transfer', value: formatCurrency(summaries.largestTransfer.amount || 0) },
    { label: 'Average Daily Expense', value: formatCurrency(summaries.avgDailyExpense) },
    { label: 'Average Monthly Expense', value: formatCurrency(summaries.avgMonthlyExpense) },
    { label: 'Most Used Category', value: summaries.mostUsedCategory },
    { label: 'Most Used Account', value: summaries.mostUsedAccount },
    { label: 'Most Active Member', value: summaries.mostActiveMember },
    { label: 'First Transaction', value: summaries.firstTransaction },
    { label: 'Last Transaction', value: summaries.lastTransaction },
  ];
  
  state.doc.setFontSize(7);
  const colWidth = CONTENT_WIDTH / 3;
  
  metrics.forEach((metric, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = MARGIN_LEFT + col * colWidth;
    const rowY = state.yPos + row * 7;
    
    state.doc.setFont('helvetica', 'bold');
    state.doc.setTextColor(0, 51, 102);
    state.doc.text(metric.label + ':', x, rowY);
    state.doc.setFont('helvetica', 'normal');
    state.doc.setTextColor(51, 51, 51);
    state.doc.text(metric.value.substring(0, 40), x + 45, rowY);
  });
  
  state.yPos += Math.ceil(metrics.length / 3) * 7 + 10;
}

// Charts
function drawCharts(state: PDFState, summaries: any) {
  state.doc.setFontSize(11);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Financial Overview', MARGIN_LEFT, state.yPos);
  state.yPos += 8;
  
  // Income vs Expense vs Transfers vs Savings Chart
  const chartData = [
    { label: 'Income', value: summaries.totalIncome, color: [34, 197, 94] },
    { label: 'Expense', value: summaries.totalExpense, color: [239, 68, 68] },
    { label: 'Transfers', value: summaries.totalTransfers, color: [59, 130, 246] },
    { label: 'Savings', value: Math.abs(summaries.netSavings), color: [16, 185, 129] },
  ];
  
  const maxValue = Math.max(...chartData.map((d: { value: number }) => d.value), 1);

  const chartHeight = 35;
  const barCount = chartData.length;
  const barWidth = (CONTENT_WIDTH - 40) / barCount - 10;
  const totalWidth = barCount * (barWidth + 10);
  const startX = MARGIN_LEFT + (CONTENT_WIDTH - totalWidth) / 2;
  const chartBottom = state.yPos + chartHeight;
  
  chartData.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * (chartHeight - 8);
    const barX = startX + index * (barWidth + 10);
    const barY = chartBottom - barHeight;
    
    state.doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    state.doc.roundedRect(barX, barY, barWidth, barHeight, 1.5, 1.5, 'F');
    
    state.doc.setFontSize(5);
    state.doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    state.doc.text(formatCurrency(item.value), barX + barWidth / 2, barY - 1.5, { align: 'center' });
    
    state.doc.setFontSize(5.5);
    state.doc.setTextColor(51, 51, 51);
    state.doc.text(item.label, barX + barWidth / 2, chartBottom + 4, { align: 'center' });
  });
  
  state.yPos += chartHeight + 15;
  
  // Category Distribution Chart
  const categoryData = Object.entries(summaries.categoryTotals)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([name, amount], i) => ({
      label: name.length > 12 ? name.substring(0, 12) + '...' : name,
      value: amount as number,
      color: [
        [34, 197, 94], [59, 130, 246], [168, 85, 247], [245, 158, 11], [239, 68, 68]
      ][i % 5]
    }));
  
  if (categoryData.length > 0) {
    state.doc.setFontSize(11);
    state.doc.setFont('helvetica', 'bold');
    state.doc.setTextColor(0, 51, 102);
    state.doc.text('Top Expense Categories', MARGIN_LEFT, state.yPos);
    state.yPos += 8;
    

    const catMaxValue = Math.max(...categoryData.map((d: { value: number }) => d.value), 1);



    const catBarWidth = (CONTENT_WIDTH - 40) / categoryData.length - 10;
    const catTotalWidth = categoryData.length * (catBarWidth + 10);
    const catStartX = MARGIN_LEFT + (CONTENT_WIDTH - catTotalWidth) / 2;
    const catChartBottom = state.yPos + 30;
    
    categoryData.forEach((item, index) => {
      const barHeight = (item.value / catMaxValue) * 25;
      const barX = catStartX + index * (catBarWidth + 10);
      const barY = catChartBottom - barHeight;
      
      state.doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      state.doc.roundedRect(barX, barY, catBarWidth, barHeight, 1.5, 1.5, 'F');
      
      state.doc.setFontSize(4.5);
      state.doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      state.doc.text(formatCurrency(item.value), barX + catBarWidth / 2, barY - 1.5, { align: 'center' });
      
      state.doc.setFontSize(5);
      state.doc.setTextColor(51, 51, 51);
      state.doc.text(item.label, barX + catBarWidth / 2, catChartBottom + 4, { align: 'center' });
    });
    
    state.yPos += 45;
  }
  
  // Monthly Income & Expense Chart
  if (summaries.monthlyData && summaries.monthlyData.length > 0) {
    state.doc.setFontSize(11);
    state.doc.setFont('helvetica', 'bold');
    state.doc.setTextColor(0, 51, 102);
    state.doc.text('Monthly Income & Expense', MARGIN_LEFT, state.yPos);
    state.yPos += 8;
    
    const monthlyData = summaries.monthlyData.slice(-6); // Last 6 months
    const monthlyMax = Math.max(
      ...monthlyData.map((d: { income: number; expense: number }) => Math.max(d.income, d.expense)),
      1
    );
    const monthlyChartHeight = 30;
    const barWidthMonthly = (CONTENT_WIDTH - 50) / monthlyData.length - 8;
    const startXMonthly = MARGIN_LEFT + 25;
    const monthlyChartBottom = state.yPos + monthlyChartHeight;
    
    monthlyData.forEach((item: any, index: number) => {
      const groupX = startXMonthly + index * (barWidthMonthly + 8);
      const incomeHeight = (item.income / monthlyMax) * (monthlyChartHeight - 8);
      const expenseHeight = (item.expense / monthlyMax) * (monthlyChartHeight - 8);
      
      // Income bar
      state.doc.setFillColor(34, 197, 94);
      state.doc.rect(groupX, monthlyChartBottom - incomeHeight, barWidthMonthly / 2 - 1, incomeHeight, 'F');
      
      // Expense bar
      state.doc.setFillColor(239, 68, 68);
      state.doc.rect(groupX + barWidthMonthly / 2 + 1, monthlyChartBottom - expenseHeight, barWidthMonthly / 2 - 1, expenseHeight, 'F');
      
      // Month label
      state.doc.setFontSize(4.5);
      state.doc.setTextColor(51, 51, 51);
      state.doc.text(item.month, groupX + barWidthMonthly / 2, monthlyChartBottom + 4, { align: 'center' });
    });
    
    // Legend
    state.doc.setFontSize(5);
    state.doc.setFillColor(34, 197, 94);
    state.doc.rect(MARGIN_LEFT, state.yPos, 4, 4, 'F');
    state.doc.text('Income', MARGIN_LEFT + 6, state.yPos + 3.5);
    state.doc.setFillColor(239, 68, 68);
    state.doc.rect(MARGIN_LEFT + 25, state.yPos, 4, 4, 'F');
    state.doc.text('Expense', MARGIN_LEFT + 31, state.yPos + 3.5);
    
    state.yPos += monthlyChartHeight + 15;
  }
}

// Report Configuration
function drawReportConfiguration(state: PDFState, filters: any, totalResults: number, generatedBy: string, generatedOn: string) {
  state.doc.setFontSize(10);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Report Configuration', MARGIN_LEFT, state.yPos);
  state.yPos += 7;
  
  const configs = [
    { label: 'Member:', value: filters?.member || 'All' },
    { label: 'Account:', value: filters?.account || 'All' },
    { label: 'Category:', value: filters?.category || 'All' },
    { label: 'Transaction Type:', value: filters?.type || 'All' },
    { label: 'Date Range:', value: filters?.dateRange ? 
      `${format(filters.dateRange.start, 'dd MMM yyyy')} - ${format(filters.dateRange.end, 'dd MMM yyyy')}` : 
      'All Time' },
    { label: 'Generated By:', value: generatedBy },
    { label: 'Generated On:', value: generatedOn },
    { label: 'Sorting:', value: 'Date (Descending)' },
    { label: 'Total Records:', value: totalResults.toString() },
  ];
  
  state.doc.setFontSize(7);
  const configColWidth = CONTENT_WIDTH / 3;
  
  configs.forEach((config, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = MARGIN_LEFT + col * configColWidth;
    const rowY = state.yPos + row * 6;
    
    state.doc.setFont('helvetica', 'bold');
    state.doc.text(config.label, x, rowY);
    state.doc.setFont('helvetica', 'normal');
    state.doc.text(config.value, x + 40, rowY);
  });
  
  state.yPos += Math.ceil(configs.length / 3) * 6 + 10;
}

// Transaction Table
function drawTransactionTable(state: PDFState, exportData: ExportData[]) {
  // Build dynamic columns based on data
  const allColumns = [
    { header: 'Date', dataKey: 'Date', fixed: true },
    { header: 'Time', dataKey: 'Time', fixed: true },
    { header: 'Transaction ID', dataKey: 'Transaction ID', fixed: true },
    { header: 'Type', dataKey: 'Type', fixed: true },
    { header: 'Category', dataKey: 'Category' },
    { header: 'Merchant', dataKey: 'Merchant' },
    { header: 'Account', dataKey: 'Account' },
    { header: 'Payment Method', dataKey: 'Payment Method' },
    { header: 'Credit', dataKey: 'Credit', fixed: true },
    { header: 'Debit', dataKey: 'Debit', fixed: true },
    { header: 'Running Balance', dataKey: 'Running Balance', fixed: true },
    { header: 'Added By', dataKey: 'Added By' },
    { header: 'Status', dataKey: 'Status' },
    { header: 'Remarks', dataKey: 'Remarks' },
  ];
  
  // Filter out empty columns
  const visibleColumns = allColumns.filter(col => {
    if (col.fixed) return true;
    return exportData.some(row => {
      const value = (row as any)[col.dataKey];
      return value && value !== '-' && value !== '';
    });
  });
  
  // Calculate font size based on column count
  let fontSize = 7;
  if (visibleColumns.length > 12) fontSize = 6;
  else if (visibleColumns.length > 10) fontSize = 6.5;
  
  const head = [visibleColumns.map(col => col.header)];
  const body = exportData.map((item) => 
    visibleColumns.map(col => (item as any)[col.dataKey] || '')
  );
  
  // Build column styles
  const columnStyles: any = {};
  visibleColumns.forEach((col, index) => {
    let width = 20;
    if (col.header === 'Date') width = 22;
    else if (col.header === 'Time') width = 18;
    else if (col.header === 'Transaction ID') width = 20;
    else if (col.header === 'Type') width = 16;
    else if (col.header === 'Category' || col.header === 'Merchant' || col.header === 'Account' || col.header === 'Remarks') width = 30;
    else if (col.header === 'Credit' || col.header === 'Debit' || col.header === 'Running Balance') width = 35;
    else if (col.header === 'Added By' || col.header === 'Status') width = 20;
    
    columnStyles[index] = {
      cellWidth: width,
      overflow: 'linebreak',
      minCellHeight: 5,
    };
    if (['Credit', 'Debit', 'Running Balance'].includes(col.header)) {
      columnStyles[index].halign = 'left';
    }
  });
  
  autoTable(state.doc, {
    startY: state.yPos,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      fontSize: fontSize,
      cellPadding: 1.5,
      lineWidth: 0.1,
      overflow: 'linebreak',
      minCellHeight: 4,
    },
    headStyles: {
      fillColor: [0, 51, 102],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: fontSize,
      cellPadding: 1.5,
      minCellHeight: 5,
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: state.yPos, bottom: MARGIN_BOTTOM + FOOTER_HEIGHT },
    tableWidth: 'wrap',
    horizontalPageBreak: true,
    horizontalPageBreakRepeat: [0, 1, 2], // Repeat Date, Time, Transaction ID
    showHead: 'everyPage',
    columnStyles: columnStyles,
    willDrawCell: (data: CellHookData) => {
      if (data.section === 'body') {
        const typeIndex = visibleColumns.findIndex(c => c.dataKey === 'Type');
        if (typeIndex >= 0 && data.column.index === typeIndex) {
          const transactionType = exportData[data.row.index]?.transactionType;
          if (transactionType === 'income') {
            data.cell.styles.textColor = [34, 197, 94];
          } else if (transactionType === 'expense') {
            data.cell.styles.textColor = [239, 68, 68];
          } else if (transactionType === 'transfer') {
            data.cell.styles.textColor = [59, 130, 246];
          }
        }
      }
    },
  });
  
  const finalY = (state.doc as any).lastAutoTable.finalY;
  state.yPos = finalY + 5;
}

// Category Summary Table
function drawCategorySummaryTable(state: PDFState, summaries: any) {
  state.doc.setFontSize(11);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Category Summary', MARGIN_LEFT, state.yPos);
  state.yPos += 6;
  
  const categoryTableData = Object.entries(summaries.categoryTotals)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([name, totalAmount]) => {
      const catData = summaries.categoryDetails?.[name] || { count: 0, income: 0, expense: 0, max: 0, min: Infinity };
      return [
        name,
        catData.count.toString(),
        formatCurrency(catData.income),
        formatCurrency(catData.expense),
        formatCurrency((catData.income + catData.expense) / Math.max(catData.count, 1)),
        formatCurrency(catData.max),
        formatCurrency(catData.min === Infinity ? 0 : catData.min),
        `${((totalAmount as number) / Math.max(summaries.totalExpense, 1) * 100).toFixed(1)}%`
      ];
    });
  
  if (categoryTableData.length > 0) {
    autoTable(state.doc, {
      startY: state.yPos,
      head: [['Category', 'Transactions', 'Income', 'Expense', 'Average', 'Highest', 'Lowest', 'Contribution %']],
      body: categoryTableData,
      theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 6.5, fontStyle: 'bold' },
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM + FOOTER_HEIGHT },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 22, halign: 'right' },
      }
    });
    
    state.yPos = (state.doc as any).lastAutoTable.finalY + 5;
  }
}

// Member Summary Table
function drawMemberSummaryTable(state: PDFState, summaries: any) {
  state.doc.setFontSize(11);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Member Summary', MARGIN_LEFT, state.yPos);
  state.yPos += 6;
  
  const memberTableData = summaries.memberDetails
    .sort((a: any, b: any) => b.transactions - a.transactions)
    .map((m: any) => [
      m.name,
      formatCurrency(m.income),
      formatCurrency(m.expense),
      formatCurrency(m.transfer),
      m.transactions.toString(),
      formatCurrency(m.net),
      formatCurrency(m.average),
      m.lastActivity ? format(new Date(m.lastActivity), 'dd MMM yyyy') : 'N/A'
    ]);
  
  if (memberTableData.length > 0) {
    autoTable(state.doc, {
      startY: state.yPos,
      head: [['Member', 'Income', 'Expense', 'Transfers', 'Transactions', 'Net', 'Average', 'Last Activity']],
      body: memberTableData,
      theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 6.5, fontStyle: 'bold' },
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM + FOOTER_HEIGHT },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 28, halign: 'center' },
      }
    });
    
    state.yPos = (state.doc as any).lastAutoTable.finalY + 5;
  }
}

// Account Summary Table
function drawAccountSummaryTable(state: PDFState, accounts: Account[], transactions: Transaction[], accountBalances?: Record<string, { currentBalance: number }>) {

  state.doc.setFontSize(11);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Account Summary', MARGIN_LEFT, state.yPos);
  state.yPos += 6;
  
  const accountData = accounts.map(acc => {
    const accCredits = transactions.filter(t => 
      (t.type === 'income' && t.accountId === acc.id) || 
      (t.type === 'transfer' && t.toAccountId === acc.id)
    ).reduce((sum, t) => sum + t.amount, 0);
    
    const accDebits = transactions.filter(t => 
      (t.type === 'expense' && t.accountId === acc.id) || 
      (t.type === 'transfer' && t.fromAccountId === acc.id)
    ).reduce((sum, t) => sum + t.amount, 0);
    
    const accTransfers = transactions.filter(t => 
      t.type === 'transfer' && (t.fromAccountId === acc.id || t.toAccountId === acc.id)
    ).length;
    
    const accTransactions = transactions.filter(t => 
      t.accountId === acc.id || t.fromAccountId === acc.id || t.toAccountId === acc.id
    ).length;
    
    return [
      acc.name,
      formatCurrency(accountBalances?.[acc.id]?.currentBalance ?? acc.openingBalance ?? 0),

      formatCurrency(accCredits),

      formatCurrency(accDebits),
      accTransfers.toString(),
      formatCurrency((accountBalances?.[acc.id]?.currentBalance ?? acc.openingBalance ?? 0)),

      accTransactions.toString()
    ];
  });
  
  if (accountData.length > 0) {
    autoTable(state.doc, {
      startY: state.yPos,
      head: [['Account', 'Opening', 'Credits', 'Debits', 'Transfers', 'Closing', 'Transactions']],
      body: accountData,
      theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 6.5, fontStyle: 'bold' },
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM + FOOTER_HEIGHT },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 20, halign: 'center' },
      }
    });
    
    state.yPos = (state.doc as any).lastAutoTable.finalY + 5;
  }
}

// Monthly Analysis Table
function drawMonthlyAnalysisTable(state: PDFState, summaries: any) {
  state.doc.setFontSize(11);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Monthly Analysis', MARGIN_LEFT, state.yPos);
  state.yPos += 6;
  
  const monthlyTableData = summaries.monthlyData?.map((m: any) => [
    m.month,
    formatCurrency(m.income),
    formatCurrency(m.expense),
    formatCurrency(m.transfers),
    formatCurrency(m.savings),
    formatCurrency(m.cashFlow)
  ]) || [];
  
  if (monthlyTableData.length > 0) {
    autoTable(state.doc, {
      startY: state.yPos,
      head: [['Month', 'Income', 'Expense', 'Transfers', 'Savings', 'Cash Flow']],
      body: monthlyTableData,
      theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 6.5, fontStyle: 'bold' },
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM + FOOTER_HEIGHT },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      }
    });
    
    state.yPos = (state.doc as any).lastAutoTable.finalY + 5;
  }
}

// Analytics
function drawAnalytics(state: PDFState, summaries: any) {
  state.doc.setFontSize(11);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Analytics', MARGIN_LEFT, state.yPos);
  state.yPos += 8;
  
  const analytics = [
    { label: 'Highest Expense', value: `${summaries.largestExpense.category || 'N/A'}: ${formatCurrency(summaries.largestExpense.amount || 0)}` },
    { label: 'Highest Income', value: `${summaries.largestIncome.category || 'N/A'}: ${formatCurrency(summaries.largestIncome.amount || 0)}` },
    { label: 'Smallest Expense', value: formatCurrency(summaries.smallestExpense.amount || 0) },
    { label: 'Smallest Income', value: formatCurrency(summaries.smallestIncome.amount || 0) },
    { label: 'Most Frequent Merchant', value: summaries.mostFrequentMerchant },
    { label: 'Most Frequent Category', value: summaries.mostUsedCategory },
    { label: 'Most Used Payment Method', value: summaries.mostUsedPaymentMethod },
    { label: 'Average Transaction', value: formatCurrency(summaries.avgTransaction) },
    { label: 'Median Transaction', value: formatCurrency(summaries.medianTransaction) },
    { label: 'Top Spending Month', value: summaries.topSpendingMonth },
    { label: 'Top Income Month', value: summaries.topIncomeMonth },
    { label: 'Top Contributor', value: summaries.topContributor },
  ];
  
  state.doc.setFontSize(7);
  const colWidth = CONTENT_WIDTH / 2;
  
  analytics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN_LEFT + col * colWidth;
    const rowY = state.yPos + row * 7;
    
    state.doc.setFont('helvetica', 'bold');
    state.doc.setTextColor(0, 51, 102);
    state.doc.text(metric.label + ':', x, rowY);
    state.doc.setFont('helvetica', 'normal');
    state.doc.setTextColor(51, 51, 51);
    state.doc.text(metric.value, x + 55, rowY);
  });
  
  state.yPos += Math.ceil(analytics.length / 2) * 7 + 10;
}

// Final Page
function drawFinalPage(state: PDFState) {
  state.yPos = PAGE_HEIGHT / 2 - 35;
  
  state.doc.setFontSize(22);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('END OF REPORT', PAGE_WIDTH / 2, state.yPos, { align: 'center' });
  
  state.yPos += 12;
  
  state.doc.setFontSize(10);
  state.doc.setFont('helvetica', 'normal');
  state.doc.setTextColor(100, 100, 100);
  state.doc.text('Generated Automatically', PAGE_WIDTH / 2, state.yPos, { align: 'center' });
  
  state.yPos += 8;
  state.doc.text('MKS FAMILY EXPENSE TRACKER', PAGE_WIDTH / 2, state.yPos, { align: 'center' });
  
  state.yPos += 15;
  
  const finalDetails = [
    `Generated By: ${state.generatedBy}`,
    `Generated On: ${state.generatedOn}`,
    `Report ID: ${state.reportId}`,
  ];
  
  state.doc.setFontSize(8);
  finalDetails.forEach(detail => {
    state.yPos += 6;
    state.doc.text(detail, PAGE_WIDTH / 2, state.yPos, { align: 'center' });
  });
  
  state.yPos += 15;
  
  // Digital signature
  state.doc.setDrawColor(0, 51, 102);
  state.doc.setLineWidth(0.5);
  state.doc.line(PAGE_WIDTH / 2 - 30, state.yPos, PAGE_WIDTH / 2 + 30, state.yPos);
  state.doc.setFontSize(7);
  state.doc.text('Digital Signature', PAGE_WIDTH / 2, state.yPos + 4, { align: 'center' });
  
  state.yPos += 20;
  
  state.doc.setFontSize(14);
  state.doc.setFont('helvetica', 'bold');
  state.doc.setTextColor(0, 51, 102);
  state.doc.text('Thank You', PAGE_WIDTH / 2, state.yPos, { align: 'center' });
  
  state.yPos += 10;
  state.doc.setFontSize(8);
  state.doc.setTextColor(150, 150, 150);
  state.doc.text('CONFIDENTIAL', PAGE_WIDTH / 2, state.yPos, { align: 'center' });
}

// Precompute summaries
function precomputeSummaries(transactions: Transaction[], categories: Category[], accounts: Account[]) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalTransfers = transactions.filter(t => t.type === 'transfer').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  
  const expenses = transactions.filter(t => t.type === 'expense');
  const incomes = transactions.filter(t => t.type === 'income');
  const transfers = transactions.filter(t => t.type === 'transfer');
  
  const largestExpense = expenses.reduce((max, t) => t.amount > (max?.amount || 0) ? t : max, expenses[0] || { amount: 0 });
  const largestIncome = incomes.reduce((max, t) => t.amount > (max?.amount || 0) ? t : max, incomes[0] || { amount: 0 });
  const largestTransfer = transfers.reduce((max, t) => t.amount > (max?.amount || 0) ? t : max, transfers[0] || { amount: 0 });
  
  const smallestExpense = expenses.reduce((min, t) => t.amount < (min?.amount || Infinity) ? t : min, expenses[0] || { amount: 0 });
  const smallestIncome = incomes.reduce((min, t) => t.amount < (min?.amount || Infinity) ? t : min, incomes[0] || { amount: 0 });
  
  const allAmounts = transactions.map(t => t.amount).sort((a, b) => a - b);
  const avgTransaction = allAmounts.length > 0 ? allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length : 0;
  const medianTransaction = allAmounts.length > 0 
    ? (allAmounts.length % 2 === 0 
      ? (allAmounts[allAmounts.length / 2 - 1] + allAmounts[allAmounts.length / 2]) / 2 
      : allAmounts[Math.floor(allAmounts.length / 2)])
    : 0;
  
  // Category details
  const categoryTotals: Record<string, number> = {};
  const categoryDetails: Record<string, any> = {};
  transactions.forEach(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    if (cat) {
      const catName = cat.name;
      if (!categoryDetails[catName]) {
        categoryDetails[catName] = { count: 0, income: 0, expense: 0, max: 0, min: Infinity };
      }
      categoryDetails[catName].count++;
      if (t.type === 'income') categoryDetails[catName].income += t.amount;
      else if (t.type === 'expense') {
        categoryDetails[catName].expense += t.amount;
        categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
      }
      if (t.amount > categoryDetails[catName].max) categoryDetails[catName].max = t.amount;
      if (t.amount < categoryDetails[catName].min) categoryDetails[catName].min = t.amount;
    }
  });
  
  // Account usage
  const accountUsage: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'transfer') {
      if (t.fromAccountId) accountUsage[t.fromAccountId] = (accountUsage[t.fromAccountId] || 0) + 1;
      if (t.toAccountId) accountUsage[t.toAccountId] = (accountUsage[t.toAccountId] || 0) + 1;
    } else {
      if (t.accountId) accountUsage[t.accountId] = (accountUsage[t.accountId] || 0) + 1;
    }
  });
  const mostUsedAccountId = Object.entries(accountUsage).sort(([, a], [, b]) => b - a)[0]?.[0];
  const mostUsedAccount = accounts.find(a => a.id === mostUsedAccountId)?.name || 'N/A';
  
  // Merchant frequency
  const merchantFreq: Record<string, number> = {};
  transactions.forEach(t => {
    const merchant = (t as any).merchant;
    if (merchant && merchant !== '-') {
      merchantFreq[merchant] = (merchantFreq[merchant] || 0) + 1;
    }
  });
  const mostFrequentMerchant = Object.entries(merchantFreq).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
  
  // Payment method frequency
  const paymentFreq: Record<string, number> = {};
  transactions.forEach(t => {
    const pm = (t as any).paymentMethod;
    if (pm && pm !== '-') {
      paymentFreq[pm] = (paymentFreq[pm] || 0) + 1;
    }
  });
  const mostUsedPaymentMethod = Object.entries(paymentFreq).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
  
  // Member stats
  const memberStats: Record<string, any> = {};
  transactions.forEach(t => {
    if (t.addedBy) {
      if (!memberStats[t.addedBy]) {
        memberStats[t.addedBy] = {
          income: 0, expense: 0, transfer: 0, transactions: 0, lastActivity: t.date
        };
      }
      memberStats[t.addedBy].transactions++;
      if (t.type === 'income') memberStats[t.addedBy].income += t.amount;
      else if (t.type === 'expense') memberStats[t.addedBy].expense += t.amount;
      else if (t.type === 'transfer') memberStats[t.addedBy].transfer += t.amount;
      if (new Date(t.date) > new Date(memberStats[t.addedBy].lastActivity)) {
        memberStats[t.addedBy].lastActivity = t.date;
      }
    }
  });
  
  const memberDetails = Object.entries(memberStats).map(([name, stats]) => ({
    name,
    income: stats.income,
    expense: stats.expense,
    transfer: stats.transfer,
    transactions: stats.transactions,
    net: stats.income - stats.expense,
    average: stats.transactions > 0 ? (stats.income + stats.expense + stats.transfer) / stats.transactions : 0,
    lastActivity: stats.lastActivity
  }));
  
  const mostUsedCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';
  const mostActiveMember = memberDetails.sort((a, b) => b.transactions - a.transactions)[0]?.name || 'N/A';
  const topContributor = memberDetails.sort((a, b) => b.income - a.income)[0]?.name || 'N/A';
  
  // Monthly data
  const monthlyMap: Record<string, any> = {};
  transactions.forEach(t => {
    const monthKey = format(new Date(t.date), 'MMM yyyy');
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, income: 0, expense: 0, transfers: 0, count: 0 };
    }
    if (t.type === 'income') monthlyMap[monthKey].income += t.amount;
    else if (t.type === 'expense') monthlyMap[monthKey].expense += t.amount;
    else if (t.type === 'transfer') monthlyMap[monthKey].transfers += t.amount;
    monthlyMap[monthKey].count++;
  });
  
  const monthlyData = Object.values(monthlyMap).map(m => ({
    ...m,
    savings: m.income - m.expense,
    cashFlow: m.income - m.expense - m.transfers
  })).sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });
  
  const topSpendingMonth = [...monthlyData].sort((a, b) => b.expense - a.expense)[0]?.month || 'N/A';
  const topIncomeMonth = [...monthlyData].sort((a, b) => b.income - a.income)[0]?.month || 'N/A';
  
  // Calculate average daily expense
  const uniqueDays = new Set(transactions.map(t => format(new Date(t.date), 'yyyy-MM-dd'))).size;
  const avgDailyExpense = uniqueDays > 0 ? totalExpense / uniqueDays : 0;
  
  // Calculate average monthly expense
  const avgMonthlyExpense = monthlyData.length > 0 ? totalExpense / monthlyData.length : 0;
  
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  return {
    totalIncome, totalExpense, totalTransfers, netSavings,
    totalTransactions: transactions.length,
    largestExpense: { 
      amount: largestExpense.amount || 0, 
      category: largestExpense.categoryId ? categories.find(c => c.id === (largestExpense as any).categoryId)?.name : 'N/A' 
    },
    largestIncome: { 
      amount: largestIncome.amount || 0, 
      category: largestIncome.categoryId ? categories.find(c => c.id === (largestIncome as any).categoryId)?.name : 'N/A' 
    },
    largestTransfer: { amount: largestTransfer.amount || 0 },
    smallestExpense: { amount: smallestExpense.amount || 0 },
    smallestIncome: { amount: smallestIncome.amount || 0 },
    avgTransaction,
    medianTransaction,
    avgExpense: expenses.length > 0 ? totalExpense / expenses.length : 0,
    avgIncome: incomes.length > 0 ? totalIncome / incomes.length : 0,
    avgDailyExpense,
    avgMonthlyExpense,
    categoryTotals,
    categoryDetails,
    memberDetails,
    mostUsedCategory,
    mostActiveMember,
    mostUsedAccount,
    mostFrequentMerchant,
    mostUsedPaymentMethod,
    topSpendingMonth,
    topIncomeMonth,
    topContributor,
    monthlyData,
    firstTransaction: sortedTransactions[0] ? format(new Date(sortedTransactions[0].date), 'dd MMM yyyy') : 'N/A',
    lastTransaction: sortedTransactions[sortedTransactions.length - 1] ? 
      format(new Date(sortedTransactions[sortedTransactions.length - 1].date), 'dd MMM yyyy') : 'N/A',
    transactions
  };
}

// Legacy PDF export
export function exportToPDFLegacy(data: ExportData[], filename: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  doc.setFontSize(18);
  doc.text('Transactions Ledger', 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 30);

  const head = [Object.keys(data[0] || {}).slice(0, 10)];
  const body = data.map((item) => Object.values(item).slice(0, 10));

  autoTable(doc, {
    startY: 35,
    head: head,
    body: body,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`${filename}.pdf`);
}
