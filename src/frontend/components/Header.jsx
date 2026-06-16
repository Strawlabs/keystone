import React from 'react';
import { Bell, Search } from 'lucide-react';

export default function Header({
  activeTab,
  currentUser,
  toggleNotificationDropdown,
  showNotificationDropdown,
  notifications,
  markNotificationRead,
  globalSearch,
  setGlobalSearch,
  setTab,
}) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getPageTitle = (tab) => {
    const titles = {
      dashboard: 'Dashboard',
      projects: 'Projects',
      'assigned-projects': 'Assigned Projects',
      drawings: 'Drawing Library',
      approvals: 'Approval Center',
      tasks: 'Task Management',
      'site-logs': 'Site Logs',
      notifications: 'Notifications',
      users: 'User Management',
      activity: 'Activity Timeline',
      settings: 'Settings',
      saas: 'SaaS Administration',
      'blueprint-review': 'Blueprint Review',
    };
    return titles[tab] || tab;
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between px-6 select-none shrink-0 sticky top-0 backdrop-blur-md z-30">
      {/* Left: Page Title + Search */}
      <div className="flex items-center gap-6">
        <h1 className="text-base font-extrabold text-white leading-none hidden sm:block">
          {getPageTitle(activeTab)}
        </h1>

        {/* Global Search */}
        <div className="relative rounded-lg hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <input
            type="text"
            value={globalSearch || ''}
            onChange={(e) => setGlobalSearch?.(e.target.value)}
            className="block w-56 pl-9 pr-3 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950/60 text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent transition-all"
            placeholder="Search projects, drawings..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={toggleNotificationDropdown}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border border-slate-950 animate-pulse" />
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Notifications</span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <span className="text-[9px] bg-blue-950/30 border border-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded font-extrabold uppercase">
                      {unreadCount} unread
                    </span>
                  )}
                  <button
                    onClick={() => setTab?.('notifications')}
                    className="text-[9px] font-bold text-blue-400 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-850">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">No notifications yet</p>
                ) : (
                  notifications.slice(0, 6).map(n => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs flex flex-col gap-1 hover:bg-slate-850/50 transition-colors ${!n.is_read ? 'bg-blue-950/10' : ''}`}
                    >
                      {n.title && <p className="font-bold text-white text-[10px]">{n.title}</p>}
                      <p className="text-slate-400 leading-snug">{n.message}</p>
                      <div className="flex items-center justify-between mt-1 text-[9px] text-slate-600">
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                        {!n.is_read && (
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className="text-blue-400 font-bold hover:underline cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* User Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-none">{currentUser?.name}</p>
            <p className="text-[9px] text-slate-500 leading-none mt-1 uppercase tracking-wider font-bold">{currentUser?.role}</p>
          </div>
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
            alt={currentUser?.name}
            className="w-8 h-8 rounded-full border border-slate-700 object-cover"
          />
        </div>
      </div>
    </header>
  );
}
