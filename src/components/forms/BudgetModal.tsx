import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { BudgetForm } from './BudgetForm';
import { useUIStore } from '@/stores/useUIStore';

export function BudgetModal() {
  const { isBudgetModalOpen, closeBudgetModal, budgetToEditId } = useUIStore();

  return (
    <Dialog open={isBudgetModalOpen} onOpenChange={(open) => !open && closeBudgetModal()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{budgetToEditId ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <BudgetForm 
            editId={budgetToEditId} 
            onSuccess={closeBudgetModal}
            onCancel={closeBudgetModal}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
