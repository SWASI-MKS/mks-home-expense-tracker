import { emailService } from './emailService';
import { EmailPayload } from './emailProvider';
import { useNotificationStore } from '@/stores/useNotificationStore';

type EmailType = 'notification' | 'report';

interface QueueItem {
  id: string;
  type: EmailType;
  payload: EmailPayload;
  retries: number;
  notificationId?: string; // Reference to the app notification to mark as sent or update on error
}

class EmailQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private MAX_RETRIES = 1;

  enqueue(type: EmailType, payload: EmailPayload, notificationId?: string) {
    const item: QueueItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      payload,
      retries: 0,
      notificationId,
    };
    
    this.queue.push(item);
    
    // Fire and forget
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      let success = false;

      try {
        if (item.type === 'notification') {
          success = await emailService.sendNotification(item.payload);
        } else {
          success = await emailService.sendReport(item.payload);
        }
      } catch (error) {
        console.error('Error during email dispatch:', error);
      }

      if (success) {
        // Remove from queue
        this.queue.shift();
        
        // Update notification history if applicable
        /*
        if (item.notificationId) {
            // Update emailSent = true
        }
        */
      } else {
        if (item.retries < this.MAX_RETRIES) {
          item.retries++;
          // Move to back of queue
          this.queue.shift();
          this.queue.push(item);
        } else {
          // Failed permanently
          this.queue.shift();
          this.handlePermanentFailure(item);
        }
      }
      
      // Small delay to prevent rate limit issues
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isProcessing = false;
  }

  private handlePermanentFailure(item: QueueItem) {
    console.error(`Email dispatch failed permanently for ${item.type}`, item);
    // Add a notification about the failure so the user knows
    useNotificationStore.getState().addNotification({
      title: 'Email Delivery Failed',
      message: `Failed to send email to ${item.payload.to_email}`,
      category: 'SYSTEM',
      severity: 'ERROR',
      emailSent: false,
      browserSent: false,
    });
  }
}

export const emailQueue = new EmailQueue();
