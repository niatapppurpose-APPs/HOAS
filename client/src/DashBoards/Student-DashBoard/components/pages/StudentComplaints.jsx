import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import StudentHeader from '../layout/StudentHeader';
import { fileComplaint, getMyComplaints, reviewComplaint } from '../../../../firebase/cloudFunctions';
import {
    FileText,
    Send,
    Image as ImageIcon,
    X,
    ChevronRight,
    Clock,
    CheckCircle2,
    Loader2,
    Tag,
    Calendar,
    Upload,
    MessageSquareText,
    Inbox,
    Eye,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
    ShieldAlert,
    XCircle,
} from 'lucide-react';
import { CATEGORIES, STATUS_CONFIG, FILTER_OPTIONS, formatDate, getCategoryLabel } from './complaintConstants';
import compressImage from './utils/compressImage';
import { uploadComplaintImage } from '../../../../utils/cloudinaryUpload';
import CountdownTimer from './CountdownTimer';
import ComplaintDetailModal from './ComplaintDetailModal';
import './StudentComplaints.css';

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════
const StudentComplaints = () => {
    const { user, userData } = useAuth();
    const { isDark } = useTheme();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const toast = useToast();
    const fileInputRef = useRef(null);

    // ── Form state ───────────────────────────────────────────
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // ── History state ────────────────────────────────────────
    const [complaints, setComplaints] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    // ── Review / Dispute state ───────────────────────────────
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);

    // ── Fetch complaints in real-time ────────────────────────
    useEffect(() => {
        if (!user?.uid) return;

        let cancelled = false;

        const load = async () => {
            try {
                const { complaints } = await getMyComplaints();
                if (cancelled) return;
                const data = (complaints || []).map((c) => ({ id: c._id, ...c }));
                data.sort((a, b) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return timeB - timeA;
                });
                setComplaints(data);
                setHistoryLoading(false);
            } catch (err) {
                console.error('Error fetching complaints:', err);
                setHistoryLoading(false);
            }
        };

        load();

        const interval = setInterval(load, 30000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [user?.uid]);

    // ── Filtered complaints (memoized) ───────────────────────────────
    const filteredComplaints = useMemo(() =>
        activeFilter === 'all'
            ? complaints
            : complaints.filter((c) => c.status === activeFilter),
        [complaints, activeFilter]
    );

    // ── Stats (memoized) ─────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: complaints.length,
        pending: complaints.filter((c) => c.status === 'pending').length,
        inProgress: complaints.filter((c) => c.status === 'in-progress').length,
        resolved: complaints.filter((c) => c.status === 'resolved').length,
    }), [complaints]);

    // ── Image handling ───────────────────────────────────────
    const handleImageSelect = useCallback((file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.warning('Please select an image file (PNG, JPG, WEBP)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.warning('Image must be smaller than 5 MB');
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
    }, [toast]);

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Drag & Drop ──────────────────────────────────────────
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleImageSelect(file);
    };

    // ── Submit complaint ─────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!category) {
            toast.warning('Please select a complaint category');
            return;
        }
        if (!title.trim()) {
            toast.warning('Please enter a complaint title');
            return;
        }
        if (!description.trim() || description.trim().length < 20) {
            toast.warning('Description must be at least 20 characters');
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            let imageUrl = null;

            // Compress image to a small data URI, then proxy-upload it to Cloudinary
            if (imageFile) {
                try {
                    setUploadProgress(30);
                    const dataUri = await compressImage(imageFile);
                    setUploadProgress(60);
                    const uploaded = await uploadComplaintImage(dataUri);
                    imageUrl = uploaded.url;
                    setUploadProgress(100);
                } catch (compressErr) {
                    console.warn('Image processing failed:', compressErr);
                    toast.warning('Image processing failed — complaint will be submitted without the attachment.');
                    imageUrl = null;
                }
            }

            await fileComplaint({
                category,
                title: title.trim(),
                description: description.trim(),
                imageUrl,
            });

            // Reset form
            setCategory('');
            setTitle('');
            setDescription('');
            removeImage();
            toast.success('Complaint submitted successfully! 🎉');
        } catch (err) {
            console.error('Failed to submit complaint:', err);
            // Handle specific Cloud Function errors
            const errorMessage = err.message || 'Failed to submit complaint. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    // ── View detail modal ────────────────────────────────────
    const openDetail = async (complaint) => {
        setSelectedComplaint(complaint);
    };

    const closeDetail = () => {
        setSelectedComplaint(null);
        setShowDisputeModal(false);
    };

    // ── Accept Resolution (Student confirms issue is fixed) ──
    const handleAcceptResolution = async (complaint) => {
        setIsReviewing(true);
        try {
            await reviewComplaint(complaint.id, 'accept');

            toast.success('Resolution accepted! Complaint is now resolved.');
            if (selectedComplaint?.id === complaint.id) {
                setSelectedComplaint(prev => ({ ...prev, status: 'resolved', studentReviewStatus: 'accepted' }));
            }
        } catch (err) {
            console.error('Error accepting resolution:', err);
            toast.error('Failed to accept resolution. Please try again.');
        } finally {
            setIsReviewing(false);
        }
    };

    // ── Dispute Resolution (Student says issue is NOT fixed) ──
    const handleDisputeResolution = async (complaint, disputeReason) => {
        if (!disputeReason?.trim()) {
            toast.warning('Please provide a reason for your dispute');
            return;
        }

        setIsReviewing(true);
        try {
            await reviewComplaint(complaint.id, 'dispute', disputeReason.trim());

            toast.success('Dispute submitted! The warden will be alerted.');
            setShowDisputeModal(false);
            if (selectedComplaint?.id === complaint.id) {
                setSelectedComplaint(prev => ({
                    ...prev,
                    status: 'disputed',
                    studentReviewStatus: 'disputed',
                    disputeReason: disputeReason.trim(),
                }));
            }
        } catch (err) {
            console.error('Error disputing resolution:', err);
            toast.error('Failed to submit dispute. Please try again.');
        } finally {
            setIsReviewing(false);
        }
    };






    // ══════════════════════════════════════════════════════════
    // Render
    // ══════════════════════════════════════════════════════════
    return (
        <>
            <StudentHeader
                title="Complaints · Student Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* ── Hero Banner ──────────────────────────────── */}
                <div className="complaints-hero">
                    <div className="complaints-hero-content">
                        <h2>Complaint Management</h2>
                        <p>Submit & track your hostel complaints in one place</p>
                        <div className="complaints-stats-row">
                            <div className="complaints-stat-chip">
                                <FileText size={13} /> {stats.total} Total
                            </div>
                            <div className="complaints-stat-chip">
                                <Clock size={13} /> {stats.pending} Pending
                            </div>
                            <div className="complaints-stat-chip">
                                <Loader2 size={13} /> {stats.inProgress} Active
                            </div>
                            <div className="complaints-stat-chip">
                                <CheckCircle2 size={13} /> {stats.resolved} Resolved
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Grid ────────────────────────────────── */}
                <div className="complaints-grid">

                    {/* ═══ LEFT — Submit Form ═══ */}
                    <div className="complaints-card">
                        <div className="complaints-card-header">
                            <div
                                className="complaints-card-header-icon"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                            >
                                <Send size={16} color="white" />
                            </div>
                            <div>
                                <h3>File a Complaint</h3>
                                <p>Describe your issue in detail</p>
                            </div>
                        </div>

                        <div className="complaints-card-body">
                            <form className="complaints-form" onSubmit={handleSubmit}>
                                {/* Category */}
                                <div className="complaints-field">
                                    <label className="complaints-label">
                                        <Tag size={13} /> Category <span className="required">*</span>
                                    </label>
                                    <select
                                        className="complaints-select"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        disabled={isSubmitting}
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c.value} value={c.value} disabled={!c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Title */}
                                <div className="complaints-field">
                                    <label className="complaints-label">
                                        <FileText size={13} /> Title <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="complaints-input"
                                        placeholder="e.g. Broken window in Room 204"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        maxLength={100}
                                        disabled={isSubmitting}
                                    />
                                    <span className="complaints-char-count">{title.length}/100</span>
                                </div>

                                {/* Description */}
                                <div className="complaints-field">
                                    <label className="complaints-label">
                                        <MessageSquareText size={13} /> Description <span className="required">*</span>
                                    </label>
                                    <textarea
                                        className="complaints-textarea"
                                        placeholder="Provide a detailed description of the issue, including when it started and its impact…"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        maxLength={1000}
                                        disabled={isSubmitting}
                                    />
                                    <span className="complaints-char-count">{description.length}/1000</span>
                                </div>

                                {/* Image Upload */}
                                <div className="complaints-field">
                                    <label className="complaints-label">
                                        <ImageIcon  size={13} /> Attach Image <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>(optional)</span>
                                    </label>

                                    {!imagePreview ? (
                                        <div
                                            className={`complaints-upload-zone ${isDragging ? 'dragging' : ''} flex flex-col items-center`}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={(e) => handleImageSelect(e.target.files?.[0])}
                                            />
                                            <Upload size={28} className="complaints-upload-icon" />
                                            <p className="complaints-upload-text">
                                                Drag & drop or <span>browse</span>
                                            </p>
                                            <p className="complaints-upload-hint">PNG, JPG or WEBP — Max 5 MB</p>
                                        </div>
                                    ) : (
                                        <div className="complaints-upload-preview">
                                            <img src={imagePreview} alt="Complaint attachment" />
                                            <button type="button" className="complaints-upload-remove" onClick={removeImage}>
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Upload Progress */}
                                {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="complaints-progress-bar">
                                        <div
                                            className="complaints-progress-fill"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="complaints-submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="complaints-spinner" />
                                            Submitting…
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Submit Complaint
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ═══ RIGHT — Complaint History ═══ */}
                    <div className="complaints-card">
                        <div className="complaints-card-header">
                            <div
                                className="complaints-card-header-icon"
                                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                            >
                                <Inbox size={16} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3>Complaint History</h3>
                                <p>{complaints.length} complaint{complaints.length !== 1 ? 's' : ''} filed</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="complaints-history-controls" style={{ paddingTop: '0.75rem' }}>
                            {FILTER_OPTIONS.map((f) => (
                                <button
                                    key={f.value}
                                    className={`complaints-filter-btn ${activeFilter === f.value ? 'active' : ''}`}
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
                        <div className="complaints-scroll" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                            {historyLoading ? (
                                <div className="complaints-empty">
                                    <Loader2 size={32} className="complaints-spinner" style={{ color: '#3b82f6' }} />
                                    <p style={{ marginTop: '0.75rem' }}>Loading complaints…</p>
                                </div>
                            ) : filteredComplaints.length === 0 ? (
                                <div className="complaints-empty">
                                    <div className="complaints-empty-icon">
                                        <Inbox size={24} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <h4>No complaints found</h4>
                                    <p>
                                        {activeFilter === 'all'
                                            ? "You haven't filed any complaints yet. Use the form to get started."
                                            : `No ${activeFilter} complaints right now.`}
                                    </p>
                                </div>
                            ) : (
                                filteredComplaints.map((complaint) => {
                                    const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
                                    return (
                                        <div className="complaint-item" key={complaint.id}>
                                            <div className="complaint-item-top">
                                                <span className="complaint-item-title">{complaint.title}</span>
                                                <div className={`complaint-status ${statusCfg.className}`}>
                                                    <span className="complaint-status-dot" />
                                                    {statusCfg.label}
                                                </div>
                                            </div>
                                            <div className="complaint-item-meta">
                                                <span className="complaint-item-category">
                                                    <Tag size={10} />
                                                    {getCategoryLabel(complaint.category)}
                                                </span>
                                                <span className="complaint-item-date">
                                                    <Calendar size={10} />
                                                    {formatDate(complaint.createdAt)}
                                                </span>
                                            </div>

                                            {/* ── Review Required Banner ── */}
                                            {complaint.status === 'warden-resolved' && (
                                                <div className="complaint-review-banner">
                                                    <div className="complaint-review-banner-text">
                                                        <AlertTriangle size={14} />
                                                        <span>Warden marked this as resolved. Is your issue fixed?</span>
                                                    </div>
                                                    <div className="complaint-review-actions">
                                                        <button
                                                            className="complaint-review-btn complaint-btn-accept"
                                                            onClick={(e) => { e.stopPropagation(); handleAcceptResolution(complaint); }}
                                                            disabled={isReviewing}
                                                        >
                                                            <ThumbsUp size={13} />
                                                            Yes, Resolved
                                                        </button>
                                                        <button
                                                            className="complaint-review-btn complaint-btn-dispute"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedComplaint(complaint);
                                                                setShowDisputeModal(true);
                                                            }}
                                                            disabled={isReviewing}
                                                        >
                                                            <ThumbsDown size={13} />
                                                            Not Resolved
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Disputed Banner ── */}
                                            {complaint.status === 'disputed' && (
                                                <div className="complaint-disputed-banner">
                                                    <ShieldAlert size={14} />
                                                    <span>You disputed this resolution. Waiting for warden response...</span>
                                                </div>
                                            )}

                                            {/* ── Escalated Banner ── */}
                                            {complaint.status === 'escalated' && (
                                                <div className="complaint-escalated-banner">
                                                    <AlertTriangle size={14} />
                                                    <span>This complaint has been escalated to management.</span>
                                                </div>
                                            )}

                                            {/* ── Rejected Banner (with warden's reason) ── */}
                                            {complaint.status === 'rejected' && (
                                                <div className="complaint-disputed-banner" style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)' }}>
                                                    <XCircle size={14} />
                                                    <span>
                                                        {complaint.rejectionReason
                                                            ? <>Rejected by warden: &ldquo;{complaint.rejectionReason}&rdquo;</>
                                                            : 'This complaint was rejected by the warden.'}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="complaint-item-actions">
                                                <button
                                                    className="complaint-view-btn"
                                                    onClick={() => openDetail(complaint)}
                                                >
                                                    <Eye size={13} />
                                                    View Details
                                                    <ChevronRight size={13} />
                                                </button>
                                            </div>
                                            {(complaint.status === 'pending' || complaint.status === 'in-progress') && (
                                                <CountdownTimer createdAt={complaint.createdAt} />
                                            )}
                                        </div>

                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Detail Modal ─────────────────────────────────── */}
            <ComplaintDetailModal
                complaint={selectedComplaint}
                onClose={closeDetail}
                isReviewing={isReviewing}
                showDisputeModal={showDisputeModal}
                setShowDisputeModal={setShowDisputeModal}
                onAcceptResolution={handleAcceptResolution}
                onDisputeResolution={handleDisputeResolution}
            />
        </>
    );
};

export default StudentComplaints;