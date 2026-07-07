import { useReportsData } from './hooks/useReportsData';
import { ReportSummary } from './components/ReportSummary';
import { ReportFilters } from './components/ReportFilters';
import { ReportCharts } from './components/ReportCharts';
import { ReportTable } from './components/ReportTable';
import { ReportInsights } from './components/ReportInsights';

export function ReportsPage() {
  const { 
    filterType, setFilterType, 
    filteredTransactions, summary 
  } = useReportsData();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">Comprehensive analysis of your finances.</p>
      </div>

      <ReportFilters filterType={filterType} setFilterType={setFilterType} />
      
      <ReportSummary summary={summary} />
      
      <ReportInsights 
        filteredTransactions={filteredTransactions} 
        summary={summary} 
      />

      <ReportCharts summary={summary} transactions={filteredTransactions} />
      
      <ReportTable transactions={filteredTransactions} summary={summary} />

    </div>
  );
}
