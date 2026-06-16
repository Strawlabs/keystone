import React, { useState } from 'react';
import { Search, Upload, FileText, Download, Send, Eye } from 'lucide-react';

const CATEGORIES = ['all', 'architectural', 'structural', 'interior', 'electrical', 'plumbing', 'elevation', 'miscellaneous'];

const categoryColors = {
  architectural: 'text-blue-400 bg-blue-950/20 border-blue-900/40',
  structural: 'text-amber-400 bg-amber-950/20 border-amber-900/40',
  interior: 'text-purple-400 bg-purple-950/20 border-purple-900/40',
  electrical: 'text-yellow-400 bg-yellow-950/20 border-yellow-900/40',
  plumbing: 'text-cyan-400 bg-cyan-950/20 border-cyan-900/40',
  elevation: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40',
  miscellaneous: 'text-slate-400 bg-slate-800 border-slate-700',
};

export default function DrawingsView({
  drawingCategoryFilter,
  setDrawingCategoryFilter,
  drawingSearch,
  setDrawingSearch,
  filteredDrawings,
  isClient,
  isStaff,
  currentUser,
  setShowDrawingModal,
  setSelectedDrawingId,
  setTab,
  submitApproval,
  users,
}) {
  const [submittingId, setSubmittingId] = useState(null);

  // Who can upload: admin, architect, staff
  const canUpload = !isClient;
  // Who can submit for approval: admin, architect
  const canSubmitApproval = currentUser?.role === 'admin' || currentUser?.role === 'architect';

  const clients = (users || []).filter(u => u.role === 'client');

  const handleQuickSubmitApproval = async (drawingId) => {
    if (clients.length === 0) {
      alert('No clients available to send for approval.');
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

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Drawing Library</h2>
          <p className="text-xs text-slate-500 mt-0.5">Store, manage and submit architectural drawings for approval.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative rounded-lg shadow-sm w-48 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={drawingSearch}
              onChange={(e) => setDrawingSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="Search drawings..."
            />
          </div>
          {canUpload && (
            <button
              onClick={() => setShowDrawingModal(true)}
              className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all whitespace-nowrap cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Upload className="w-4 h-4" />
              Upload Drawing
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setDrawingCategoryFilter(cat)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
              drawingCategoryFilter === cat
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Drawings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrawings.map((d) => {
          const catStyle = categoryColors[d.category] || categoryColors.miscellaneous;
          const isPdf = d.file_url?.toLowerCase().endsWith('.pdf') || d.file_url?.includes('.pdf');
          return (
            <div
              key={d.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-slate-700 hover:-translate-y-0.5 transition-all"
            >
              {/* Thumbnail / Preview area */}
              <div className="h-36 bg-slate-950 relative overflow-hidden flex items-center justify-center blueprint-grid group">
                {d.file_url && !isPdf ? (
                  <img
                    src={d.file_url}
                    alt={d.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-slate-700" />
                    {isPdf && <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">PDF</span>}
                  </div>
                )}
                <div className={`absolute top-3 right-3 backdrop-blur px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border capitalize ${catStyle}`}>
                  {d.category}
                </div>
                {d.file_url && (
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="absolute bottom-3 right-3 p-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-white leading-tight">{d.name}</h4>
                  {d.drawing_number && (
                    <p className="text-[9px] text-slate-600 font-mono mt-0.5">#{d.drawing_number}</p>
                  )}
                  <p className="text-[10px] text-slate-500 truncate mt-1">
                    Project: {d.project_name || 'General'}
                  </p>
                </div>

                {/* Meta row */}
                <div className="grid grid-cols-3 gap-2 text-[9px] text-slate-600 border-t border-slate-850 pt-2.5">
                  <div>
                    <p className="font-bold uppercase text-slate-700">Rev</p>
                    <p className="text-slate-400 font-semibold">{d.current_revision || d.revision || 1}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-slate-700">By</p>
                    <p className="text-slate-400 font-semibold truncate">{d.uploaded_by_name || 'You'}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-slate-700">Date</p>
                    <p className="text-slate-400 font-semibold">{new Date(d.created_at || d.uploaded_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* View Blueprint button */}
                  <button
                    onClick={() => {
                      setSelectedDrawingId(d.id);
                      setTab('blueprint-review');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>

                  {/* Download button */}
                  {d.file_url && (
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Submit for Approval — Admin/Architect only */}
                  {canSubmitApproval && (
                    <button
                      onClick={() => handleQuickSubmitApproval(d.id)}
                      disabled={submittingId === d.id}
                      className="flex items-center justify-center p-1.5 rounded-lg bg-blue-950/30 border border-blue-900/40 hover:bg-blue-600 text-blue-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                      title="Submit for Approval"
                    >
                      {submittingId === d.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredDrawings.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20 flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-slate-700" />
            <div>
              <p className="text-sm font-bold text-slate-600">No drawings found</p>
              <p className="text-xs text-slate-700 mt-1">
                {canUpload ? 'Upload a drawing to get started.' : 'No drawings have been uploaded yet.'}
              </p>
            </div>
            {canUpload && (
              <button
                onClick={() => setShowDrawingModal(true)}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload First Drawing
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
