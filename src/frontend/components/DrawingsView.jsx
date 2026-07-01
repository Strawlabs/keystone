import React, { useState, useCallback } from 'react';
import { useStore } from '@/frontend/store/store';

const CATEGORIES = [
  'all',
  'architectural',
  'structural',
  'electrical',
  'plumbing',
  'elevation',
  'interior',
  'site_photos',
  'project_documents',
  'miscellaneous',
];

const CATEGORY_LABELS = {
  all: 'All Drawings',
  architectural: 'Architectural',
  structural: 'Structural',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  elevation: 'Elevation',
  interior: 'Interior',
  site_photos: 'Site Photos',
  project_documents: 'Project Docs',
  miscellaneous: 'Miscellaneous',
};

const CATEGORY_STYLES = {
  architectural: 'text-primary bg-primary/5 border-primary/20',
  structural: 'text-tertiary bg-tertiary/5 border-tertiary/20',
  electrical: 'text-secondary bg-secondary/5 border-secondary/20',
  plumbing: 'text-outline bg-outline/5 border-outline/20',
  interior: 'text-success bg-success/5 border-success/20',
  elevation: 'text-primary bg-primary/5 border-primary/20',
  site_photos: 'text-amber-600 bg-amber-50 border-amber-200',
  project_documents: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  miscellaneous: 'text-outline-variant bg-surface-container border-border-subtle',
};

// Icon to show per file type
const FILE_ICON_MAP = {
  pdf: { icon: 'picture_as_pdf', color: 'text-red-500' },
  jpg: { icon: 'image', color: 'text-emerald-500' },
  jpeg: { icon: 'image', color: 'text-emerald-500' },
  png: { icon: 'image', color: 'text-emerald-500' },
  dwg: { icon: 'architecture', color: 'text-blue-500' },
};

const STATUS_DOT_STYLES = {
  approved: { dot: 'bg-success', text: 'Approved' },
  pending: { dot: 'bg-warning', text: 'Pending' },
  revision_requested: { dot: 'bg-error', text: 'Revision Req.' },
  rejected: { dot: 'bg-error', text: 'Rejected' },
  draft: { dot: 'bg-outline', text: 'Draft' },
};

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First' },
  { value: 'created_at_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'revision_desc', label: 'Revision ↑' },
];

function getFileExtension(fileUrl, storagePath) {
  const src = storagePath || fileUrl || '';
  const lastDot = src.lastIndexOf('.');
  return lastDot !== -1 ? src.slice(lastDot + 1).toLowerCase() : '';
}

export default function DrawingsView({
  drawingCategoryFilter,
  setDrawingCategoryFilter,
  drawingSearch,
  setDrawingSearch,
  drawingSort,
  setDrawingSort,
  filteredDrawings,
  isClient,
  isStaff,
  currentUser,
  setShowDrawingModal,
  setSelectedDrawingId,
  setTab,
  submitApproval,
  users = [],
  approvals = [],
  getSignedUrl,
  deleteDrawing,
  setShowPreviewModal,
  setPreviewDrawing,
}) {
  const [submittingId, setSubmittingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const canUpload = !isClient;
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'architect';
  const canSubmitApproval = currentUser?.role === 'admin' || currentUser?.role === 'architect';

  const clients = (users || []).filter(u => u.role === 'client');

  const handleQuickSubmitApproval = async (drawingId) => {
    if (clients.length === 0) {
      useStore.getState().setError('No clients available to send for approval. Please add a client first.');
      return;
    }
    const firstClient = clients[0];
    setSubmittingId(drawingId);
    await submitApproval?.({
      drawing_id: drawingId,
      client_id: firstClient.id,
      comments: 'Please review the attached drawing.',
    });
    setSubmittingId(null);
  };

  const handleDownload = useCallback(async (drawing) => {
    if (!drawing.storage_path && !drawing.file_url) return;
    setDownloadingId(drawing.id);
    try {
      let url = drawing.file_url;
      if (drawing.storage_path && getSignedUrl) {
        const signed = await getSignedUrl(drawing.storage_path);
        if (signed) url = signed;
      }
      if (!url) {
        useStore.getState().setError('Could not generate download link. Please try again.');
        return;
      }
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = drawing.name || 'drawing';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      useStore.getState().setError('Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  }, [getSignedUrl]);

  const handlePreview = (drawing) => {
    if (setShowPreviewModal && setPreviewDrawing) {
      setPreviewDrawing(drawing);
      setShowPreviewModal(true);
    } else {
      // Fallback to blueprint canvas
      setSelectedDrawingId(drawing.id);
      setTab('blueprint-review');
    }
  };

  const handleDelete = async (drawing) => {
    if (!window.confirm(`Are you sure you want to delete "${drawing.name}"? This action cannot be undone.`)) return;
    setDeletingId(drawing.id);
    await deleteDrawing?.(drawing.id);
    setDeletingId(null);
  };

  const getDrawingStatusInfo = (drawingId) => {
    const drawingApproval = (approvals || []).find(a => a.drawing_id === drawingId);
    if (!drawingApproval) return STATUS_DOT_STYLES.draft;
    return STATUS_DOT_STYLES[drawingApproval.status] || STATUS_DOT_STYLES.pending;
  };

  // Client-side sort fallback (for when server-sort is not used in search)
  const sortedDrawings = [...filteredDrawings].sort((a, b) => {
    switch (drawingSort) {
      case 'name_asc': return (a.name || '').localeCompare(b.name || '');
      case 'name_desc': return (b.name || '').localeCompare(a.name || '');
      case 'revision_desc': return (b.current_revision || 1) - (a.current_revision || 1);
      case 'created_at_asc': return new Date(a.created_at) - new Date(b.created_at);
      case 'created_at_desc':
      default: return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Pagination
  const totalItems = sortedDrawings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedDrawings = sortedDrawings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderFileThumb = (drawing) => {
    const ext = getFileExtension(drawing.file_url, drawing.storage_path);
    const isImage = ext === 'jpg' || ext === 'jpeg' || ext === 'png';
    const fileIcon = FILE_ICON_MAP[ext] || { icon: 'description', color: 'text-outline' };

    if (isImage && drawing.file_url && drawing.file_url.startsWith('http')) {
      return (
        <img
          src={drawing.file_url}
          alt={drawing.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      );
    }

    return (
      <div className="flex flex-col items-center gap-2">
        <span className={`material-symbols-outlined text-[52px] ${fileIcon.color}`}>
          {fileIcon.icon}
        </span>
        {ext && (
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
            {ext.toUpperCase()} File
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-label-md text-secondary mb-2">
            <span>Projects</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Library</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-semibold">Drawings</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-ink-black font-bold">Drawing Library</h2>
          <p className="text-body-md text-secondary mt-1 font-medium">
            Manage and version-control all technical documentation and blueprints for the current studio project.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-surface-container-lowest border border-border-subtle text-secondary font-bold rounded-lg flex items-center gap-2 hover:bg-surface-container-low transition-colors cursor-pointer text-body-md"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export List
          </button>
          {canUpload && (
            <button
              onClick={() => setShowDrawingModal(true)}
              className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg flex items-center gap-2 shadow-md hover:bg-primary-container transition-all active:scale-[0.98] cursor-pointer text-body-md"
            >
              <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
              Upload Drawing
            </button>
          )}
        </div>
      </div>

      {/* Filters & Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-1.5 bg-surface-container-low/60 rounded-xl border border-border-subtle shadow-sm">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = drawingCategoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setDrawingCategoryFilter(cat);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-body-md font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-secondary hover:bg-surface-container-lowest/40 hover:text-primary'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 px-2 justify-between lg:justify-end flex-wrap">
          {/* Sort Dropdown */}
          <select
            value={drawingSort}
            onChange={(e) => {
              setDrawingSort(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface-container-lowest border border-border-subtle rounded-lg px-3 py-1.5 text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Grid/Table view toggles */}
          <div className="flex items-center bg-surface-container-high rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'grid'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'table'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
            </button>
          </div>

          <div className="h-6 w-px bg-border-subtle hidden lg:block"></div>

          {/* Search Input */}
          <div className="relative w-52 lg:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={drawingSearch}
              onChange={(e) => {
                setDrawingSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-surface-container-lowest border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder="Search name, number, revision..."
            />
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedDrawings.map((d) => {
            const catStyle = CATEGORY_STYLES[d.category] || CATEGORY_STYLES.miscellaneous;
            const statusInfo = getDrawingStatusInfo(d.id);
            const isDeleting = deletingId === d.id;
            const isDownloading = downloadingId === d.id;

            return (
              <div
                key={d.id}
                className={`group bg-surface-container-lowest rounded-xl border border-border-subtle overflow-hidden hover:shadow-xl hover:shadow-black/5 transition-all duration-300 flex flex-col h-full shadow-sm ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-[4/3] bg-surface-container-high overflow-hidden flex items-center justify-center blueprint-grid">
                  {renderFileThumb(d)}

                  {/* Rev Corner badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-ink-black/80 text-white text-[10px] font-bold rounded backdrop-blur-sm uppercase tracking-wider font-mono">
                      Rev {d.current_revision || d.revision || 1}
                    </span>
                  </div>

                  {/* Hover Buttons */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                      onClick={() => handlePreview(d)}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform cursor-pointer"
                      title="Preview Drawing"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                    {(d.file_url || d.storage_path) && (
                      <button
                        onClick={() => handleDownload(d)}
                        disabled={isDownloading}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform cursor-pointer disabled:opacity-60"
                        title="Download Drawing"
                      >
                        {isDownloading ? (
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[20px]">download</span>
                        )}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(d)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-error shadow-lg hover:scale-110 transition-transform cursor-pointer"
                        title="Delete Drawing"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border capitalize truncate ${catStyle}`}
                      >
                        {CATEGORY_LABELS[d.category] || d.category}
                      </span>
                      <span className="text-label-md text-secondary font-semibold shrink-0 font-mono">
                        {d.drawing_number ? `#${d.drawing_number}` : '—'}
                      </span>
                    </div>
                    <h3 className="font-bold text-body-lg text-ink-black line-clamp-1 mb-1" title={d.name}>
                      {d.name}
                    </h3>
                    <p className="text-label-sm text-secondary truncate mb-4">
                      Project: {d.project_name || 'General Project'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between mt-auto">
                    {/* Status Dot */}
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot}`}></span>
                      <span className="text-label-md font-semibold text-secondary">{statusInfo.text}</span>
                    </div>

                    {/* Submit CTA */}
                    {statusInfo.text === 'Draft' && canSubmitApproval ? (
                      <button
                        onClick={() => handleQuickSubmitApproval(d.id)}
                        disabled={submittingId === d.id}
                        className="text-primary text-label-md font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        {submittingId === d.id ? 'Submitting...' : 'Submit for Approval'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-outline font-medium">
                        {new Date(d.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Drawing Card (Placeholder UI inside Grid) */}
          {canUpload && (
            <div
              onClick={() => setShowDrawingModal(true)}
              className="group bg-surface-container-low border-2 border-dashed border-border-subtle rounded-xl flex flex-col items-center justify-center p-8 text-center hover:border-primary/50 transition-colors cursor-pointer min-h-[260px]"
            >
              <div className="w-14 h-14 bg-surface-container-lowest rounded-full flex items-center justify-center text-secondary mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-[30px]">upload_file</span>
              </div>
              <h3 className="font-bold text-ink-black mb-1">Add More Drawings</h3>
              <p className="text-label-md text-secondary max-w-[180px]">
                PDF, JPG, PNG or DWG files up to 50 MB.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-surface-container-lowest rounded-xl border border-border-subtle overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-subtle">
                  <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Drawing Name</th>
                  <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Number</th>
                  <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Revision</th>
                  <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-4 text-label-md font-bold text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {paginatedDrawings.map((d) => {
                  const statusInfo = getDrawingStatusInfo(d.id);
                  const catStyle = CATEGORY_STYLES[d.category] || CATEGORY_STYLES.miscellaneous;
                  const isDeleting = deletingId === d.id;
                  const isDownloading = downloadingId === d.id;
                  const ext = getFileExtension(d.file_url, d.storage_path);
                  const fileIcon = FILE_ICON_MAP[ext] || { icon: 'description', color: 'text-outline' };

                  return (
                    <tr key={d.id} className={`hover:bg-primary/5 transition-colors cursor-pointer group ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-[24px] ${fileIcon.color}`}>{fileIcon.icon}</span>
                          <div>
                            <p className="font-body-md font-bold text-ink-black">{d.name}</p>
                            <p className="text-label-sm text-secondary">Proj: {d.project_name || 'General'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-body-md text-secondary">
                        {d.drawing_number || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${catStyle}`}>
                          {CATEGORY_LABELS[d.category] || d.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-body-md text-secondary font-mono">
                        Rev {d.current_revision || d.revision || 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                          <span className="text-label-md font-semibold text-secondary">{statusInfo.text}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body-md text-secondary">
                        {new Date(d.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreview(d)}
                            className="p-1 hover:bg-primary/10 rounded text-primary transition-colors cursor-pointer"
                            title="Preview"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          {(d.file_url || d.storage_path) && (
                            <button
                              onClick={() => handleDownload(d)}
                              disabled={isDownloading}
                              className="p-1 hover:bg-primary/10 rounded text-primary transition-colors cursor-pointer disabled:opacity-60"
                              title="Download File"
                            >
                              {isDownloading ? (
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                              ) : (
                                <span className="material-symbols-outlined text-[20px]">download</span>
                              )}
                            </button>
                          )}
                          {statusInfo.text === 'Draft' && canSubmitApproval && (
                            <button
                              onClick={() => handleQuickSubmitApproval(d.id)}
                              disabled={submittingId === d.id}
                              className="px-2.5 py-1 text-[11px] bg-primary text-white rounded font-bold hover:bg-primary-container transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {submittingId === d.id ? 'Submitting...' : 'Submit'}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(d)}
                              className="p-1 hover:bg-error/10 rounded text-error transition-colors cursor-pointer"
                              title="Delete Drawing"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
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
        </div>
      )}

      {filteredDrawings.length === 0 && (
        <div className="py-16 text-center bg-surface-container-low/30 border border-dashed border-border-subtle rounded-xl flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[40px] text-secondary">folder_open</span>
          <div>
            <p className="text-sm font-bold text-on-surface">No drawings found</p>
            <p className="text-xs text-secondary mt-1">
              {canUpload ? 'Upload a blueprint sheet to get started.' : 'No blueprint drawings have been uploaded.'}
            </p>
          </div>
          {canUpload && (
            <button
              onClick={() => setShowDrawingModal(true)}
              className="flex items-center gap-2 py-2 px-4 rounded-lg bg-primary hover:bg-primary-container text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
              Upload First Drawing
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredDrawings.length > 0 && (
        <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
          <p className="text-label-md text-secondary">
            Showing <span className="font-semibold text-ink-black">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{' '}
            <span className="font-semibold text-ink-black">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
            <span className="font-semibold text-ink-black">{totalItems}</span> drawings
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
                      ? 'bg-primary text-white shadow-sm'
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
  );
}
