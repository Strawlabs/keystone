import React, { useState, useEffect } from 'react';
import { ZoomOut, ZoomIn, MessageSquare, X, History, Upload, CheckCircle2, AlertTriangle, ArrowLeft, FileText, Download, CloudUpload } from 'lucide-react';

export default function BlueprintReviewPanel({
  activeDrawing,
  zoomScale,
  setZoomScale,
  drawingContainerRef,
  handleBlueprintClick,
  blueprintPins,
  clickCoords,
  isClient,
  isClientRole,
  handleClientApprovalAction,
  newPinComment,
  setNewPinComment,
  submitPinComment,
  setClickCoords,
  store,
  users = [],
  currentUser,
  currentTenantId
}) {
  const [selectedVersion, setSelectedVersion] = useState(null); // null = Latest, object = selected previous revision
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload modal state
  const [revFile, setRevFile] = useState(null);
  const [revFileError, setRevFileError] = useState('');
  const [revNotes, setRevNotes] = useState('');
  const [uploadingRev, setUploadingRev] = useState(false);
  const [uploadRevProgress, setUploadRevProgress] = useState(0);

  const ALLOWED_DRAWING_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'dwg'];
  const MAX_FILE_SIZE_MB = 50;

  // Fetch versions whenever activeDrawing changes
  useEffect(() => {
    if (activeDrawing?.id && store?.fetchDrawingVersions) {
      store.fetchDrawingVersions(activeDrawing.id);
    }
    setSelectedVersion(null);
  }, [activeDrawing?.id]);

  const versionsList = (activeDrawing?.id && store?.drawingVersions?.[activeDrawing.id]) || [];
  const currentRevNumber = activeDrawing?.current_revision || activeDrawing?.revision || 1;

  // Fallback if versions haven't loaded yet or drawing has no version record
  const displayVersions = versionsList.length > 0 ? versionsList : [
    {
      id: `initial-${activeDrawing?.id || 'd1'}`,
      drawing_id: activeDrawing?.id || 'd1',
      revision_number: currentRevNumber,
      revision_notes: activeDrawing?.description || 'Initial drawing release.',
      file_url: activeDrawing?.file_url,
      storage_path: activeDrawing?.storage_path || null,
      uploaded_by: activeDrawing?.uploaded_by || currentUser?.id || 'System',
      created_at: activeDrawing?.created_at || new Date().toISOString()
    }
  ];

  const activeRevNumber = selectedVersion ? selectedVersion.revision_number : currentRevNumber;
  const isViewingPrevious = selectedVersion && selectedVersion.revision_number !== currentRevNumber;
  const displayFileUrl = selectedVersion ? selectedVersion.file_url : (activeDrawing?.file_url || "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1000");

  const getUserName = (userId) => {
    if (!userId) return 'Unknown Uploader';
    const u = users.find(user => user.id === userId);
    return u ? u.name : (userId === currentUser?.id ? (currentUser?.name || 'You') : 'Team Member');
  };

  const handleRevFileChange = (e) => {
    const file = e.target.files[0];
    setRevFileError('');
    if (!file) { setRevFile(null); return; }

    const ext = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();
    if (!ALLOWED_DRAWING_EXTENSIONS.includes(ext)) {
      setRevFileError(`Unsupported file type ".${ext}". Allowed: PDF, JPG, PNG, DWG.`);
      setRevFile(null);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setRevFileError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: ${MAX_FILE_SIZE_MB} MB.`);
      setRevFile(null);
      e.target.value = '';
      return;
    }
    setRevFile(file);
  };

  const handleUploadRevSubmit = async (e) => {
    e.preventDefault();
    if (!revFile) {
      if (store) store.setError('Please select a drawing file to upload.');
      return;
    }
    if (!revNotes.trim()) {
      if (store) store.setError('Please enter revision notes describing changes.');
      return;
    }

    // Check if user is in mock/dev mode (non-UUID tenant)
    const isMock = !currentTenantId || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentTenantId) === false;
    if (isMock) {
      if (store) {
        store.setSuccess(`[UI Mode] Revision Rev ${currentRevNumber + 1} logged for drawing "${activeDrawing?.name || 'Drawing'}".`);
        if (store.fetchData) store.fetchData();
      }
      setShowUploadModal(false);
      setRevFile(null);
      setRevNotes('');
      return;
    }

    setUploadingRev(true);
    setUploadRevProgress(15);
    try {
      const formData = new FormData();
      formData.append('file', revFile);
      formData.append('path', 'drawings');

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });
      setUploadRevProgress(60);
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload file to Supabase Storage');
      }

      setUploadRevProgress(80);
      const success = await store.createDrawingRevision(
        activeDrawing.id,
        uploadData.fileUrl,
        revNotes,
        uploadData.storagePath || null
      );
      setUploadRevProgress(100);

      if (success) {
        setShowUploadModal(false);
        setRevFile(null);
        setRevNotes('');
        setRevFileError('');
        setSelectedVersion(null); // Switch directly to the newly uploaded latest revision
        if (store.fetchDrawingVersions) {
          await store.fetchDrawingVersions(activeDrawing.id);
        }
      }
    } catch (err) {
      console.error('Revision upload failed:', err);
      if (store) store.setError(err.message || 'Failed to upload revision.');
    } finally {
      setUploadingRev(false);
      setUploadRevProgress(0);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 relative">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Blueprint Board Container */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[500px]">
          
          {/* Drawing Viewer Toolbar */}
          <div className="bg-slate-950 p-4 border-b border-slate-850 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate max-w-xs">{activeDrawing?.name || 'Review Board Floor Plan'}</h3>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono font-bold text-white shadow-sm">
                    Rev {activeRevNumber}
                  </span>
                  {isViewingPrevious ? (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Previous Version</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Current / Latest</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                  #{activeDrawing?.drawing_number || '—'} · Project: {activeDrawing?.project_name || 'Keystone Project'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Revision Management Actions */}
              <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 rounded-lg text-xs font-bold text-slate-200 transition-colors cursor-pointer shadow-sm"
                  title="View Version History & Previous Revisions"
                >
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span>History ({displayVersions.length})</span>
                </button>

                {!isClientRole && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
                    title="Upload New Drawing Revision"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ New Revision</span>
                  </button>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-905 p-1 rounded-lg border border-slate-800 select-none">
                <button 
                  onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.25))}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-slate-300 px-2 min-w-[48px] text-center">{Math.round(zoomScale * 100)}%</span>
                <button 
                  onClick={() => setZoomScale(Math.min(2.5, zoomScale + 0.25))}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Outdated Revision Warning Banner */}
          {isViewingPrevious && (
            <div className="bg-amber-950/70 border-b border-amber-500/30 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-start sm:items-center gap-2.5 text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p className="text-xs font-bold text-amber-300">
                    Viewing Outdated Revision (Rev {selectedVersion.revision_number}) — Not the Latest Drawing Plan
                  </p>
                  <p className="text-[10px] text-amber-400/90 mt-0.5">
                    Uploaded on {new Date(selectedVersion.created_at || Date.now()).toLocaleString()} by {getUserName(selectedVersion.uploaded_by)} · Notes: "{selectedVersion.revision_notes || 'No notes provided'}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVersion(null)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Latest (Rev {currentRevNumber})</span>
              </button>
            </div>
          )}

          {/* Drawing Clickable Map Canvas */}
          <div className="flex-1 overflow-auto relative blueprint-grid flex items-center justify-center p-8 min-h-[400px]">
            <div 
              ref={drawingContainerRef}
              onClick={handleBlueprintClick}
              className="relative border-2 border-dashed border-blue-500/20 max-w-full shadow-2xl cursor-crosshair select-none transition-transform duration-150"
              style={{ 
                transform: `scale(${zoomScale})`, 
                backgroundImage: `url('${displayFileUrl}')`,
                backgroundSize: 'cover',
                width: '650px',
                height: '430px'
              }}
            >
              <div className="absolute inset-0 bg-blue-950/20 mix-blend-overlay pointer-events-none"></div>

              {/* Display Dropped Pins */}
              {blueprintPins.map((pin, index) => (
                <div
                  key={pin.id}
                  className="absolute w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] font-extrabold text-white shadow-lg shadow-blue-500/30 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  title={`${pin.user} (${pin.role}): ${pin.comment}`}
                >
                  {index + 1}
                  
                  {/* Mini Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-[10px] text-slate-300 leading-snug">
                    <span className="font-extrabold text-white block mb-0.5">{pin.user} ({pin.role.toUpperCase()})</span>
                    {pin.comment}
                  </div>
                </div>
              ))}

              {/* Temporary indicator during click */}
              {clickCoords && (
                <div
                  className="absolute w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-xs text-white shadow-xl -translate-x-1/2 -translate-y-1/2 animate-ping"
                  style={{ left: `${clickCoords.x}%`, top: `${clickCoords.y}%` }}
                />
              )}
            </div>
          </div>

          {/* Blueprint Review Action Footer (Client sign-off or revision request) */}
          {isClient && (
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[10px] text-slate-400 leading-snug max-w-md">
                Review the blueprint plan. Click anywhere on the drawing layout to place a comment tag before approving or requesting architectural revisions.
              </p>

              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => handleClientApprovalAction('revision_requested')}
                  className="py-2 px-4 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold text-amber-400 transition-all cursor-pointer"
                >
                  Request Revision
                </button>
                <button 
                  onClick={() => handleClientApprovalAction('approved')}
                  className="py-2 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-500/15 cursor-pointer"
                >
                  Approve Blueprint
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Comments / Pins Panel */}
        <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between shrink-0 space-y-4">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>Blueprint Review Feed</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{blueprintPins.length} pins</span>
            </h3>

            {/* Scrollable list of comments */}
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
              {blueprintPins.map((pin, idx) => (
                <div key={pin.id} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-start gap-2.5 hover:border-slate-700 transition-colors">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-300 shrink-0 mt-0.5 font-mono">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center gap-1">
                      <span className="text-[10px] font-bold text-white truncate">{pin.user}</span>
                      <span className="text-[8px] bg-slate-850 px-1.5 py-0.5 rounded text-slate-400 font-extrabold uppercase shrink-0">{pin.role}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1 leading-normal">{pin.comment}</p>
                  </div>
                </div>
              ))}
              {blueprintPins.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400 font-medium">No comment pins dropped yet.</p>
                  <p className="text-[10px] text-slate-500 mt-1">Click the drawing canvas to drop feedback tags.</p>
                </div>
              )}
            </div>
          </div>

          {/* Comment Add Panel */}
          {clickCoords ? (
            <div className="p-3.5 bg-slate-950/80 border border-blue-500/30 rounded-xl space-y-2.5 animate-fade-in shadow-lg">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  Pin Drop Active
                </span>
                <button onClick={() => setClickCoords(null)} className="text-slate-400 hover:text-white cursor-pointer p-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>
              <textarea
                rows={2}
                value={newPinComment}
                onChange={(e) => setNewPinComment(e.target.value)}
                placeholder="Add review remark..."
                className="w-full text-xs p-2.5 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-500"
              />
              <button 
                onClick={submitPinComment}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer shadow-md"
              >
                Drop Tag Pin
              </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/30 border border-dashed border-slate-800 rounded-xl text-center text-[10px] text-slate-400 leading-normal">
              Click any coordinate on the blueprint viewer canvas above to drop a tagged correction pin.
            </div>
          )}
        </div>

      </div>

      {/* VERSION HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Drawing Version History</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {activeDrawing?.name} (#{activeDrawing?.drawing_number || '—'}) · {displayVersions.length} {displayVersions.length === 1 ? 'Revision' : 'Revisions'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Revisions */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {displayVersions.map((v) => {
                const isCurrent = v.revision_number === currentRevNumber;
                const isSelected = activeRevNumber === v.revision_number;

                return (
                  <div
                    key={v.id || v.revision_number}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500/50 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-850">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg font-mono text-xs font-bold text-white shadow-sm">
                          Rev {v.revision_number}
                        </span>
                        {isCurrent ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Current / Latest
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-800/80 text-slate-400 border border-slate-700 rounded text-[9px] font-bold uppercase tracking-wider">
                            Previous Version
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                            Viewing Now
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedVersion(isCurrent ? null : v);
                              setShowHistoryModal(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-white text-[10px] font-bold transition-colors cursor-pointer border border-slate-700"
                          >
                            Inspect on Canvas
                          </button>
                        )}

                        <button
                          onClick={() => window.open(v.file_url || activeDrawing?.file_url, '_blank')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                          title="Download Revision File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                        <span><strong className="text-slate-300">Uploaded by:</strong> {getUserName(v.uploaded_by)}</span>
                        <span className="font-mono"><strong className="text-slate-300">Date:</strong> {new Date(v.created_at || Date.now()).toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-200 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Revision Notes</span>
                        {v.revision_notes || 'No notes provided for this version.'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <p className="text-[10px] text-slate-400">
                Authorized users can review previous architectural revisions or compare notes against the latest drawing plan.
              </p>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE NEW REVISION MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create New Revision</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {activeDrawing?.name} (#{activeDrawing?.drawing_number || '—'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => !uploadingRev && setShowUploadModal(false)}
                disabled={uploadingRev}
                className="w-8 h-8 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadRevSubmit} className="p-6 space-y-5">
              
              {/* Revision Info Banner */}
              <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center justify-between text-blue-200">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-300">Next Revision: Rev {currentRevNumber + 1}</p>
                    <p className="text-[10px] text-blue-400/80 mt-0.5">Revision numbers auto-increment uniquely per drawing</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-600/20 border border-blue-500/40 rounded text-[10px] font-mono font-bold text-blue-300">
                  Rev {currentRevNumber + 1}
                </span>
              </div>

              {/* File Upload Drop Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Drawing Sheet File <span className="text-rose-400">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-750 rounded-xl p-6 text-center hover:border-blue-500/60 transition-colors cursor-pointer bg-slate-950/50 relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.dwg"
                    onChange={handleRevFileChange}
                    disabled={uploadingRev}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                  />
                  <CloudUpload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  {revFile ? (
                    <div>
                      <p className="text-xs font-bold text-blue-400 truncate max-w-sm mx-auto">{revFile.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {(revFile.size / 1024 / 1024).toFixed(2)} MB · {revFile.name.slice(revFile.name.lastIndexOf('.') + 1).toUpperCase()}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-300 font-bold">Click or drag new drawing revision file</p>
                      <p className="text-[10px] text-slate-500 mt-1">PDF · DWG · JPG · PNG (Max 50 MB)</p>
                    </div>
                  )}
                </div>

                {revFileError && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold">{revFileError}</p>
                  </div>
                )}
              </div>

              {/* Revision Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Revision Notes <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={revNotes}
                  onChange={(e) => setRevNotes(e.target.value)}
                  disabled={uploadingRev}
                  placeholder="Describe what changed in this revision (e.g. updated structural column reinforcement, modified master bedroom wiring plan)..."
                  className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-500 disabled:opacity-60"
                />
              </div>

              {/* Upload Progress */}
              {uploadingRev && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Uploading Revision Rev {currentRevNumber + 1}...</span>
                    <span>{uploadRevProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${uploadRevProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploadingRev}
                  className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingRev || !revFile || !revNotes.trim()}
                  className="flex items-center gap-2 py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {uploadingRev ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Revision Rev {currentRevNumber + 1}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
