import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { EditRequest } from '@/types';
import { useEditRequestStore } from '@/stores/useEditRequestStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUIStore } from '@/stores/useUIStore';
import toast from 'react-hot-toast';

interface RequestReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: EditRequest | null;
}

export function RequestReviewDialog({ open, onOpenChange, request }: RequestReviewDialogProps) {
  const { updateEditRequest } = useEditRequestStore();
  const { transactions } = useTransactionStore();
  const { openTransactionModal } = useUIStore();

  if (!request) return null;

  const transaction = transactions.find(t => t.id === request.transactionId);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-300';
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300';
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleApprove = () => {
    console.log('[RequestReviewDialog] Approve clicked for request:', request.requestId);
    if (request.requestType === 'edit') {
      openTransactionModal(request.transactionId);
    } else if (request.requestType === 'delete') {
      const { archiveTransaction } = useTransactionStore.getState();
      archiveTransaction(request.transactionId);
      updateEditRequest(request.requestId, {
        status: 'approved',
        resolvedAt: new Date().toISOString(),
      });
      toast.success('Delete request approved and transaction removed!');
    }

    updateEditRequest(request.requestId, {
      status: 'approved',
      resolvedAt: new Date().toISOString(),
    });

    onOpenChange(false);
  };

  const handleReject = () => {
    console.log('[RequestReviewDialog] Reject clicked for request:', request.requestId);
    updateEditRequest(request.requestId, {
      status: 'rejected',
      resolvedAt: new Date().toISOString(),
    });
    toast.success('Request rejected!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {request.requestType === 'edit' ? 'Edit' : 'Delete'} Request
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
              {request.priority.toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status.toUpperCase()}
            </span>
          </DialogTitle>
          <DialogDescription>
            Request from {request.requestedBy} for transaction {request.transactionId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {transaction && (
            <div className="p-4 bg-accent/30 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">Transaction Details</h4>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Date:</span> {new Date(transaction.date).toLocaleDateString()}</p>
                <p><span className="text-muted-foreground">Type:</span> {transaction.type}</p>
                <p><span className="text-muted-foreground">Amount:</span> {transaction.amount.toLocaleString('en-IN')}</p>
                {transaction.notes && <p><span className="text-muted-foreground">Description:</span> {transaction.notes}</p>}

              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Request</label>
            <div className="p-3 bg-accent/20 rounded-lg text-sm">
              {request.reason}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Request created: {new Date(request.createdAt).toLocaleString()}
          </div>
        </div>

        {request.status === 'pending' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReject}>
              Reject
            </Button>
            <Button onClick={handleApprove}>
              Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
