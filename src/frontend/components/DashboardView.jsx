import React from 'react';

export default function DashboardView({
  currentUser,
  projects,
  approvals,
  tasks,
  siteLogs,
  drawings,
  users,
  setTab,
  setShowProjectModal,
  setShowUserModal,
}) {
  const isAdmin = currentUser?.role === 'admin';
  const isArchitect = currentUser?.role === 'architect';
  const isStaff = currentUser?.role === 'staff';
  const isClient = currentUser?.role === 'client';

  const activeProjects = projects.filter(p => p.status === 'active');
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const myApprovals = approvals.filter(a => a.client_id === currentUser?.id && a.status === 'pending');
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed');
  const myTasks = tasks.filter(t => t.assigned_to === currentUser?.id && t.status !== 'completed');

  const displayApprovals = isClient ? myApprovals : pendingApprovals;
  const displayTasksCount = isStaff ? myTasks.length : pendingTasks.length;
  const displayOverdueCount = isStaff ? overdueTasks.filter(t => t.assigned_to === currentUser?.id).length : overdueTasks.length;

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="space-y-6 animate-fade-in text-on-background">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Studio Overview</h2>
          <p className="font-body-md text-body-md text-secondary">Good {getHour()}, {currentUser?.name?.split(' ')[0]}. Here is what is happening across your projects today.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {(isAdmin || isArchitect) && (
            <button 
              onClick={() => setShowProjectModal?.(true)}
              className="px-4 py-2 rounded-lg text-body-md font-bold bg-primary text-white hover:opacity-90 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              New Project
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setShowUserModal?.(true)}
              className="px-4 py-2 rounded-lg text-body-md font-medium border border-border-subtle bg-white hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Invite User
            </button>
          )}
        </div>
      </div>

      {/* KPI Row (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-5 rounded-xl border-l-4 border-l-primary flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-secondary font-label-md text-label-md">Active Projects</span>
            <span className="material-symbols-outlined text-primary text-[20px]">architecture</span>
          </div>
          <div>
            <div className="text-display font-display text-[32px] leading-none mb-1 font-extrabold">{projects.length}</div>
            <div className="flex items-center text-success text-label-sm font-label-sm">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span className="ml-1">+{activeProjects.length} active</span>
            </div>
          </div>
        </div>

        <div className="premium-card p-5 rounded-xl border-l-4 border-l-warning flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-secondary font-label-md text-label-md">Pending Approvals</span>
            <span className="material-symbols-outlined text-warning text-[20px]">pending_actions</span>
          </div>
          <div>
            <div className="text-display font-display text-[32px] leading-none mb-1 font-extrabold">{displayApprovals.length}</div>
            <div className="flex items-center text-secondary text-label-sm font-label-sm">
              <span>Requires attention</span>
            </div>
          </div>
        </div>

        <div className="premium-card p-5 rounded-xl border-l-4 border-l-error flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-secondary font-label-md text-label-md">Open Tasks</span>
            <span className="material-symbols-outlined text-error text-[20px]">assignment_late</span>
          </div>
          <div>
            <div className="text-display font-display text-[32px] leading-none mb-1 font-extrabold">{displayTasksCount}</div>
            <div className="flex items-center text-error text-label-sm font-label-sm">
              <span className="material-symbols-outlined text-[14px]">priority_high</span>
              <span className="ml-1">{displayOverdueCount} overdue</span>
            </div>
          </div>
        </div>

        <div className="premium-card p-5 rounded-xl border-l-4 border-l-success flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-secondary font-label-md text-label-md">Site Visits</span>
            <span className="material-symbols-outlined text-success text-[20px]">location_on</span>
          </div>
          <div>
            <div className="text-display font-display text-[32px] leading-none mb-1 font-extrabold">{siteLogs.length}</div>
            <div className="flex items-center text-secondary text-label-sm font-label-sm">
              <span>Recorded updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-12 gap-6 pb-8">
        {/* Recent Activity Timeline (Col Span 4) */}
        <div className="col-span-12 lg:col-span-4 premium-card rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="px-5 py-4 border-b border-border-subtle bg-surface-container-lowest flex justify-between items-center shrink-0">
            <h3 className="text-body-lg font-bold text-ink-black">Recent Activity</h3>
            {isAdmin && (
              <button onClick={() => setTab('activity')} className="text-primary text-label-md font-medium hover:underline cursor-pointer">View all</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-hide">
            <div className="relative pl-8">
              <div className="absolute left-[3px] top-2 bottom-[-32px] w-[1px] bg-border-subtle"></div>
              <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white box-content"></div>
              <p className="text-body-md font-semibold text-on-surface">Structural Plan Update</p>
              <p className="text-body-md text-secondary">Uploaded by <span className="text-primary font-medium">Marco Rossi</span> for Project "Azure Heights".</p>
              <span className="text-label-md text-slate-400">12 mins ago</span>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-[3px] top-2 bottom-[-32px] w-[1px] bg-border-subtle"></div>
              <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-warning border-2 border-white box-content"></div>
              <p className="text-body-md font-semibold text-on-surface">New Comment</p>
              <p className="text-body-md text-secondary">"The cantilever dimension seems off in section B-B." - <span class="text-primary font-medium">Elena Vance</span></p>
              <span className="text-label-md text-slate-400">2 hours ago</span>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-[3px] top-2 bottom-[-32px] w-[1px] bg-border-subtle"></div>
              <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-white box-content"></div>
              <p className="text-body-md font-semibold text-on-surface">Drawing Approved</p>
              <p className="text-body-md text-secondary">Client approved "Lobby Interior Renderings".</p>
              <span className="text-label-md text-slate-400">5 hours ago</span>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-secondary border-2 border-white box-content"></div>
              <p className="text-body-md font-semibold text-on-surface">Site Log Created</p>
              <p className="text-body-md text-secondary">Foundation inspection completed at "North Dock".</p>
              <span className="text-label-md text-slate-400">Yesterday</span>
            </div>
          </div>
        </div>

        {/* Pending Approvals & Deadlines (Col Span 5) */}
        <div className="col-span-12 lg:col-span-5 space-y-6 flex flex-col h-[500px]">
          {/* Pending Approvals Card */}
          <div className="premium-card rounded-xl overflow-hidden flex-1 flex flex-col min-h-[220px]">
            <div className="px-5 py-4 border-b border-border-subtle bg-surface-container-lowest flex justify-between items-center shrink-0">
              <h3 className="text-body-lg font-bold text-ink-black">Pending Approvals</h3>
              <span className="bg-warning/10 text-warning text-label-sm font-bold px-2 py-0.5 rounded-full border border-warning/20">
                {displayApprovals.length} Awaiting
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scroll-hide">
              <div className="space-y-1">
                {displayApprovals.slice(0, 3).map((app) => {
                  const drawing = drawings.find(d => d.id === app.drawing_id);
                  return (
                    <div 
                      key={app.id} 
                      onClick={() => setTab('approvals')}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 bg-surface-container rounded-lg flex items-center justify-center text-secondary shrink-0">
                          <span className="material-symbols-outlined text-[20px]">description</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-md font-semibold text-ink-black truncate">{drawing?.name || 'Technical Sheet'}</p>
                          <p className="text-label-md text-secondary truncate">Rev {drawing?.current_revision || 1} • {new Date(app.submitted_at || Date.now()).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-primary text-white text-label-sm font-bold rounded-lg transition-opacity cursor-pointer shrink-0">
                        Review
                      </button>
                    </div>
                  );
                })}
                {displayApprovals.length === 0 && (
                  <p className="p-8 text-xs text-secondary text-center">No pending approvals</p>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Card */}
          <div className="premium-card rounded-xl overflow-hidden flex-1 flex flex-col min-h-[220px]">
            <div className="px-5 py-4 border-b border-border-subtle bg-surface-container-lowest flex justify-between items-center shrink-0">
              <h3 className="text-body-lg font-bold text-ink-black">Upcoming Deadlines</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scroll-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-label-md text-secondary border-b border-border-subtle">
                    <th className="pb-2 font-semibold">Milestone</th>
                    <th className="pb-2 font-semibold">Due Date</th>
                    <th className="pb-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-body-md text-on-background">
                  {tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task) => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                    return (
                      <tr key={task.id} className="border-b border-border-subtle/50 last:border-none">
                        <td className="py-2.5 font-medium text-ink-black truncate max-w-[150px]">{task.title}</td>
                        <td className="py-2.5 text-secondary">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
                        <td className="py-2.5 text-right">
                          <span className={isOverdue ? 'text-error font-semibold' : 'text-warning font-semibold'}>
                            {isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {tasks.filter(t => t.status !== 'completed').length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-8 text-xs text-secondary text-center">No active deadlines</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Site Progress Feed (Col Span 3) */}
        <div className="col-span-12 lg:col-span-3 premium-card rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="px-5 py-4 border-b border-border-subtle bg-surface-container-lowest flex justify-between items-center shrink-0">
            <h3 className="text-body-lg font-bold text-ink-black">Site Progress Feed</h3>
            <span className="material-symbols-outlined text-secondary text-[20px]">camera_alt</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-hide">
            <div className="group cursor-pointer" onClick={() => setTab('site-logs')}>
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-surface-container">
                <img 
                  className="w-full h-full object-cover transition-transform duration-550 group-hover:scale-108" 
                  alt="West Wing Piling" 
                  src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400&h=250&fit=crop"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-label-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility</span> View Full Log
                  </span>
                </div>
              </div>
              <div className="px-1">
                <p className="text-body-md font-semibold text-ink-black">West Wing Piling</p>
                <p className="text-label-md text-secondary">Grandview Hotel • 4h ago</p>
              </div>
            </div>

            <div className="group cursor-pointer" onClick={() => setTab('site-logs')}>
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-surface-container">
                <img 
                  className="w-full h-full object-cover transition-transform duration-550 group-hover:scale-108" 
                  alt="Glass Facade Install" 
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&h=250&fit=crop"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-label-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility</span> View Full Log
                  </span>
                </div>
              </div>
              <div className="px-1">
                <p className="text-body-md font-semibold text-ink-black">Glass Facade Install</p>
                <p className="text-label-md text-secondary">The Cube • Yesterday</p>
              </div>
            </div>

            <div className="group cursor-pointer" onClick={() => setTab('site-logs')}>
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-surface-container">
                <img 
                  className="w-full h-full object-cover transition-transform duration-550 group-hover:scale-108" 
                  alt="Exterior Cladding" 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&h=250&fit=crop"
                />
              </div>
              <div className="px-1">
                <p className="text-body-md font-semibold text-ink-black">Exterior Cladding</p>
                <p className="text-label-md text-secondary">Apex Tower • 2d ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
