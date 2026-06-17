const iconMap = {
  dashboard: 'dashboard',
  projects: 'architecture',
  'assigned-projects': 'architecture',
  drawings: 'edit_document',
  approvals: 'verified',
  tasks: 'assignment',
  'site-logs': 'home_work',
  users: 'group',
  notifications: 'notifications',
  activity: 'history',
  settings: 'settings',
  saas: 'shield'
};

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
    <aside className="w-64 h-screen fixed left-0 top-0 bg-surface border-r border-border-subtle flex flex-col justify-between py-6 px-4 z-50 shrink-0 select-none">
      <div>
        {/* Logo */}
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
          </div>
          <div>
            <h1 className="text-headline-md font-bold text-on-surface leading-tight">Keystone Studio</h1>
            <p className="text-label-md text-secondary">Studio Admin</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 px-1 space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = activeTab === item.id;
            const isNotif = item.id === 'notifications';
            const iconName = iconMap[item.id] || 'circle';
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-secondary-container text-primary font-semibold border-l-4 border-primary rounded-r-lg'
                    : 'text-secondary hover:bg-surface-container-low transition-colors duration-150 rounded-lg'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {iconName}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {/* Notification badge */}
                {isNotif && unreadCount > 0 && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary text-on-primary' : 'bg-primary-container text-primary'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Card at bottom of sidebar */}
      <div className="pt-6 border-t border-border-subtle">
        {(!isClient && !isStaff) && (
          <button
            onClick={handleOpenProjectModal}
            className="w-full mb-4 bg-primary text-on-primary py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Project</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          <img
            src={currentUser?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVdMMcz-t7qHiWviIzACzLVcwxuA2tE6rl012J2YBbv6z7sOan21OCbU56XdVUxI-H6_ISPlC6sddReYy1sJVipQ0SrNDiFgIetBDLxUQxnqgrOdmGz1xNPBFz6TVGFU-LFzzWGmv3FE-J2JVcMINIWVAj2qFvq1B-gIGZtr7CMn1hN0c7Oq-A2cy1rBpx4UOQrgZhprpq5sc749Dz7fGiIV4FtDXgTnNBE-STfKGLInTsztjBpjHaQePJRn6WCTbsj29zJWYcWwM'}
            alt={currentUser?.name}
            className="w-9 h-9 rounded-full object-cover border border-border-subtle bg-surface-container"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">{currentUser?.name}</p>
            <p className="text-[9px] text-secondary truncate uppercase tracking-wider font-bold mt-0.5">{currentUser?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-secondary hover:text-error rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            title="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
