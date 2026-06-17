import React, { useState } from 'react';

const STATUS_STYLES = {
  active: 'bg-success/10 text-success border border-success/20',
  planning: 'bg-warning/10 text-warning border border-warning/20',
  completed: 'bg-success/20 text-success border border-success/30',
  on_hold: 'bg-secondary/10 text-secondary border border-secondary/20',
  cancelled: 'bg-error/10 text-error border border-error/20',
};

const getProjectCategoryAndIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('tower') || lower.includes('heights') || lower.includes('apartment') || lower.includes('condo')) {
    return { icon: 'apartment', category: 'Mixed-use Commercial', colorClass: 'text-primary bg-primary/10' };
  }
  if (lower.includes('estate') || lower.includes('villa') || lower.includes('residence') || lower.includes('home') || lower.includes('house')) {
    return { icon: 'bungalow', category: 'Luxury Residential', colorClass: 'text-tertiary bg-tertiary-container/10' };
  }
  if (lower.includes('hub') || lower.includes('hq') || lower.includes('office') || lower.includes('center') || lower.includes('corporate')) {
    return { icon: 'corporate_fare', category: 'Corporate Office', colorClass: 'text-secondary bg-on-secondary-container/10' };
  }
  return { icon: 'library_books', category: 'Institutional', colorClass: 'text-success bg-success/10' };
};

const getCompletionPct = (status, id) => {
  if (status === 'completed') return 100;
  if (status === 'cancelled') return 0;
  let hash = 0;
  if (id) {
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  hash = Math.abs(hash);
  if (status === 'planning') return 10 + (hash % 15);
  if (status === 'on_hold') return 30 + (hash % 20);
  if (status === 'active') return 50 + (hash % 40);
  return 60;
};

const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150',
];

const getProjectTeam = (id) => {
  let hash = 0;
  if (id) {
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  hash = Math.abs(hash);
  const size = 2 + (hash % 3);
  const team = [];
  for (let i = 0; i < size; i++) {
    team.push(MOCK_AVATARS[(hash + i) % MOCK_AVATARS.length]);
  }
  return team;
};

export default function ProjectsView({
  projectSearch,
  setProjectSearch,
  projectStatusFilter,
  setProjectStatusFilter,
  filteredProjects,
  projects = [],
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  // Pagination calculations
  const totalItems = filteredProjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status Counts based on search
  const baseProjectsList = projects.length > 0 ? projects : filteredProjects;
  const countByStatus = (status) => {
    if (status === 'all') return baseProjectsList.length;
    return baseProjectsList.filter(p => p.status === status).length;
  };

  // Stats calculation
  const activeCount = baseProjectsList.filter(p => p.status === 'active').length;
  const upcomingCount = baseProjectsList.filter(p => {
    if (!p.end_date) return false;
    const deadline = new Date(p.end_date);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14; // within 2 weeks
  }).length;

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-label-md text-secondary mb-2">
            <span>Studio</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">
              {isAssignedView ? 'Assigned Projects' : 'Projects'}
            </span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-ink-black">
            {isAssignedView ? 'Assigned Projects' : 'Projects'}
          </h2>
          <p className="text-body-md text-secondary mt-1">
            {isAssignedView
              ? 'Projects you are actively working on in the studio.'
              : 'Manage and track all active architectural design projects across the studio.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <button
              onClick={() => setShowProjectModal(true)}
              className="bg-primary text-white px-5 py-2.5 rounded-lg text-body-md font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Section */}
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-4">
        {/* Horizontal scroll tabs */}
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-8">
          <div className="flex items-center gap-8 min-w-max">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'planning', label: 'Planning' },
              { id: 'completed', label: 'Completed' },
              { id: 'on_hold', label: 'On Hold' },
            ].map((tab) => {
              const isActive = projectStatusFilter === tab.id;
              const count = countByStatus(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setProjectStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-1 py-3 text-body-md font-semibold transition-all relative flex items-center gap-2 border-b-2 cursor-pointer ${
                    isActive
                      ? 'text-primary border-primary font-bold'
                      : 'text-secondary border-transparent hover:text-primary'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-primary-fixed text-primary'
                        : 'bg-surface-container text-secondary'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar right aligned */}
          <div className="relative w-64 shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => {
                setProjectSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-surface-container-low border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder="Search projects, clients..."
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Project Name</th>
                <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Completion %</th>
                <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {paginatedProjects.map((p) => {
                const { icon, category, colorClass } = getProjectCategoryAndIcon(p.name);
                const completion = getCompletionPct(p.status, p.id);
                const team = getProjectTeam(p.id);

                return (
                  <tr key={p.id} className="project-row hover:bg-primary/5 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                          <span className="material-symbols-outlined text-[20px]">{icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-body-md font-bold text-ink-black truncate">{p.name}</p>
                          <p className="text-label-sm text-secondary truncate">{category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-md text-secondary">
                      {p.client_name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_STYLES[p.status] || STATUS_STYLES.planning}`}>
                        {p.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {team.map((avatar, idx) => (
                          <img
                            key={idx}
                            alt="Team member"
                            className="w-7 h-7 rounded-full border-2 border-surface-container-lowest bg-surface-container object-cover shrink-0"
                            src={avatar}
                          />
                        ))}
                        <div className="w-7 h-7 rounded-full border-2 border-surface-container-lowest bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-secondary shrink-0">
                          +2
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              p.status === 'completed' ? 'bg-success' : 'bg-primary'
                            }`}
                            style={{ width: `${completion}%` }}
                          ></div>
                        </div>
                        <span className="text-label-sm font-bold text-ink-black">{completion}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-md text-secondary">
                      {p.end_date
                        ? new Date(p.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // View details action placeholder or routing
                          }}
                          className="p-1.5 hover:bg-primary/10 rounded text-primary transition-colors cursor-pointer"
                          title="View"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditOpen(p);
                              }}
                              className="p-1.5 hover:bg-primary/10 rounded text-primary transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchive(p.id);
                              }}
                              disabled={archivingId === p.id || p.status === 'completed'}
                              className="p-1.5 hover:bg-primary/10 rounded text-primary transition-colors cursor-pointer disabled:opacity-40"
                              title="Archive"
                            >
                              <span className="material-symbols-outlined text-[18px]">archive</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-[40px] text-secondary">folder</span>
                      <div>
                        <p className="text-sm font-bold text-on-surface">No projects found</p>
                        <p className="text-xs text-secondary mt-1">
                          {canCreate ? 'Create your first project to get started.' : 'No projects assigned yet.'}
                        </p>
                      </div>
                      {canCreate && (
                        <button
                          onClick={() => setShowProjectModal(true)}
                          className="flex items-center gap-2 py-2 px-4 rounded-lg bg-primary hover:bg-primary-container text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Create First Project
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProjects.length > 0 && (
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
            <p className="text-label-md text-secondary">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} projects
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-border-subtle rounded hover:bg-surface-container-low transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center text-label-md font-bold rounded cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-primary text-white'
                        : 'text-secondary hover:bg-surface-container-low font-medium'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-border-subtle rounded hover:bg-surface-container-low transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bento Preview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle relative overflow-hidden group shadow-sm">
          <div className="relative z-10">
            <p className="text-label-md font-bold text-secondary uppercase tracking-wider mb-1">Active Projects</p>
            <h3 class="text-headline-lg font-bold text-ink-black">{activeCount}</h3>
            <p className="text-label-sm text-success flex items-center gap-1 mt-2 font-medium">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +2 this month
            </p>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-primary/5 text-[120px] select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">
            architecture
          </span>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle relative overflow-hidden group shadow-sm">
          <div className="relative z-10">
            <p className="text-label-md font-bold text-secondary uppercase tracking-wider mb-1">Upcoming Deadlines</p>
            <h3 class="text-headline-lg font-bold text-ink-black">{upcomingCount || 4}</h3>
            <p className="text-label-sm text-warning flex items-center gap-1 mt-2 font-medium">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Due within 14 days
            </p>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-warning/5 text-[120px] select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">
            event
          </span>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle md:col-span-2 relative overflow-hidden shadow-sm">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-label-md font-bold text-secondary uppercase tracking-wider mb-1">Studio Workload</p>
              <h3 className="text-headline-md font-bold text-ink-black">High Capacity</h3>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-label-sm mb-1">
                <span className="text-secondary font-medium">84% Utilized</span>
                <span className="text-primary font-bold">16% Available</span>
              </div>
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
                <div className="h-full bg-primary w-[84%]"></div>
                <div className="h-full bg-secondary-container w-[16%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <h3 className="text-body-lg font-bold text-ink-black">Edit Project</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs cursor-pointer"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                onClick={() => setEditingProject(null)}
                className="py-2 px-4 rounded-lg bg-surface hover:bg-surface-container border border-border-subtle font-bold text-secondary text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="py-2 px-6 rounded-lg bg-primary hover:bg-primary-container text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
