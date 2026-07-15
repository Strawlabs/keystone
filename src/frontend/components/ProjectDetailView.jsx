import React, { useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning', styles: 'bg-warning/10 text-warning border border-warning/20' },
  { value: 'active', label: 'Active', styles: 'bg-success/10 text-success border border-success/20' },
  { value: 'on_hold', label: 'On Hold', styles: 'bg-secondary/10 text-secondary border border-secondary/20' },
  { value: 'completed', label: 'Completed', styles: 'bg-success/20 text-success border border-success/30' },
  { value: 'cancelled', label: 'Cancelled', styles: 'bg-error/10 text-error border border-error/20' }
];

export default function ProjectDetailView({
  project,
  drawings = [],
  tasks = [],
  users = [],
  projectMembers = [],
  addProjectMember,
  removeProjectMember,
  projectTimeline = [],
  updateProject,
  setTab,
  currentUser,
  setSelectedDrawingId,
  setSelectedApprovalId,
  siteLogs = [],
  approvals = [],
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, team, drawings, tasks, site-logs, approvals, timeline
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState('staff');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!project) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-outline text-[48px]">folder_open</span>
        <p className="mt-2 text-body-lg font-bold text-on-surface">Project not found</p>
        <button
          onClick={() => setTab('projects')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-container transition-all"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const isClient = currentUser?.role === 'client';
  const isStaff = currentUser?.role === 'staff';
  const canManageTeam = currentUser?.role === 'admin' || currentUser?.role === 'architect';
  const canChangeStatus = currentUser?.role === 'admin' || currentUser?.role === 'architect';

  // Stats calculations
  const projectDrawings = drawings.filter(d => d.project_id === project.id);
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = projectTasks.filter(t => t.status !== 'completed').length;
  const teamSize = projectMembers.length;

  // Days remaining calculation
  let daysRemainingText = '—';
  let daysColorClass = 'text-secondary';
  if (project.end_date) {
    const deadline = new Date(project.end_date);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (project.status === 'completed') {
      daysRemainingText = 'Completed';
      daysColorClass = 'text-success';
    } else if (diffDays < 0) {
      daysRemainingText = `${Math.abs(diffDays)} days overdue`;
      daysColorClass = 'text-error font-bold';
    } else {
      daysRemainingText = `${diffDays} days left`;
      daysColorClass = diffDays <= 7 ? 'text-warning font-bold' : 'text-primary font-bold';
    }
  }

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setIsUpdatingStatus(true);
    await updateProject?.(project.id, { status: newStatus });
    setIsUpdatingStatus(false);
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserToAdd) return;
    const success = await addProjectMember?.(project.id, selectedUserToAdd, selectedRoleForAdd);
    if (success) {
      setSelectedUserToAdd('');
      setSelectedRoleForAdd('staff');
    }
  };

  // Filter out users who are already project members
  const availableUsersToAdd = users.filter(
    u => u.status !== 'disabled' && !projectMembers.some(m => m.user_id === u.id)
  );

  const currentStatusConfig = STATUS_OPTIONS.find(o => o.value === project.status) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-6 animate-fade-in text-on-surface">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => setTab(currentUser?.role === 'staff' ? 'assigned-projects' : 'projects')}
            className="p-2 border border-border-subtle rounded-lg bg-surface hover:bg-surface-container transition-all cursor-pointer"
            title="Back to list"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2 py-0.5 bg-surface-container-high border border-border-subtle rounded text-[10px] font-bold tracking-wider text-secondary uppercase">
                {project.code}
              </span>
              <h2 className="font-headline-md text-headline-md text-ink-black">{project.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${currentStatusConfig.styles}`}>
                {project.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-body-md text-secondary mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
              {project.location || 'No location set'}
            </p>
          </div>
        </div>

        {canChangeStatus && (
          <div className="flex items-center gap-3">
            <span className="text-label-md text-secondary font-bold uppercase tracking-wider">Status:</span>
            <select
              value={project.status}
              onChange={handleStatusChange}
              disabled={isUpdatingStatus}
              className="bg-surface-container-low border border-border-subtle rounded-lg px-3 py-1.5 text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer font-semibold text-ink-black"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center border-b border-border-subtle overflow-x-auto no-scrollbar gap-8">
        {[
          { id: 'overview', label: 'Overview', icon: 'info' },
          { id: 'team', label: 'Studio Team', icon: 'group', roles: ['admin', 'architect', 'staff'] },
          { id: 'drawings', label: 'Drawings', icon: 'description' },
          { id: 'tasks', label: 'Tasks', icon: 'assignment', roles: ['admin', 'architect', 'staff', 'client'] },
          { id: 'site-logs', label: 'Site Logs', icon: 'photo_camera', roles: ['admin', 'architect', 'staff'] },
          { id: 'approvals', label: 'Approvals', icon: 'approval', roles: ['admin', 'architect', 'client'] },
          { id: 'timeline', label: 'Activity', icon: 'history' },
        ].map(tab => {
          if (tab.roles && !tab.roles.includes(currentUser?.role)) return null;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-1 py-3 text-body-md font-semibold transition-all relative flex items-center gap-2 border-b-2 cursor-pointer ${
                isActive
                  ? 'text-primary border-primary font-bold'
                  : 'text-secondary border-transparent hover:text-primary'
              }`}
            >
              {tab.icon && (
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle Columns: Details & Description */}
            <div className="lg:col-span-2 space-y-6">
              {/* KPI Mini-Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Drawings</p>
                  <h4 className="text-headline-md font-bold text-ink-black mt-2">{projectDrawings.length}</h4>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Pending Tasks</p>
                  <h4 className="text-headline-md font-bold text-ink-black mt-2">{pendingTasks}</h4>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Team Size</p>
                  <h4 className="text-headline-md font-bold text-ink-black mt-2">{teamSize}</h4>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Timeline</p>
                  <h4 className={`text-body-md mt-3 ${daysColorClass}`}>{daysRemainingText}</h4>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm space-y-3">
                <h3 className="font-bold text-ink-black text-body-lg">Project Description</h3>
                <p className="text-body-md text-secondary leading-relaxed whitespace-pre-line">
                  {project.description || 'No description provided for this project.'}
                </p>
              </div>

              {/* Client Info Card */}
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm space-y-4">
                <h3 className="font-bold text-ink-black text-body-lg">Client Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Client Name</label>
                    <p className="text-body-md font-semibold text-ink-black mt-1">{project.client_name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Client Email</label>
                    <p className="text-body-md font-semibold text-ink-black mt-1">
                      {project.client_email ? (
                        <a href={`mailto:${project.client_email}`} className="text-primary hover:underline">
                          {project.client_email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sidebar Stats & Information */}
            <div className="space-y-6">
              {/* Timing Metadata Card */}
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm space-y-4">
                <h3 className="font-bold text-ink-black text-body-lg">Schedule Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-body-md border-b border-border-subtle/50 pb-2">
                    <span className="text-secondary font-medium">Start Date</span>
                    <span className="font-semibold text-ink-black">
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-body-md">
                    <span className="text-secondary font-medium">Target Completion</span>
                    <span className="font-semibold text-ink-black">
                      {project.end_date
                        ? new Date(project.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Tracker Card */}
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm space-y-4">
                <h3 className="font-bold text-ink-black text-body-lg">Task Completion Progress</h3>
                <div>
                  <div className="flex justify-between text-label-sm mb-1.5 font-bold">
                    <span className="text-secondary">Progress</span>
                    <span className="text-primary">
                      {projectTasks.length > 0
                        ? `${Math.round((completedTasks / projectTasks.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0
                        }%`
                      }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-secondary mt-2 font-medium">
                    {completedTasks} of {projectTasks.length} tasks completed
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeSubTab === 'team' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Team List Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-surface-container-lowest rounded-xl border border-border-subtle overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-border-subtle">
                      <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">System Role</th>
                      <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Project Role</th>
                      {canManageTeam && (
                        <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {projectMembers.map(member => (
                      <tr key={member.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              alt={member.users?.name || 'User'}
                              src={
                                member.users?.avatar_url ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                              }
                              className="w-8 h-8 rounded-full object-cover border border-border-subtle"
                            />
                            <div>
                              <p className="font-body-md font-bold text-ink-black">{member.users?.name || 'Invite Pending'}</p>
                              <p className="text-label-sm text-secondary">{member.users?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-bold text-secondary uppercase tracking-wider">
                            {member.users?.role || 'staff'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-primary/10 text-primary border-primary/20">
                            {member.role}
                          </span>
                        </td>
                        {canManageTeam && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => removeProjectMember?.(project.id, member.user_id)}
                              className="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors cursor-pointer"
                              title="Remove from project"
                            >
                              <span className="material-symbols-outlined text-[18px]">group_remove</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {projectMembers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-secondary">
                          No specific members assigned yet. All tenant members can access this project.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Member Column */}
            {canManageTeam && (
              <div>
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-ink-black text-body-lg">Assign Team Member</h3>
                    <p className="text-label-sm text-secondary mt-0.5">Assign studio staff or client contacts to this project</p>
                  </div>

                  <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Select User</label>
                      <select
                        value={selectedUserToAdd}
                        onChange={e => setSelectedUserToAdd(e.target.value)}
                        required
                        className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                      >
                        <option value="">Select a user...</option>
                        {availableUsersToAdd.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Project Assignment Role</label>
                      <select
                        value={selectedRoleForAdd}
                        onChange={e => setSelectedRoleForAdd(e.target.value)}
                        className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                      >
                        <option value="staff">Staff / Contributor</option>
                        <option value="architect">Architect in Charge</option>
                        <option value="client">Client Approver</option>
                        <option value="admin">Project Director (Admin)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedUserToAdd}
                      className="w-full bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-primary-container disabled:opacity-40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">group_add</span>
                      Assign User
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DRAWINGS TAB */}
        {activeSubTab === 'drawings' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-ink-black text-body-lg">Project Blueprints & Drawings</h3>
              {!isClient && (
                <button
                  onClick={() => setTab('drawings')}
                  className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  Upload Drawing
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {projectDrawings.map(d => (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDrawingId(d.id);
                    setTab('blueprint-review');
                  }}
                  className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer group transition-all"
                >
                  <div className="aspect-[4/3] bg-surface-container-high relative overflow-hidden flex items-center justify-center">
                    {d.file_url?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <img src={d.file_url} alt={d.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[48px] text-secondary">
                        architecture
                      </span>
                    )}
                    <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      Rev {d.current_revision}
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {d.category?.replace('_', ' ')}
                    </p>
                    <h4 className="font-bold text-ink-black truncate group-hover:text-primary transition-colors">
                      {d.name}
                    </h4>
                    <p className="text-label-sm text-secondary truncate">#{d.drawing_number || '—'}</p>
                  </div>
                </div>
              ))}
              {projectDrawings.length === 0 && (
                <div className="col-span-full py-16 text-center text-secondary border border-dashed border-border-subtle rounded-xl bg-surface-container-lowest">
                  <span className="material-symbols-outlined text-[40px] text-outline">description</span>
                  <p className="text-body-md font-bold mt-2">No drawings uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeSubTab === 'tasks' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-ink-black text-body-lg">Project Tasks</h3>
              <button
                onClick={() => setTab('tasks')}
                className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_task</span>
                Create Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* To Do / In Progress / Completed Lanes */}
              {['pending', 'in_progress', 'completed'].map(statusKey => {
                const laneTasks = projectTasks.filter(
                  t =>
                    t.status === statusKey ||
                    (statusKey === 'pending' && t.status === 'delayed')
                );
                const titleMap = {
                  pending: 'Pending / Delayed',
                  in_progress: 'In Progress',
                  completed: 'Completed'
                };
                const colorMap = {
                  pending: 'border-t-4 border-t-warning bg-surface-container-low',
                  in_progress: 'border-t-4 border-t-primary bg-surface-container-low',
                  completed: 'border-t-4 border-t-success bg-surface-container-low'
                };

                return (
                  <div key={statusKey} className={`p-4 rounded-xl shadow-sm space-y-4 ${colorMap[statusKey]}`}>
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-ink-black text-body-md">{titleMap[statusKey]}</h4>
                      <span className="px-2 py-0.5 bg-surface-container-high rounded text-xs font-bold text-secondary">
                        {laneTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {laneTasks.map(t => (
                        <div
                          key={t.id}
                          className="bg-surface-container-lowest p-4 rounded-lg border border-border-subtle shadow-sm space-y-2 hover:border-primary/20 transition-all"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="font-bold text-ink-black text-body-sm leading-snug">{t.title}</h5>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${
                                t.priority === 'high'
                                  ? 'bg-error/10 text-error'
                                  : t.priority === 'medium'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-secondary/10 text-secondary'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-label-sm text-secondary line-clamp-2">{t.description}</p>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-border-subtle/50 text-[10px] text-secondary font-medium">
                            <span className="flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">event</span>
                              {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date'}
                            </span>
                            <span className="bg-surface-container-high px-1.5 py-0.5 rounded uppercase">
                              {users.find(u => u.id === t.assigned_to)?.name || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {laneTasks.length === 0 && (
                        <p className="text-center text-label-sm text-secondary py-8 bg-surface-container-lowest/50 border border-dashed border-border-subtle rounded-lg">
                          No tasks in this lane
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SITE LOGS TAB */}
        {activeSubTab === 'site-logs' && (() => {
          const projectSiteLogs = siteLogs.filter(l => l.project_id === project.id);
          return (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-ink-black text-body-lg">Site Visit Logs</h3>
                <button
                  onClick={() => setTab('site-logs')}
                  className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Record Site Log
                </button>
              </div>
              {projectSiteLogs.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-border-subtle rounded-xl bg-surface-container-lowest">
                  <span className="material-symbols-outlined text-[40px] text-outline">photo_camera</span>
                  <p className="text-body-md font-bold mt-2 text-on-surface">No site logs recorded yet</p>
                  <p className="text-label-sm text-secondary mt-1">Record your first site visit to track progress on the ground.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectSiteLogs.map(log => {
                    const logUser = users.find(u => u.id === log.created_by);
                    const logDate = new Date(log.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    });
                    const statusColorMap = {
                      active: 'bg-success/10 text-success border-success/20',
                      paused: 'bg-warning/10 text-warning border-warning/20',
                      inspection: 'bg-primary/10 text-primary border-primary/20',
                      completed: 'bg-secondary/10 text-secondary border-secondary/20',
                    };
                    return (
                      <div key={log.id} className="bg-surface-container-lowest p-5 rounded-xl border border-border-subtle shadow-sm space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {log.site_status && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusColorMap[log.site_status] || 'bg-secondary/10 text-secondary border-secondary/20'}`}>
                                  {log.site_status.replace('_', ' ')}
                                </span>
                              )}
                              <span className="text-label-sm text-secondary font-medium">{logDate}</span>
                            </div>
                            <p className="text-body-md text-on-surface leading-relaxed whitespace-pre-line">{log.notes}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-ink-black">{logUser?.name || 'Unknown'}</p>
                              <p className="text-[10px] text-secondary capitalize">{logUser?.role}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* APPROVALS TAB */}
        {activeSubTab === 'approvals' && (() => {
          const projectDrawingIds = new Set(drawings.filter(d => d.project_id === project.id).map(d => d.id));
          const projectApprovals = approvals.filter(a => projectDrawingIds.has(a.drawing_id));
          const pending = projectApprovals.filter(a => a.status === 'pending');
          const resolved = projectApprovals.filter(a => a.status !== 'pending');

          const approvalStatusStyles = {
            pending: 'bg-warning/10 text-warning border-warning/20',
            approved: 'bg-success/10 text-success border-success/20',
            rejected: 'bg-error/10 text-error border-error/20',
            revision_requested: 'bg-primary/10 text-primary border-primary/20',
          };
          const approvalStatusLabel = {
            pending: 'Awaiting Review',
            approved: 'Approved',
            rejected: 'Rejected',
            revision_requested: 'Revision Requested',
          };

          const renderApprovalCard = (a) => {
            const drawing = drawings.find(d => d.id === a.drawing_id);
            const client = users.find(u => u.id === a.client_id);
            const submitter = users.find(u => u.id === a.submitted_by);
            const submittedDate = new Date(a.submitted_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            });
            const isOverdue = a.due_date && new Date(a.due_date) < new Date() && a.status === 'pending';

            return (
              <div key={a.id} className="bg-surface-container-lowest p-5 rounded-xl border border-border-subtle shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${approvalStatusStyles[a.status] || approvalStatusStyles.pending}`}>
                        {approvalStatusLabel[a.status] || a.status}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error text-white uppercase tracking-wider animate-pulse">
                          Overdue
                        </span>
                      )}
                      <span className="text-label-sm text-secondary">Submitted {submittedDate}</span>
                    </div>
                    <p className="font-bold text-ink-black text-body-md">{drawing?.name || 'Drawing'}</p>
                    <p className="text-label-sm text-secondary">
                      #{drawing?.drawing_number || '—'} · {drawing?.category?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedDrawingId(a.drawing_id);
                        setTab('blueprint-review');
                      }}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      View Drawing
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApprovalId?.(a.id);
                        setTab('approvals');
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">history</span>
                      Audit Trail & Details
                    </button>
                  </div>
                </div>

                {a.submission_notes && (
                  <div className="bg-surface-container-low p-3 rounded-lg border border-border-subtle text-[11px] text-secondary italic leading-relaxed">
                    <span className="font-bold not-italic text-primary block mb-0.5">Architect Notes: </span>"{a.submission_notes}"
                  </div>
                )}

                {a.comments && a.comments !== a.submission_notes && (
                  <div className="bg-surface-container-low p-3 rounded-lg border border-border-subtle text-[11px] text-secondary italic leading-relaxed">
                    <span className="font-bold not-italic text-ink-black block mb-0.5">Reviewer comment: </span>"{a.comments}"
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-border-subtle/50 text-[10px] text-secondary flex-wrap">
                  <span>Client: <span className="font-bold text-ink-black">{client?.name || '—'}</span></span>
                  <span>Submitted by: <span className="font-bold text-ink-black">{submitter?.name || '—'}</span></span>
                  {a.due_date && (
                    <span className={isOverdue ? 'text-error font-bold' : ''}>
                      Due Date: <span className="font-bold text-ink-black">{new Date(a.due_date).toLocaleDateString()}</span>
                    </span>
                  )}
                  {a.responded_at && (
                    <span>Responded: <span className="font-bold text-ink-black">{new Date(a.responded_at).toLocaleDateString()}</span></span>
                  )}
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-6 animate-fade-in">
              {/* Pending */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink-black text-body-lg">Pending Review</h3>
                  {pending.length > 0 && (
                    <span className="px-2 py-0.5 bg-warning/10 text-warning text-[10px] font-bold rounded-full border border-warning/20">{pending.length}</span>
                  )}
                </div>
                {pending.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border-subtle rounded-xl bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-[32px] text-outline">check_circle</span>
                    <p className="text-body-sm font-bold mt-1 text-secondary">No pending approvals</p>
                  </div>
                ) : (
                  pending.map(renderApprovalCard)
                )}
              </div>
              {/* Resolved */}
              {resolved.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-ink-black text-body-lg">Resolved</h3>
                  {resolved.map(renderApprovalCard)}
                </div>
              )}
              {projectApprovals.length === 0 && (
                <div className="py-16 text-center border border-dashed border-border-subtle rounded-xl bg-surface-container-lowest">
                  <span className="material-symbols-outlined text-[40px] text-outline">approval</span>
                  <p className="text-body-md font-bold mt-2 text-on-surface">No approval requests yet</p>
                  <p className="text-label-sm text-secondary mt-1">Submit a drawing for client approval from the Drawings section.</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* TIMELINE TAB */}
        {activeSubTab === 'timeline' && (
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm animate-fade-in space-y-6">
            <h3 className="font-bold text-ink-black text-body-lg">Project Activity History</h3>

            <div className="relative border-l-2 border-border-subtle ml-4 pl-6 space-y-6">
              {projectTimeline.map(log => {
                const date = new Date(log.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const userObject = users.find(u => u.id === log.user_id);

                return (
                  <div key={log.id} className="relative">
                    {/* Circle icon marker */}
                    <span className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest shadow-sm"></span>

                    <div className="space-y-1">
                      <p className="text-body-md font-semibold text-ink-black">
                        {log.action}
                      </p>
                      <p className="text-label-sm text-secondary">
                        by {userObject ? `${userObject.name} (${userObject.role})` : 'System'} • {date}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="bg-surface-container-low p-2.5 rounded-lg border border-border-subtle text-[11px] text-secondary mt-1.5 font-medium max-w-lg leading-relaxed">
                          {log.metadata.projectName && <div>Project: {log.metadata.projectName}</div>}
                          {log.metadata.oldStatus && (
                            <div>
                              Status transition: {log.metadata.oldStatus} &rarr; {log.metadata.newStatus}
                            </div>
                          )}
                          {log.metadata.addedUserName && (
                            <div>Assigned Team Member: {log.metadata.addedUserName} ({log.metadata.addedUserRole})</div>
                          )}
                          {log.metadata.removedUserName && (
                            <div>Removed Team Member: {log.metadata.removedUserName}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {projectTimeline.length === 0 && (
                <div className="text-center py-12 text-secondary relative -ml-6">
                  <span className="material-symbols-outlined text-[40px] text-outline">history</span>
                  <p className="text-body-md font-bold mt-2">No activity recorded for this project yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
