import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { RequestPriority } from '@/types';

interface RequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestType: 'edit' | 'delete';
  transactionId: string;
  transactionOwner: string;
  onSubmit: (data: {
    reason: string;
    priority: RequestPriority;
    attachmentUrl?: string;
  }) => void;
}

export function RequestDialog({
  open,
  onOpenChange,
  requestType,
  transactionId,
  transactionOwner,
  onSubmit,
}: RequestDialogProps) {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('low');

  const handleSubmit = () => {
    onSubmit({ reason, priority });
    setReason('');
    setPriority('low');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Request {requestType.charAt(0).toUpperCase() + requestType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Send a request to {transactionOwner} to {requestType} transaction {transactionId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
              placeholder="Explain why you want to request this..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <div className="flex gap-3">
              <Button
                variant={priority === 'low' ? 'default' : 'outline'}
                onClick={() => setPriority('low')}
                type="button"
              >
                Low
              </Button>
              <Button
                variant={priority === 'medium' ? 'default' : 'outline'}
                onClick={() => setPriority('medium')}
                type="button"
              >
                Medium
              </Button>
              <Button
                variant={priority === 'high' ? 'default' : 'outline'}
                onClick={() => setPriority('high')}
                type="button"
              >
                High
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason.trim()}>
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
