import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Tags } from 'lucide-react';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['income', 'expense']),
  color: z.string().min(4).max(7).optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, initializeDefaults } = useCategoryStore();
  const { hasTransactionsForCategory } = useTransactionStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
      color: '#10b981'
    }
  });

  useEffect(() => {
    initializeDefaults();
  }, [initializeDefaults]);

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || cat.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const openAddDialog = () => {
    setEditingId(null);
    reset({ name: '', type: typeFilter === 'income' ? 'income' : 'expense', color: '#10b981' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    setEditingId(id);
    setValue('name', cat.name);
    setValue('type', cat.type);
    setValue('color', cat.color || '#10b981');
    setIsDialogOpen(true);
  };

  const onSubmit = (data: CategoryFormValues) => {
    try {
      if (editingId) {
        updateCategory(editingId, data);
        toast.success('Category updated successfully');
      } else {
        addCategory(data);
        toast.success('Category added successfully');
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteCategory(deleteId);
    toast.success('Category deleted successfully');
    setDeleteId(null);
  };

  const requestDelete = (id: string) => {
    if (hasTransactionsForCategory(id)) {
      toast.error('Cannot delete category with existing transactions.');
      return;
    }
    setDeleteId(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage your income and expense categories.</p>
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search categories..." 
            className="pl-9 max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-muted p-1 rounded-lg w-full sm:w-auto">
          {(['all', 'income', 'expense'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex-1 sm:px-6 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                typeFilter === t 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <Tags className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No categories found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or add a new category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map(cat => (
            <div key={cat.id} className="group bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-foreground/20 transition-colors">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: cat.color || (cat.type === 'income' ? '#10b981' : '#f43f5e') }} 
                />
                <div>
                  <p className="font-medium text-sm">{cat.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                </div>
              </div>
              {!cat.isDefault && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditDialog(cat.id)} className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => requestDelete(cat.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-accent">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <Input {...register('name')} placeholder="e.g. Subscriptions" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select 
                {...register('type')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  {...register('color')}
                  className="w-10 h-10 rounded border-0 p-0 cursor-pointer bg-transparent"
                />
                <span className="text-sm text-muted-foreground">Pick a color marker</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
