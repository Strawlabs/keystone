import React, { useState } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';

// Check if user is in dev/mock mode (non-UUID tenant)
const isMockTenant = (tenantId) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return !uuidRegex.test(tenantId);
};

const MockModeWarning = () => (
  <div className="flex items-start gap-3 p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-xl mb-4">
    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
    <div>
      <p className="text-xs font-bold text-amber-300">Sign up to save data</p>
      <p className="text-[10px] text-amber-500 mt-0.5 leading-snug">
        You're in UI Preview mode. Files and records won't be saved. Create a real account to use all features.
      </p>
    </div>
  </div>
);

export default function Modals({
  showProjectModal,
  setShowProjectModal,
  showSiteLogModal,
  setShowSiteLogModal,
  showTaskModal,
  setShowTaskModal,
  showDrawingModal,
  setShowDrawingModal,
  showUserModal,
  setShowUserModal,
  newProj,
  setNewProj,
  handleSaveProject,
  newLog,
  setNewLog,
  createSiteLog,
  projects,
  newTaskInput,
  setNewTaskInput,
  handleSaveTask,
  users,
  newDrawingInput,
  setNewDrawingInput,
  createDrawing,
  newUser,
  setNewUser,
  handleSaveUser,
  currentUser,
  currentTenantId,
}) {
  // Local state for file uploads
  const [drawingFile, setDrawingFile] = useState(null);
  const [uploadingDrawing, setUploadingDrawing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [sitePhotos, setSitePhotos] = useState([]);
  const [sitePhotoPreview, setSitePhotoPreview] = useState([]);
  const [uploadingLogs, setUploadingLogs] = useState(false);

  const isMock = isMockTenant(currentTenantId);

  const handleUploadDrawingSubmit = async (e) => {
    e.preventDefault();
    if (!drawingFile) {
      alert('Please select a file to upload.');
      return;
    }
    if (isMock) {
      alert('Sign up with a real account to upload drawings to Supabase Storage.');
      return;
    }
    setUploadingDrawing(true);
    setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append('file', drawingFile);
      formData.append('path', 'drawings');

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });
      setUploadProgress(60);
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload to Supabase Storage');
      }

      setUploadProgress(80);
      const success = await createDrawing({
        project_id: newDrawingInput.project_id || (projects[0]?.id || ''),
        name: newDrawingInput.name,
        drawing_number: newDrawingInput.drawing_number,
        category: newDrawingInput.category,
        file_url: uploadData.fileUrl,
        revision_number: parseInt(newDrawingInput.revision_number) || 1,
        revision_notes: newDrawingInput.revision_notes
      });

      setUploadProgress(100);
      if (success) {
        setShowDrawingModal(false);
        setNewDrawingInput({ project_id: '', name: '', drawing_number: '', category: 'architectural', revision_number: '1', revision_notes: '', file_url: '' });
        setDrawingFile(null);
        setUploadProgress(0);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingDrawing(false);
    }
  };

  const handleSitePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setSitePhotos(files);
    const previews = files.map(f => URL.createObjectURL(f));
    setSitePhotoPreview(previews);
  };

  const handleSaveSiteLogSubmit = async (e) => {
    e.preventDefault();
    setUploadingLogs(true);
    try {
      const uploadedUrls = [];
      for (const file of sitePhotos) {
        if (isMock) {
          // In mock mode just use a placeholder
          uploadedUrls.push(URL.createObjectURL(file));
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', 'site-logs');

        const uploadRes = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          uploadedUrls.push(uploadData.fileUrl);
        }
      }

      const success = await createSiteLog({
        project_id: newLog.project_id || (projects[0]?.id || ''),
        notes: newLog.notes,
        site_status: newLog.site_status || 'active',
        photos: uploadedUrls
      });

      if (success) {
        setShowSiteLogModal(false);
        setNewLog({ project_id: '', notes: '', site_status: 'active', photos: [] });
        setSitePhotos([]);
        setSitePhotoPreview([]);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingLogs(false);
    }
  };

  return (
    <>
      {/* 1. CREATE PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-fade-in text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white">Create New Project</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Initialize a new project workspace</p>
              </div>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {isMock && <MockModeWarning />}

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs text-slate-350">
              {/* Basic Info */}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Basic Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Project Name *</label>
                    <input
                      type="text"
                      required
                      value={newProj.name}
                      onChange={(e) => setNewProj({ ...newProj, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-200"
                      placeholder="e.g. Zenith Tower Residential"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Project Code *</label>
                    <input
                      type="text"
                      required
                      value={newProj.code}
                      onChange={(e) => setNewProj({ ...newProj, code: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-200"
                      placeholder="e.g. PRJ-ZTR"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client Name *</label>
                    <input
                      type="text"
                      required
                      value={newProj.client_name}
                      onChange={(e) => setNewProj({ ...newProj, client_name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-200"
                      placeholder="e.g. Global Realty Partners"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client Email *</label>
                    <input
                      type="email"
                      required
                      value={newProj.client_email}
                      onChange={(e) => setNewProj({ ...newProj, client_email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-200"
                      placeholder="name@client.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  rows={2}
                  value={newProj.description}
                  onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none text-slate-200"
                  placeholder="Project description and context..."
                />
              </div>

              {/* Location */}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Location</p>
                <input
                  type="text"
                  required
                  value={newProj.location}
                  onChange={(e) => setNewProj({ ...newProj, location: e.target.value })}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="e.g. 14 Ring Road, Bangalore, KA"
                />
              </div>

              {/* Timeline */}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Timeline</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newProj.start_date}
                      onChange={(e) => setNewProj({ ...newProj, start_date: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">End Date *</label>
                    <input
                      type="date"
                      required
                      value={newProj.end_date}
                      onChange={(e) => setNewProj({ ...newProj, end_date: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select
                  value={newProj.status}
                  onChange={(e) => setNewProj({ ...newProj, status: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowProjectModal(false)} className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RECORD SITE LOG MODAL */}
      {showSiteLogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in text-slate-202">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white">Record Site Log</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Track site visits and progress</p>
              </div>
              <button onClick={() => setShowSiteLogModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveSiteLogSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Select Project *</label>
                  <select
                    required
                    value={newLog.project_id}
                    onChange={(e) => setNewLog({ ...newLog, project_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Site Status</label>
                  <select
                    value={newLog.site_status || 'active'}
                    onChange={(e) => setNewLog({ ...newLog, site_status: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="inspection">Inspection</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Visit Notes *</label>
                <textarea
                  required
                  rows={4}
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none text-slate-202"
                  placeholder="e.g. Concrete pouring completed on foundation sector B-2..."
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Site Photos (Multiple)</label>
                <div className="mt-1 border border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-slate-600 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleSitePhotoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-500">Click or drag to upload photos</p>
                  <p className="text-[9px] text-slate-600 mt-0.5">JPG, PNG, WEBP supported</p>
                </div>
                {sitePhotoPreview.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {sitePhotoPreview.map((src, i) => (
                      <div key={i} className="h-14 rounded-lg overflow-hidden bg-slate-800">
                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => { setShowSiteLogModal(false); setSitePhotoPreview([]); setSitePhotos([]); }} disabled={uploadingLogs} className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer" disabled={uploadingLogs}>
                  {uploadingLogs ? 'Uploading...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ASSIGN TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in text-slate-202">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white">Create Task</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Assign a task to a team member</p>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Select Project *</label>
                <select
                  required
                  value={newTaskInput.project_id}
                  onChange={(e) => setNewTaskInput({ ...newTaskInput, project_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Task Name *</label>
                <input
                  type="text"
                  required
                  value={newTaskInput.title}
                  onChange={(e) => setNewTaskInput({ ...newTaskInput, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                  placeholder="e.g. Verify layout alignment"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  rows={2}
                  value={newTaskInput.description}
                  onChange={(e) => setNewTaskInput({ ...newTaskInput, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none text-slate-202"
                  placeholder="Task details..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Assigned To *</label>
                  <select
                    required
                    value={newTaskInput.assigned_to}
                    onChange={(e) => setNewTaskInput({ ...newTaskInput, assigned_to: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                  >
                    <option value="">-- Select --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                  <select
                    value={newTaskInput.priority}
                    onChange={(e) => setNewTaskInput({ ...newTaskInput, priority: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newTaskInput.due_date}
                    onChange={(e) => setNewTaskInput({ ...newTaskInput, due_date: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none text-slate-202"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowTaskModal(false)} className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DRAWING UPLOAD MODAL */}
      {showDrawingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-fade-in text-slate-202 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white">Upload Drawing</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Upload to Supabase Storage — PDF, JPG, PNG, DWG</p>
              </div>
              <button onClick={() => setShowDrawingModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {isMock && <MockModeWarning />}

            <form onSubmit={handleUploadDrawingSubmit} className="space-y-4 text-xs">
              {/* Drawing Information */}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Drawing Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Select Project *</label>
                    <select
                      required
                      value={newDrawingInput.project_id}
                      onChange={(e) => setNewDrawingInput({ ...newDrawingInput, project_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                    >
                      <option value="">-- Select Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Drawing Name *</label>
                    <input
                      type="text"
                      required
                      value={newDrawingInput.name}
                      onChange={(e) => setNewDrawingInput({ ...newDrawingInput, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                      placeholder="e.g. Ground Floor Plan"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Drawing Number</label>
                    <input
                      type="text"
                      value={newDrawingInput.drawing_number}
                      onChange={(e) => setNewDrawingInput({ ...newDrawingInput, drawing_number: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                      placeholder="e.g. DWG-001"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category *</label>
                    <select
                      required
                      value={newDrawingInput.category}
                      onChange={(e) => setNewDrawingInput({ ...newDrawingInput, category: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                    >
                      <option value="architectural">Architectural</option>
                      <option value="structural">Structural</option>
                      <option value="interior">Interior</option>
                      <option value="electrical">Electrical</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="elevation">Elevation</option>
                      <option value="miscellaneous">Miscellaneous</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Revision Information */}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Revision Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Revision Number</label>
                    <input
                      type="number"
                      min="1"
                      value={newDrawingInput.revision_number}
                      onChange={(e) => setNewDrawingInput({ ...newDrawingInput, revision_number: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Revision Notes</label>
                    <input
                      type="text"
                      value={newDrawingInput.revision_notes}
                      onChange={(e) => setNewDrawingInput({ ...newDrawingInput, revision_notes: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                      placeholder="Initial release..."
                    />
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">File Upload</p>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-blue-600 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf"
                    onChange={(e) => setDrawingFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  {drawingFile ? (
                    <div>
                      <p className="text-xs font-bold text-blue-400">{drawingFile.name}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{(drawingFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-500">Click or drag to upload</p>
                      <p className="text-[9px] text-slate-600 mt-1">PDF · JPG · PNG · DWG · DXF</p>
                    </div>
                  )}
                </div>

                {/* Upload Progress Bar */}
                {uploadingDrawing && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                      <span>Uploading to Supabase Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowDrawingModal(false)} disabled={uploadingDrawing} className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex items-center gap-2 py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer" disabled={uploadingDrawing}>
                  {uploadingDrawing ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploadingDrawing ? 'Uploading...' : 'Upload Drawing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. INVITE USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in text-slate-202">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white">Create User</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Invite a team member or client</p>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                  placeholder="sarah@example.com"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Platform Role *</label>
                <select
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-202 focus:outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="architect">Architect</option>
                  <option value="staff">Staff</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowUserModal(false)} className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
