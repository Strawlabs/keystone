import React, { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, Clock, Send, FileText, Calendar, User, ChevronRight, Download, Eye } from 'lucide-react';

export default function ApprovalCenterView({
  approvals,
  drawings,
  users,
  currentUser,
  submitApproval,
  approveDrawing,
  rejectDrawing,
  setSelectedDrawingId,
  setTab,
  projects,
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({ drawing_id: '', client_id: '', comments: '', due_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewingApproval, setReviewingApproval] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isArchitect = currentUser?.role === 'architect';
  const isClient = currentUser?.role === 'client';

  const tabs = [
    { id: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/40' },
    { id: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/40' },
    { id: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-950/20 border-rose-900/40' },
    { id: 'revision_requested', label: 'Revision Requested', icon: RotateCcw, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/40' },
  ];

  const filteredApprovals = approvals.filter(a => {
    if (activeTab === 'revision_requested') return a.status === 'revision_requested';
    return a.status === activeTab;
  });

  const getDrawing = (id) => drawings.find(d => d.id === id);
  const getClient = (id) => users.find(u => u.id === id);
  const getStatusStyle = (status) => {
    if (status === 'pending') return 'text-amber-400 bg-amber-950/20 border-amber-900/40';
    if (status === 'approved') return 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40';
    if (status === 'rejected') return 'text-rose-400 bg-rose-950/20 border-rose-900/40';
    return 'text-blue-400 bg-blue-950/20 border-blue-900/40';
  };

  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await submitApproval({
      drawing_id: submitForm.drawing_id,
      client_id: submitForm.client_id,
      comments: submitForm.comments,
      due_date: submitForm.due_date || null,
    });
    setSubmitting(false);
    if (ok) {
      setShowSubmitModal(false);
      setSubmitForm({ drawing_id: '', client_id: '', comments: '', due_date: '' });
    }
  };

  const handleApprove = async (approvalId) => {
    const ok = await approveDrawing(approvalId, reviewComment || 'Approved by client.');
    if (ok) { setReviewingApproval(null); setReviewComment(''); }
  };

  const handleReject = async (approvalId, isRevision = false) => {
    const ok = await rejectDrawing(approvalId, reviewComment, isRevision);
    if (ok) { setReviewingApproval(null); setReviewComment(''); }
  };

  const clients = users.filter(u => u.role === 'client');

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Approval Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage drawing approval workflows and client responses.</p>
        </div>
        {(isAdmin || isArchitect) && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Approval</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
        {tabs.map(tab => {
          const count = approvals.filter(a => a.status === tab.id).length;
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : ''}`} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${isActive ? tab.bg + ' ' + tab.color : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Approval Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredApprovals.map(approval => {
          const drawing = getDrawing(approval.drawing_id);
          const client = getClient(approval.client_id);
          return (
            <div key={approval.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4 hover:border-slate-700 transition-all">
              
              {/* Drawing Info */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-950/30 border border-blue-900/40 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-white leading-snug truncate">{drawing?.name || 'Untitled Drawing'}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{drawing?.category || '—'} · Rev {drawing?.current_revision || 1}</p>
                </div>
                <span className={`text-[8px] px-2 py-0.5 font-bold uppercase rounded border shrink-0 ${getStatusStyle(approval.status)}`}>
                  {approval.status.replace('_', ' ')}
                </span>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-600" />
                  <span className="truncate">{client?.name || 'Client'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  <span>{new Date(approval.submitted_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Comments */}
              {approval.comments && (
                <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-950/40 border border-slate-850 rounded-lg p-2.5 line-clamp-2">
                  "{approval.comments}"
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={() => { setSelectedDrawingId(drawing?.id); setTab('drawings'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Drawing
                </button>

                {isClient && approval.status === 'pending' && (
                  <button
                    onClick={() => setReviewingApproval(approval)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white transition-all cursor-pointer shadow-sm shadow-blue-600/20"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    Review
                  </button>
                )}

                {drawing?.file_url && (
                  <a
                    href={drawing.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {filteredApprovals.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            <Clock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No {activeTab.replace('_', ' ')} approvals</p>
            <p className="text-xs text-slate-700 mt-1">
              {activeTab === 'pending' && (isAdmin || isArchitect) ? 'Submit a drawing for client approval to get started.' : 'Nothing here yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Client Review Modal */}
      {reviewingApproval && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white">Review Drawing</h3>
              <button onClick={() => { setReviewingApproval(null); setReviewComment(''); }} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Drawing</p>
              <p className="text-xs font-bold text-white mt-0.5">{getDrawing(reviewingApproval.drawing_id)?.name}</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Comments</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Add your feedback or notes..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleReject(reviewingApproval.id, false)}
                className="py-2.5 px-3 rounded-lg bg-rose-950/30 border border-rose-900/50 hover:bg-rose-600 text-xs font-bold text-rose-400 hover:text-white transition-all cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={() => handleReject(reviewingApproval.id, true)}
                className="py-2.5 px-3 rounded-lg bg-amber-950/20 border border-amber-900/40 hover:bg-amber-500 text-xs font-bold text-amber-400 hover:text-slate-950 transition-all cursor-pointer"
              >
                Request Revision
              </button>
              <button
                onClick={() => handleApprove(reviewingApproval.id)}
                className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit for Approval Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white">Submit Drawing for Approval</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmitApproval} className="space-y-4 text-xs">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Select Drawing *</label>
                <select
                  required
                  value={submitForm.drawing_id}
                  onChange={e => setSubmitForm({ ...submitForm, drawing_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- Select a Drawing --</option>
                  {drawings.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Select Client *</label>
                <select
                  required
                  value={submitForm.client_id}
                  onChange={e => setSubmitForm({ ...submitForm, client_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Comments / Notes</label>
                <textarea
                  rows={3}
                  value={submitForm.comments}
                  onChange={e => setSubmitForm({ ...submitForm, comments: e.target.value })}
                  placeholder="Describe what the client should review..."
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Due Date (Optional)</label>
                <input
                  type="date"
                  value={submitForm.due_date}
                  onChange={e => setSubmitForm({ ...submitForm, due_date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-60"
                >
                  {submitting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Approval Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
