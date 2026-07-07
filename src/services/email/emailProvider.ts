// Abstract email provider interface to allow switching to Resend, SendGrid, etc.
export interface EmailPayload {
  to_name: string;
  to_email: string;
  subject: string;
  [key: string]: any;
}

export interface EmailProvider {
  sendNotification(payload: EmailPayload): Promise<boolean>;
  sendReport(payload: EmailPayload): Promise<boolean>;
}
