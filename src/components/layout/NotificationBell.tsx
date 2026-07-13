import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCircle2, Edit, Trash } from 'lucide-react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useEditRequestStore } from '@/stores/useEditRequestStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { SEVERITY_ICONS, NOTIFICATION_ICONS } from '@/services/notification/notificationIcons';
import { RequestReviewDialog } from '@/pages/Transactions/components/RequestReviewDialog';
import { EditRequest } from '@/types';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { notifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, clearHistory } = useNotificationStore();
  const { getRequestsByOwner } = useEditRequestStore();

  const { currentMember } = useAuthStore();
  
  console.log('[NotificationBell] currentMember:', currentMember);
  
  const unreadCount = getUnreadCount();
  const pendingRequestsForOwner = currentMember 
    ? getRequestsByOwner(currentMember).filter(r => r.status === 'pending') 
    : [];
  console.log('[NotificationBell] pendingRequestsForOwner:', pendingRequestsForOwner);
  
  const totalBadgeCount = unreadCount + pendingRequestsForOwner.length;

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'ERROR': return 'text-destructive';
      case 'WARNING': return 'text-yellow-500';
      case 'SUCCESS': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-slate-500';
      case 'medium': return 'text-amber-500';
      case 'high': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors w-10 h-10 flex items-center justify-center relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {totalBadgeCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-[10px] font-bold text-destructive-foreground rounded-full flex items-center justify-center">
            {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border shadow-lg rounded-xl z-50 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  onClick={() => clearHistory()}
                  className="text-xs text-destructive hover:underline flex items-center gap-1 ml-2"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {pendingRequestsForOwner.length > 0 && (
              <div className="p-2">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Pending Requests ({pendingRequestsForOwner.length})
                </h4>
                {pendingRequestsForOwner.map((req) => (
                  <div 
                    key={req.requestId}
                    className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex gap-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <div className="text-xl shrink-0 mt-0.5">
                      {req.requestType === 'edit' ? <Edit className="w-5 h-5 text-amber-600" /> : <Trash className="w-5 h-5 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {req.requestType === 'edit' ? 'Edit Request' : 'Delete Request'}
                        </p>
                        <span className={`text-xs font-semibold ${getPriorityColor(req.priority)}`}>
                          {req.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        From {req.requestedBy}: {req.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-medium">
                        <span>Tx: {req.transactionId}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notifications.length === 0 && pendingRequestsForOwner.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-3 rounded-lg flex gap-3 transition-colors group relative ${notif.read ? 'bg-transparent' : 'bg-accent/50'} hover:bg-accent`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="text-xl shrink-0 mt-0.5">
                    {NOTIFICATION_ICONS[notif.category as keyof typeof NOTIFICATION_ICONS] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate">{notif.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-medium">
                      <span className={getSeverityColor(notif.severity)}>
                        {SEVERITY_ICONS[notif.severity as keyof typeof SEVERITY_ICONS]} {notif.severity}
                      </span>
                      {notif.member && (
                        <>
                          <span>•</span>
                          <span>{notif.member}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Actions (visible on hover or always for delete) */}
                  <div className="absolute top-3 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.read && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                        className="p-1 hover:bg-background rounded text-primary"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                      className="p-1 hover:bg-background rounded text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <RequestReviewDialog 
        open={!!selectedRequest} 
        onOpenChange={(o) => !o && setSelectedRequest(null)} 
        request={selectedRequest} 
      />
    </div>
  );
}
