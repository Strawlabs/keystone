import React, { useState } from 'react';

const FILTERS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'assigned', label: 'Assigned to Me' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'delayed', label: 'Delayed' },
];

const PRIORITY_STYLES = {
  high: 'bg-error/10 text-error border border-error/20',
  medium: 'bg-warning/10 text-warning border border-warning/20',
  low: 'bg-primary/10 text-primary border border-primary/20',
};

const STATUS_STYLES = {
  pending: 'bg-surface-container text-secondary border border-border-subtle',
  in_progress: 'bg-primary/10 text-primary border border-primary/20',
  completed: 'bg-success/10 text-success border border-success/20',
  delayed: 'bg-error/10 text-error border border-error/20',
};

const COLUMN_COLORS = {
  pending: 'bg-outline',
  in_progress: 'bg-primary',
  delayed: 'bg-error',
  completed: 'bg-success',
};

const getAvatarUrl = (userId) => {
  let hash = 0;
  if (userId) {
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
  ];
  return avatars[Math.abs(hash) % avatars.length];
};

export default function TasksView({
  taskFilter,
  setTaskFilter,
  filteredTasks,
  projects = [],
  isClient,
  isStaff,
  currentUser,
  setShowTaskModal,
  completeTask,
  updateTask,
  users = [],
}) {
  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'
  const [editingTask, setEditingTask] = useState(null);

  const canCreate = !isClient;

  const getAssigneeName = (id) => {
    const user = (users || []).find(u => u.id === id);
    return user?.name || 'Unassigned';
  };

  const getProjectName = (projectId) => {
    return projects.find(p => p.id === projectId)?.name || 'General Project';
  };

  const isOverdue = (task) => {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  };

  // Filter tasks in memory for columns
  const getTasksByStatus = (status) => {
    return filteredTasks.filter(t => t.status === status);
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-ink-black font-bold">Task Management</h2>
          <p className="text-body-md text-secondary mt-1 font-medium">
            Manage, assign, and track project tasks and design milestones across the studio.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* List vs Kanban toggle */}
          <div className="flex items-center bg-surface border border-border-subtle p-1 rounded-lg shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 flex items-center gap-2 text-label-md font-semibold rounded-md cursor-pointer transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-1.5 flex items-center gap-2 text-label-md font-semibold rounded-md cursor-pointer transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_kanban</span>
              <span>Kanban</span>
            </button>
          </div>

          {canCreate && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-container text-body-md font-bold text-white transition-all whitespace-nowrap cursor-pointer shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Assign Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => {
            const isActive = taskFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setTaskFilter(f.id)}
                className={`px-1 py-2 text-body-md font-semibold transition-all relative flex items-center gap-2 border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-primary border-primary font-bold'
                    : 'text-secondary border-transparent hover:text-primary'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto custom-scrollbar pb-6">
          <div className="flex gap-6 min-w-[1000px] h-full items-start">
            {[
              { id: 'pending', label: 'Pending' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'delayed', label: 'Delayed' },
              { id: 'completed', label: 'Completed' },
            ].map((col) => {
              const colTasks = getTasksByStatus(col.id);
              return (
                <div
                  key={col.id}
                  className="w-1/4 flex flex-col bg-surface-container-low rounded-xl p-3 border border-border-subtle min-h-[500px]"
                >
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${COLUMN_COLORS[col.id]}`}></span>
                      <span className="font-bold text-ink-black uppercase tracking-wider text-label-sm">
                        {col.label}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-container-highest rounded-full text-secondary">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                    {colTasks.map((t) => {
                      const overdue = isOverdue(t);
                      return (
                        <div
                          key={t.id}
                          onClick={() => setEditingTask(t)}
                          className="bg-surface-container-lowest p-4 rounded-lg border border-border-subtle hover:border-primary/40 transition-all cursor-pointer shadow-sm relative group"
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.low
                              }`}
                            >
                              {t.priority}
                            </span>
                            <span className="material-symbols-outlined text-secondary text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">
                              edit
                            </span>
                          </div>

                          <h4 className={`font-bold text-ink-black mb-1 text-xs leading-snug ${t.status === 'completed' ? 'line-through text-secondary' : ''}`}>
                            {t.title}
                          </h4>
                          <p className="text-[10px] text-secondary mb-3 truncate">
                            {getProjectName(t.project_id)}
                          </p>

                          <div className="flex items-center justify-between mt-4 border-t border-border-subtle pt-2.5">
                            <div className="flex items-center gap-1.5">
                              {col.id === 'completed' ? (
                                <div className="flex items-center gap-1 text-success text-[10px] font-bold">
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  <span>Done</span>
                                </div>
                              ) : overdue ? (
                                <div className="flex items-center gap-1 text-error text-[10px] font-bold">
                                  <span className="material-symbols-outlined text-[16px]">event_busy</span>
                                  <span>Overdue</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-secondary text-[10px] font-medium">
                                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                  <span>
                                    {t.due_date
                                      ? new Date(t.due_date).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                        })
                                      : '—'}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {t.status !== 'completed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    completeTask(t.id);
                                  }}
                                  className="w-6 h-6 bg-success/10 text-success rounded-full flex items-center justify-center border border-success/20 hover:bg-success hover:text-white transition-all cursor-pointer"
                                  title="Complete Task"
                                >
                                  <span className="material-symbols-outlined text-[14px]">check</span>
                                </button>
                              )}
                              <img
                                alt={getAssigneeName(t.assigned_to)}
                                className="w-6 h-6 rounded-full bg-surface-container object-cover border border-border-subtle"
                                src={getAvatarUrl(t.assigned_to)}
                                title={getAssigneeName(t.assigned_to)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="py-8 text-center text-secondary/60 text-[10px] border border-dashed border-border-subtle rounded-lg">
                        Empty column
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List Table View */}
      {viewMode === 'list' && (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-subtle text-secondary font-bold select-none">
                  <th className="px-6 py-4 uppercase tracking-wider">Task Name</th>
                  <th className="px-6 py-4 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 uppercase tracking-wider">Assigned User</th>
                  <th className="px-6 py-4 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-center">Priority</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredTasks.map((t) => {
                  const overdue = isOverdue(t);
                  return (
                    <tr key={t.id} className="hover:bg-primary/5 transition-colors cursor-pointer group" onClick={() => setEditingTask(t)}>
                      <td className="px-6 py-4">
                        <div>
                          <p className={`font-bold leading-snug text-ink-black ${t.status === 'completed' ? 'line-through text-secondary' : ''}`}>
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-[10px] text-secondary mt-0.5 line-clamp-1">{t.description}</p>
                          )}
                          {overdue && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-error">
                              <span className="material-symbols-outlined text-[14px]">error</span>
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-secondary text-body-md font-semibold">
                        {getProjectName(t.project_id)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <img
                            alt={getAssigneeName(t.assigned_to)}
                            className="w-6 h-6 rounded-full bg-surface-container object-cover border border-border-subtle shrink-0"
                            src={getAvatarUrl(t.assigned_to)}
                          />
                          <span className="text-secondary font-semibold truncate max-w-[120px]">
                            {getAssigneeName(t.assigned_to)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={overdue ? 'text-error font-bold' : 'text-secondary font-medium'}>
                          {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[9px] px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider ${PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.low}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[9px] px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider ${STATUS_STYLES[t.status] || STATUS_STYLES.pending}`}>
                          {t.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {t.status !== 'completed' && (
                            <button
                              onClick={() => completeTask(t.id)}
                              className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-success/15 border border-success/20 text-success hover:bg-success hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                              title="Mark Complete"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              Complete
                            </button>
                          )}
                          {canCreate && t.status !== 'completed' && (
                            <button
                              onClick={() => setEditingTask(t)}
                              className="p-1.5 hover:bg-primary/10 rounded text-primary transition-colors cursor-pointer"
                              title="Edit Status"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTasks.length === 0 && (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-[40px] text-secondary mb-3">assignment</span>
              <p className="text-sm font-bold text-on-surface">No tasks found</p>
              <p className="text-xs text-secondary mt-1">
                {canCreate ? 'Assign a task to get started.' : 'No tasks assigned to you yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-5 animate-scale-up text-on-surface">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <h3 className="text-body-lg font-bold text-ink-black">Edit Task Status</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <p className="text-xs font-bold text-ink-black">{editingTask.title}</p>
              <p className="text-[10px] text-secondary mt-1">Change current progress state:</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['pending', 'in_progress', 'completed', 'delayed'].map((s) => (
                <button
                  key={s}
                  onClick={async () => {
                    await updateTask?.(editingTask.id, { status: s });
                    setEditingTask(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer capitalize ${
                    editingTask.status === s
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface hover:bg-surface-container text-secondary border-border-subtle'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
