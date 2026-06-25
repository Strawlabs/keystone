import React, { useState } from 'react';

// 1. Users management panel
export function UsersView({ users = [], setShowUserModal }) {
  const roleStyle = {
    admin: 'text-primary bg-primary/5 border-primary/20',
    architect: 'text-tertiary bg-tertiary/5 border-tertiary/20',
    staff: 'text-success bg-success/5 border-success/20',
    client: 'text-secondary bg-secondary/5 border-secondary/20',
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <nav className="flex items-center gap-2 text-label-md text-secondary mb-2">
            <span>Administration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-semibold">User Directory</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight">
            User Management
          </h2>
          <p className="text-body-md text-secondary mt-1 font-medium">
            Manage team members, client contacts, organizational roles, and platform permissions.
          </p>
        </div>
        <button
          onClick={() => setShowUserModal(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-lg text-body-md font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create User
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-secondary font-bold select-none">
                <th className="px-6 py-4 uppercase tracking-wider">User Information</th>
                <th className="px-6 py-4 uppercase tracking-wider text-center">System Role</th>
                <th className="px-6 py-4 uppercase tracking-wider">Email Address</th>
                <th className="px-6 py-4 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-primary/5 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="w-9 h-9 rounded-full border border-border-subtle object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center text-xs font-bold shadow-inner">
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-ink-black text-body-md">{u.name}</p>
                        <p className="text-[10px] text-secondary font-mono mt-0.5">ID: {u.id?.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[9px] px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider ${roleStyle[u.role] || roleStyle.client}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-secondary font-semibold text-body-md">{u.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold capitalize ${u.status === 'active' ? 'text-success' : 'text-secondary'}`}>
                      <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-success' : 'bg-outline'}`} />
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="py-1 px-3 bg-surface hover:bg-surface-container border border-border-subtle rounded text-secondary font-bold text-[10px] transition-colors cursor-pointer">
                        Edit
                      </button>
                      <button className="py-1 px-3 bg-error/10 hover:bg-error border border-error/20 text-error hover:text-white rounded font-bold text-[10px] transition-colors cursor-pointer">
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="py-16 text-center text-secondary">
            <span className="material-symbols-outlined text-[40px] text-secondary mb-2">group</span>
            <p className="text-sm font-bold text-on-surface">No users registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Operations audit timeline with filters
export function ActivityView({ activityLogs = [], users = [] }) {
  const [userFilter, setUserFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const activityTypes = ['all', 'project', 'drawing', 'task', 'site_log', 'approval', 'auth'];

  const filtered = activityLogs.filter(log => {
    const matchUser = userFilter === 'all' || log.user_id === userFilter;
    const matchType = typeFilter === 'all' || log.entity_type === typeFilter;
    const matchDate = !dateFilter || new Date(log.created_at).toDateString() === new Date(dateFilter).toDateString();
    return matchUser && matchType && matchDate;
  });

  const typeColor = {
    project: 'text-primary bg-primary/10',
    drawing: 'text-tertiary bg-tertiary/10',
    task: 'text-warning bg-warning/10',
    site_log: 'text-success bg-success/10',
    approval: 'text-error bg-error/10',
    auth: 'text-secondary bg-secondary/10',
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <div>
        <nav className="flex items-center gap-2 text-label-md text-secondary mb-2">
          <span>Audit Trail</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">Activity logs</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight">
          System Activity Timeline
        </h2>
        <p className="text-body-md text-secondary mt-1 font-medium">
          Real-time audit log of all document updates, task assignments, approvals, and user logins.
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-surface-container-low border border-border-subtle rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mr-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">filter_list</span>
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Filters:</span>
        </div>

        {/* User Filter */}
        <select
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
          className="py-1.5 px-3 bg-surface-container-lowest border border-border-subtle rounded-lg text-xs text-secondary font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <option value="all">All Actors</option>
          {(users || []).map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="py-1.5 px-3 bg-surface-container-lowest border border-border-subtle rounded-lg text-xs text-secondary font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          {activityTypes.map(t => (
            <option key={t} value={t}>{t === 'all' ? 'All Activities' : t.replace('_', ' ')}</option>
          ))}
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="py-1.5 px-3 bg-surface-container-lowest border border-border-subtle rounded-lg text-xs text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        {(userFilter !== 'all' || typeFilter !== 'all' || dateFilter) && (
          <button
            onClick={() => { setUserFilter('all'); setTypeFilter('all'); setDateFilter(''); }}
            className="text-xs text-primary font-bold hover:underline cursor-pointer ml-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        {filtered.map((log) => (
          <div key={log.id} className="p-4 bg-surface-container-lowest border border-border-subtle rounded-xl flex items-start justify-between gap-4 hover:border-primary/20 transition-all shadow-sm">
            <div className="flex items-start gap-3">
              <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${typeColor[log.entity_type]?.split(' ')[0] || 'bg-outline'}`} />
              <div>
                <p className="text-xs font-bold text-ink-black leading-snug">{log.action}</p>
                <p className="text-[10px] text-secondary font-semibold mt-0.5">
                  Actor: <span className="text-on-surface">{log.user_name || 'System'}</span>
                  {log.entity_type && <span className="ml-2 uppercase tracking-wide text-[8px] px-1.5 py-0.5 rounded bg-surface-container border border-border-subtle">· {log.entity_type.replace('_', ' ')}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-secondary font-mono shrink-0">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>
                {new Date(log.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-secondary border border-dashed border-border-subtle rounded-xl bg-surface-container-low/30">
            <span className="material-symbols-outlined text-[40px] text-secondary mb-2">history_toggle_off</span>
            <p className="text-sm font-bold text-on-surface">No matching activity logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Settings preferences page
export function SettingsView({ store }) {
  const [saved, setSaved] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    approvalRequests: true,
    taskAssigned: true,
    drawingUploaded: true,
    siteLogAdded: false,
  });

  const handleSave = (e) => {
    e.preventDefault();
    store.setSuccess?.('Settings saved successfully');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface max-w-2xl">
      <div>
        <nav className="flex items-center gap-2 text-label-md text-secondary mb-2">
          <span>Preferences</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">Settings</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight">
          System Settings
        </h2>
        <p className="text-body-md text-secondary mt-1 font-medium">
          Manage corporate workspace settings, platform notifications, and date formatting styles.
        </p>
      </div>

      {/* Company Settings */}
      <div className="bg-surface-container-lowest border border-border-subtle p-6 rounded-2xl shadow-sm space-y-5">
        <h3 className="text-body-lg font-bold text-ink-black border-b border-border-subtle pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">corporate_fare</span>
          Company Workspace Settings
        </h3>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Company Name</label>
              <input
                type="text"
                defaultValue="Keystone Studio Partners"
                className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Contact Email</label>
              <input
                type="email"
                defaultValue="admin@keystone.com"
                className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Company Logo URL</label>
            <input
              type="url"
              placeholder="https://your-logo-url.com/logo.png"
              className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Office Address</label>
            <textarea
              rows={2}
              defaultValue="Level 14, Zenith Tower, Outer Ring Road, Bangalore, KA - 560103"
              className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-5 bg-primary hover:bg-primary-container rounded-lg text-xs font-bold text-white transition-colors cursor-pointer shadow-sm active:scale-95"
          >
            {saved ? '✓ Settings Saved!' : 'Save Company Details'}
          </button>
        </form>
      </div>

      {/* Preferences */}
      <div className="bg-surface-container-lowest border border-border-subtle p-6 rounded-2xl shadow-sm space-y-5">
        <h3 className="text-body-lg font-bold text-ink-black border-b border-border-subtle pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">globe</span>
          Regional Preferences
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Time Zone</label>
            <select className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-xs">
              <option>Asia/Kolkata (IST +5:30)</option>
              <option>UTC</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
              <option>Asia/Dubai</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Date Format</label>
            <select className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-xs">
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Switches */}
      <div className="bg-surface-container-lowest border border-border-subtle p-6 rounded-2xl shadow-sm space-y-5">
        <h3 className="text-body-lg font-bold text-ink-black border-b border-border-subtle pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">notifications</span>
          Email & Alert Notifications
        </h3>
        <div className="space-y-4">
          {[
            { key: 'approvalRequests', label: 'Approval requests', desc: 'Notify when client approval is requested for blueprint sheets' },
            { key: 'taskAssigned', label: 'Task updates', desc: 'Notify when tasks are assigned, completed, or delayed' },
            { key: 'drawingUploaded', label: 'Drawing uploads', desc: 'Send summary alerts when new technical design revisions are added' },
            { key: 'siteLogAdded', label: 'Field site updates', desc: 'Receive real-time progress update timeline emails' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 p-3.5 rounded-lg bg-surface border border-border-subtle hover:border-primary/20 transition-all shadow-sm">
              <div>
                <p className="font-bold text-ink-black text-xs">{label}</p>
                <p className="text-[10px] text-secondary font-medium mt-0.5">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifSettings(s => ({ ...s, [key]: !s[key] }))}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${notifSettings[key] ? 'bg-primary' : 'bg-surface-container-high'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${notifSettings[key] ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => store.setSuccess?.('Notification preferences saved')}
          className="py-2.5 px-5 bg-primary hover:bg-primary-container rounded-lg text-xs font-bold text-white transition-colors cursor-pointer shadow-sm active:scale-95"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// 4. Platform overview dashboard (Straw Labs Admin view)
export function SaaSAdminView() {
  const firms = [
    { name: 'Keystone Studio Ltd', users: 5, storage: '1.2 GB', plan: 'Standard', status: 'active', renewal: 'Jan 2027' },
    { name: 'Blueprint Co.', users: 3, storage: '0.8 GB', plan: 'Basic', status: 'active', renewal: 'Mar 2027' },
    { name: 'Apex Architects', users: 8, storage: '2.8 GB', plan: 'Enterprise', status: 'active', renewal: 'Dec 2026' },
    { name: 'Studio Nova', users: 2, storage: '0.2 GB', plan: 'Basic', status: 'suspended', renewal: 'Oct 2026' },
  ];

  const planStyle = {
    Standard: 'text-primary',
    Basic: 'text-secondary',
    Enterprise: 'text-tertiary',
  };

  const [auditData, setAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const runAudit = async () => {
    setLoadingAudit(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('keystone_token') : null;
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin/readiness', { headers });
      const data = await res.json();
      setAuditData(data);
    } catch (e) {
      console.error('Audit failed:', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <div>
        <nav className="flex items-center gap-2 text-label-md text-secondary mb-2">
          <span>Admin Portal</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">Straw Labs SaaS Dashboard</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight">
          SaaS Platform Administration
        </h2>
        <p className="text-body-md text-secondary mt-1 font-medium">
          Straw Labs system monitor: tenant space utilization, subscriber lists, and billing renewal dates.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest border border-border-subtle p-5 rounded-xl space-y-2 shadow-sm relative overflow-hidden">
          <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Active Firms</span>
          <p className="text-3xl font-black text-ink-black">4</p>
          <p className="text-[10px] text-secondary font-semibold">3 active · 1 suspended</p>
        </div>
        <div className="bg-surface-container-lowest border border-border-subtle p-5 rounded-xl space-y-2 shadow-sm relative overflow-hidden">
          <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Total Storage Used</span>
          <p className="text-3xl font-black text-ink-black">5.0 GB</p>
          <p className="text-[10px] text-secondary font-semibold">of 50 GB allocated capacity</p>
        </div>
        <div className="bg-surface-container-lowest border border-border-subtle p-5 rounded-xl space-y-2 shadow-sm relative overflow-hidden">
          <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Monthly Revenue</span>
          <p className="text-3xl font-black text-ink-black">₹72,400</p>
          <p className="text-[10px] text-success font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            +12% vs last month
          </p>
        </div>
      </div>

      {/* Production Readiness Section */}
      <div className="bg-surface-container-lowest border border-border-subtle p-6 rounded-xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h3 className="text-body-lg font-bold text-ink-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
              Keystone Production Readiness Audit
            </h3>
            <p className="text-[10px] text-secondary mt-1 font-medium">Verify system security, RLS tables, backups, SSL encryption, Resend, and DB ping latency.</p>
          </div>
          <button
            onClick={runAudit}
            disabled={loadingAudit}
            className="shrink-0 flex items-center gap-2 py-2 px-5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-60 active:scale-95"
          >
            {loadingAudit ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">sync</span>
            )}
            <span>{loadingAudit ? 'Auditing...' : 'Run Audit Check'}</span>
          </button>
        </div>

        {auditData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auditData.checks?.map((check, idx) => {
              const colors = {
                healthy: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
                warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
                error: 'bg-rose-500/10 border-rose-500/20 text-rose-600'
              };
              const icons = {
                healthy: 'check_circle',
                warning: 'warning',
                error: 'error'
              };
              const statusColor = colors[check.status] || 'bg-slate-100 border-slate-200 text-slate-600';
              const statusIcon = icons[check.status] || 'help';

              return (
                <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${statusColor}`}>
                  <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">{statusIcon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-on-surface">{check.name}</h4>
                    <p className="text-[10px] mt-1 text-secondary leading-relaxed font-semibold">{check.message}</p>
                    <span className="inline-block mt-2 text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 bg-white/50 border border-current rounded">
                      {check.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-secondary border border-dashed border-border-subtle rounded-xl bg-surface-container-low/20">
            <span className="material-symbols-outlined text-[32px] mb-1">dashboard_customize</span>
            <p className="text-xs font-bold text-secondary">Click "Run Audit Check" to validate deployment integrity checklist.</p>
          </div>
        )}
      </div>

      {/* Firm Table */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-secondary font-bold">
                <th className="px-6 py-4 uppercase tracking-wider">Workspace Firm Name</th>
                <th className="px-6 py-4 uppercase tracking-wider text-center">Active Users</th>
                <th className="px-6 py-4 uppercase tracking-wider">Storage space</th>
                <th className="px-6 py-4 uppercase tracking-wider">Subscription Tier</th>
                <th className="px-6 py-4 uppercase tracking-wider">Renewal date</th>
                <th className="px-6 py-4 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {firms.map((f, i) => (
                <tr key={i} className="hover:bg-primary/5 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-bold text-ink-black">
                    {f.name}
                    {i === 0 && (
                      <span className="ml-2 text-[9px] text-primary bg-primary/5 border border-primary/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-secondary font-semibold">{f.users}</td>
                  <td className="px-6 py-4 text-secondary font-semibold">{f.storage}</td>
                  <td className="px-6 py-4 font-bold">
                    <span className={planStyle[f.plan] || 'text-secondary'}>{f.plan} Tier</span>
                  </td>
                  <td className="px-6 py-4 text-secondary font-semibold">{f.renewal}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border capitalize ${f.status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
