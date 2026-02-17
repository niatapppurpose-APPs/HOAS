import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import WardenHeader from '../layout/WardenHeader';
import { db } from '../../../../firebase/firebaseConfig';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
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
    MessageSquareText,
    X,
    ArrowRightCircle,
} from 'lucide-react';
import './WardenComplaints.css';

// ── Config ───────────────────────────────────────────────────
const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        className: 'warden-status-pending',
    },
    'in-progress': {
        label: 'In Progress',
        className: 'warden-status-in-progress',
    },
    resolved: {
        label: 'Resolved',
        className: 'warden-status-resolved',
    },
    rejected: {
        label: 'Rejected',
        className: 'warden-status-rejected',
    },
};

const CATEGORIES = [
    { value: 'maintenance', label: '🔧 Maintenance & Repairs' },
    { value: 'cleanliness', label: '🧹 Cleanliness & Hygiene' },
    { value: 'electrical', label: '⚡ Electrical Issues' },
    { value: 'plumbing', label: '🚿 Plumbing & Water' },
    { value: 'food', label: '🍽️ Food & Mess' },
    { value: 'security', label: '🔒 Security Concerns' },
    { value: 'noise', label: '🔊 Noise Disturbance' },
    { value: 'internet', label: '📶 Internet & WiFi' },
    { value: 'furniture', label: '🪑 Furniture Issues' },
    { value: 'other', label: '📌 Other' },
];

const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
];

// ── Helpers ──────────────────────────────────────────────────
const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const getCategoryLabel = (value) => {
    const cat = CATEGORIES.find((c) => c.value === value);
    return cat ? cat.label : value;
};

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
    const [responseText, setResponseText] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // ── Fetch complaints for this warden's college ───────────
    useEffect(() => {
        // The warden and students share the same managementId
        const mId = userData?.managementId;
        if (!mId) return;

        const q = query(
            collection(db, 'complaints'),
            where('managementId', '==', mId)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                // Sort newest first client-side
                data.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis?.() || 0;
                    const timeB = b.createdAt?.toMillis?.() || 0;
                    return timeB - timeA;
                });
                setComplaints(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching complaints:', err);
                toast.error('Failed to load complaints');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userData?.managementId]);

    // ── Filtered ─────────────────────────────────────────────
    const filteredComplaints =
        activeFilter === 'all'
            ? complaints
            : complaints.filter((c) => c.status === activeFilter);

    // ── Stats ────────────────────────────────────────────────
    const stats = {
        total: complaints.length,
        pending: complaints.filter((c) => c.status === 'pending').length,
        inProgress: complaints.filter((c) => c.status === 'in-progress').length,
        resolved: complaints.filter((c) => c.status === 'resolved').length,
    };

    // ── Update complaint status ──────────────────────────────
    const updateStatus = async (complaintId, newStatus, response = null) => {
        setIsUpdating(true);
        try {
            const updateData = {
                status: newStatus,
                updatedAt: serverTimestamp(),
                respondedBy: userData?.fullName || 'Warden',
                respondedAt: serverTimestamp(),
            };
            if (response) {
                updateData.response = response;
            }
            await updateDoc(doc(db, 'complaints', complaintId), updateData);
            toast.success(`Complaint marked as ${newStatus}`);

            // If modal is open, update it
            if (selectedComplaint?.id === complaintId) {
                setSelectedComplaint((prev) => ({ ...prev, status: newStatus, response: response || prev?.response }));
            }
            setResponseText('');
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
        updateStatus(complaint.id, 'in-progress');
    };

    const handleResolve = (e, complaint) => {
        e.stopPropagation();
        updateStatus(complaint.id, 'resolved');
    };

    const handleReject = (e, complaint) => {
        e.stopPropagation();
        updateStatus(complaint.id, 'rejected');
    };

    // ── Modal handlers ───────────────────────────────────────
    const openDetail = (complaint) => {
        setSelectedComplaint(complaint);
        setResponseText(complaint.response || '');
    };
    const closeDetail = () => {
        setSelectedComplaint(null);
        setResponseText('');
    };

    const handleModalResolve = () => {
        if (!selectedComplaint) return;
        updateStatus(selectedComplaint.id, 'resolved', responseText.trim() || null);
    };

    const handleModalReject = () => {
        if (!selectedComplaint) return;
        if (!responseText.trim()) {
            toast.warning('Please provide a reason for rejection');
            return;
        }
        updateStatus(selectedComplaint.id, 'rejected', responseText.trim());
    };

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
                {/* ── Hero ─────────────────────────────────── */}
                <div className="warden-complaints-hero">
                    <div className="warden-complaints-hero-content">
                        <h2>Complaint Management</h2>
                        <p>Review and resolve student complaints for {userData?.collegeName || 'your college'}</p>
                        <div className="warden-stats-row">
                            <div className="warden-stat-chip">
                                <FileText size={13} /> {stats.total} Total
                            </div>
                            <div className="warden-stat-chip">
                                <Clock size={13} /> {stats.pending} Pending
                            </div>
                            <div className="warden-stat-chip">
                                <Loader2 size={13} /> {stats.inProgress} In Progress
                            </div>
                            <div className="warden-stat-chip">
                                <CheckCircle2 size={13} /> {stats.resolved} Resolved
                            </div>
                        </div>
                    </div>
                </div>

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
                    <div className="warden-scroll" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
                                return (
                                    <div className="warden-complaint-item" key={complaint.id}>
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
                <div className="warden-modal-backdrop" onClick={closeDetail}>
                    <div className="warden-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="warden-modal-header">
                            <h3>Complaint Details</h3>
                            <button className="warden-modal-close" onClick={closeDetail}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="warden-modal-body">
                            {/* Status */}
                            <div className="warden-detail-row">
                                <span className="warden-detail-label">Status</span>
                                <div style={{ marginTop: '0.25rem' }}>
                                    {(() => {
                                        const s = STATUS_CONFIG[selectedComplaint.status] || STATUS_CONFIG.pending;
                                        return (
                                            <div className={`warden-status ${s.className}`}>
                                                <span className="warden-status-dot" />
                                                {s.label}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Student Info */}
                            <div className="warden-detail-row">
                                <span className="warden-detail-label">Student</span>
                                <span className="warden-detail-value">
                                    {selectedComplaint.studentName || 'Unknown Student'}
                                    {selectedComplaint.studentEmail && <> · {selectedComplaint.studentEmail}</>}
                                </span>
                            </div>

                            {selectedComplaint.roomNumber && (
                                <div className="warden-detail-row">
                                    <span className="warden-detail-label">Room Number</span>
                                    <span className="warden-detail-value">{selectedComplaint.roomNumber}</span>
                                </div>
                            )}

                            {/* Title */}
                            <div className="warden-detail-row">
                                <span className="warden-detail-label">Title</span>
                                <span className="warden-detail-value" style={{ fontWeight: 600 }}>
                                    {selectedComplaint.title}
                                </span>
                            </div>

                            {/* Category */}
                            <div className="warden-detail-row">
                                <span className="warden-detail-label">Category</span>
                                <span className="warden-detail-value">
                                    {getCategoryLabel(selectedComplaint.category)}
                                </span>
                            </div>

                            {/* Description */}
                            <div className="warden-detail-row">
                                <span className="warden-detail-label">Description</span>
                                <span className="warden-detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedComplaint.description}
                                </span>
                            </div>

                            {/* Date */}
                            <div className="warden-detail-row">
                                <span className="warden-detail-label">Filed on</span>
                                <span className="warden-detail-value">
                                    {formatDate(selectedComplaint.createdAt)}
                                </span>
                            </div>

                            {/* Image */}
                            {selectedComplaint.imageUrl && (
                                <div className="warden-detail-row">
                                    <span className="warden-detail-label">Attached Image</span>
                                    <div className="warden-detail-image">
                                        <img src={selectedComplaint.imageUrl} alt="Complaint attachment" />
                                    </div>
                                </div>
                            )}

                            {/* Response Form — only show if not resolved/rejected */}
                            {(selectedComplaint.status === 'pending' || selectedComplaint.status === 'in-progress') && (
                                <div className="warden-response-form">
                                    <label>
                                        <MessageSquareText size={14} />
                                        Add a Response
                                    </label>
                                    <textarea
                                        className="warden-response-textarea"
                                        placeholder="Type your response to the student…"
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        maxLength={500}
                                    />
                                    <div className="warden-response-actions">
                                        {selectedComplaint.status === 'pending' && (
                                            <button
                                                className="warden-response-submit"
                                                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                                                onClick={() => updateStatus(selectedComplaint.id, 'in-progress', responseText.trim() || null)}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? <Loader2 size={14} className="warden-spinner" /> : <ArrowRightCircle size={14} />}
                                                Mark In Progress
                                            </button>
                                        )}
                                        <button
                                            className="warden-response-submit resolve"
                                            onClick={handleModalResolve}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? <Loader2 size={14} className="warden-spinner" /> : <CheckCircle2 size={14} />}
                                            Resolve
                                        </button>
                                        <button
                                            className="warden-response-submit reject"
                                            onClick={handleModalReject}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? <Loader2 size={14} className="warden-spinner" /> : <XCircle size={14} />}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Show existing response if resolved/rejected */}
                            {(selectedComplaint.status === 'resolved' || selectedComplaint.status === 'rejected') && selectedComplaint.response && (
                                <div className="warden-response-form" style={{ borderColor: selectedComplaint.status === 'resolved' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
                                    <label>
                                        <MessageSquareText size={14} />
                                        Response Sent
                                    </label>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        {selectedComplaint.response}
                                    </p>
                                    {selectedComplaint.respondedBy && (
                                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            — {selectedComplaint.respondedBy}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WardenComplaints;