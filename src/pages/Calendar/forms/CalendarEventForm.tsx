import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { CalendarEvent } from '@/types';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useImageUploadStore } from '@/stores/useImageUploadStore';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  time: z.string().optional(),
  categoryId: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface Props {
  date: string;
  initialData?: CalendarEvent;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CalendarEventForm({ date, initialData, onCancel, onSuccess }: Props) {
  const { addEvent, updateEvent, categories } = useCalendarStore();
  const { enqueueImage } = useImageUploadStore();
  
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(initialData?.images || []);
  
  const { register, handleSubmit, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { 
      title: initialData?.title || '',
      description: initialData?.description || '',
      time: initialData?.time || '',
      categoryId: initialData?.categoryId || '',
      recurrence: initialData?.recurrence || 'none' 
    }
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      const id = initialData?.id || `evt-${Date.now()}`;
      
      const payload = {
        ...data,
        id,
        date: initialData?.date || date,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        type: 'event' as const,
        images: existingImages,
      };

      if (initialData) {
        updateEvent(id, payload);
        toast.success('Event updated successfully');
      } else {
        addEvent(payload as CalendarEvent);
        toast.success('Event added successfully');
      }

      // Enqueue new images
      for (const file of newFiles) {
        await enqueueImage({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          calendarItemId: id,
          collectionName: 'events',
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
      <h3 className="font-semibold">Add Event</h3>
      
      <div>
        <label className="block text-xs font-medium mb-1">Title</label>
        <Input {...register('title')} placeholder="e.g. Birthday" />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Time (Optional)</label>
          <Input type="time" {...register('time')} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Repeat</label>
          <select {...register('recurrence')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Category</label>
        <select {...register('categoryId')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">None</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
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
        <Button type="submit" size="sm">Save Event</Button>
      </div>
    </form>
  );
}
