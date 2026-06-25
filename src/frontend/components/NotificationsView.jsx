import React, { useState } from 'react';
import { Bell, CheckCircle, CheckSquare, ClipboardList, FileText, Activity, Eye } from 'lucide-react';

const notifIcons = {
  approval_request: { icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/40' },
  approval_response: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
  task_assigned: { icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/40' },
  task_completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
  drawing_uploaded: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/40' },
};

export default function NotificationsView({ notifications, markNotificationRead, setTab }) {
  const [filter, setFilter] = useState('all');

  const typeLabels = {
    all: 'All',
    approval_request: 'Approval Requests',
    approval_response: 'Approval Responses',
    task_assigned: 'Task Assigned',
    task_completed: 'Task Completed',
    drawing_uploaded: 'Drawing Uploaded',
  };

  const filtered = notifications.filter(n => filter === 'all' || n.type === filter);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = () => {
    notifications.filter(n => !n.is_read).forEach(n => markNotificationRead(n.id));
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(typeLabels).map(([key, label]) => {
          const count = key === 'all' ? notifications.length : notifications.filter(n => n.type === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filter === key
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
              {count > 0 && <span className="ml-1.5 text-[9px] font-black text-slate-500">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-2">
        {filtered.map(notif => {
          const meta = notifIcons[notif.type] || { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' };
          const Icon = meta.icon;
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                !notif.is_read
                  ? 'bg-blue-950/10 border-blue-900/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${meta.bg}`}>
                <Icon className={`w-4 h-4 ${meta.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {notif.title && (
                  <p className="text-xs font-bold text-white leading-snug mb-0.5">{notif.title}</p>
                )}
                <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                  <span>{new Date(notif.created_at).toLocaleString()}</span>
                  <span className="text-slate-700">·</span>
                  <span className="capitalize font-medium text-slate-500">{notif.type?.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!notif.is_read && (
                  <button
                    onClick={() => markNotificationRead(notif.id)}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Mark Read
                  </button>
                )}
                {notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-slate-700" title="Read" />
                )}
                {!notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Unread" />
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No notifications yet</p>
            <p className="text-xs text-slate-700 mt-1">Activity will appear here when teammates take actions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
