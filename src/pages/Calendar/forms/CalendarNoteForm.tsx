import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  time: z.string().optional(),
  color: z.string().optional(),
  categoryId: z.string().optional(),
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface Props {
  date: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CalendarNoteForm({ date, onCancel, onSuccess }: Props) {
  const { addNote, categories } = useCalendarStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema) as any,
    defaultValues: { color: '#f59e0b', isPinned: false, isFavorite: false }
  });

  const onSubmit = (data: NoteFormValues) => {
    try {
      addNote({
        ...data,
        id: `note-${Date.now()}`,
        date,
        createdAt: new Date().toISOString(),
        type: 'note',
      });
      toast.success('Note added successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 bg-card p-4 rounded-lg border border-border shadow-sm">
      <h3 className="font-semibold">Add Note</h3>
      
      <div>
        <label className="block text-xs font-medium mb-1">Title</label>
        <Input {...register('title')} placeholder="e.g. Call Bank" />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>
      
      <div>
        <label className="block text-xs font-medium mb-1">Description</label>
        <textarea 
          {...register('description')} 
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Time (Optional)</label>
          <Input type="time" {...register('time')} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Category</label>
          <select {...register('categoryId')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">None</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">Save Note</Button>
      </div>
    </form>
  );
}
