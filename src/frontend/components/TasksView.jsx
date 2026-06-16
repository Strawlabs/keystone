import React, { useState } from 'react';
import { Plus, Check, Clock, AlertTriangle, User, Calendar, Edit2 } from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'assigned', label: 'Assigned to Me' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'delayed', label: 'Delayed' },
];

const priorityStyle = {
  high: 'bg-rose-950/20 text-rose-400 border-rose-900/40',
  medium: 'bg-amber-950/20 text-amber-400 border-amber-900/40',
  low: 'bg-blue-950/20 text-blue-400 border-blue-900/40',
};

const statusStyle = {
  pending: 'bg-slate-800 text-slate-400 border-slate-700',
  in_progress: 'bg-blue-950/20 text-blue-400 border-blue-900/40',
  completed: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40',
  delayed: 'bg-rose-950/20 text-rose-400 border-rose-900/40',
};

export default function TasksView({
  taskFilter,
  setTaskFilter,
  filteredTasks,
  isClient,
  isStaff,
  currentUser,
  setShowTaskModal,
  completeTask,
  updateTask,
  users,
}) {
  const [editingTask, setEditingTask] = useState(null);

  const canCreate = !isClient;

  const getAssigneeName = (id) => {
    const user = (users || []).find(u => u.id === id);
    return user?.name || 'Unassigned';
  };

  const isOverdue = (task) => {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Task Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track and manage project tasks across your team.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all whitespace-nowrap cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Assign Task
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
        {FILTERS.map((f) => {
          const isActive = taskFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setTaskFilter(f.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Tasks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 select-none">
              <th className="p-4 font-bold uppercase tracking-wider">Task Name</th>
              <th className="p-4 font-bold uppercase tracking-wider">Assigned User</th>
              <th className="p-4 font-bold uppercase tracking-wider">Due Date</th>
              <th className="p-4 font-bold uppercase tracking-wider text-center">Priority</th>
              <th className="p-4 font-bold uppercase tracking-wider text-center">Status</th>
              <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filteredTasks.map((t) => {
              const overdue = isOverdue(t);
              return (
                <tr key={t.id} className="hover:bg-slate-850/20 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className={`font-bold leading-snug ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                      )}
                      {overdue && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-rose-400">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Overdue
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-slate-300 truncate max-w-[100px]">{getAssigneeName(t.assigned_to)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      <span className={overdue ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[8px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${priorityStyle[t.priority] || priorityStyle.low}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[8px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${statusStyle[t.status] || statusStyle.pending}`}>
                      {t.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {t.status !== 'completed' && (
                        <button
                          onClick={() => completeTask(t.id)}
                          className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-600 hover:text-white text-[9px] font-bold transition-all cursor-pointer"
                          title="Mark Complete"
                        >
                          <Check className="w-3 h-3" />
                          Complete
                        </button>
                      )}
                      {canCreate && t.status !== 'completed' && (
                        <button
                          onClick={() => setEditingTask(t)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTasks.length === 0 && (
          <div className="py-16 text-center">
            <Clock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No tasks found</p>
            <p className="text-xs text-slate-700 mt-1">
              {canCreate ? 'Assign a task to get started.' : 'No tasks assigned to you yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white">Edit Task Status</h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div>
              <p className="text-xs font-bold text-white">{editingTask.title}</p>
              <p className="text-[10px] text-slate-500 mt-1">Update status:</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['pending', 'in_progress', 'completed', 'delayed'].map(s => (
                <button
                  key={s}
                  onClick={async () => {
                    await updateTask?.(editingTask.id, { status: s });
                    setEditingTask(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer capitalize ${
                    editingTask.status === s
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
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
