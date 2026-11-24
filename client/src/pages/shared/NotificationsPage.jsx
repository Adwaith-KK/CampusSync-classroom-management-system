import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { Bell, CheckCheck, Info } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) setNotifications(res.data.data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      // Fallback: mark individually
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => api.put(`/notifications/${n.id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const typeColors = {
    claim:    'bg-amber-100 text-amber-700 border-amber-200',
    booking:  'bg-indigo-100 text-indigo-700 border-indigo-200',
    system:   'bg-slate-100 text-slate-600 border-slate-200',
    timetable:'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <LoadingSpinner message="Loading notifications..." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-campus-600" />
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-campus-600 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-campus-600 hover:text-campus-700 disabled:opacity-50 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications Yet"
          description="System events, booking updates, and campus announcements will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                notif.is_read
                  ? 'bg-white border-slate-100 opacity-70 hover:opacity-100'
                  : 'bg-campus-50 border-campus-200 hover:bg-campus-100'
              }`}
            >
              {/* Unread indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {!notif.is_read ? (
                  <div className="w-2 h-2 rounded-full bg-campus-500 mt-1" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-200 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${typeColors[notif.type] || typeColors.system}`}>
                    {notif.type}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(notif.created_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mt-1">{notif.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
