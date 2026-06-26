import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { TransactionForm } from './TransactionForm';
import { useUIStore } from '@/stores/useUIStore';

export function TransactionModal() {
  const { isTransactionModalOpen, closeTransactionModal, transactionToEditId } = useUIStore();

  return (
    <Dialog open={isTransactionModalOpen} onOpenChange={(open) => !open && closeTransactionModal()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{transactionToEditId ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TransactionForm 
            editId={transactionToEditId} 
            onSuccess={closeTransactionModal}
            onCancel={closeTransactionModal}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
