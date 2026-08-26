import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  X,
  ArrowRightCircle,
  AlertTriangle,
  ShieldAlert,
  MessageSquareText,
} from 'lucide-react';
import { STATUS_CONFIG, formatDate, getCategoryLabel } from './wardenComplaintConstants';

const WardenComplaintDetailModal = React.memo(({
  complaint,
  onClose,
  onUpdateStatus,
  isUpdating,
}) => {
  const [responseText, setResponseText] = useState(complaint.response || '');
  const [rejectError, setRejectError] = useState('');
  const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;

  const handleResolve = () => {
    onUpdateStatus(complaint.id, 'warden-resolved', responseText.trim() || null, complaint);
  };

  const handleReject = () => {
    if (responseText.trim().length < 5) {
      setRejectError('A rejection reason is required before you can reject this complaint.');
      return;
    }
    onUpdateStatus(complaint.id, 'rejected', responseText.trim(), complaint);
  };

  const handleMarkInProgress = () => {
    onUpdateStatus(complaint.id, 'in-progress', responseText.trim() || null, complaint);
  };

  return (
    <div className="warden-modal-backdrop" onClick={onClose}>
      <div className="warden-modal" onClick={(e) => e.stopPropagation()}>
        <div className="warden-modal-header">
          <h3>Complaint Details</h3>
          <button className="warden-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="warden-modal-body">
          {/* Status */}
          <div className="warden-detail-row">
            <span className="warden-detail-label">Status</span>
            <div style={{ marginTop: '0.25rem' }}>
              <div className={`warden-status ${statusCfg.className}`}>
                <span className="warden-status-dot" />
                {statusCfg.label}
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="warden-detail-row">
            <span className="warden-detail-label">Student</span>
            <span className="warden-detail-value">
              {complaint.studentName || 'Unknown Student'}
              {complaint.studentEmail && <> · {complaint.studentEmail}</>}
            </span>
          </div>

          {complaint.roomNumber && (
            <div className="warden-detail-row">
              <span className="warden-detail-label">Room Number</span>
              <span className="warden-detail-value">{complaint.roomNumber}</span>
            </div>
          )}

          {/* Title */}
          <div className="warden-detail-row">
            <span className="warden-detail-label">Title</span>
            <span className="warden-detail-value" style={{ fontWeight: 600 }}>
              {complaint.title}
            </span>
          </div>

          {/* Category */}
          <div className="warden-detail-row">
            <span className="warden-detail-label">Category</span>
            <span className="warden-detail-value">
              {getCategoryLabel(complaint.category)}
            </span>
          </div>

          {/* Description */}
          <div className="warden-detail-row">
            <span className="warden-detail-label">Description</span>
            <span className="warden-detail-value" style={{ whiteSpace: 'pre-wrap' }}>
              {complaint.description}
            </span>
          </div>

          {/* Date */}
          <div className="warden-detail-row">
            <span className="warden-detail-label">Filed on</span>
            <span className="warden-detail-value">
              {formatDate(complaint.createdAt)}
            </span>
          </div>

          {/* Image */}
          {complaint.imageUrl && (
            <div className="warden-detail-row">
              <span className="warden-detail-label">Attached Image</span>
              <div className="warden-detail-image">
                <img src={complaint.imageUrl} alt="Complaint attachment" />
              </div>
            </div>
          )}

          {/* Response Form — show for pending, in-progress, and disputed */}
          {(complaint.status === 'pending' || complaint.status === 'in-progress' || complaint.status === 'disputed') && (
            <div className={`warden-response-form ${complaint.status === 'disputed' ? 'warden-response-disputed' : ''}`}>
              {/* Dispute alert in modal */}
              {complaint.status === 'disputed' && (
                <div className="warden-modal-dispute-alert">
                  <div className="warden-modal-dispute-header">
                    <ShieldAlert size={16} />
                    <strong>Student Disputed Your Resolution!</strong>
                  </div>
                  {complaint.disputeReason && (
                    <p className="warden-modal-dispute-reason">
                      Student says: &ldquo;{complaint.disputeReason}&rdquo;
                    </p>
                  )}
                  <p className="warden-modal-dispute-warning">
                    <AlertTriangle size={12} />
                    If you don&apos;t respond within 48 hours, this complaint will be automatically escalated to management.
                  </p>
                </div>
              )}

              <label>
                <MessageSquareText size={14} />
                {complaint.status === 'disputed' ? 'Respond to Dispute' : 'Add a Response'}
              </label>
              <textarea
                className="warden-response-textarea"
                placeholder={complaint.status === 'disputed'
                  ? "Address the student's concern and explain what action you've taken..."
                  : complaint.status === 'pending'
                    ? "Type your response — a reason is required if you reject…"
                    : "Type your response to the student…"
                }
                value={responseText}
                onChange={(e) => {
                  setResponseText(e.target.value);
                  if (rejectError) setRejectError('');
                }}
                maxLength={500}
                style={rejectError ? { borderColor: '#ef4444' } : undefined}
              />
              {rejectError && (
                <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginTop: '0.25rem' }}>
                  {rejectError}
                </p>
              )}
              <div className="warden-response-actions">
                {complaint.status === 'pending' && (
                  <button
                    className="warden-response-submit"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                    onClick={handleMarkInProgress}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 size={14} className="warden-spinner" /> : <ArrowRightCircle size={14} />}
                    Mark In Progress
                  </button>
                )}
                <button
                  className="warden-response-submit resolve"
                  onClick={handleResolve}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 size={14} className="warden-spinner" /> : <CheckCircle2 size={14} />}
                  {complaint.status === 'disputed' ? 'Re-Resolve (Send for Review)' : 'Resolve'}
                </button>
                {complaint.status !== 'disputed' && (
                  <button
                    className="warden-response-submit reject"
                    onClick={handleReject}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 size={14} className="warden-spinner" /> : <XCircle size={14} />}
                    Reject
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Show existing response if resolved/rejected/warden-resolved */}
          {(complaint.status === 'resolved' || complaint.status === 'rejected' || complaint.status === 'warden-resolved') && complaint.response && (
            <div className="warden-response-form" style={{ borderColor: complaint.status === 'resolved' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
              <label>
                <MessageSquareText size={14} />
                Response Sent
              </label>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {complaint.response}
              </p>
              {complaint.respondedBy && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  — {complaint.respondedBy}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

WardenComplaintDetailModal.displayName = 'WardenComplaintDetailModal';

export default WardenComplaintDetailModal;
