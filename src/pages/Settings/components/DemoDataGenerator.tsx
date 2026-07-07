import { useState, useCallback } from 'react';
import { Button } from '@/components/common/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/common/Dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Database, Download, X, AlertTriangle, CheckCircle, RefreshCcw, Trash2 } from 'lucide-react';
import { generateDemoData, clearDemoData, resetDemoData, hasDemoData, ProgressCallback } from '@/utils/demoDataGenerator';
import toast from 'react-hot-toast';

export function DemoDataEnvironment() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [progressMax, setProgressMax] = useState(100);
  
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [timeTaken, setTimeTaken] = useState<number>(0);

  const handleProgress: ProgressCallback = useCallback((msg, value, max) => {
    setProgressMsg(msg);
    setProgressValue(value);
    setProgressMax(max);
  }, []);

  const startGeneration = async (mode: 'generate' | 'reset') => {
    setShowDuplicateDialog(false);
    setShowProgressDialog(true);
    setIsGenerating(true);
    
    const startTime = performance.now();
    try {
      let results;
      if (mode === 'reset') {
        results = await resetDemoData(handleProgress);
      } else {
        results = await generateDemoData(handleProgress);
      }
      
      const endTime = performance.now();
      setTimeTaken((endTime - startTime) / 1000);
      setSummaryData(results);
      
      setShowProgressDialog(false);
      setShowSummaryDialog(true);
      toast.success('Demo data generated successfully!');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to generate demo data');
      setShowProgressDialog(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    console.log("Generate button clicked");
    if (hasDemoData()) {
      setShowDuplicateDialog(true);
    } else {
      startGeneration('generate');
    }
  };

  const handleClearClick = () => {
    setShowClearConfirm(true);
  };

  const executeClear = async () => {
    setShowProgressDialog(true);
    setIsGenerating(true);
    try {
      await clearDemoData(handleProgress);
      toast.success('Demo data cleared successfully');
    } catch(e) {
      console.error(e);
      toast.error('Failed to clear demo data');
    } finally {
      setIsGenerating(false);
      setShowProgressDialog(false);
      setShowClearConfirm(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl pt-6">
      <h4 className="font-medium text-blue-600 border-b border-blue-200 dark:border-blue-900/50 pb-2 flex items-center gap-2">
        <Database className="w-5 h-5" />
        Demo Data Environment
      </h4>
      <p className="text-sm text-muted-foreground">
        Populate the application with professional, highly realistic demo data to test features like budgets, reporting, and calendar naturally.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-blue-500/10 dark:text-blue-500/5">
            <Database className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 relative z-10">
            <Download className="w-5 h-5" />
            <h5 className="font-semibold">Generate Demo Data</h5>
          </div>
          <p className="text-sm text-muted-foreground relative z-10">Generate hundreds of natural transactions across randomly distributed accounts and budgets.</p>
          <Button className="mt-auto w-full relative z-10" onClick={handleGenerateClick} disabled={isGenerating}>
            Generate Data
          </Button>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-rose-500/10 dark:text-rose-500/5">
            <Trash2 className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 relative z-10">
            <Trash2 className="w-5 h-5" />
            <h5 className="font-semibold">Clear Demo Data</h5>
          </div>
          <p className="text-sm text-muted-foreground relative z-10">Remove all generated demo data while keeping your actual family data perfectly intact.</p>
          <Button variant="outline" className="mt-auto w-full border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 relative z-10" onClick={handleClearClick} disabled={isGenerating}>
            Clear Demo Records
          </Button>
        </div>
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Demo Data Already Exists
            </DialogTitle>
            <DialogDescription>
              Your application already contains demo data. Generating more may clutter your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button variant="default" onClick={() => startGeneration('reset')} className="justify-start">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Replace Existing Demo Data
            </Button>
            <Button variant="outline" onClick={() => startGeneration('generate')} className="justify-start">
              <Database className="w-4 h-4 mr-2" />
              Keep Existing Demo Data (Append)
            </Button>
            <Button variant="ghost" onClick={() => setShowDuplicateDialog(false)} className="justify-start">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={(open) => {
        if (!open && !isGenerating) setShowProgressDialog(false);
      }}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Generating Demo Data</DialogTitle>
            <DialogDescription>
              Please wait while we simulate several months of family financial activity.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="bg-muted rounded-full h-2 w-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300" 
                style={{ width: `${progressMax > 0 ? (progressValue / progressMax) * 100 : 0}%` }} 
              />
            </div>
            <p className="text-sm font-medium text-center font-mono text-muted-foreground h-6">
              {progressMsg}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-xl">Demo Data Generated Successfully</DialogTitle>
          </DialogHeader>
          
          {summaryData && (
            <div className="mt-4 bg-muted/50 rounded-lg p-4 space-y-2 text-sm font-mono">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Accounts:</span>
                <span className="font-semibold">{summaryData.accounts}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Categories:</span>
                <span className="font-semibold">{summaryData.categories}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Budgets:</span>
                <span className="font-semibold">{summaryData.budgets}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Transactions:</span>
                <span className="font-semibold">{summaryData.transactions}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Transfers:</span>
                <span className="font-semibold">{summaryData.transfers}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Calendar Items:</span>
                <span className="font-semibold">{summaryData.calendarItems}</span>
              </div>
              <div className="flex justify-between text-base pt-2">
                <span className="font-medium text-foreground">Total Records:</span>
                <span className="font-bold text-primary">{summaryData.totalRecords}</span>
              </div>
              <div className="flex justify-between text-xs pt-4 text-muted-foreground">
                <span>Time Taken:</span>
                <span>{timeTaken.toFixed(2)} seconds</span>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setShowSummaryDialog(false)} className="w-full">
              Continue to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Confirm Dialog */}
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear Demo Data"
        description="Are you sure you want to delete all demo records? Your actual family data will remain safe and untouched."
        onConfirm={executeClear}
        confirmText="Clear Demo Data"
        variant="destructive"
      />
    </div>
  );
}
