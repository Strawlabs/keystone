import React from 'react';
import { LogOut, Plus, Bell } from 'lucide-react';

export default function Sidebar({
  filteredMenuItems,
  activeTab,
  setTab,
  currentUser,
  isClient,
  isStaff,
  handleOpenProjectModal,
  logout,
  notifications,
}) {
  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 3l9 9M12 3L3 12" />
            </svg>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white font-sans">Keystone</span>
            <p className="text-[9px] text-slate-500 font-medium leading-none mt-0.5 uppercase tracking-widest">Studio</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 px-3 space-y-0.5">
          {filteredMenuItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            const isNotif = item.id === 'notifications';
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {/* Notification badge */}
                {isNotif && unreadCount > 0 && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Card at bottom of sidebar */}
      <div className="p-4 border-t border-slate-800">
        {(!isClient && !isStaff) && (
          <button
            onClick={handleOpenProjectModal}
            className="w-full mb-3 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-600/10 border border-blue-900/40 hover:bg-blue-600 text-xs font-bold text-blue-400 hover:text-white transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
            alt={currentUser?.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-700"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
            <p className="text-[9px] text-slate-500 truncate uppercase tracking-wider font-bold mt-0.5">{currentUser?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
