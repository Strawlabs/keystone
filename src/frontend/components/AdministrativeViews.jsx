import React, { useState } from 'react';
import { Plus, Filter, Building2, Mail, MapPin, Clock, Globe, Bell } from 'lucide-react';

// 1. Users management panel
export function UsersView({ users, setShowUserModal }) {
  const roleStyle = {
    admin: 'bg-blue-950/20 text-blue-400 border-blue-900/50',
    architect: 'bg-purple-950/20 text-purple-400 border-purple-900/50',
    staff: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50',
    client: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage team members, roles and access levels.</p>
        </div>
        <button
          onClick={() => setShowUserModal(true)}
          className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 select-none">
              <th className="p-4 font-bold uppercase tracking-wider">Name</th>
              <th className="p-4 font-bold uppercase tracking-wider text-center">Role</th>
              <th className="p-4 font-bold uppercase tracking-wider">Email</th>
              <th className="p-4 font-bold uppercase tracking-wider text-center">Status</th>
              <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-850/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full border border-slate-800 object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">ID: {u.id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`text-[8px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${roleStyle[u.role] || roleStyle.client}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{u.email}</td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold capitalize ${u.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                    {u.status || 'active'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-[9px] py-1 px-2.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer font-bold">
                      Edit
                    </button>
                    <button className="text-[9px] py-1 px-2.5 rounded bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer font-bold">
                      Disable
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-600">No users yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Operations audit timeline with filters
export function ActivityView({ activityLogs, users }) {
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
    project: 'text-blue-400', drawing: 'text-purple-400', task: 'text-amber-400',
    site_log: 'text-emerald-400', approval: 'text-rose-400', auth: 'text-slate-400',
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      <div>
        <h2 className="text-xl font-extrabold text-white">Activity Timeline</h2>
        <p className="text-xs text-slate-500 mt-0.5">Complete audit trail of all platform operations.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filters:</span>
        </div>

        {/* User Filter */}
        <select
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
          className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="all">All Users</option>
          {(users || []).map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer"
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
          className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
        />

        {(userFilter !== 'all' || typeFilter !== 'all' || dateFilter) && (
          <button
            onClick={() => { setUserFilter('all'); setTypeFilter('all'); setDateFilter(''); }}
            className="text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        {filtered.map((log) => (
          <div key={log.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start justify-between gap-4 hover:border-slate-700 transition-all">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColor[log.entity_type] || 'text-slate-400'}`}
                style={{ backgroundColor: 'currentColor' }} />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white leading-snug">{log.action}</p>
                <p className="text-[10px] text-slate-500">
                  Actor: <span className="text-slate-400 font-medium">{log.user_name || 'System'}</span>
                  {log.entity_type && <span className="ml-2 capitalize text-slate-600">· {log.entity_type.replace('_', ' ')}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 shrink-0">
              <Clock className="w-3 h-3" />
              <span>{new Date(log.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <p className="text-sm font-bold text-slate-600">No activities found</p>
            <p className="text-xs text-slate-700 mt-1">Adjust your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Full Settings screen per spec Screen 21
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
    store.setSuccess('Settings saved successfully');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 max-w-2xl">
      <div>
        <h2 className="text-xl font-extrabold text-white">Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage company details and platform preferences.</p>
      </div>

      {/* Company Settings */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          Company Settings
        </h3>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
              <input
                type="text"
                defaultValue="Keystone Studio Partners"
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-200"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Contact Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="email"
                  defaultValue="admin@keystone.com"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Company Logo URL</label>
            <input
              type="url"
              placeholder="https://your-logo-url.com/logo.png"
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Office Address</label>
            <div className="mt-1 relative">
              <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
              <textarea
                rows={2}
                defaultValue="Level 14, Zenith Tower, Outer Ring Road, Bangalore, KA - 560103"
                className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-200"
              />
            </div>
          </div>

          <button
            type="submit"
            className="py-2 px-5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
          >
            {saved ? '✓ Saved!' : 'Save Company Settings'}
          </button>
        </form>
      </div>

      {/* Preferences */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          Preferences
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Time Zone</label>
            <select className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none cursor-pointer">
              <option>Asia/Kolkata (IST +5:30)</option>
              <option>UTC</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
              <option>Asia/Dubai</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date Format</label>
            <select className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none cursor-pointer">
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          Notification Settings
        </h3>
        <div className="space-y-4 text-xs">
          {[
            { key: 'approvalRequests', label: 'Approval Requests', desc: 'Notify when a drawing is submitted for approval' },
            { key: 'taskAssigned', label: 'Task Assigned', desc: 'Notify when a new task is assigned to you' },
            { key: 'drawingUploaded', label: 'Drawing Uploaded', desc: 'Notify when a new drawing is added to a project' },
            { key: 'siteLogAdded', label: 'Site Log Added', desc: 'Notify when a new site log is recorded' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-950/40 border border-slate-850">
              <div>
                <p className="font-bold text-white">{label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setNotifSettings(s => ({ ...s, [key]: !s[key] }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${notifSettings[key] ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${notifSettings[key] ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => store.setSuccess('Notification preferences saved')}
          className="py-2 px-5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// 4. Platform overview dashboard
export function SaaSAdminView() {
  const firms = [
    { name: 'Keystone Studio Ltd', users: 5, storage: '1.2 GB', plan: 'Standard', status: 'active', renewal: 'Jan 2027' },
    { name: 'Blueprint Co.', users: 3, storage: '0.8 GB', plan: 'Basic', status: 'active', renewal: 'Mar 2027' },
    { name: 'Apex Architects', users: 8, storage: '2.8 GB', plan: 'Enterprise', status: 'active', renewal: 'Dec 2026' },
    { name: 'Studio Nova', users: 2, storage: '0.2 GB', plan: 'Basic', status: 'suspended', renewal: 'Oct 2026' },
  ];

  const planStyle = {
    Standard: 'text-blue-400', Basic: 'text-slate-400', Enterprise: 'text-purple-400',
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      <div>
        <h2 className="text-xl font-extrabold text-white">SaaS Administration</h2>
        <p className="text-xs text-slate-500 mt-0.5">Straw Labs internal — tenant usage monitoring and subscription status.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Firms</span>
          <p className="text-3xl font-black text-white">4</p>
          <p className="text-[10px] text-slate-600">3 active · 1 suspended</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Storage</span>
          <p className="text-3xl font-black text-white">5.0 GB</p>
          <p className="text-[10px] text-slate-600">of 50 GB allocated</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Monthly Revenue</span>
          <p className="text-3xl font-black text-white">₹72,400</p>
          <p className="text-[10px] text-emerald-500">+12% from last month</p>
        </div>
      </div>

      {/* Firm Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
              <th className="p-4 font-bold uppercase tracking-wider">Firm Name</th>
              <th className="p-4 font-bold uppercase tracking-wider text-center">Active Users</th>
              <th className="p-4 font-bold uppercase tracking-wider">Storage Used</th>
              <th className="p-4 font-bold uppercase tracking-wider">Active Plan</th>
              <th className="p-4 font-bold uppercase tracking-wider">Renewal Date</th>
              <th className="p-4 font-bold uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {firms.map((f, i) => (
              <tr key={i} className="hover:bg-slate-850/10 transition-colors">
                <td className="p-4 font-bold text-white">{f.name}{i === 0 && <span className="ml-2 text-[8px] text-blue-400 bg-blue-950/20 border border-blue-900/40 px-1.5 py-0.5 rounded font-bold">Current</span>}</td>
                <td className="p-4 text-center text-slate-400">{f.users}</td>
                <td className="p-4 text-slate-400">{f.storage}</td>
                <td className="p-4"><span className={`font-bold ${planStyle[f.plan] || 'text-slate-400'}`}>{f.plan} Tier</span></td>
                <td className="p-4 text-slate-400">{f.renewal}</td>
                <td className="p-4 text-right">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${f.status === 'active' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' : 'bg-rose-950/20 text-rose-400 border-rose-900/40'}`}>
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
