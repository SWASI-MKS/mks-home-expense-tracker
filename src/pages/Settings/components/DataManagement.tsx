import { useState, useRef } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { 
  generateBackupJSON, validateBackupJSON, restoreFromBackup, clearAllData,
  exportToCSV, exportToExcel, exportToPDF 
} from '@/utils/dataManagement';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Download, Upload, Trash2, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { CSVImport } from './CSVImport';
import { notificationCenter } from '@/services/notification/notificationCenter';
import { useFamilyStore } from '@/stores/useFamilyStore';

export function DataManagement() {
  const { transactions } = useTransactionStore();
  const { summary } = useDashboardData();
  
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreData, setRestoreData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    try {
      const json = generateBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense_tracker_backup_${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      // Update last backup date in store
      useSettingsStore.getState().setLastBackupDate(new Date().toISOString());
      
      const member = useFamilyStore.getState().displayName || 'System';
      notificationCenter.dispatch({
        title: 'Backup Successful',
        message: `${member} successfully exported a data backup.`,
        category: 'BACKUP',
        severity: 'SUCCESS',
        member,
        preventEmail: true,
      });
      
      toast.success('Backup exported successfully');
    } catch (e: any) {
      const member = useFamilyStore.getState().displayName || 'System';
      notificationCenter.dispatch({
        title: 'Backup Failed',
        message: `Failed to generate data backup. Error: ${e.message}`,
        category: 'BACKUP',
        severity: 'ERROR',
        member,
        forceEmail: true,
      });
      toast.error('Failed to generate backup');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const data = validateBackupJSON(result);
        setRestoreData(data);
        setIsRestoreOpen(true);
      } catch (err: any) {
        const member = useFamilyStore.getState().displayName || 'System';
        notificationCenter.dispatch({
          title: 'Corrupted JSON Import',
          message: `${member} attempted to import an invalid backup file. Error: ${err.message}`,
          category: 'SYSTEM',
          severity: 'ERROR',
          member,
          forceEmail: true,
        });
        toast.error(err.message || 'Invalid backup file');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmRestore = (mode: 'replace' | 'merge') => {
    if (!restoreData) return;
    try {
      restoreFromBackup(restoreData, mode);
      
      const member = useFamilyStore.getState().displayName || 'System';
      notificationCenter.dispatch({
        title: 'Backup Restored',
        message: `${member} restored a backup (${mode}).`,
        category: 'BACKUP',
        severity: 'SUCCESS',
        member,
        preventEmail: true,
      });
      
      toast.success('Data restored successfully');
      setIsRestoreOpen(false);
      setRestoreData(null);
    } catch (e: any) {
      const member = useFamilyStore.getState().displayName || 'System';
      notificationCenter.dispatch({
        title: 'Database Restore Failed',
        message: `Failed to restore backup. Error: ${e.message}`,
        category: 'BACKUP',
        severity: 'CRITICAL',
        member,
        forceEmail: true,
      });
      toast.error('Failed to restore data');
    }
  };

  const handleClearData = () => {
    clearAllData();
    setIsClearOpen(false);
    
    const member = useFamilyStore.getState().displayName || 'System';
    notificationCenter.dispatch({
      title: 'Database Wiped',
      message: `${member} cleared all application data.`,
      category: 'SYSTEM',
      severity: 'WARNING',
      member,
      preventEmail: true,
    });
    
    toast.success('All data has been cleared');
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Data Management</h3>
        <p className="text-sm text-muted-foreground">Backup, restore, and export your financial data.</p>
      </div>

      {/* Backup & Restore */}
      <div className="space-y-4 max-w-2xl">
        <h4 className="font-medium border-b border-border pb-2">Backup & Restore</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Download className="w-5 h-5" />
              <h5 className="font-semibold">Export JSON Backup</h5>
            </div>
            <p className="text-sm text-muted-foreground">Download a complete snapshot of all your transactions, accounts, categories, budgets, and settings.</p>
            <Button className="mt-auto w-full" onClick={handleExportJSON}>Generate Backup</Button>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Upload className="w-5 h-5" />
              <h5 className="font-semibold">Restore Backup</h5>
            </div>
            <p className="text-sm text-muted-foreground">Restore your application state from a previously downloaded JSON backup file.</p>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button variant="outline" className="mt-auto w-full" onClick={() => fileInputRef.current?.click()}>
              Select JSON File
            </Button>
          </div>

          <CSVImport />
        </div>
      </div>

      {/* Exports */}
      <div className="space-y-4 max-w-2xl">
        <h4 className="font-medium border-b border-border pb-2">Export Reports</h4>
        <p className="text-sm text-muted-foreground mb-4">Export your transactions into various formats for external use.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="outline" className="flex flex-col h-auto py-4 gap-2" onClick={() => exportToCSV(transactions)}>
            <FileText className="w-6 h-6 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4 gap-2" onClick={() => exportToExcel(transactions)}>
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Export Excel</span>
          </Button>
          <Button variant="outline" className="flex flex-col h-auto py-4 gap-2" onClick={() => exportToPDF(transactions, summary)}>
            <FileJson className="w-6 h-6 text-rose-600" />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 max-w-2xl pt-6">
        <h4 className="font-medium text-rose-600 border-b border-rose-200 dark:border-rose-900/50 pb-2">Danger Zone</h4>
        <div className="p-4 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/10 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-600">
            <Trash2 className="w-5 h-5" />
            <h5 className="font-semibold">Clear All Data</h5>
          </div>
          <p className="text-sm text-rose-600/80">Permanently delete all transactions, accounts, categories, and budgets. This action cannot be undone.</p>
          <Button variant="destructive" className="mt-2 w-max" onClick={() => setIsClearOpen(true)}>Wipe Application Data</Button>
        </div>
      </div>

      {/* Restore Dialog */}
      {isRestoreOpen && restoreData && (
        <ConfirmDialog
          open={isRestoreOpen}
          onOpenChange={setIsRestoreOpen}
          title="Restore Backup"
          description={`This backup contains ${restoreData.transactions?.length || 0} transactions and ${restoreData.accounts?.length || 0} accounts. How would you like to restore it?`}
          onConfirm={() => handleConfirmRestore('replace')}
          confirmText="Replace All Current Data"
          variant="destructive"
        >
          <Button variant="outline" className="w-full mt-2" onClick={() => handleConfirmRestore('merge')}>
            Merge with Current Data
          </Button>
        </ConfirmDialog>
      )}

      {/* Clear Dialog */}
      <ConfirmDialog
        open={isClearOpen}
        onOpenChange={setIsClearOpen}
        title="Are you absolutely sure?"
        description="This will permanently delete all your data, including all transactions, accounts, and budgets. Make sure you have exported a backup first!"
        onConfirm={handleClearData}
        confirmText="Yes, delete everything"
        variant="destructive"
      />
    </div>
  );
}
