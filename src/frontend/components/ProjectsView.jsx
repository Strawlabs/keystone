import React, { useState } from 'react';
import { Search, Plus, Calendar, MapPin, User, Archive, Edit2, Eye, Folder } from 'lucide-react';

const STATUS_STYLES = {
  active: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50',
  planning: 'bg-blue-950/20 text-blue-400 border-blue-900/50',
  completed: 'bg-slate-800 text-slate-400 border-slate-700',
  on_hold: 'bg-amber-950/20 text-amber-400 border-amber-900/50',
  cancelled: 'bg-rose-950/20 text-rose-400 border-rose-900/50',
};

export default function ProjectsView({
  projectSearch,
  setProjectSearch,
  projectStatusFilter,
  setProjectStatusFilter,
  filteredProjects,
  isClient,
  isStaff,
  setShowProjectModal,
  updateProject,
  deleteProject,
  isAssignedView,
}) {
  const [archivingId, setArchivingId] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({});

  const canCreate = !isClient && !isStaff;
  const canEdit = !isClient && !isStaff;

  const handleArchive = async (id) => {
    if (!confirm('Archive this project? It will be marked as completed.')) return;
    setArchivingId(id);
    await updateProject?.(id, { status: 'completed' });
    setArchivingId(null);
  };

  const handleEditOpen = (p) => {
    setEditingProject(p);
    setEditForm({ name: p.name, status: p.status, description: p.description || '', client_name: p.client_name });
  };

  const handleEditSave = async () => {
    await updateProject?.(editingProject.id, editForm);
    setEditingProject(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            {isAssignedView ? 'Assigned Projects' : 'Projects'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAssignedView ? 'Projects you are actively working on.' : 'Manage all client projects in your practice.'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative rounded-lg shadow-sm w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            placeholder="Search by name, client..."
          />
        </div>
        <select
          value={projectStatusFilter}
          onChange={(e) => setProjectStatusFilter(e.target.value)}
          className="py-2 px-3 border border-slate-800 rounded-lg text-xs bg-slate-900 text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-[10px] text-slate-600">{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 hover:-translate-y-0.5 transition-all"
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">{p.code}</span>
                <h3 className="text-sm font-extrabold text-white mt-0.5 leading-snug truncate">{p.name}</h3>
              </div>
              <span className={`text-[8px] px-2 py-0.5 font-bold uppercase rounded border shrink-0 ${STATUS_STYLES[p.status] || STATUS_STYLES.planning}`}>
                {p.status?.replace('_', ' ')}
              </span>
            </div>

            {/* Description */}
            {p.description && (
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
            )}

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-y-2.5 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="truncate">{p.client_name || '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="truncate">{p.location || '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                <span>{p.start_date ? new Date(p.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                <span>{p.end_date ? new Date(p.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              {/* View button */}
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>

              {canEdit && (
                <>
                  <button
                    onClick={() => handleEditOpen(p)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchive(p.id)}
                    disabled={archivingId === p.id || p.status === 'completed'}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/30 hover:text-amber-400 text-slate-400 transition-colors cursor-pointer disabled:opacity-40"
                    title="Archive / Mark Complete"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20 flex flex-col items-center gap-3">
            <Folder className="w-10 h-10 text-slate-700" />
            <div>
              <p className="text-sm font-bold text-slate-600">No projects found</p>
              <p className="text-xs text-slate-700 mt-1">
                {canCreate ? 'Create your first project to get started.' : 'No projects assigned yet.'}
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create First Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white">Edit Project</h3>
              <button onClick={() => setEditingProject(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Project Name</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button onClick={() => setEditingProject(null)} className="py-2 px-4 rounded-lg bg-slate-800 font-bold cursor-pointer text-xs">Cancel</button>
              <button onClick={handleEditSave} className="py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
