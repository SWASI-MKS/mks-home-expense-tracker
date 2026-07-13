import { emailQueue } from './emailQueue';
import { EmailPayload } from './emailProvider';

export const sendBudgetWarningEmail = (
  email: string, 
  name: string, 
  budgetName: string, 
  percentage: number, 
  amount: number,
  member: string
) => {
  const payload: EmailPayload = {
    to_email: email,
    to_name: name,
    subject: `Budget Warning: ${budgetName}`,
    title: `Budget Warning: ${budgetName}`,
    message: `${member} caused the budget "${budgetName}" to reach ${Math.round(percentage)}% of its limit.`,
    category: 'Budget',
    amount: `₹${amount.toLocaleString('en-IN')}`,
    priority: 'High',
    member,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    notes: 'Please review your spending.',
    action: 'View Budget'
  };

  emailQueue.enqueue('notification', payload);
};

export const sendBudgetExceededEmail = (
  email: string, 
  name: string, 
  budgetName: string, 
  amount: number,
  member: string
) => {
  const payload: EmailPayload = {
    to_email: email,
    to_name: name,
    subject: `Budget Exceeded: ${budgetName}`,
    title: `Budget Exceeded: ${budgetName}`,
    message: `${member} caused the budget "${budgetName}" to exceed its limit.`,
    category: 'Budget',
    amount: `₹${amount.toLocaleString('en-IN')}`,
    priority: 'Critical',
    member,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    notes: 'Action is required.',
    action: 'View Budget'
  };

  emailQueue.enqueue('notification', payload);
};

// You can add more specific triggers here for large expenses, reminders, reports, etc.
// For now, these generic triggers can be used by the notification center.

export const queueGenericNotificationEmail = (payload: EmailPayload) => {
  emailQueue.enqueue('notification', payload);
};

export const queueReportEmail = (payload: EmailPayload) => {
  emailQueue.enqueue('report', payload);
};
