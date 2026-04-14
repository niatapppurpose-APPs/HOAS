import { useState, useEffect, memo } from 'react';
import {
    X,
    MessageSquareText,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    ShieldAlert,
    Clock,
} from 'lucide-react';
import { STATUS_CONFIG, formatDate, getCategoryLabel } from './complaintConstants';
import ContextChatBox from '../../../../components/ContextChat/ContextChatBox';

const ComplaintDetailModal = memo(({
    complaint,
    onClose,
    isReviewing,
    showDisputeModal,
    setShowDisputeModal,
    onAcceptResolution,
    onDisputeResolution,
}) => {
    const [disputeReason, setDisputeReason] = useState('');

    // Reset dispute reason when modal opens for a different complaint
    useEffect(() => {
        setDisputeReason('');
    }, [complaint?.id]);

    if (!complaint) return null;

    const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;

    return (
        <div className="complaint-modal-backdrop" onClick={onClose}>
            <div className="complaint-modal" onClick={(e) => e.stopPropagation()}>
                <div className="complaint-modal-header">
                    <h3>Complaint Details</h3>
                    <button className="complaint-modal-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="complaint-modal-body">
                    {/* Status */}
                    <div className="complaint-detail-row">
                        <span className="complaint-detail-label">Status</span>
                        <div style={{ marginTop: '0.25rem' }}>
                            <div className={`complaint-status ${statusCfg.className}`}>
                                <span className="complaint-status-dot" />
                                {statusCfg.label}
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="complaint-detail-row">
                        <span className="complaint-detail-label">Title</span>
                        <span className="complaint-detail-value" style={{ fontWeight: 600 }}>
                            {complaint.title}
                        </span>
                    </div>

                    {/* Category */}
                    <div className="complaint-detail-row">
                        <span className="complaint-detail-label">Category</span>
                        <span className="complaint-detail-value">
                            {getCategoryLabel(complaint.category)}
                        </span>
                    </div>

                    {/* Description */}
                    <div className="complaint-detail-row">
                        <span className="complaint-detail-label">Description</span>
                        <span className="complaint-detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                            {complaint.description}
                        </span>
                    </div>

                    {/* Date */}
                    <div className="complaint-detail-row">
                        <span className="complaint-detail-label">Filed on</span>
                        <span className="complaint-detail-value">
                            {formatDate(complaint.createdAt)}
                        </span>
                    </div>

                    {/* Attached Image */}
                    {complaint.imageUrl && (
                        <div className="complaint-detail-row">
                            <span className="complaint-detail-label">Attached Image</span>
                            <div className="complaint-detail-image">
                                <img src={complaint.imageUrl} alt="Complaint attachment" />
                            </div>
                        </div>
                    )}

                    {/* Response from hostel */}
                    {complaint.response && (
                        <div className="complaint-response-card">
                            <h4>
                                <MessageSquareText size={14} />
                                Response from Hostel
                            </h4>
                            <p>{complaint.response}</p>
                            {complaint.respondedBy && (
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    — {complaint.respondedBy}
                                </p>
                            )}
                        </div>
                    )}

                    <ContextChatBox
                        contextType="complaint"
                        contextId={complaint.id}
                        title="Complaint Context Chat"
                    />

                    {/* ── Review Section (Warden-Resolved) ── */}
                    {complaint.status === 'warden-resolved' && !showDisputeModal && (
                        <div className="complaint-review-section">
                            <div className="complaint-review-header">
                                <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                                <h4>Review Required</h4>
                            </div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                The warden has marked this complaint as resolved. Please verify if your issue has actually been fixed.
                            </p>
                            <div className="complaint-review-modal-actions">
                                <button
                                    className="complaint-review-btn complaint-btn-accept"
                                    onClick={() => onAcceptResolution(complaint)}
                                    disabled={isReviewing}
                                >
                                    {isReviewing ? <Loader2 size={14} className="complaints-spinner" /> : <ThumbsUp size={14} />}
                                    Yes, Issue is Resolved
                                </button>
                                <button
                                    className="complaint-review-btn complaint-btn-dispute"
                                    onClick={() => setShowDisputeModal(true)}
                                    disabled={isReviewing}
                                >
                                    <ThumbsDown size={14} />
                                    No, Issue is NOT Resolved
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Dispute Form (within modal) ── */}
                    {showDisputeModal && complaint.status === 'warden-resolved' && (
                        <div className="complaint-dispute-form">
                            <div className="complaint-review-header">
                                <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                                <h4>Dispute Resolution</h4>
                            </div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                Explain why the issue is not resolved. This will be sent to the warden as an urgent alert.
                                {complaint.disputeCount > 0 && (
                                    <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                        {' '}(Disputed {complaint.disputeCount} time{complaint.disputeCount !== 1 ? 's' : ''} before)
                                    </span>
                                )}
                            </p>
                            <textarea
                                className="complaint-dispute-textarea"
                                placeholder="Describe why the issue is still not resolved..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                maxLength={500}
                            />
                            <span className="complaints-char-count">{disputeReason.length}/500</span>
                            <div className="complaint-review-modal-actions" style={{ marginTop: '0.5rem' }}>
                                <button
                                    className="complaint-review-btn complaint-btn-dispute"
                                    onClick={() => onDisputeResolution(complaint, disputeReason)}
                                    disabled={isReviewing || !disputeReason.trim()}
                                >
                                    {isReviewing ? <Loader2 size={14} className="complaints-spinner" /> : <ShieldAlert size={14} />}
                                    Submit Dispute
                                </button>
                                <button
                                    className="complaint-review-btn"
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                    onClick={() => { setShowDisputeModal(false); setDisputeReason(''); }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Dispute Info (when already disputed) ── */}
                    {complaint.status === 'disputed' && complaint.disputeReason && (
                        <div className="complaint-dispute-info">
                            <div className="complaint-review-header">
                                <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                                <h4>Your Dispute</h4>
                            </div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                &ldquo;{complaint.disputeReason}&rdquo;
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, marginTop: '0.5rem' }}>
                                Waiting for warden to respond. If no response within 48 hours, this will be escalated to management automatically.
                            </p>
                        </div>
                    )}

                    {/* ── Escalation Info ── */}
                    {complaint.status === 'escalated' && (
                        <div className="complaint-escalated-info">
                            <div className="complaint-review-header">
                                <AlertTriangle size={16} style={{ color: '#dc2626' }} />
                                <h4>Escalated to Management</h4>
                            </div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                {complaint.escalationReason || 'This complaint has been escalated to management for review.'}
                            </p>
                        </div>
                    )}

                    {/* ── Complaint History Timeline ── */}
                    {complaint.complaintHistory && complaint.complaintHistory.length > 0 && (
                        <div className="complaint-history-section">
                            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                Complaint Timeline
                            </h4>
                            <div className="complaint-timeline">
                                {complaint.complaintHistory.map((entry, idx) => (
                                    <div className="complaint-timeline-item" key={idx}>
                                        <div className="complaint-timeline-dot" />
                                        <div className="complaint-timeline-content">
                                            <span className="complaint-timeline-action">
                                                {entry.action === 'created' && 'Complaint Filed'}
                                                {entry.action === 'warden_resolved' && 'Warden Marked Resolved'}
                                                {entry.action === 'student_accepted' && 'Student Accepted Resolution'}
                                                {entry.action === 'student_disputed' && 'Student Disputed Resolution'}
                                                {entry.action === 'auto_escalated' && 'Auto-Escalated to Management'}
                                            </span>
                                            {entry.reason && (
                                                <span className="complaint-timeline-reason">{entry.reason}</span>
                                            )}
                                            <span className="complaint-timeline-time">
                                                {new Date(entry.timestamp).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

ComplaintDetailModal.displayName = 'ComplaintDetailModal';

export default ComplaintDetailModal;
