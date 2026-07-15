import React, { useState } from 'react';

const STATUS_BADGE_STYLES = {
  pending: 'bg-warning/10 text-warning border border-warning/20',
  approved: 'bg-success/10 text-success border border-success/20',
  rejected: 'bg-error/10 text-error border border-error/20',
  revision_requested: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
};

// Stable mock images to match Stitch screenshots
const MOCK_BLUEPRINTS = [
  'https://images.unsplash.com/photo-1503387762-592dedbd82d2?w=600',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600',
];

const getMockImage = (id) => {
  let hash = 0;
  if (id) {
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  return MOCK_BLUEPRINTS[Math.abs(hash) % MOCK_BLUEPRINTS.length];
};

export default function ApprovalCenterView({
  approvals = [],
  drawings = [],
  users = [],
  currentUser,
  submitApproval,
  approveDrawing,
  rejectDrawing,
  requestRevision,
  setSelectedDrawingId,
  setTab,
  projects = [],
  activityLogs = [],
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({ drawing_id: '', client_id: '', comments: '', due_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewingApproval, setReviewingApproval] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const isAdmin = currentUser?.role === 'admin';
  const isArchitect = currentUser?.role === 'architect';
  const isClient = currentUser?.role === 'client';
  const canReview = isClient || isAdmin || isArchitect || !currentUser;

  const filteredApprovals = approvals.filter(a => {
    if (activeTab === 'revision_requested') return a.status === 'revision_requested';
    return a.status === activeTab;
  });

  const getDrawing = (id) => drawings.find(d => d.id === id);
  const getClient = (id) => users.find(u => u.id === id);
  const getSubmitter = (id) => users.find(u => u.id === id);

  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await submitApproval({
      drawing_id: submitForm.drawing_id,
      client_id: submitForm.client_id,
      comments: submitForm.comments,
      submission_notes: submitForm.comments,
      due_date: submitForm.due_date || null,
    });
    setSubmitting(false);
    if (ok) {
      setShowSubmitModal(false);
      setSubmitForm({ drawing_id: '', client_id: '', comments: '', due_date: '' });
    }
  };

  const handleApprove = async (approvalId) => {
    const ok = await approveDrawing(approvalId, reviewComment || 'Approved by client. Looks complete.');
    if (ok) {
      setReviewingApproval(null);
      setReviewComment('');
    }
  };

  const handleReject = async (approvalId, isRevision = false) => {
    const fn = isRevision && requestRevision ? requestRevision : rejectDrawing;
    const ok = await fn(approvalId, reviewComment || (isRevision ? 'Revision needed.' : 'Rejected.'), isRevision);
    if (ok) {
      setReviewingApproval(null);
      setReviewComment('');
    }
  };

  const getWaitingDays = (submittedAt) => {
    if (!submittedAt) return 1;
    const diff = Date.now() - new Date(submittedAt).getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const getApprovalAuditTrail = (approval) => {
    if (!approval) return [];
    const logs = activityLogs.filter(l => l.entity_type === 'approval' && l.entity_id === approval.id);
    if (logs.length > 0) {
      return logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    // Fallback timeline from approval timestamps if logs not loaded
    const timeline = [];
    if (approval.responded_at) {
      timeline.push({
        id: 'resp-' + approval.id,
        action: approval.status === 'approved' ? 'Drawing Approved' : approval.status === 'rejected' ? 'Drawing Rejected' : 'Revision Requested',
        created_at: approval.responded_at,
        user_id: approval.client_id,
        metadata: { comments: approval.comments }
      });
    }
    timeline.push({
      id: 'sub-' + approval.id,
      action: 'Approval Requested',
      created_at: approval.submitted_at || new Date().toISOString(),
      user_id: approval.submitted_by,
      metadata: { submissionNotes: approval.submission_notes || approval.comments, dueDate: approval.due_date }
    });
    return timeline;
  };

  // Pagination
  const totalItems = filteredApprovals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedApprovals = filteredApprovals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clientUsers = users.filter(u => u.role === 'client');
  const clients = clientUsers.length > 0 ? clientUsers : users;

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-label-md text-secondary mb-2">
            <span>Studio</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Approval Center</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-ink-black font-bold">Approval Center</h2>
          <p className="text-body-md text-secondary mt-1 font-medium">
            Manage drawing approval workflows, client sign-offs, and design feedback loops.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(isAdmin || isArchitect) && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-primary text-white px-5 py-2.5 rounded-lg text-body-md font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              Submit for Approval
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-border-subtle pb-px">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'pending', label: 'Pending', countColor: 'bg-warning/10 text-warning' },
            { id: 'approved', label: 'Approved', countColor: 'bg-success/10 text-success' },
            { id: 'rejected', label: 'Rejected', countColor: 'bg-error/10 text-error' },
            { id: 'revision_requested', label: 'Revision Requested', countColor: 'bg-tertiary/10 text-tertiary' },
          ].map((tab) => {
            const count = approvals.filter(a => a.status === tab.id).length;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-1 py-4 text-body-md font-semibold transition-all relative flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-primary border-primary font-bold'
                    : 'text-secondary border-transparent hover:text-primary'
                }`}
              >
                <span>{tab.label === 'revision_requested' ? 'Revision Req.' : tab.label}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab.countColor}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Approvals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedApprovals.map((approval) => {
          const drawing = getDrawing(approval.drawing_id) || approval.drawings || approval.drawing;
          const client = getClient(approval.client_id);
          const submitter = getSubmitter(approval.submitted_by);
          const waitingDays = getWaitingDays(approval.submitted_at);
          const mockImg = getMockImage(approval.id);
          const isOverdue = approval.due_date && new Date(approval.due_date) < new Date() && approval.status === 'pending';

          return (
            <div
              key={approval.id}
              className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden hover:shadow-xl hover:shadow-black/5 transition-all duration-300 flex flex-col h-full shadow-sm group"
            >
              {/* Image Header */}
              <div className="relative h-48 bg-surface-container-high overflow-hidden shrink-0">
                <img
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  src={drawing?.file_url || mockImg}
                  alt={drawing?.name || 'Blueprint drawing'}
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {isOverdue && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-error text-white uppercase tracking-wider shadow-sm animate-pulse">
                      Overdue
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-label-sm font-bold shadow-sm uppercase tracking-wider backdrop-blur-md ${STATUS_BADGE_STYLES[approval.status] || STATUS_BADGE_STYLES.pending}`}>
                    {approval.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-body-lg text-ink-black line-clamp-1 mb-1" title={drawing?.name}>
                    {drawing?.name || 'Untitled Drawing'}
                  </h3>
                  <p className="text-label-md text-primary font-bold uppercase tracking-wider mb-4">
                    Project: {drawing?.project_name || 'General Project'}
                  </p>

                  <div className="space-y-2.5 mb-5 text-xs text-secondary font-medium">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      <span>
                        Client: <span className="text-on-surface font-bold">{client?.name || '—'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">architecture</span>
                      <span>
                        Submitted by: <span className="text-on-surface font-bold">{submitter?.name || 'Architect'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      <span>
                        Submitted:{' '}
                        <span className="text-on-surface font-bold">
                          {new Date(approval.submitted_at || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                    </div>
                    {approval.due_date && (
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px] text-primary">event</span>
                        <span>
                          Due Date:{' '}
                          <span className={`font-bold ${isOverdue ? 'text-error' : 'text-on-surface'}`}>
                            {new Date(approval.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        </span>
                      </div>
                    )}
                    {approval.status === 'pending' && (
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        <span>
                          Waiting:{' '}
                          <span className="text-warning font-bold">
                            {waitingDays} {waitingDays === 1 ? 'day' : 'days'}
                          </span>
                        </span>
                      </div>
                    )}
                    {approval.responded_at && (
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px]">fact_check</span>
                        <span>
                          Reviewed:{' '}
                          <span className="text-on-surface font-bold">
                            {new Date(approval.responded_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {approval.submission_notes && (
                    <div className="bg-surface-container-low border border-border-subtle rounded-lg p-3 text-[11px] text-secondary italic leading-relaxed mb-3">
                      <span className="font-bold not-italic block text-label-xs uppercase tracking-wider text-primary mb-1">Architect Notes:</span>
                      "{approval.submission_notes}"
                    </div>
                  )}

                  {approval.comments && approval.comments !== approval.submission_notes && (
                    <div className="bg-surface-container-low border border-border-subtle rounded-lg p-3 text-[11px] text-secondary italic leading-relaxed mb-5">
                      <span className="font-bold not-italic block text-label-xs uppercase tracking-wider text-ink-black mb-1">Review Response:</span>
                      "{approval.comments}"
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-border-subtle">
                  {canReview && (approval.status === 'pending' || approval.status === 'revision_requested') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(approval.id)}
                        className="flex-1 bg-success hover:bg-success/90 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
                        title="Quick Approve Sheet"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Approve
                      </button>
                      <button
                        onClick={() => setReviewingApproval(approval)}
                        className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-primary-container transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
                        title="Review / Request Revision"
                      >
                        <span className="material-symbols-outlined text-[16px]">rate_review</span>
                        Review
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setReviewingApproval(approval)}
                      className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      Audit Trail & Details
                    </button>

                    <button
                      onClick={() => {
                        if (drawing?.id) {
                          setSelectedDrawingId(drawing.id);
                          setTab('blueprint-review');
                        }
                      }}
                      className="px-3 border border-border-subtle hover:bg-surface-container text-secondary py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                      title="View Blueprint & Drop Pins"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>

                    {drawing?.file_url && (
                      <a
                        href={drawing.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 border border-border-subtle rounded-lg text-secondary hover:bg-surface-container flex items-center justify-center transition-colors"
                        title="Download Sheet"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredApprovals.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-border-subtle rounded-xl bg-surface-container-low/30">
            <span className="material-symbols-outlined text-[40px] text-secondary mb-3">schedule</span>
            <p className="text-sm font-bold text-on-surface">No {activeTab.replace('_', ' ')} approvals found</p>
            <p className="text-xs text-secondary mt-1">
              {activeTab === 'pending' && (isAdmin || isArchitect)
                ? 'Submit a blueprint sheet for client approval to get started.'
                : 'There are no items matching this approval state.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Stats Row */}
      {filteredApprovals.length > 0 && (
        <footer className="py-8 border-t border-border-subtle flex flex-wrap gap-8 items-center justify-between text-secondary">
          <div className="flex gap-12 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Average Approval Time</p>
              <p className="text-headline-md font-bold text-ink-black">4.2 Days</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Approval Rate</p>
              <p className="text-headline-md font-bold text-success">92%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Total Outstanding</p>
              <p className="text-headline-md font-bold text-ink-black">
                {approvals.filter(a => a.status === 'pending').length} Items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-body-md font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-border-subtle rounded-lg hover:bg-surface-container disabled:opacity-30 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-border-subtle rounded-lg hover:bg-surface-container disabled:opacity-30 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Client Review & Audit Trail Modal */}
      {reviewingApproval && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 animate-scale-up text-on-surface max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3 sticky top-0 bg-surface-container-lowest z-10">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-label-sm font-bold uppercase tracking-wider ${STATUS_BADGE_STYLES[reviewingApproval.status] || STATUS_BADGE_STYLES.pending}`}>
                  {reviewingApproval.status.replace('_', ' ')}
                </span>
                <h3 className="text-body-lg font-bold text-ink-black">
                  {getDrawing(reviewingApproval.drawing_id)?.name || 'Drawing Details'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setReviewingApproval(null);
                  setReviewComment('');
                }}
                className="text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawing Preview Sheet */}
            <div className="relative h-64 bg-surface-container-high rounded-xl overflow-hidden border border-border-subtle flex items-center justify-center group">
              <img
                src={getDrawing(reviewingApproval.drawing_id)?.file_url || getMockImage(reviewingApproval.id)}
                alt="Blueprint sheet"
                className="w-full h-full object-contain bg-slate-900"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                {getDrawing(reviewingApproval.drawing_id)?.file_url && (
                  <a
                    href={getDrawing(reviewingApproval.drawing_id).file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-ink-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-100 shadow-md"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Full Screen Sheet
                  </a>
                )}
              </div>
            </div>

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-surface-container-low border border-border-subtle rounded-xl text-xs">
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Submitted By</p>
                <p className="font-bold text-ink-black">{getSubmitter(reviewingApproval.submitted_by)?.name || 'Architect'}</p>
                <p className="text-[10px] text-secondary">
                  {new Date(reviewingApproval.submitted_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Client Reviewer</p>
                <p className="font-bold text-ink-black">{getClient(reviewingApproval.client_id)?.name || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Due Date</p>
                <p className={`font-bold ${reviewingApproval.due_date && new Date(reviewingApproval.due_date) < new Date() && reviewingApproval.status === 'pending' ? 'text-error' : 'text-ink-black'}`}>
                  {reviewingApproval.due_date ? new Date(reviewingApproval.due_date).toLocaleDateString() : 'No due date'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Responded Date</p>
                <p className="font-bold text-ink-black">
                  {reviewingApproval.responded_at ? new Date(reviewingApproval.responded_at).toLocaleDateString() : 'Pending review'}
                </p>
              </div>
            </div>

            {/* Submission & Review Notes */}
            <div className="space-y-3">
              {reviewingApproval.submission_notes && (
                <div className="p-3 bg-surface border border-border-subtle rounded-lg text-xs">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">Architect Submission Notes:</span>
                  <p className="text-secondary italic">"{reviewingApproval.submission_notes}"</p>
                </div>
              )}

              {reviewingApproval.comments && reviewingApproval.comments !== reviewingApproval.submission_notes && (
                <div className="p-3 bg-surface border border-border-subtle rounded-lg text-xs">
                  <span className="text-[10px] font-bold text-ink-black uppercase tracking-wider block mb-1">Client Feedback / Remarks:</span>
                  <p className="text-secondary italic">"{reviewingApproval.comments}"</p>
                </div>
              )}
            </div>

            {/* Audit Trail Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">timeline</span>
                Full Approval Audit Trail & Actions
              </h4>
              <div className="border-l-2 border-primary/20 pl-4 space-y-4 my-2">
                {getApprovalAuditTrail(reviewingApproval).map((item, idx) => {
                  const userName = users.find(u => u.id === item.user_id)?.name || (item.user_id === reviewingApproval.client_id ? getClient(reviewingApproval.client_id)?.name : getSubmitter(reviewingApproval.submitted_by)?.name) || 'User';
                  return (
                    <div key={item.id || idx} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm" />
                      <div className="flex items-center justify-between font-bold text-ink-black">
                        <span>{item.action}</span>
                        <span className="text-[10px] font-normal text-secondary">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-secondary mt-0.5">
                        By: <span className="font-semibold text-on-surface">{userName}</span>
                      </p>
                      {item.metadata && (item.metadata.comments || item.metadata.submissionNotes) && (
                        <p className="text-secondary/80 italic mt-1 bg-surface-container-low p-2 rounded border border-border-subtle">
                          "{item.metadata.comments || item.metadata.submissionNotes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Client Interactive Action Box when pending or revision requested */}
            {canReview && (reviewingApproval.status === 'pending' || reviewingApproval.status === 'revision_requested' || reviewingApproval.status === 'rejected') && (
              <div className="border-t border-border-subtle pt-4 space-y-3">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                  Your Review Remarks / Feedback Comments
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Enter approval details, remarks, or specific changes required for revision..."
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-xs text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => handleReject(reviewingApproval.id, false)}
                    className="py-2.5 px-3 rounded-lg bg-error/10 hover:bg-error border border-error/20 hover:text-white text-xs font-bold text-error transition-all cursor-pointer"
                  >
                    Reject Sheet
                  </button>
                  <button
                    onClick={() => handleReject(reviewingApproval.id, true)}
                    className="py-2.5 px-3 rounded-lg bg-tertiary/10 hover:bg-tertiary border border-tertiary/20 hover:text-white text-xs font-bold text-tertiary transition-all cursor-pointer"
                  >
                    Need Revision
                  </button>
                  <button
                    onClick={() => handleApprove(reviewingApproval.id)}
                    className="py-2.5 px-3 rounded-lg bg-primary hover:bg-primary-container text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
                  >
                    Approve Sheet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit for Approval Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scale-up text-on-surface">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <h3 className="text-body-lg font-bold text-ink-black">Submit Blueprint for Approval</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitApproval} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Select Drawing Sheet *
                </label>
                <select
                  required
                  value={submitForm.drawing_id}
                  onChange={(e) => setSubmitForm({ ...submitForm, drawing_id: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs cursor-pointer"
                >
                  <option value="">-- Choose Blueprint Drawing --</option>
                  {drawings.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Select Target Client *
                </label>
                <select
                  required
                  value={submitForm.client_id}
                  onChange={(e) => setSubmitForm({ ...submitForm, client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs cursor-pointer"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Description / Submission Notes
                </label>
                <textarea
                  rows={3}
                  value={submitForm.comments}
                  onChange={(e) => setSubmitForm({ ...submitForm, comments: e.target.value })}
                  placeholder="Describe what parts of the document need reviews..."
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={submitForm.due_date}
                  onChange={(e) => setSubmitForm({ ...submitForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="py-2 px-4 rounded-lg bg-surface hover:bg-surface-container border border-border-subtle font-bold text-secondary text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 py-2 px-6 rounded-lg bg-primary hover:bg-primary-container text-white font-bold text-xs cursor-pointer transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  )}
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
