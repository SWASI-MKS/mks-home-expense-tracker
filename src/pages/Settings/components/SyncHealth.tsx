import { useState } from 'react';
import { useSyncStore, PendingOp } from '@/stores/useSyncStore';
import { dbService } from '@/services/firestore/dbService';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import { 
  RefreshCw, AlertTriangle, CheckCircle, Clock, Activity, 
  Download, Eye, Database, Receipt, Tags, PieChart, Settings, Bell, 
  AlertOctagon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CollectionConfig {
  name: string;
  label: string;
  icon: any;
  color: string;
}

const COLLECTIONS_CONFIG: CollectionConfig[] = [
  { name: 'accounts', label: 'Accounts', icon: Database, color: 'text-blue-500 bg-blue-500/10' },
  { name: 'transactions', label: 'Transactions', icon: Receipt, color: 'text-emerald-500 bg-emerald-500/10' },
  { name: 'categories', label: 'Categories', icon: Tags, color: 'text-amber-500 bg-amber-500/10' },
  { name: 'budgets', label: 'Budgets', icon: PieChart, color: 'text-purple-500 bg-purple-500/10' },
  { name: 'settings', label: 'Settings', icon: Settings, color: 'text-pink-500 bg-pink-500/10' },
  { name: 'notifications', label: 'Notifications', icon: Bell, color: 'text-indigo-500 bg-indigo-500/10' },
];

export function SyncHealth() {
  const { 
    queue, status, lastSyncedTime, lastSuccessfulSync, 
    lastSyncDuration, averageSyncDuration, retryFailedOps, updateOpState 
  } = useSyncStore();
  
  const [selectedErrorOp, setSelectedErrorOp] = useState<PendingOp | null>(null);

  const handleRetryAll = () => {
    const failedCount = queue.filter(op => op.status === 'failed').length;
    if (failedCount === 0) {
      toast.success('No failed operations to retry.');
      return;
    }
    retryFailedOps();
    dbService.triggerBackgroundSync();
    toast.success(`Retrying ${failedCount} failed operation(s)...`);
  };

  const handleRetryCollection = (colName: string) => {
    const failedColOps = queue.filter(op => op.collection === colName && op.status === 'failed');
    if (failedColOps.length === 0) {
      toast.success(`No failed operations for ${colName}.`);
      return;
    }

    // Reset only failed operations for this specific collection
    failedColOps.forEach(op => {
      updateOpState(op.id, {
        status: 'pending',
        errorCode: undefined,
        errorMessage: undefined,
        failedAt: undefined,
        lastAttempt: undefined,
        retryCount: 0
      });
    });

    dbService.triggerBackgroundSync();
    toast.success(`Retrying ${failedColOps.length} operation(s) for ${colName}...`);
  };

  const downloadErrorLog = (colName: string) => {
    const failedColOps = queue.filter(op => op.collection === colName && op.status === 'failed');
    if (failedColOps.length === 0) {
      toast.success(`No error logs to download for ${colName}.`);
      return;
    }

    const logData = failedColOps.map(op => ({
      id: op.id,
      collection: op.collection,
      docId: op.docId,
      type: op.type,
      retryCount: op.retryCount,
      errorCode: op.errorCode,
      errorMessage: op.errorMessage,
      failedAt: op.failedAt,
      lastAttempt: op.lastAttempt,
      queueVersion: op.queueVersion,
      data: op.data
    }));

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sync_error_log_${colName}_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded error log for ${colName}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 rounded-xl border border-border">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Sync Health Dashboard
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor background synchronization queues, performance, and recovery operations.
          </p>
        </div>
        <Button onClick={handleRetryAll} variant="outline" className="shrink-0 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry All Failed
        </Button>
      </div>

      {/* Connection summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Overall Status</p>
              <p className="text-lg font-bold capitalize mt-0.5">{status}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Queue Size</p>
              <p className="text-lg font-bold mt-0.5">{queue.length} item(s)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Last Sync Event</p>
              <p className="text-sm font-semibold mt-0.5 whitespace-pre-line leading-tight">
                {lastSyncedTime || 'No successful sync yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {COLLECTIONS_CONFIG.map(col => {
          const colOps = queue.filter(op => op.collection === col.name);
          const pendingCount = colOps.filter(op => op.status === 'pending' || op.status === 'syncing').length;
          const failedCount = colOps.filter(op => op.status === 'failed').length;
          
          let colStatus: 'synced' | 'pending' | 'failed' = 'synced';
          if (failedCount > 0) colStatus = 'failed';
          else if (pendingCount > 0) colStatus = 'pending';

          const lastSync = lastSuccessfulSync[col.name];
          const lastDur = lastSyncDuration[col.name];
          const avgDur = averageSyncDuration[col.name];

          return (
            <Card key={col.name} className="border-border bg-card flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 space-y-4 flex-1">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${col.color}`}>
                      <col.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground">{col.label}</h4>
                      <p className="text-xs text-muted-foreground">Collection: {col.name}</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {colStatus === 'synced' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Synced
                    </span>
                  )}
                  {colStatus === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Pending
                    </span>
                  )}
                  {colStatus === 'failed' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Failed
                    </span>
                  )}
                </div>

                {/* Queue Stats */}
                <div className="grid grid-cols-3 gap-2 bg-muted/20 p-3 rounded-lg text-center border border-border/50">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Queue Size</p>
                    <p className="text-base font-extrabold text-foreground mt-0.5">{colOps.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Pending</p>
                    <p className="text-base font-extrabold text-amber-500 mt-0.5">{pendingCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Failed</p>
                    <p className="text-base font-extrabold text-red-500 mt-0.5">{failedCount}</p>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Successful Sync:</span>
                    <span className="font-semibold text-foreground">
                      {lastSync ? new Date(lastSync).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync Duration:</span>
                    <span className="font-semibold text-foreground">{lastDur !== undefined ? `${lastDur}ms` : '0ms'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Sync Duration:</span>
                    <span className="font-semibold text-foreground">{avgDur !== undefined ? `${avgDur}ms` : '0ms'}</span>
                  </div>
                </div>

                {/* Error Items List */}
                {failedCount > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Failed Sync Errors:
                    </p>
                    <div className="max-h-24 overflow-y-auto space-y-2 pr-1 select-none">
                      {colOps.filter(op => op.status === 'failed').map(op => (
                        <div key={op.id} className="text-[11px] p-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 rounded-lg flex justify-between items-center gap-2 transition-colors">
                          <div className="truncate flex-1">
                            <span className="font-bold text-red-600 dark:text-red-400 capitalize mr-1">[{op.type}]</span>
                            <span className="text-muted-foreground">Doc: {op.docId}</span>
                            <p className="text-foreground truncate font-mono text-[10px] mt-0.5">{op.errorMessage || 'Unknown write failure'}</p>
                          </div>
                          <button 
                            onClick={() => setSelectedErrorOp(op)}
                            className="px-2 py-1 bg-muted hover:bg-accent border border-border text-[9px] font-bold rounded flex items-center gap-1 shrink-0 text-foreground transition-all"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Card Footer Actions */}
              <div className="bg-muted/10 px-6 py-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                {failedCount > 0 && (
                  <Button 
                    onClick={() => downloadErrorLog(col.name)}
                    variant="outline" 
                    size="sm"
                    className="h-8 text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Error Log
                  </Button>
                )}
                <Button 
                  onClick={() => handleRetryCollection(col.name)}
                  variant={failedCount > 0 ? "default" : "outline"} 
                  size="sm"
                  className="h-8 text-xs flex items-center gap-1.5"
                  disabled={colOps.length === 0}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync / Retry
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Error Details Modal */}
      {selectedErrorOp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl border-border bg-card shadow-2xl relative animate-in zoom-in-95 duration-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-bold text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                    Sync Error Details
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Operation ID: {selectedErrorOp.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedErrorOp(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1 hover:bg-muted rounded-lg transition-colors w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-muted/20 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-muted-foreground">Collection:</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedErrorOp.collection}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Document ID:</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedErrorOp.docId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Write Type:</span>
                  <p className="font-bold capitalize text-foreground mt-0.5">{selectedErrorOp.type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Retry Attempts:</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedErrorOp.retryCount} / 5</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Failed At:</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedErrorOp.failedAt ? new Date(selectedErrorOp.failedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Attempted:</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedErrorOp.lastAttempt ? new Date(selectedErrorOp.lastAttempt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">Error Message:</span>
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-xs font-mono text-red-600 dark:text-red-400 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  [{selectedErrorOp.errorCode || 'unknown-error-code'}] {selectedErrorOp.errorMessage || 'No error details provided.'}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">Queued Document Data:</span>
                <pre className="p-3 bg-muted/40 border border-border rounded-lg text-[10px] font-mono text-foreground max-h-48 overflow-y-auto leading-relaxed select-text">
                  {JSON.stringify(selectedErrorOp.data, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  onClick={() => {
                    const op = selectedErrorOp;
                    const blob = new Blob([JSON.stringify(op, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `error_op_${op.id}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Download This Log
                </Button>
                <Button 
                  onClick={() => {
                    const op = selectedErrorOp;
                    updateOpState(op.id, {
                      status: 'pending',
                      errorCode: undefined,
                      errorMessage: undefined,
                      failedAt: undefined,
                      lastAttempt: undefined,
                      retryCount: 0
                    });
                    dbService.triggerBackgroundSync();
                    setSelectedErrorOp(null);
                    toast.success(`Queued operation retry for document ${op.docId}.`);
                  }}
                  size="sm"
                >
                  Retry Operation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
