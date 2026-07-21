import React, { useState } from 'react';
import { useStore } from '@/frontend/store/store';

// 1. Users management panel
export function UsersView({ users = [], setShowUserModal }) {
  const { updateUserById, disableUser } = useStore();
  const [editingUser, setEditingUser] = useState(null); // { id, name, role }
  const [confirmDisableUser, setConfirmDisableUser] = useState(null); // user to disable
  const [editForm, setEditForm] = useState({ name: '', role: '' });
  const [saving, setSaving] = useState(false);

  const ROLES = ['admin', 'architect', 'staff', 'client'];

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({ name: u.name, role: u.role });
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    await updateUserById(editingUser.id, editForm);
    setSaving(false);
    setEditingUser(null);
  };

  const roleStyle = {
    admin: 'text-primary bg-primary/5 border-primary/20',
    architect: 'text-tertiary bg-tertiary/5 border-tertiary/20',
    staff: 'text-success bg-success/5 border-success/20',
    client: 'text-secondary bg-secondary/5 border-secondary/20',
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-ink-black text-body-lg">Edit User</h3>
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Role</label>
              <select
                value={editForm.role}
                onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs cursor-pointer"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="flex-1 py-2 bg-primary text-white font-bold text-xs rounded-lg hover:opacity-90 transition-all disabled:opacity-60 cursor-pointer animate-press"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 border border-border-subtle text-secondary font-bold text-xs rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Confirmation Modal */}
      {confirmDisableUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2.5 text-error">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="font-bold text-ink-black text-body-lg">Disable Account?</h3>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Are you sure you want to disable <strong>{confirmDisableUser.name}</strong> ({confirmDisableUser.email})?
              They will lose access to this workspace immediately.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={async () => {
                  setSaving(true);
                  await disableUser(confirmDisableUser.id);
                  setSaving(false);
                  setConfirmDisableUser(null);
                }}
                disabled={saving}
                className="flex-1 py-2 bg-error text-white font-bold text-xs rounded-lg hover:opacity-90 transition-all disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Disabling…' : 'Disable User'}
              </button>
              <button
                onClick={() => setConfirmDisableUser(null)}
                className="flex-1 py-2 border border-border-subtle text-secondary font-bold text-xs rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                <tr key={u.id} className="hover:bg-primary/5 transition-colors group">
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
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold capitalize ${u.status === 'disabled' ? 'text-error' : 'text-success'}`}>
                      <span className={`w-2 h-2 rounded-full ${u.status === 'disabled' ? 'bg-error' : 'bg-success'}`} />
                      {u.status === 'disabled' ? 'Disabled' : (u.status || 'Active')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="py-1 px-3 bg-surface hover:bg-surface-container border border-border-subtle rounded text-secondary font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      {u.status !== 'disabled' ? (
                        <button
                          onClick={() => setConfirmDisableUser(u)}
                          className="py-1 px-3 bg-error/10 hover:bg-error border border-error/20 text-error hover:text-white rounded font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserById(u.id, { status: 'active' })}
                          className="py-1 px-3 bg-success/10 hover:bg-success border border-success/20 text-success hover:text-white rounded font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          Enable
                        </button>
                      )}
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
// 2. Operations audit timeline with filters
export function ActivityView({ activityLogs = [], users = [] }) {
  const [userFilter, setUserFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activityTypes = ['all', 'project', 'drawing', 'task', 'site_log', 'approval', 'auth'];

  const getLocalDateStr = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const filtered = activityLogs.filter(log => {
    const matchUser = userFilter === 'all' || log.user_id === userFilter;
    const matchType = typeFilter === 'all' || log.entity_type === typeFilter;
    const matchDate = !dateFilter || 
      (log.created_at && log.created_at.slice(0, 10) === dateFilter) || 
      getLocalDateStr(log.created_at) === dateFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      (log.action?.toLowerCase().includes(q)) ||
      (log.user_name?.toLowerCase().includes(q)) ||
      (log.metadata?.projectName?.toLowerCase().includes(q)) ||
      (log.metadata?.drawingName?.toLowerCase().includes(q)) ||
      (log.metadata?.taskTitle?.toLowerCase().includes(q)) ||
      (log.metadata?.comments?.toLowerCase().includes(q));
    return matchUser && matchType && matchDate && matchSearch;
  });

  const typeColor = {
    project: 'text-primary bg-primary/10 border-primary/20',
    drawing: 'text-tertiary bg-tertiary/10 border-tertiary/20',
    task: 'text-warning bg-warning/10 border-warning/20',
    site_log: 'text-success bg-success/10 border-success/20',
    approval: 'text-error bg-error/10 border-error/20',
    auth: 'text-secondary bg-secondary/10 border-secondary/20',
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-border-subtle text-xs font-bold text-secondary">
          <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
          <span>{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} found</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-surface-container-low border border-border-subtle rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mr-1">
          <span className="material-symbols-outlined text-secondary text-[20px]">filter_list</span>
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Filters:</span>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-secondary">search</span>
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-surface-container-lowest border border-border-subtle rounded-lg text-xs font-medium text-ink-black placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
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

        {(userFilter !== 'all' || typeFilter !== 'all' || dateFilter || searchQuery) && (
          <button
            onClick={() => { setUserFilter('all'); setTypeFilter('all'); setDateFilter(''); setSearchQuery(''); }}
            className="text-xs text-primary font-bold hover:underline cursor-pointer ml-auto sm:ml-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        {filtered.map((log) => {
          const m = log.metadata || {};
          const hasMeta = m.projectName || m.drawingName || m.taskTitle || m.comments || m.oldStatus || m.newStatus || m.revisionNumber || m.photoCount;
          return (
            <div key={log.id} className="p-4 bg-surface-container-lowest border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-primary/20 transition-all shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${typeColor[log.entity_type] || 'bg-surface-container border-border-subtle text-secondary'}`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {log.entity_type === 'project' ? 'folder' :
                     log.entity_type === 'drawing' ? 'draw' :
                     log.entity_type === 'task' ? 'task_alt' :
                     log.entity_type === 'site_log' ? 'domain' :
                     log.entity_type === 'approval' ? 'verified' : 'badge'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-ink-black leading-snug">{log.action}</p>
                    {log.entity_type && (
                      <span className="uppercase tracking-wider text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-surface-container border border-border-subtle text-secondary">
                        {log.entity_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <span className="font-semibold text-on-surface">Actor: {log.user_name || 'System'}</span>
                    {log.user_role && <span className="text-[10px] uppercase font-bold text-secondary/80">({log.user_role})</span>}
                  </div>
                  {hasMeta && (
                    <div className="mt-2 text-xs bg-surface-container-low/70 border border-border-subtle/60 rounded-lg p-2.5 space-y-1 text-secondary">
                      {m.projectName && <div className="font-semibold text-ink-black">Project: <span className="font-normal text-secondary">{m.projectName}</span></div>}
                      {m.drawingName && <div className="font-semibold text-ink-black">Drawing: <span className="font-normal text-secondary">{m.drawingName} {m.revisionNumber ? `(Rev ${m.revisionNumber})` : ''}</span></div>}
                      {m.taskTitle && <div className="font-semibold text-ink-black">Task: <span className="font-normal text-secondary">{m.taskTitle}</span></div>}
                      {m.oldStatus && m.newStatus && <div>Status changed from <span className="font-medium text-ink-black">{m.oldStatus}</span> to <span className="font-medium text-ink-black">{m.newStatus}</span></div>}
                      {m.photoCount !== undefined && <div>Photos attached: <span className="font-medium text-ink-black">{m.photoCount}</span></div>}
                      {m.comments && <div className="italic text-on-surface">"{m.comments}"</div>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-secondary font-mono shrink-0 sm:self-start bg-surface-container-low px-2.5 py-1 rounded-md border border-border-subtle/50">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
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
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-secondary border border-dashed border-border-subtle rounded-xl bg-surface-container-low/30">
            <span className="material-symbols-outlined text-[40px] text-secondary mb-2">history_toggle_off</span>
            <p className="text-sm font-bold text-on-surface">No matching activity logs found</p>
            <p className="text-xs text-secondary mt-1">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
// 3. Settings preferences page
export function SettingsView({ store }) {
  const { updateCompanySettings, currentTenant } = store;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    logo_url: '',
    contact_email: '',
    address: '',
  });

  // Sync form inputs once currentTenant is loaded asynchronously
  React.useEffect(() => {
    if (currentTenant) {
      setForm({
        name: currentTenant.name || '',
        logo_url: currentTenant.logo_url || '',
        contact_email: currentTenant.company_email || '',
        address: currentTenant.company_address || '',
      });
    }
  }, [currentTenant]);
  const [notifSettings, setNotifSettings] = useState({
    approvalRequests: true,
    taskAssigned: true,
    drawingUploaded: true,
    siteLogAdded: false,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {};
    if (form.name.trim()) payload.name = form.name.trim();
    if (form.logo_url.trim()) payload.logo_url = form.logo_url.trim();
    if (form.contact_email.trim()) payload.contact_email = form.contact_email.trim();
    if (form.address.trim()) payload.address = form.address.trim();
    if (Object.keys(payload).length > 0) {
      await updateCompanySettings(payload);
    } else {
      store.setSuccess?.('No changes to save.');
    }
    setSaving(false);
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
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your company name"
                className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Contact Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                placeholder="admin@yourcompany.com"
                className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Company Logo URL</label>
            <input
              type="url"
              value={form.logo_url}
              onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
              placeholder="https://your-logo-url.com/logo.png"
              className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
            />
            {form.logo_url && (
              <img src={form.logo_url} alt="Logo preview" className="mt-2 h-10 rounded border border-border-subtle object-contain" onError={e => e.target.style.display='none'} />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Office Address</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Your office address"
              className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle/80">
            <span className="text-[11px] text-secondary font-medium">Changes apply immediately across all team member views.</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ name: currentTenant?.name || '', logo_url: currentTenant?.logo_url || '', address: currentTenant?.address || '', contact_email: currentTenant?.contact_email || '' })}
                className="py-2 px-4 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-semibold text-secondary transition-all cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="py-2 px-5 bg-primary hover:bg-primary-container rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-elevated btn-interactive disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
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
          Email &amp; Alert Notifications
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
