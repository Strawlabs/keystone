'use client';
import React, { useMemo } from 'react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_COLORS = {
  planning:  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  active:    { bg: 'bg-emerald-100', text: 'text-emerald-700',dot: 'bg-emerald-500' },
  on_hold:   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  completed: { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400'  },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-400'    },
};

function ResolvedImage({ src, alt, className, getSignedUrl }) {
  const [resolvedSrc, setResolvedSrc] = React.useState(src);

  React.useEffect(() => {
    if (!src) return;
    if (src.startsWith('blob:')) {
      setResolvedSrc(src);
      return;
    }
    const extractPath = (url) => {
      if (!url.startsWith('http')) return url;
      const marker = '/keystone-assets/';
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        let clean = url.substring(idx + marker.length);
        const qIdx = clean.indexOf('?');
        if (qIdx !== -1) clean = clean.substring(0, qIdx);
        return clean || null;
      }
      return null;
    };
    const stPath = extractPath(src);
    if (stPath && getSignedUrl) {
      getSignedUrl(stPath).then((signed) => {
        if (signed) setResolvedSrc(signed);
      });
    } else {
      setResolvedSrc(src);
    }
  }, [src, getSignedUrl]);

  return (
    <img
      src={resolvedSrc || src}
      alt={alt}
      className={className}
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.planning;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status?.replace('_', ' ')}
    </span>
  );
}

function KpiCard({ label, value, icon, accent, sub, trend, trendUp = true, onClick, loading = false }) {
  if (loading) {
    return (
      <div className={`premium-card p-5 rounded-xl border-l-4 ${accent} flex flex-col justify-between h-[126px]`}>
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 skeleton-block" />
          <div className="h-6 w-6 skeleton-block rounded-md" />
        </div>
        <div>
          <div className="h-9 w-16 skeleton-block mb-1.5" />
          <div className="h-3 w-28 skeleton-block" />
        </div>
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={`premium-card p-5 rounded-xl border-l-4 ${accent} flex flex-col justify-between h-[126px] ${onClick ? 'cursor-pointer card-hover' : ''} transition-all`}
    >
      <div className="flex justify-between items-start">
        <span className="text-secondary font-semibold text-xs tracking-wide uppercase">{label}</span>
        <span className="material-symbols-outlined text-[20px] text-secondary">{icon}</span>
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[34px] leading-none font-extrabold text-ink-black mb-1 animate-count-up">{value ?? '—'}</div>
          {trend && (
            <span className={trendUp ? 'stat-trend-up' : 'stat-trend-down'}>
              <span className="material-symbols-outlined text-[14px]">
                {trendUp ? 'trending_up' : 'trending_down'}
              </span>
              {trend}
            </span>
          )}
        </div>
        {sub && <div className="text-[11px] text-secondary font-medium">{sub}</div>}
      </div>
    </div>
  );
}

function SectionCard({ title, badge, action, onAction, children, height = 'h-[320px]' }) {
  return (
    <div className={`premium-card rounded-xl overflow-hidden flex flex-col ${height}`}>
      <div className="px-5 py-3.5 border-b border-border-subtle bg-surface-container-lowest flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-body-lg font-bold text-ink-black">{title}</h3>
          {badge !== undefined && badge !== null && (
            <span className="bg-primary/10 text-primary text-label-sm font-bold px-2 py-0.5 rounded-full border border-primary/20">
              {badge}
            </span>
          )}
        </div>
        {action && (
          <button onClick={onAction} className="text-primary text-label-md font-medium hover:underline cursor-pointer">
            {action}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scroll-hide">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
      <span className="material-symbols-outlined text-[36px] text-secondary/40">{icon}</span>
      <p className="text-label-md text-secondary text-center">{message}</p>
    </div>
  );
}

// ─── Activity icon by entity_type ────────────────────────────────────────────
const ENTITY_ICONS = {
  project:  { icon: 'architecture',     color: 'bg-primary/10 text-primary'    },
  drawing:  { icon: 'description',      color: 'bg-indigo-100 text-indigo-600' },
  task:     { icon: 'task_alt',         color: 'bg-emerald-100 text-emerald-600' },
  approval: { icon: 'pending_actions',  color: 'bg-amber-100 text-amber-600'   },
  site_log: { icon: 'location_on',      color: 'bg-orange-100 text-orange-600' },
  auth:     { icon: 'login',            color: 'bg-slate-100 text-slate-500'   },
};

function ActivityItem({ log, isLast }) {
  const ei = ENTITY_ICONS[log.entity_type] || ENTITY_ICONS.project;
  const dotColor = {
    project:  'bg-primary',
    drawing:  'bg-indigo-500',
    task:     'bg-success',
    approval: 'bg-warning',
    site_log: 'bg-tertiary',
    auth:     'bg-secondary',
  }[log.entity_type] || 'bg-primary';

  return (
    <div className="relative pl-11 pr-5 py-3">
      {!isLast && (
        <div className="absolute left-[24px] top-[26px] bottom-0 w-px bg-border-subtle" />
      )}
      <div className={`absolute left-[19px] top-[14px] h-2.5 w-2.5 rounded-full border-2 border-background box-content ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-semibold text-ink-black leading-snug">{log.action}</p>
        {log.user_name && (
          <p className="text-label-md text-secondary">
            by <span className="text-primary font-medium">{log.user_name}</span>
          </p>
        )}
        {log.project_name && (
          <p className="text-label-sm text-slate-400 truncate">{log.project_name}</p>
        )}
        <span className="text-label-sm text-outline">{relativeTime(log.created_at)}</span>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function DashboardSkeleton({ role = 'admin' }) {
  const kpiCount = role === 'admin' ? 6 : 4;
  const accent = ['border-l-primary', 'border-l-success', 'border-l-warning', 'border-l-indigo-400', 'border-l-error', 'border-l-orange-400'];
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-slate-200 rounded-lg" />
          {role === 'admin' && <div className="h-9 w-28 bg-slate-100 rounded-lg" />}
        </div>
      </div>

      {/* KPI cards */}
      <div className={`grid gap-4 ${role === 'admin' ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6' : 'grid-cols-2 xl:grid-cols-4'}`}>
        {Array.from({ length: kpiCount }).map((_, i) => (
          <KpiCard key={i} label="" value="" icon="" accent={accent[i % accent.length]} loading />
        ))}
      </div>

      {/* Widgets row skeleton */}
      <div className="grid grid-cols-12 gap-6 pb-8">
        <div className="col-span-12 lg:col-span-4 h-[420px] premium-card rounded-xl bg-slate-50" />
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="h-[200px] premium-card rounded-xl bg-slate-50" />
          <div className="h-[200px] premium-card rounded-xl bg-slate-50" />
        </div>
        <div className="col-span-12 lg:col-span-3 h-[420px] premium-card rounded-xl bg-slate-50" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function AdminDashboard({ currentUser, projects, approvals, tasks, siteLogs, drawings, users, activityLogs, dashboardStats, setTab, setShowProjectModal, setShowUserModal, getSignedUrl }) {
  const now = new Date();
  const kpis = dashboardStats?.kpis || {};

  // Fall back to client-side computation when stats not yet loaded
  const activeProjectsLen    = kpis.activeProjects    ?? projects.filter(p => p.status === 'active').length;
  const completedProjectsLen = kpis.completedProjects ?? projects.filter(p => p.status === 'completed').length;
  const pendingApprovalsLen  = kpis.pendingApprovals  ?? approvals.filter(a => a.status === 'pending').length;
  const totalUsersLen        = kpis.totalUsers        ?? users.length;
  const openTasksLen         = kpis.openTasks         ?? tasks.filter(t => t.status !== 'completed').length;
  const siteLogsLen          = kpis.siteLogs          ?? siteLogs.length;

  const overdueSub = kpis.overdueTasks != null
    ? (kpis.overdueTasks > 0 ? `${kpis.overdueTasks} overdue` : 'none overdue')
    : (() => {
        const ov = tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now);
        return ov.length > 0 ? `${ov.length} overdue` : 'none overdue';
      })();

  // Project status donut data
  const statusBreakdown = dashboardStats?.projectStatusBreakdown || {
    planning:  projects.filter(p => p.status === 'planning').length,
    active:    projects.filter(p => p.status === 'active').length,
    on_hold:   projects.filter(p => p.status === 'on_hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
  };

  const enrichedActivity = useMemo(() => {
    if (dashboardStats?.recentActivity?.length) return dashboardStats.recentActivity;
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    return activityLogs.slice(0, 10).map(l => ({
      ...l,
      user_name: userMap[l.user_id]?.name || 'Unknown',
    }));
  }, [dashboardStats, activityLogs, users]);

  const approvalItems = useMemo(() => {
    if (dashboardStats?.pendingApprovalItems?.length) return dashboardStats.pendingApprovalItems;
    const drawingMap = Object.fromEntries(drawings.map(d => [d.id, d]));
    return approvals.filter(a => a.status === 'pending').slice(0, 5).map(a => ({
      ...a,
      drawing_name:     drawingMap[a.drawing_id]?.name || 'Drawing',
      drawing_revision: drawingMap[a.drawing_id]?.current_revision || 1,
    }));
  }, [dashboardStats, approvals, drawings]);

  const deadlines = useMemo(() => {
    if (dashboardStats?.upcomingDeadlines?.length) return dashboardStats.upcomingDeadlines;
    return tasks.filter(t => t.status !== 'completed' && t.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);
  }, [dashboardStats, tasks]);

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Studio Overview</h2>
          <p className="font-body-md text-body-md text-secondary mt-0.5">
            Good {getHour()}, {currentUser?.name?.split(' ')[0]}. Here is what is happening across your projects today.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <button
            id="admin-new-project-btn"
            onClick={() => setShowProjectModal?.(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-container transition-all btn-interactive shadow-elevated cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Project
          </button>
          <button
            id="admin-invite-user-btn"
            onClick={() => setShowUserModal?.(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle bg-white hover:bg-surface-container-low transition-all btn-interactive shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Invite User
          </button>
        </div>
      </div>

      {/* KPI Grid — 4 cards matching Stripe / Vercel design */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Active Projects"   value={activeProjectsLen}    icon="architecture"    accent="border-l-primary" trend="+14% MoM" trendUp={true} sub={`of ${projects.length} total`}  onClick={() => setTab('projects')} />
        <KpiCard label="Pending Approvals" value={pendingApprovalsLen}  icon="pending_actions" accent="border-l-warning" trend={pendingApprovalsLen > 0 ? 'Requires Action' : 'All Clear'} trendUp={pendingApprovalsLen === 0} sub="require review"                 onClick={() => setTab('approvals')} />
        <KpiCard label="Open Tasks"        value={openTasksLen}         icon="assignment_late" accent="border-l-error"   trend="-8% backlog" trendUp={true} sub={overdueSub}                     onClick={() => setTab('tasks')} />
        <KpiCard label="Site Visits"       value={siteLogsLen}          icon="location_on"     accent="border-l-success" trend="On schedule" trendUp={true} sub="logged visits"                  onClick={() => setTab('site-logs')} />
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-12 gap-6 pb-8">

        {/* Activity Timeline — col 4 */}
        <div className="col-span-12 lg:col-span-4">
          <SectionCard title="Team Activity" action={enrichedActivity.length > 0 ? 'View all' : null} onAction={() => setTab('activity')} height="h-[460px]">
            {enrichedActivity.length === 0
              ? <EmptyState icon="history" message="No recent activity yet." />
              : enrichedActivity.slice(0, 8).map((log, i) => (
                  <ActivityItem key={log.id || i} log={log} isLast={i === Math.min(enrichedActivity.length, 8) - 1} />
                ))
            }
          </SectionCard>
        </div>

        {/* Middle column: Approvals + Deadlines — col 5 */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <SectionCard title="Pending Approvals" badge={approvalItems.length} action={approvalItems.length > 0 ? 'Review all' : null} onAction={() => setTab('approvals')} height="h-[215px]">
            {approvalItems.length === 0
              ? <EmptyState icon="pending_actions" message="No pending approvals." />
              : <div className="divide-y divide-border-subtle/60">
                  {approvalItems.slice(0, 3).map(ap => (
                    <div key={ap.id} onClick={() => setTab('approvals')} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low transition-colors cursor-pointer group">
                      <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-amber-600">description</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-md font-semibold text-ink-black truncate">{ap.drawing_name}</p>
                        <p className="text-label-md text-secondary">Rev {ap.drawing_revision} · {formatDate(ap.submitted_at)}</p>
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 text-label-sm text-primary font-semibold transition-opacity shrink-0">Review →</span>
                    </div>
                  ))}
                </div>
            }
          </SectionCard>

          <SectionCard title="Upcoming Deadlines" height="h-[221px]">
            {deadlines.length === 0
              ? <EmptyState icon="event" message="No upcoming deadlines." />
              : <table className="w-full text-left">
                  <thead className="border-b border-border-subtle">
                    <tr className="text-label-md text-secondary">
                      <th className="pb-2 pt-3 px-5 font-semibold">Task</th>
                      <th className="pb-2 pt-3 font-semibold">Due</th>
                      <th className="pb-2 pt-3 font-semibold text-right pr-5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deadlines.slice(0, 4).map(task => {
                      const isOverdue = task.due_date && new Date(task.due_date) < now;
                      return (
                        <tr key={task.id} className="border-b border-border-subtle/40 last:border-none hover:bg-surface-container-low/50">
                          <td className="py-2.5 px-5 text-body-md font-medium text-ink-black max-w-[140px] truncate">{task.title}</td>
                          <td className="py-2.5 text-label-md text-secondary">{formatDate(task.due_date)}</td>
                          <td className="py-2.5 text-right pr-5">
                            <span className={`text-label-sm font-bold ${isOverdue ? 'text-error' : 'text-warning'}`}>
                              {isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            }
          </SectionCard>
        </div>

        {/* Site Progress Feed — col 3 (replaces Project Status breakdown) */}
        <div className="col-span-12 lg:col-span-3">
          <SectionCard title="Site Progress" height="h-[460px]">
            <div className="p-4 space-y-4 overflow-y-auto scroll-hide h-full">

              {/* Status breakdown mini bars */}
              <div className="space-y-2 pb-3 border-b border-border-subtle">
                {Object.entries(statusBreakdown).map(([status, count]) => {
                  const total = projects.length || 1;
                  const pct = Math.round((count / total) * 100);
                  const c = STATUS_COLORS[status] || STATUS_COLORS.planning;
                  return (
                    <div key={status}>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-label-sm font-semibold capitalize ${c.text}`}>{status.replace('_', ' ')}</span>
                        <span className="text-label-sm font-bold text-ink-black">{count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.dot}`} style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent site log images */}
              <p className="text-label-md font-bold text-secondary uppercase tracking-wider pt-1">Recent Site Logs</p>
              {siteLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <span className="material-symbols-outlined text-[36px] text-secondary/40">camera_alt</span>
                  <p className="text-label-md text-secondary text-center">No site logs yet</p>
                </div>
              ) : (
                siteLogs.slice(0, 3).map((log) => {
                  const proj = projects.find(p => p.id === log.project_id);
                  const hasPhoto = log.photo_url || log.photos?.[0];
                  return (
                    <div
                      key={log.id}
                      onClick={() => setTab('site-logs')}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-1.5 bg-surface-container">
                        {hasPhoto ? (
                          <ResolvedImage
                            src={hasPhoto}
                            alt={log.title}
                            className="w-full h-full object-cover img-zoom"
                            getSignedUrl={getSignedUrl}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
                            <span className="material-symbols-outlined text-[32px] text-secondary/40">camera_alt</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-white text-label-sm font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">visibility</span> View Log
                          </span>
                        </div>
                      </div>
                      <div className="px-0.5">
                        <p className="text-label-md font-semibold text-ink-black truncate">{log.title || (log.notes ? log.notes.slice(0, 45) + (log.notes.length > 45 ? '...' : '') : 'Site Visit')}</p>
                        <p className="text-label-sm text-secondary">{proj?.name || 'Project'} · {relativeTime(log.visit_date || log.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ARCHITECT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function ArchitectDashboard({ currentUser, projects, approvals, tasks, drawings, users, activityLogs, dashboardStats, setTab, setShowProjectModal, setShowDrawingModal }) {
  const now = new Date();
  const kpis = dashboardStats?.kpis || {};

  // KPI values — prefer server-computed, fallback to client-side
  // myProjectsLen: server counts created_by + project_members; client fallback uses created_by only
  // (project_members is not available client-side, so the fallback will undercount for staff — acceptable
  //  since the skeleton + fast stats load means this fallback is rarely seen)
  const myProjectsLen     = kpis.assignedProjects         ?? projects.filter(p => p.created_by === currentUser?.id).length;
  const myTasksLen        = kpis.pendingTasks             ?? tasks.filter(t => t.assigned_to === currentUser?.id && t.status !== 'completed').length;
  const myDrawingsLen     = kpis.recentDrawings           ?? drawings.filter(d => d.uploaded_by === currentUser?.id).length;
  const awaitingClientLen = kpis.pendingApprovalResponses ?? approvals.filter(a => a.submitted_by === currentUser?.id && a.status === 'pending').length;

  const overdueSub = kpis.overdueTasks != null
    ? (kpis.overdueTasks > 0 ? `${kpis.overdueTasks} overdue` : 'on track')
    : (() => {
        const ov = tasks.filter(t => t.assigned_to === currentUser?.id && t.status !== 'completed' && t.due_date && new Date(t.due_date) < now);
        return ov.length > 0 ? `${ov.length} overdue` : 'on track';
      })();

  // Task list — prefer server-enriched (has project_name)
  const myTaskList = useMemo(() => {
    if (dashboardStats?.myTasks?.length) return dashboardStats.myTasks;
    return tasks
      .filter(t => t.assigned_to === currentUser?.id && t.status !== 'completed')
      .slice(0, 6);
  }, [dashboardStats, tasks, currentUser]);

  // Drawings list — prefer server-enriched (has project_name, sorted)
  const myDrawingsList = useMemo(() => {
    if (dashboardStats?.myRecentDrawings?.length) return dashboardStats.myRecentDrawings;
    return drawings
      .filter(d => d.uploaded_by === currentUser?.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6)
      .map(d => ({ ...d, project_name: projects.find(p => p.id === d.project_id)?.name || '' }));
  }, [dashboardStats, drawings, currentUser, projects]);

  // Awaiting client list
  const submittedPendingList = useMemo(() => {
    if (dashboardStats?.mySubmittedApprovalItems?.length) return dashboardStats.mySubmittedApprovalItems;
    const drawingMap = Object.fromEntries(drawings.map(d => [d.id, d]));
    return approvals
      .filter(a => a.submitted_by === currentUser?.id && a.status === 'pending')
      .slice(0, 3)
      .map(a => ({
        ...a,
        drawing_name:     drawingMap[a.drawing_id]?.name || 'Drawing',
        drawing_revision: drawingMap[a.drawing_id]?.current_revision || 1,
      }));
  }, [dashboardStats, approvals, drawings, currentUser]);

  // Recent activity
  const enrichedActivity = useMemo(() => {
    if (dashboardStats?.recentActivity?.length) return dashboardStats.recentActivity;
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    return activityLogs.slice(0, 6).map(l => ({ ...l, user_name: userMap[l.user_id]?.name || 'Unknown' }));
  }, [dashboardStats, activityLogs, users]);

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  };

  const PRIORITY_COLORS = {
    high:   'text-error bg-error/10',
    medium: 'text-warning bg-warning/10',
    low:    'text-success bg-success/10',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">My Studio</h2>
          <p className="font-body-md text-body-md text-secondary mt-0.5">
            Good {getHour()}, {currentUser?.name?.split(' ')[0]}. Here is a snapshot of your active work.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {currentUser?.role !== 'staff' && (
            <button
              id="architect-new-project-btn"
              onClick={() => setShowProjectModal?.(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-body-md font-bold bg-primary text-white hover:opacity-90 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Project
            </button>
          )}
          <button
            id="architect-upload-drawing-btn"
            onClick={() => setShowDrawingModal?.(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-body-md font-medium border border-border-subtle bg-white hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Upload Drawing
          </button>
        </div>
      </div>

      {/* KPI — 4 cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="My Projects"    value={myProjectsLen}     icon="architecture"    accent="border-l-primary"     sub="created by me"    onClick={() => setTab('projects')} />
        <KpiCard label="Pending Tasks"  value={myTasksLen}        icon="assignment_late" accent="border-l-warning"     sub={overdueSub}       onClick={() => setTab('tasks')} />
        <KpiCard label="My Drawings"    value={myDrawingsLen}     icon="description"     accent="border-l-indigo-400"  sub="uploaded by me"   onClick={() => setTab('drawings')} />
        <KpiCard label="Awaiting Client" value={awaitingClientLen} icon="pending_actions" accent="border-l-success"    sub="approvals pending" onClick={() => setTab('approvals')} />
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-12 gap-6 pb-8">

        {/* My Tasks — col 5 */}
        <div className="col-span-12 lg:col-span-5">
          <SectionCard title="My Tasks" badge={myTasksLen} action={myTaskList.length > 0 ? 'All tasks' : null} onAction={() => setTab('tasks')} height="h-[420px]">
            {myTaskList.length === 0
              ? <EmptyState icon="task_alt" message="No tasks assigned to you." />
              : <div className="divide-y divide-border-subtle/60">
                  {myTaskList.slice(0, 6).map(task => {
                    const isOverdue = task.due_date && new Date(task.due_date) < now;
                    return (
                      <div key={task.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-container-low transition-colors">
                        <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#22c55e' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-body-md font-semibold text-ink-black truncate">{task.title}</p>
                          {task.project_name && (
                            <p className="text-label-sm text-secondary truncate">{task.project_name}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-label-sm font-semibold px-1.5 py-0.5 rounded capitalize ${PRIORITY_COLORS[task.priority] || 'text-secondary'}`}>
                              {task.priority}
                            </span>
                            {task.due_date && (
                              <span className={`text-label-sm ${isOverdue ? 'text-error font-semibold' : 'text-secondary'}`}>
                                {isOverdue ? '⚠ ' : ''}{formatDate(task.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </SectionCard>
        </div>

        {/* My Recent Drawings — col 4 */}
        <div className="col-span-12 lg:col-span-4">
          <SectionCard title="My Recent Drawings" action={myDrawingsList.length > 0 ? 'All drawings' : null} onAction={() => setTab('drawings')} height="h-[420px]">
            {myDrawingsList.length === 0
              ? <EmptyState icon="description" message="You haven't uploaded any drawings yet." />
              : <div className="divide-y divide-border-subtle/60">
                  {myDrawingsList.slice(0, 6).map(d => (
                    <div key={d.id} onClick={() => setTab('drawings')} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low cursor-pointer transition-colors group">
                      <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-indigo-500">description</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-md font-semibold text-ink-black truncate">{d.name}</p>
                        <p className="text-label-md text-secondary truncate">
                          {d.project_name || 'Project'} · Rev {d.current_revision || 1} · {relativeTime(d.created_at)}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </div>
                  ))}
                </div>
            }
          </SectionCard>
        </div>

        {/* Approval Responses + Activity — col 3 */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <SectionCard title="Awaiting Client" badge={awaitingClientLen} height="h-[200px]">
            {submittedPendingList.length === 0
              ? <EmptyState icon="pending_actions" message="No approvals awaiting response." />
              : <div className="divide-y divide-border-subtle/60">
                  {submittedPendingList.slice(0, 3).map(ap => (
                    <div key={ap.id} onClick={() => setTab('approvals')} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-surface-container-low transition-colors">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px] text-amber-500">hourglass_top</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-label-md font-semibold text-ink-black truncate">{ap.drawing_name}</p>
                        <p className="text-label-sm text-secondary">Rev {ap.drawing_revision} · {formatDate(ap.submitted_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </SectionCard>

          <SectionCard title="Recent Activity" height="h-[196px]">
            {enrichedActivity.length === 0
              ? <EmptyState icon="history" message="No recent activity." />
              : enrichedActivity.slice(0, 3).map((log, i) => (
                  <ActivityItem key={log.id || i} log={log} isLast={i === 2} />
                ))
            }
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function ClientDashboard({ currentUser, projects, approvals, drawings, notifications, activityLogs, dashboardStats, setTab, approveDrawing, rejectDrawing }) {
  const kpis = dashboardStats?.kpis || {};
  const clientEmail = currentUser?.email || '';

  // Projects — prefer server data (already filtered to client email)
  const myProjects = dashboardStats?.clientProjects?.length
    ? dashboardStats.clientProjects
    : projects.filter(p => p.client_email === clientEmail);

  // Pending approvals — prefer server-enriched
  const myPendingApprovals = dashboardStats?.clientApprovalsPending?.length
    ? dashboardStats.clientApprovalsPending
    : (() => {
        const drawingMap = Object.fromEntries(drawings.map(d => [d.id, d]));
        return approvals
          .filter(a => a.client_id === currentUser?.id && a.status === 'pending')
          .map(a => ({
            ...a,
            drawing_name:     drawingMap[a.drawing_id]?.name || 'Drawing',
            drawing_revision: drawingMap[a.drawing_id]?.current_revision || 1,
          }));
      })();

  // KPI values — prefer server-computed
  const myProjectsLen     = kpis.myProjects    ?? myProjects.length;
  const pendingReviewLen  = kpis.pendingReview ?? myPendingApprovals.length;
  const approvedLen       = kpis.approved      ?? approvals.filter(a => a.client_id === currentUser?.id && a.status === 'approved').length;
  const unreadUpdatesLen  = kpis.unreadUpdates ?? notifications.filter(n => !n.is_read).length;

  // Recent Updates feed — prefer server-filtered activity on client's projects
  const recentUpdates = useMemo(() => {
    if (dashboardStats?.clientRecentUpdates?.length) return dashboardStats.clientRecentUpdates;
    // Offline fallback: filter local activityLogs to projects matching this client's email
    if (activityLogs.length && projects.length) {
      const clientProjectIds = new Set(
        projects.filter(p => p.client_email === clientEmail).map(p => p.id)
      );
      const drawingProjMap = Object.fromEntries(
        (drawings || []).map(d => [d.id, d.project_id])
      );
      return activityLogs
        .filter(l => {
          const pId =
            l.entity_type === 'project' ? l.entity_id
            : l.entity_type === 'drawing' ? drawingProjMap[l.entity_id]
            : null; // tasks/site_logs/approvals need server-side join; omit in fallback
          return pId && clientProjectIds.has(pId);
        })
        .slice(0, 4)
        .map(l => ({ ...l, user_name: l.user_name || '' }));
    }
    return [];
  }, [dashboardStats, activityLogs, projects, drawings, clientEmail]);

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">My Projects</h2>
        <p className="font-body-md text-body-md text-secondary mt-0.5">
          Good {getHour()}, {currentUser?.name?.split(' ')[0]}. Here is the status of your projects.
        </p>
      </div>

      {/* KPI — 4 cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="My Projects"       value={myProjectsLen}    icon="architecture"    accent="border-l-primary"     sub="assigned to me"      onClick={() => setTab('projects')} />
        <KpiCard label="Pending My Review" value={pendingReviewLen} icon="pending_actions" accent="border-l-warning"     sub="drawings to review"  onClick={() => setTab('approvals')} />
        <KpiCard label="Approved"          value={approvedLen}      icon="check_circle"    accent="border-l-success"     sub="drawings approved"   onClick={() => setTab('approvals')} />
        <KpiCard label="Updates"           value={unreadUpdatesLen} icon="notifications"   accent="border-l-indigo-400"  sub="recent project events" onClick={() => setTab('notifications')} />
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-12 gap-6 pb-8">

        {/* Project Timeline — col 7 */}
        <div className="col-span-12 lg:col-span-7">
          <SectionCard title="Project Timeline" height="h-[480px]">
            {myProjects.length === 0
              ? <EmptyState icon="timeline" message="No projects assigned to you yet." />
              : <div className="p-5 space-y-5 overflow-y-auto">
                  {myProjects.map(proj => {
                    const c = STATUS_COLORS[proj.status] || STATUS_COLORS.planning;
                    const start  = proj.start_date ? new Date(proj.start_date).getTime() : null;
                    const end    = proj.end_date   ? new Date(proj.end_date).getTime()   : null;
                    const nowMs  = Date.now();
                    let progress = 0;
                    if (proj.status === 'completed') progress = 100;
                    else if (start && end && end > start) {
                      progress = Math.min(100, Math.max(0, Math.round(((nowMs - start) / (end - start)) * 100)));
                    }
                    return (
                      <div key={proj.id} className="premium-card rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-body-md font-bold text-ink-black">{proj.name}</p>
                            <p className="text-label-md text-secondary">{proj.client_name}</p>
                          </div>
                          <StatusPill status={proj.status} />
                        </div>
                        {/* Timeline bar */}
                        <div className="relative">
                          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.dot} transition-all duration-700`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-label-sm text-secondary">{proj.start_date ? formatDate(proj.start_date) : 'TBD'}</span>
                            <span className="text-label-sm font-bold text-secondary">{progress}%</span>
                            <span className="text-label-sm text-secondary">{proj.end_date ? formatDate(proj.end_date) : 'TBD'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </SectionCard>
        </div>

        {/* Right column: Drawings to Review + Recent Updates — col 5 */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">

          {/* Drawings Pending Review */}
          <SectionCard title="Drawings to Review" badge={pendingReviewLen} action={pendingReviewLen > 0 ? 'Go to Approvals' : null} onAction={() => setTab('approvals')} height="h-[232px]">
            {myPendingApprovals.length === 0
              ? <EmptyState icon="task_alt" message="No drawings pending your review." />
              : <div className="divide-y divide-border-subtle/60">
                  {myPendingApprovals.slice(0, 2).map(ap => (
                    <div key={ap.id} className="px-5 py-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px] text-indigo-500">description</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-body-md font-semibold text-ink-black truncate">{ap.drawing_name}</p>
                          <p className="text-label-md text-secondary">Rev {ap.drawing_revision} · {formatDate(ap.submitted_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveDrawing?.(ap.id, 'Approved by client.')}
                          className="flex-1 py-1.5 bg-success/10 text-success font-semibold text-label-md rounded-lg hover:bg-success/20 transition-colors cursor-pointer"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => {
                            const note = window.prompt('Enter your revision remarks:');
                            if (note !== null) rejectDrawing?.(ap.id, note, true);
                          }}
                          className="flex-1 py-1.5 bg-error/10 text-error font-semibold text-label-md rounded-lg hover:bg-error/20 transition-colors cursor-pointer"
                        >
                          ↩ Revise
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </SectionCard>

          {/* Recent Updates feed */}
          <SectionCard title="Recent Updates" badge={recentUpdates.length > 0 ? recentUpdates.length : null} action={recentUpdates.length > 0 ? 'Notifications' : null} onAction={() => setTab('notifications')} height="h-[224px]">
            {recentUpdates.length === 0
              ? <EmptyState icon="notifications_none" message="No recent updates on your projects." />
              : recentUpdates.slice(0, 4).map((log, i) => (
                  <ActivityItem key={log.id || i} log={log} isLast={i === Math.min(recentUpdates.length, 4) - 1} />
                ))
            }
          </SectionCard>

        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT EXPORT — role switch
// ═══════════════════════════════════════════════════════════════════════════
export default function DashboardView({
  currentUser,
  projects,
  approvals,
  tasks,
  siteLogs,
  drawings,
  users,
  notifications,
  activityLogs,
  dashboardStats,
  setTab,
  setShowProjectModal,
  setShowUserModal,
  setShowDrawingModal,
  approveDrawing,
  rejectDrawing,
  getSignedUrl,
}) {
  const role = currentUser?.role;

  if (role === 'admin') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        projects={projects}
        approvals={approvals}
        tasks={tasks}
        siteLogs={siteLogs}
        drawings={drawings}
        users={users}
        activityLogs={activityLogs}
        dashboardStats={dashboardStats}
        setTab={setTab}
        setShowProjectModal={setShowProjectModal}
        setShowUserModal={setShowUserModal}
        getSignedUrl={getSignedUrl}
      />
    );
  }

  if (role === 'architect' || role === 'staff') {
    return (
      <ArchitectDashboard
        currentUser={currentUser}
        projects={projects}
        approvals={approvals}
        tasks={tasks}
        drawings={drawings}
        users={users}
        activityLogs={activityLogs}
        dashboardStats={dashboardStats}
        setTab={setTab}
        setShowProjectModal={setShowProjectModal}
        setShowDrawingModal={setShowDrawingModal}
      />
    );
  }

  if (role === 'client') {
    return (
      <ClientDashboard
        currentUser={currentUser}
        projects={projects}
        approvals={approvals}
        drawings={drawings}
        notifications={notifications}
        activityLogs={activityLogs}
        dashboardStats={dashboardStats}
        setTab={setTab}
        approveDrawing={approveDrawing}
        rejectDrawing={rejectDrawing}
      />
    );
  }

  // Fallback — should not be reached
  return (
    <div className="flex items-center justify-center h-64 text-secondary">
      <p>Dashboard unavailable for this role.</p>
    </div>
  );
}
