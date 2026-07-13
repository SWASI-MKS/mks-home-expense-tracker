import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import { Category, Account, Transaction, Attachment, Comment } from '@/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currency';
import {
  Eye,
  Calendar,
  Tag,
  CreditCard,
  User,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Copy,
  RefreshCw,
  FileText as FileTextIcon,
  UserCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  Plus,
  Banknote,
  MapPin,
  MessageSquare,
  Activity,
  Archive,
  Printer,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Link,
  Wallet,
  PieChart,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';


function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy');
}

function formatDateTime(date: string): string {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileTypeIcon(type: Attachment['type'], _mimeType?: string) {
  if (type === 'image') return <ImageIcon className="w-5 h-5" />;
  if (type === 'pdf') return <FileText className="w-5 h-5" />;
  if (type === 'spreadsheet') return <FileSpreadsheet className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
}

function getFileTypeColor(type: Attachment['type']) {
  switch (type) {
    case 'image': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    case 'pdf': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    case 'spreadsheet': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
    default: return 'text-gray-500 bg-gray-50 dark:bg-gray-800/50';
  }
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">{children}</div>
      )}
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

function InfoItem({ label, value, icon }: InfoItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  accounts: Account[];
  runningBalance: number;
}

export const TransactionDetailsDialog: React.FC<TransactionDetailsDialogProps> = ({
  transaction,
  open,
  onOpenChange,
  categories,
  accounts,
  runningBalance,
}) => {
  // Hooks first (all above any conditional returns)
  const { updateTransaction, duplicateTransaction, archiveTransaction, deleteTransaction } = useTransactionStore();
  const { openTransactionModal } = useUIStore();
  const { currentMember } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'attachments' | 'comments' | 'history' | 'related' | 'analytics'>('overview');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [previewImage, setPreviewImage] = useState<Attachment | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate derived values regardless of transaction (for hooks to work correctly)
  const relatedTransactions = useMemo<Transaction[]>(() => {
    // Find related transactions (simplified implementation)
    return [];
  }, []);

  // Event handlers using useCallback (always called)
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // TODO: Implement file upload
    toast('File upload coming soon!');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(() => {
    // TODO: Implement file select
    toast('File upload coming soon!');
  }, []);

  // Now check if transaction is null
  if (!transaction) return null;

  // Transaction-specific derived values
  const category = categories.find(c => c.id === transaction.categoryId);
  const account = accounts.find(a => a.id === transaction.accountId);
  const fromAccount = transaction.type === 'transfer' ? accounts.find(a => a.id === transaction.fromAccountId) : null;
  const toAccount = transaction.type === 'transfer' ? accounts.find(a => a.id === transaction.toAccountId) : null;
  
  const isOwner = transaction.addedBy === currentMember;

  // Transaction-specific event handlers
  const handleAddComment = () => {
    if (!newComment.trim() || !currentMember) return;
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      memberName: currentMember,
      content: newComment,
      timestamp: new Date().toISOString(),
    };
    
    updateTransaction(transaction.id, {
      comments: [...(transaction.comments || []), comment],
    }, `${currentMember} added a comment`);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleSaveEditComment = () => {
    if (!editingCommentId || !currentMember) return;
    const updatedComments = (transaction.comments || []).map(c => {
      if (c.id === editingCommentId) {
        return {
          ...c,
          content: editCommentText,
          isEdited: true,
          editedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    updateTransaction(transaction.id, { comments: updatedComments }, `${currentMember} edited a comment`);
    setEditingCommentId(null);
    setEditCommentText('');
    toast.success('Comment updated');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!currentMember) return;
    const updatedComments = (transaction.comments || []).filter(c => c.id !== commentId);
    updateTransaction(transaction.id, { comments: updatedComments }, `${currentMember} deleted a comment`);
    toast.success('Comment deleted');
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (!isOwner || !currentMember) return;
    const updatedAttachments = (transaction.attachments || []).filter(a => a.id !== attachmentId);
    updateTransaction(transaction.id, { attachments: updatedAttachments }, `${currentMember} deleted an attachment`);
    toast.success('Attachment deleted');
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'cancelled':
      case 'refunded':
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
      default:
        return null;
    }
  };
  
  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return <Banknote className="w-6 h-6 text-emerald-500" />;
      case 'expense':
        return <Banknote className="w-6 h-6 text-rose-500" />;
      case 'transfer':
        return <ArrowRight className="w-6 h-6 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return 'text-emerald-500';
      case 'expense':
        return 'text-rose-500';
      case 'transfer':
        return 'text-blue-500';
      default:
        return '';
    }
  };
  
  const getTypeBadgeClass = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'expense':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'transfer':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 flex flex-col">
        {/* Header with Amount */}
        <div className="p-6 border-b bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 shrink-0">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                {getTypeIcon(transaction.type)}
                <div>
                  Transaction Details
                  <span className="block text-sm font-normal text-muted-foreground">{transaction.id}</span>
                </div>
              </DialogTitle>
              <div className="flex items-center gap-2">
                {getStatusIcon(transaction.status)}
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                  {transaction.status || 'Completed'}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Main Amount Display */}
          <div className="flex items-center justify-between">
            <div>
              <div className={cn("text-4xl font-bold mb-1", getTypeColor(transaction.type))}>
                {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getTypeBadgeClass(transaction.type))}>
                  {transaction.type.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Running Balance</div>
              <div className="text-xl font-semibold">{formatCurrency(transaction.balanceAfter || runningBalance)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b shrink-0 bg-white dark:bg-gray-900">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {[ 
              { id: 'overview', label: 'Overview', icon: FileTextIcon },
              { id: 'attachments', label: 'Attachments', icon: FileText, count: transaction.attachments?.length },
              { id: 'comments', label: 'Comments', icon: MessageSquare, count: transaction.comments?.length },
              { id: 'history', label: 'History', icon: Activity },
              { id: 'related', label: 'Related', icon: Link },
              { id: 'analytics', label: 'Analytics', icon: PieChart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count && tab.count > 0 && (
                  <span className="ml-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Info */}
              <CollapsibleSection title="Financial Information" icon={<CreditCard className="w-5 h-5" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {transaction.type === 'transfer' ? (
                    <>
                      <InfoItem 
                        label="From Account" 
                        value={fromAccount?.name || '-'} 
                        icon={<ArrowRight className="w-4 h-4 rotate-180" />}
                      />
                      <InfoItem 
                        label="To Account" 
                        value={toAccount?.name || '-'} 
                        icon={<ArrowRight className="w-4 h-4" />}
                      />
                    </>
                  ) : (
                    <>
                      <InfoItem 
                        label="Category" 
                        value={
                          <div className="flex items-center gap-2">
                            {category?.icon || '📝'} {category?.name || 'Uncategorized'}
                          </div>
                        } 
                        icon={<Tag className="w-4 h-4" />}
                      />
                      <InfoItem 
                        label="Account" 
                        value={account?.name || '-'} 
                        icon={<Wallet className="w-4 h-4" />}
                      />
                    </>
                  )}
                  
                  <InfoItem 
                    label="Date" 
                    value={formatDate(transaction.date)} 
                    icon={<Calendar className="w-4 h-4" />}
                  />
                  
                  <InfoItem 
                    label="Time" 
                    value={format(new Date(transaction.createdAt || transaction.date), 'hh:mm a')} 
                    icon={<Clock className="w-4 h-4" />}
                  />
                  
                  {transaction.paymentMethod && (
                    <InfoItem 
                      label="Payment Method" 
                      value={transaction.paymentMethod} 
                      icon={<CreditCard className="w-4 h-4" />}
                    />
                  )}
                  
                  <InfoItem 
                    label="Added By" 
                    value={transaction.addedBy || 'System'} 
                    icon={<UserCircle className="w-4 h-4" />}
                  />

                  {transaction.createdAt && (
                    <InfoItem 
                      label="Created At" 
                      value={formatDateTime(transaction.createdAt)} 
                      icon={<Clock className="w-4 h-4" />}
                    />
                  )}
                  
                  {transaction.lastModifiedBy && (
                    <InfoItem 
                      label="Last Modified By" 
                      value={transaction.lastModifiedBy} 
                      icon={<UserCircle className="w-4 h-4" />}
                    />
                  )}
                  
                  {transaction.updatedAt && (
                    <InfoItem 
                      label="Last Updated" 
                      value={formatDateTime(transaction.updatedAt)} 
                      icon={<RefreshCw className="w-4 h-4" />}
                    />
                  )}
                </div>
              </CollapsibleSection>

              {/* Notes & Details */}
              <CollapsibleSection title="Notes & Details" icon={<FileTextIcon className="w-5 h-5" />}>
                <div className="space-y-6">
                  {transaction.merchant && (
                    <InfoItem 
                      label="Merchant / Payee" 
                      value={transaction.merchant} 
                      icon={<User className="w-4 h-4" />}
                    />
                  )}
                  
                  {transaction.notes && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <FileTextIcon className="w-4 h-4" />
                        Notes
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-800 border rounded-lg text-sm">
                        {transaction.notes}
                      </div>
                    </div>
                  )}
                  
                  {transaction.location && (
                    <InfoItem 
                      label="Location" 
                      value={transaction.location.address || 'Location set'} 
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  )}
                  
                  {transaction.tags && transaction.tags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <Tag className="w-4 h-4" />
                        Tags
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {transaction.tags.map((tag, i) => (
                          <span 
                            key={i} 
                            className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <div className="space-y-6">
              {/* Upload Area */}
              {isOwner && (
                <div
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={handleFileSelect}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                    isDragging 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <div className="text-gray-700 dark:text-gray-300 font-medium">
                    Drag & drop files here
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or <span className="text-blue-600 dark:text-blue-400 hover:underline">click to browse</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Support: JPG, PNG, PDF, DOCX, XLSX (Max 10MB)
                  </div>
                </div>
              )}
              
              {/* Existing Attachments */}
              {transaction.attachments && transaction.attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transaction.attachments.map((attachment) => (
                    <Card key={attachment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        {attachment.type === 'image' ? (
                          <div 
                            className="h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer"
                            onClick={() => setPreviewImage(attachment)}
                          >
                            <img 
                              src={attachment.url} 
                              alt={attachment.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-40 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                            <div className={cn("p-4 rounded-full", getFileTypeColor(attachment.type))}>
                              {getFileTypeIcon(attachment.type, attachment.mimeType)}
                            </div>
                          </div>
                        )}
                        <div className="p-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {attachment.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDateTime(attachment.uploadedAt)} • {formatFileSize(attachment.size)}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Uploaded by {attachment.uploadedBy}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </a>
                            <a
                              href={attachment.url}
                              download={attachment.name}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            {isOwner && (
                              <button
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <div className="font-medium">No attachments yet</div>
                  <div className="text-sm">Attach receipts or documents to this transaction</div>
                </div>
              )}
            </div>
          )}
          
          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* Add Comment */}
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <UserCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border rounded-lg resize-none bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <Button 
                      onClick={handleAddComment} 
                      disabled={!newComment.trim()}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Comments List */}
              {transaction.comments && transaction.comments.length > 0 ? (
                <div className="space-y-4">
                  {transaction.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{comment.memberName}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(comment.timestamp)}</span>
                          {comment.isEdited && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">(edited)</span>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              className="w-full p-2 border rounded-lg resize-none bg-white dark:bg-gray-800 text-sm"
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                onClick={handleSaveEditComment}
                              >
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingCommentId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{comment.content}</div>
                            {isOwner && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <div className="font-medium">No comments yet</div>
                  <div className="text-sm">Add a comment to collaborate with your family</div>
                </div>
              )}
            </div>
          )}
          
          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {transaction.auditHistory && transaction.auditHistory.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
                  
                  {transaction.auditHistory.slice().reverse().map((entry, _i) => (
                    <div key={entry.id} className="relative flex gap-4 pl-10">
                      <div className="absolute left-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900" />
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{entry.memberName}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(entry.timestamp)}</span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">{entry.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <div className="font-medium">No history yet</div>
                  <div className="text-sm">Activity will appear here</div>
                </div>
              )}
            </div>
          )}

          {/* Related Transactions Tab */}
          {activeTab === 'related' && (
            <div className="space-y-4">
              {relatedTransactions.length > 0 ? (
                <div className="space-y-3">
                  {relatedTransactions.map((txn) => (
                    <Card key={txn.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full", getTypeBadgeClass(txn.type))}>
                              {getTypeIcon(txn.type)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{txn.id}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(txn.date)}</div>
                            </div>
                          </div>
                          <div className={cn("text-lg font-semibold", getTypeColor(txn.type))}>
                            {txn.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(txn.amount))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Link className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <div className="font-medium">No related transactions</div>
                  <div className="text-sm">Related transactions will appear here</div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Current Balance</div>
                        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(transaction.balanceAfter || runningBalance)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Transaction Amount</div>
                        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(Math.abs(transaction.amount))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {transaction.status || 'Completed'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <div className="font-medium">Advanced Analytics Coming Soon</div>
                <div className="text-sm">Detailed insights and charts will appear here</div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 border-t bg-white dark:bg-gray-900 p-4 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {isOwner && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => { openTransactionModal(transaction.id); }}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { duplicateTransaction(transaction.id); toast.success('Transaction duplicated!'); }}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                onClick={() => window.print()}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              {transaction.accountId && (
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    navigate(`/accounts/${transaction.accountId}/statement`); 
                    onOpenChange(false); 
                  }}
                  className="gap-2"
                >
                  <FileTextIcon className="w-4 h-4" />
                  Statement
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => { 
                      archiveTransaction(transaction.id); 
                      onOpenChange(false); 
                      toast.success('Transaction archived'); 
                    }}
                    className="gap-2 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => { 
                      if (confirm('Are you sure you want to delete this transaction?')) {
                        deleteTransaction(transaction.id);
                        onOpenChange(false);
                        toast.success('Transaction deleted');
                      }
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden">
            <div className="relative bg-black flex items-center justify-center min-h-[60vh]">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-white z-10"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-gray-800/80 rounded-full px-3 py-2">
                <button
                  onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <span className="text-white text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <div className="w-px h-5 bg-gray-600 mx-1" />
                <button
                  onClick={() => setRotation(r => r + 90)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <RotateCw className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => { setZoomLevel(1); setRotation(0); }}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <Maximize2 className="w-5 h-5 text-white" />
                </button>
              </div>

              <img
                src={previewImage.url}
                alt={previewImage.name}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  maxWidth: '90%',
                  maxHeight: '80vh',
                  transition: 'transform 0.2s ease',
                }}
              />
            </div>
            <div className="p-4 border-t bg-white dark:bg-gray-900 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">{previewImage.name}</div>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  download={previewImage.name}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};
