import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import WardenHeader from '../layout/WardenHeader';
import { STATUS_CONFIG, FILTER_OPTIONS, formatDate, getCategoryLabel } from './wardenComplaintConstants';
import WardenComplaintDetailModal from './WardenComplaintDetailModal';
import { getWardenComplaints, updateComplaintStatus } from '../../../../firebase/cloudFunctions';
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Tag,
    Calendar,
    Inbox,
    Eye,
    ChevronRight,
    User,
    ArrowRightCircle,
    ShieldAlert,
    Flag,
    MessageSquareText,
} from 'lucide-react';
import './WardenComplaints.css';


// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════
const WardenComplaints = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const toast = useToast();

    // ── State ────────────────────────────────────────────────
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState('');

    // ── Fetch complaints for this warden's college ───────────
    useEffect(() => {
        if (!userData?.collegeId) return;

        let cancelled = false;

        const load = async () => {
            try {
                const { complaints } = await getWardenComplaints();
                if (cancelled) return;
                const data = (complaints || []).map((c) => ({ id: c._id, ...c }));
                data.sort((a, b) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return timeB - timeA;
                });
                setComplaints(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching complaints:', err);
                toast.error('Failed to load complaints');
                setLoading(false);
            }
        };

        load();

        const interval = setInterval(load, 30000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [userData?.collegeId]);

    // ── Filtered (memoized) ─────────────────────────────────────────
    const filteredComplaints = useMemo(() =>
        activeFilter === 'all'
            ? complaints
            : complaints.filter((c) => c.status === activeFilter),
        [complaints, activeFilter]
    );

    // ── Stats (memoized) ────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: complaints.length,
        pending: complaints.filter((c) => c.status === 'pending').length,
        inProgress: complaints.filter((c) => c.status === 'in-progress').length,
        resolved: complaints.filter((c) => c.status === 'resolved').length,
        disputed: complaints.filter((c) => c.status === 'disputed').length,
        wardenResolved: complaints.filter((c) => c.status === 'warden-resolved').length,
    }), [complaints]);

    // ── Update complaint status ──────────────────────────────
    const updateStatus = async (complaintId, newStatus, response = null, complaint = null) => {
        setIsUpdating(true);
        try {
            await updateComplaintStatus(complaintId, newStatus, response || '');
            toast.success(
                newStatus === 'warden-resolved'
                    ? 'Marked as resolved — waiting for student confirmation'
                    : `Complaint marked as ${newStatus}`
            );

            // If modal is open, update it
            if (selectedComplaint?.id === complaintId) {
                setSelectedComplaint((prev) => ({ ...prev, status: newStatus, response: response || prev?.response }));
            }
        } catch (err) {
            console.error('Error updating complaint:', err);
            toast.error('Failed to update complaint. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    // ── Quick Actions inline ─────────────────────────────────
    const handleMarkInProgress = (e, complaint) => {
        e.stopPropagation();
        updateStatus(complaint.id, 'in-progress', null, complaint);
    };

    const handleResolve = (e, complaint) => {
        e.stopPropagation();
        updateStatus(complaint.id, 'warden-resolved', null, complaint);
    };

    const handleReject = (e, complaint) => {
        e.stopPropagation();
        setRejectTarget(complaint);
        setRejectReason('');
        setRejectError('');
    };

    const confirmReject = async () => {
        const reason = rejectReason.trim();
        if (reason.length < 5) {
            setRejectError('Please enter a clear reason (at least 5 characters).');
            return;
        }
        const complaint = rejectTarget;
        setRejectTarget(null);
        await updateStatus(complaint.id, 'rejected', reason, complaint);
    };

    // ── Modal handlers ───────────────────────────────────────
    const openDetail = (complaint) => setSelectedComplaint(complaint);
    const closeDetail = useCallback(() => setSelectedComplaint(null), []);

    // ══════════════════════════════════════════════════════════
    // Render
    // ══════════════════════════════════════════════════════════
    return (
        <>
            <WardenHeader
                title="Complaints · Warden Portal"
                pendingCount={stats.pending}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* ── Complaints Card ──────────────────────── */}
                <div className="warden-complaints-card">
                    <div className="warden-complaints-card-header">
                        <div
                            className="warden-complaints-card-header-icon"
                            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                        >
                            <Inbox size={16} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3>Student Complaints</h3>
                            <p>{complaints.length} complaint{complaints.length !== 1 ? 's' : ''} received</p>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="warden-filter-tabs">
                        {FILTER_OPTIONS.map((f) => (
                            <button
                                key={f.value}
                                className={`warden-filter-btn ${activeFilter === f.value ? 'active' : ''}`}
                                onClick={() => setActiveFilter(f.value)}
                            >
                                {f.label}
                                {f.value !== 'all' && (
                                    <> ({complaints.filter((c) => f.value === 'all' || c.status === f.value).length})</>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="warden-scroll" style={{ maxHeight: '600px', overflowY: 'scroll' }}>
                        {loading ? (
                            <div className="warden-empty">
                                <Loader2 size={32} className="warden-spinner" style={{ color: '#f97316' }} />
                                <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Loading complaints…</p>
                            </div>
                        ) : filteredComplaints.length === 0 ? (
                            <div className="warden-empty">
                                <div className="warden-empty-icon">
                                    <Inbox size={24} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <h4>No complaints found</h4>
                                <p>
                                    {activeFilter === 'all'
                                        ? 'No student complaints have been filed yet.'
                                        : `No ${activeFilter} complaints right now.`}
                                </p>
                            </div>
                        ) : (
                            filteredComplaints.map((complaint) => {
                                const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
                                const isDisputed = complaint.status === 'disputed';
                                return (
                                    <div className={`warden-complaint-item ${isDisputed ? 'warden-complaint-disputed' : ''}`} key={complaint.id}>
                                        {/* ── RED FLAG Banner for Disputed ── */}
                                        {isDisputed && (
                                            <div className="warden-red-flag-banner">
                                                <div className="warden-red-flag-icon-pulse" />
                                                <Flag size={14} />
                                                <span>STUDENT DISPUTED — Issue Not Resolved!</span>
                                            </div>
                                        )}

                                        <div className="warden-complaint-top">
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <span className="warden-complaint-title">{complaint.title}</span>
                                                <div className="warden-complaint-student">
                                                    <User size={11} />
                                                    {complaint.studentName || 'Student'}
                                                    {complaint.roomNumber && <> · Room {complaint.roomNumber}</>}
                                                </div>
                                            </div>
                                            <div className={`warden-status ${statusCfg.className}`}>
                                                <span className="warden-status-dot" />
                                                {statusCfg.label}
                                            </div>
                                        </div>

                                        {/* ── Dispute Reason ── */}
                                        {isDisputed && complaint.disputeReason && (
                                            <div className="warden-dispute-reason">
                                                <MessageSquareText size={12} />
                                                <span>Student says: &ldquo;{complaint.disputeReason}&rdquo;</span>
                                                {complaint.disputeCount > 1 && (
                                                    <span className="warden-dispute-count">
                                                        Disputed {complaint.disputeCount}x
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="warden-complaint-meta">
                                            <span className="warden-complaint-category">
                                                <Tag size={10} />
                                                {getCategoryLabel(complaint.category)}
                                            </span>
                                            <span className="warden-complaint-date">
                                                <Calendar size={10} />
                                                {formatDate(complaint.createdAt)}
                                            </span>
                                        </div>

                                        <div className="warden-complaint-actions">
                                            {/* Quick actions only for pending */}
                                            {complaint.status === 'pending' && (
                                                <>
                                                    <button
                                                        className="warden-action-btn warden-btn-progress"
                                                        onClick={(e) => handleMarkInProgress(e, complaint)}
                                                        disabled={isUpdating}
                                                    >
                                                        <ArrowRightCircle size={13} />
                                                        Mark In Progress
                                                    </button>
                                                    <button
                                                        className="warden-action-btn warden-btn-resolve"
                                                        onClick={(e) => handleResolve(e, complaint)}
                                                        disabled={isUpdating}
                                                    >
                                                        <CheckCircle2 size={13} />
                                                        Resolve
                                                    </button>
                                                    <button
                                                        className="warden-action-btn warden-btn-reject"
                                                        onClick={(e) => handleReject(e, complaint)}
                                                        disabled={isUpdating}
                                                    >
                                                        <XCircle size={13} />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {complaint.status === 'in-progress' && (
                                                <button
                                                    className="warden-action-btn warden-btn-resolve"
                                                    onClick={(e) => handleResolve(e, complaint)}
                                                    disabled={isUpdating}
                                                >
                                                    <CheckCircle2 size={13} />
                                                    Resolve
                                                </button>
                                            )}
                                            {/* Re-resolve button for disputed complaints */}
                                            {complaint.status === 'disputed' && (
                                                <button
                                                    className="warden-action-btn warden-btn-resolve"
                                                    onClick={(e) => handleResolve(e, complaint)}
                                                    disabled={isUpdating}
                                                >
                                                    <CheckCircle2 size={13} />
                                                    Re-Resolve (Send for Review)
                                                </button>
                                            )}
                                            {/* Awaiting student review indicator */}
                                            {complaint.status === 'warden-resolved' && (
                                                <span className="warden-awaiting-badge">
                                                    <Clock size={12} />
                                                    Waiting for student confirmation...
                                                </span>
                                            )}
                                            <button
                                                className="warden-action-btn warden-btn-view"
                                                onClick={() => openDetail(complaint)}
                                            >
                                                <Eye size={13} />
                                                View Details
                                                <ChevronRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* ── Detail / Response Modal ─────────────────── */}
            {selectedComplaint && (
                <WardenComplaintDetailModal
                    complaint={selectedComplaint}
                    onClose={closeDetail}
                    onUpdateStatus={updateStatus}
                    isUpdating={isUpdating}
                />
            )}

            {/* ── Rejection Reason Modal (mandatory) ──────── */}
            {rejectTarget && (
                <div
                    className="warden-modal-backdrop"
                    onClick={() => !isUpdating && setRejectTarget(null)}
                >
                    <div className="warden-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                        <div className="warden-modal-header">
                            <h3>Reject Complaint</h3>
                            <button className="warden-modal-close" onClick={() => setRejectTarget(null)}>
                                <XCircle size={16} />
                            </button>
                        </div>
                        <div className="warden-modal-body">
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                                You are rejecting <strong>&ldquo;{rejectTarget.title}&rdquo;</strong>. The student will see your reason — please be specific and respectful.
                            </p>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                <MessageSquareText size={14} />
                                Reason for rejection <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <textarea
                                className="warden-response-textarea"
                                placeholder="Explain why this complaint cannot be actioned (e.g. duplicate, not a hostel issue, policy restriction)…"
                                value={rejectReason}
                                onChange={(e) => {
                                    setRejectReason(e.target.value);
                                    if (rejectError) setRejectError('');
                                }}
                                maxLength={500}
                                rows={4}
                                autoFocus
                                style={rejectError ? { borderColor: '#ef4444' } : undefined}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{rejectError}</span>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{rejectReason.length}/500</span>
                            </div>
                            <div className="warden-response-actions" style={{ marginTop: '0.75rem' }}>
                                <button
                                    className="warden-response-submit"
                                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                                    onClick={() => setRejectTarget(null)}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="warden-response-submit reject"
                                    onClick={confirmReject}
                                    disabled={isUpdating || rejectReason.trim().length < 5}
                                >
                                    {isUpdating ? <Loader2 size={14} className="warden-spinner" /> : <XCircle size={14} />}
                                    Reject Complaint
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WardenComplaints;