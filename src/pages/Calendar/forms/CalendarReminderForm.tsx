import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  dueTime: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  categoryId: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
  notificationEnabled: z.boolean().default(false),
  notificationOffset: z.number().optional(),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

interface Props {
  date: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CalendarReminderForm({ date, onCancel, onSuccess }: Props) {
  const { addReminder, categories } = useCalendarStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema) as any,
    defaultValues: { 
      priority: 'medium',
      recurrence: 'none',
      notificationEnabled: false,
      notificationOffset: 15
    }
  });

  const onSubmit = (data: ReminderFormValues) => {
    try {
      addReminder({
        ...data,
        id: `rem-${Date.now()}`,
        dueDate: date,
        date: date,
        status: 'pending',
        createdAt: new Date().toISOString(),
        type: 'reminder',
      });
      toast.success('Reminder added successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 bg-card p-4 rounded-lg border border-border shadow-sm">
      <h3 className="font-semibold">Add Reminder</h3>
      
      <div>
        <label className="block text-xs font-medium mb-1">Title</label>
        <Input {...register('title')} placeholder="e.g. Credit Card Bill" />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Due Time (Optional)</label>
          <Input type="time" {...register('dueTime')} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Priority</label>
          <select {...register('priority')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Category</label>
          <select {...register('categoryId')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">None</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
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

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">Save Reminder</Button>
      </div>
    </form>
  );
}
