import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { TransactionForm } from './TransactionForm';
import { useUIStore } from '@/stores/useUIStore';
import { Transaction } from '@/types';

interface TransactionModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transaction?: Transaction | null;
  isDuplicate?: boolean;
}

export function TransactionModal({ open, onOpenChange, transaction, isDuplicate }: TransactionModalProps) {
  const { isTransactionModalOpen, closeTransactionModal, transactionToEditId } = useUIStore();

  const actualOpen = open !== undefined ? open : isTransactionModalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else if (!newOpen) {
      closeTransactionModal();
    }
  };

  return (
    <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isDuplicate ? 'Duplicate Transaction' : transaction ? 'Edit Transaction' : transactionToEditId ? 'Edit Transaction' : 'New Transaction'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TransactionForm 
            key={transaction?.id || transactionToEditId || 'new'}
            editId={isDuplicate ? undefined : transaction?.id || transactionToEditId} 
            initialData={transaction}
            onSuccess={() => handleOpenChange(false)}
            onCancel={() => handleOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
