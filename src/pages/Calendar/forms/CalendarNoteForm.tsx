import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { CalendarNote } from '@/types';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useImageUploadStore } from '@/stores/useImageUploadStore';

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
  initialData?: CalendarNote;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CalendarNoteForm({ date, initialData, onCancel, onSuccess }: Props) {
  const { addNote, updateNote, categories } = useCalendarStore();
  const { enqueueImage } = useImageUploadStore();
  
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(initialData?.images || []);
  
  const { register, handleSubmit, formState: { errors } } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema) as any,
    defaultValues: { 
      title: initialData?.title || '',
      description: initialData?.description || '',
      time: initialData?.time || '',
      color: initialData?.color || '#f59e0b', 
      categoryId: initialData?.categoryId || '',
      isPinned: initialData?.isPinned || false, 
      isFavorite: initialData?.isFavorite || false 
    }
  });

  const onSubmit = async (data: NoteFormValues) => {
    try {
      const id = initialData?.id || `note-${Date.now()}`;
      
      const payload = {
        ...data,
        id,
        date: initialData?.date || date,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        type: 'note' as const,
        images: existingImages, // Keep the updated existing images array
      };

      if (initialData) {
        updateNote(id, payload);
        toast.success('Note updated successfully');
      } else {
        addNote(payload as CalendarNote);
        toast.success('Note added successfully');
      }

      // Enqueue new images
      for (const file of newFiles) {
        await enqueueImage({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          calendarItemId: id,
          collectionName: 'notes',
          blob: file,
          fileName: file.name,
          size: file.size,
        });
      }

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

      <div className="pt-2">
        <label className="block text-xs font-medium mb-2">Attachments</label>
        <ImageUpload 
          existingImages={existingImages}
          newFiles={newFiles}
          onFilesChange={setNewFiles}
          onRemoveExisting={(id) => setExistingImages(prev => prev.filter(img => img.id !== id))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">Save Note</Button>
      </div>
    </form>
  );
}
