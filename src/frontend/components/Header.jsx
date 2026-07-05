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
  onMenuClick,
  currentTenant,
}) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 border-b border-border-subtle bg-surface-container-lowest flex items-center justify-between px-4 sm:px-8 select-none shrink-0 sticky top-0 z-30">
      {/* Left: Title + Search */}
      <div className="flex items-center gap-3 sm:gap-8 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer shrink-0"
          title="Open Menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <span className="font-headline-md text-headline-md font-black text-ink-black uppercase tracking-tight hidden sm:block truncate max-w-[180px]">{currentTenant?.name || 'Keystone'}</span>

        {/* Global Search */}
        <div className="relative rounded-full max-w-md w-full bg-surface-container-low">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary material-symbols-outlined text-[20px]">search</span>
          <input
            type="text"
            value={globalSearch || ''}
            onChange={(e) => setGlobalSearch?.(e.target.value)}
            className="block w-full pl-10 pr-4 py-1.5 rounded-full border-none text-body-md text-on-background placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-transparent"
            placeholder="Search projects, drawings, or tasks..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={toggleNotificationDropdown}
            className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-surface-container-low transition-colors relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white" />
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-border-subtle rounded-xl shadow-2xl z-45 overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs font-bold text-ink-black">Notifications</span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded font-extrabold uppercase">
                      {unreadCount} unread
                    </span>
                  )}
                  <button
                    onClick={() => setTab?.('notifications')}
                    className="text-[9px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border-subtle">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-secondary text-center">No notifications yet</p>
                ) : (
                  notifications.slice(0, 6).map(n => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs flex flex-col gap-1 hover:bg-surface-container-low transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                    >
                      {n.title && <p className="font-bold text-ink-black text-[10px]">{n.title}</p>}
                      <p className="text-secondary leading-snug">{n.message}</p>
                      <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                        {!n.is_read && (
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className="text-primary font-bold hover:underline cursor-pointer"
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

        <button className="p-2 text-secondary hover:text-primary transition-colors">
          <span class="material-symbols-outlined text-[24px]">help_outline</span>
        </button>

        <div className="h-6 w-px bg-border-subtle" />

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-label-md font-bold text-ink-black leading-tight">{currentUser?.name}</p>
            <p className="text-[9px] text-secondary uppercase tracking-wider font-bold mt-0.5">{currentUser?.role}</p>
          </div>
          <img
            src={currentUser?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVdMMcz-t7qHiWviIzACzLVcwxuA2tE6rl012J2YBbv6z7sOan21OCbU56XdVUxI-H6_ISPlC6sddReYy1sJVipQ0SrNDiFgIetBDLxUQxnqgrOdmGz1xNPBFz6TVGFU-LFzzWGmv3FE-J2JVcMINIWVAj2qFvq1B-gIGZtr7CMn1hN0c7Oq-A2cy1rBpx4UOQrgZhprpq5sc749Dz7fGiIV4FtDXgTnNBE-STfKGLInTsztjBpjHaQePJRn6WCTbsj29zJWYcWwM'}
            alt={currentUser?.name}
            className="w-8 h-8 rounded-full border border-border-subtle object-cover bg-surface-container"
          />
        </div>
      </div>
    </header>
  );
}
