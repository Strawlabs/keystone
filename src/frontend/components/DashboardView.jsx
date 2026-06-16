import React from 'react';
import { Folder, CheckSquare, ClipboardList, Activity, Calendar, Users, FileText, TrendingUp, Plus, UserPlus, Eye } from 'lucide-react';

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
  const completedProjects = projects.filter(p => p.status === 'completed');
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed');
  const myTasks = tasks.filter(t => t.assigned_to === currentUser?.id && t.status !== 'completed');
  const myApprovals = approvals.filter(a => a.client_id === currentUser?.id && a.status === 'pending');
  const recentDrawings = [...drawings].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 4);

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  };

  // KPI Cards config per role
  const adminKPIs = [
    { label: 'Total Projects', value: projects.length, icon: Folder, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/40' },
    { label: 'Active Projects', value: activeProjects.length, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40', sub: `${completedProjects.length} completed` },
    { label: 'Pending Approvals', value: pendingApprovals.length, icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/40', urgent: pendingApprovals.length > 0 },
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/40' },
  ];

  const architectKPIs = [
    { label: 'Assigned Projects', value: activeProjects.length, icon: Folder, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/40' },
    { label: 'Pending Tasks', value: myTasks.length, icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/40' },
    { label: 'Drawings Uploaded', value: drawings.length, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/40' },
    { label: 'Approval Requests', value: pendingApprovals.length, icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
  ];

  const staffKPIs = [
    { label: 'My Tasks', value: myTasks.length, icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/40' },
    { label: 'Overdue', value: overdueTasks.filter(t => t.assigned_to === currentUser?.id).length, icon: Activity, color: 'text-rose-400', bg: 'bg-rose-950/20 border-rose-900/40', urgent: true },
    { label: 'Site Logs', value: siteLogs.length, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
    { label: 'Active Projects', value: activeProjects.length, icon: Folder, color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/40' },
  ];

  const clientKPIs = [
    { label: 'Active Projects', value: activeProjects.length, icon: Folder, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/40' },
    { label: 'Drawings Pending Review', value: myApprovals.length, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/40', urgent: myApprovals.length > 0 },
    { label: 'Completed Projects', value: completedProjects.length, icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
    { label: 'Total Drawings', value: drawings.length, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/40' },
  ];

  const kpis = isAdmin ? adminKPIs : isArchitect ? architectKPIs : isStaff ? staffKPIs : clientKPIs;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Good {getHour()}, {currentUser?.name?.split(' ')[0]}!</h2>
          <p className="text-slate-400 text-sm mt-1">Here is what's happening across your practice today.</p>
        </div>
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {(isAdmin || isArchitect) && (
            <button
              onClick={() => setShowProjectModal && setShowProjectModal(true)}
              className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowUserModal && setShowUserModal(true)}
              className="flex items-center gap-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Invite User
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-slate-100">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`bg-slate-900 border ${kpi.urgent ? 'border-amber-900/50' : 'border-slate-800'} p-5 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-700 transition-all`}>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">{kpi.label}</p>
                <p className="text-2xl font-black text-white mt-2">{kpi.value}</p>
                {kpi.sub && <p className="text-[10px] text-slate-600 mt-1">{kpi.sub}</p>}
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${kpi.bg}`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Role-specific widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1-2: Projects / Tasks / Approvals widget */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin & Architect: Recent Activity / Project Overview */}
          {(isAdmin || isArchitect) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Folder className="w-4 h-4 text-blue-400" />
                  Active Projects
                </h3>
                <button onClick={() => setTab('projects')} className="text-xs text-blue-400 font-bold hover:underline cursor-pointer">View All</button>
              </div>
              <div className="divide-y divide-slate-850">
                {activeProjects.slice(0, 4).map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.location || '—'} · Client: {p.client_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] px-2 py-0.5 font-bold uppercase rounded border bg-emerald-950/20 text-emerald-450 border-emerald-900/50">active</span>
                    </div>
                  </div>
                ))}
                {activeProjects.length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">No active projects</p>
                )}
              </div>
            </div>
          )}

          {/* Staff: My Tasks */}
          {isStaff && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  My Assigned Tasks
                </h3>
                <button onClick={() => setTab('tasks')} className="text-xs text-blue-400 font-bold hover:underline cursor-pointer">View All</button>
              </div>
              <div className="space-y-2">
                {myTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-lg border border-slate-850">
                    <div>
                      <p className="text-xs font-bold text-white">{t.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Due {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold border ${
                      t.priority === 'high' ? 'bg-rose-950/20 text-rose-400 border-rose-900/40' :
                      t.priority === 'medium' ? 'bg-amber-950/20 text-amber-400 border-amber-900/40' :
                      'bg-blue-950/20 text-blue-400 border-blue-900/40'
                    }`}>{t.priority}</span>
                  </div>
                ))}
                {myTasks.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No pending tasks</p>}
              </div>
            </div>
          )}

          {/* Client: Drawings Pending Review */}
          {isClient && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Drawings Pending Your Review
                </h3>
                <button onClick={() => setTab('approvals')} className="text-xs text-blue-400 font-bold hover:underline cursor-pointer">View All</button>
              </div>
              {myApprovals.length > 0 ? (
                <div className="space-y-3">
                  {myApprovals.slice(0, 4).map(a => {
                    const drawing = drawings.find(d => d.id === a.drawing_id);
                    return (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-lg border border-amber-900/30">
                        <div>
                          <p className="text-xs font-bold text-white">{drawing?.name || 'Drawing'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{drawing?.category}</p>
                        </div>
                        <button
                          onClick={() => setTab('approvals')}
                          className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No drawings awaiting your review</p>
              )}
            </div>
          )}

          {/* Pending Approvals — Admin & Architect */}
          {(isAdmin || isArchitect) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  Pending Approvals
                  {pendingApprovals.length > 0 && (
                    <span className="text-[9px] bg-amber-950/30 border border-amber-900/40 text-amber-400 font-black px-1.5 py-0.5 rounded">
                      {pendingApprovals.length} awaiting
                    </span>
                  )}
                </h3>
                <button onClick={() => setTab('approvals')} className="text-xs text-blue-400 font-bold hover:underline cursor-pointer">View All</button>
              </div>
              <div className="space-y-2">
                {pendingApprovals.slice(0, 3).map(a => {
                  const drawing = drawings.find(d => d.id === a.drawing_id);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-lg border border-slate-850">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{drawing?.name || 'Drawing'}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(a.submitted_at || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950/20 border border-amber-900/40 px-2 py-0.5 rounded">Pending</span>
                    </div>
                  );
                })}
                {pendingApprovals.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No pending approvals</p>}
              </div>
            </div>
          )}
        </div>

        {/* Col 3: Upcoming Deadlines + Site Progress */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Upcoming Deadlines
              </h3>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(t => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date();
                return (
                  <div key={t.id} className="flex flex-col gap-1 p-2.5 rounded-lg bg-slate-950/40 border border-slate-850">
                    <p className="text-xs font-bold text-slate-200 truncate">{t.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[9px]">
                      <span className={`font-bold uppercase tracking-wide ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`}>
                        {isOverdue ? '⚠ Overdue' : 'Due'} {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="capitalize text-slate-500">{t.priority}</span>
                    </div>
                  </div>
                );
              })}
              {tasks.filter(t => t.status !== 'completed').length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No upcoming deadlines</p>
              )}
            </div>
          </div>

          {/* Recent Site Updates */}
          {!isClient && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Site Updates
                </h3>
                <button onClick={() => setTab('site-logs')} className="text-xs text-blue-400 font-bold hover:underline cursor-pointer">View All</button>
              </div>
              <div className="space-y-3">
                {siteLogs.slice(0, 3).map(log => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-850">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(log.created_at || Date.now()).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{log.notes}</p>
                    {log.photos && log.photos.length > 0 && (
                      <p className="text-[9px] text-slate-500 mt-1">{log.photos.length} photo{log.photos.length > 1 ? 's' : ''} attached</p>
                    )}
                  </div>
                ))}
                {siteLogs.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No site logs yet</p>}
              </div>
            </div>
          )}

          {/* Client: Project Timeline */}
          {isClient && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Folder className="w-4 h-4 text-purple-400" />
                  Your Projects
                </h3>
                <button onClick={() => setTab('projects')} className="text-xs text-blue-400 font-bold hover:underline cursor-pointer">View All</button>
              </div>
              <div className="space-y-2">
                {projects.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-850">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                      p.status === 'active' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' :
                      p.status === 'completed' ? 'bg-slate-800 text-slate-500 border-slate-700' :
                      'bg-blue-950/20 text-blue-400 border-blue-900/40'
                    }`}>{p.status}</span>
                  </div>
                ))}
                {projects.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No projects assigned</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
