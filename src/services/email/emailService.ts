import emailjs from '@emailjs/browser';
import { EmailProvider, EmailPayload } from './emailProvider';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const NOTIFICATION_TEMPLATE = import.meta.env.VITE_EMAILJS_NOTIFICATION_TEMPLATE;
const REPORT_TEMPLATE = import.meta.env.VITE_EMAILJS_REPORT_TEMPLATE;

// Initialize EmailJS
if (PUBLIC_KEY) {
  emailjs.init(PUBLIC_KEY);
}

export class EmailJSService implements EmailProvider {
  async sendNotification(payload: EmailPayload): Promise<boolean> {
    if (!SERVICE_ID || !NOTIFICATION_TEMPLATE) {
      console.error('EmailJS not configured for notifications.');
      return false;
    }
    
    try {
      await emailjs.send(SERVICE_ID, NOTIFICATION_TEMPLATE, payload as Record<string, unknown>);
      return true;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  }

  async sendReport(payload: EmailPayload): Promise<boolean> {
    if (!SERVICE_ID || !REPORT_TEMPLATE) {
      console.error('EmailJS not configured for reports.');
      return false;
    }
    
    try {
      await emailjs.send(SERVICE_ID, REPORT_TEMPLATE, payload as Record<string, unknown>);
      return true;
    } catch (error) {
      console.error('Failed to send report email:', error);
      return false;
    }
  }
}

export const emailService = new EmailJSService();
