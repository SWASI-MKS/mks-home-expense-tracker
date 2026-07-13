export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'upi' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'wallet';

// Edit Request types
export type RequestType = 'edit' | 'delete';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type RequestPriority = 'low' | 'medium' | 'high';

export interface EditRequest {
  requestId: string;
  transactionId: string;
  owner: string;
  requestedBy: string;
  requestType: RequestType;
  reason: string;
  priority: RequestPriority;
  attachmentUrl?: string;
  status: RequestStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Audit Log types
export type AuditAction = 
  | 'transaction_created' 
  | 'transaction_edited' 
  | 'transaction_deleted'
  | 'edit_request_created'
  | 'edit_request_approved'
  | 'edit_request_rejected'
  | 'delete_request_created'
  | 'delete_request_approved'
  | 'delete_request_rejected'
  | 'archive_unlocked'
  | 'archive_locked'
  | 'login'
  | 'logout';

export interface AuditLog {
  id: string;
  action: AuditAction;
  timestamp: string;
  memberName: string;
  metadata?: Record<string, any>;
}

// Archive related types
export interface ArchiveMonth {
  year: number;
  month: number; // 0-11
  isLocked: boolean;
  unlockedAt?: string;
  unlockedBy?: string;
  lockedAt?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document' | 'spreadsheet';
  mimeType?: string;
  size?: number;
  uploadedAt: string;
  uploadedBy: string;
  storagePath?: string;
}

export interface Comment {
  id: string;
  memberName: string;
  content: string;
  timestamp: string;
  isEdited?: boolean;
  editedAt?: string;
}

export type AuditHistoryAction = 
  | 'transaction_created'
  | 'transaction_edited'
  | 'transaction_deleted'
  | 'transaction_archived'
  | 'transaction_restored'
  | 'attachment_uploaded'
  | 'attachment_deleted'
  | 'comment_added'
  | 'comment_edited'
  | 'comment_deleted'
  | 'split_transaction'
  | 'converted_to_recurring'
  | 'reminder_created'
  | 'budget_warning_triggered'
  | 'budget_exceeded';

export interface AuditHistoryEntry {
  id: string;
  action: AuditHistoryAction;
  timestamp: string;
  memberName: string;
  description: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  metadata?: Record<string, any>;
}

export interface TimelineEntry {
  id: string;
  type: 'created' | 'receipt_uploaded' | 'edited' | 'comment_added' | 'viewed';
  timestamp: string;
  memberName?: string;
  description: string;
}

export interface Location {
  address?: string;
  latitude?: number;
  longitude?: number;
}

// Account Types
export type AccountType = 
  | 'bank_account' 
  | 'credit_card' 
  | 'debit_card' 
  | 'upi_wallet' 
  | 'cash_wallet' 
  | 'investment' 
  | 'loan';

export interface Account {
  id: string;
  name: string;
  type: string; // Legacy field for backward compatibility
  accountType: AccountType; // New field for categorized types
  openingBalance: number;
  openingBalanceDate?: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  
  // Additional fields for specific account types
  bankName?: string;
  accountNumber?: string;
  lastFourDigits?: string;
  branch?: string;
  ifsc?: string;
  cardNumber?: string;
  creditLimit?: number;
  billingDate?: string;
  dueDate?: string;
  provider?: string; // For UPI wallets: GPay, PhonePe, etc.
  linkedAccountId?: string; // For UPI wallets linked to bank accounts
  upiId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string; // TXN-YYYYMMDD-XXXX
  type: TransactionType;
  amount: number;
  date: string;
  notes?: string;
  status?: TransactionStatus;
  merchant?: string;
  paymentMethod?: PaymentMethod;
  tags?: string[];
  budgetId?: string;
  reminderId?: string;
  location?: Location;
  attachments?: Attachment[];
  comments?: Comment[];
  auditHistory?: AuditHistoryEntry[];
  timeline?: TimelineEntry[];
  familyActivity?: Array<{
    action: 'viewed' | 'edited' | 'created';
    memberName: string;
    timestamp: string;
  }>;
  
  // For Income/Expense
  categoryId?: string;
  accountId?: string;
  
  // For Transfer
  fromAccountId?: string;
  toAccountId?: string;

  createdAt: string;
  updatedAt?: string;
  isArchived: boolean;
  isCleared?: boolean;
  addedBy?: string;
  lastModifiedBy?: string;
  balanceAfter?: number;
}

export interface Budget {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  month: number; // 1-12
  year: number;
  enabled: boolean;
  createdAt: string;
  warningEmailSent?: boolean;
  warningSentAt?: string;
  exceededEmailSent?: boolean;
  exceededSentAt?: string;
}

export interface BudgetProgress extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type NotificationCategory = 'FINANCE' | 'ACCOUNT' | 'REMINDER' | 'REPORT' | 'SYSTEM' | 'SYNC' | 'BACKUP' | 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  member?: string;
  timestamp: string;
  read: boolean;
  emailSent: boolean;
  browserSent: boolean;
  source?: string;
  metadata?: Record<string, any>;
}

// Family member type (used across app, including exports)
export const VALID_MEMBERS = ['Dad', 'Mom', 'Shruti', 'Swasi'] as const;
export type FamilyMember = typeof VALID_MEMBERS[number];

export * from './calendar';

