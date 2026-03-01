import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import StudentHeader from '../layout/StudentHeader';
import { db } from '../../../../firebase/firebaseConfig';
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
} from 'firebase/firestore';

import {
    FileText,
    Send,
    Image as ImageIcon,
    X,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
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
} from 'lucide-react';
import './StudentComplaints.css';

// ── Complaint Categories ─────────────────────────────────────
const CATEGORIES = [
    { value: '', label: 'Select a category…' },
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

const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        className: 'complaint-status-pending',
        icon: Clock,
    },
    'in-progress': {
        label: 'In Progress',
        className: 'complaint-status-in-progress',
        icon: Loader2,
    },
    'warden-resolved': {
        label: 'Review Required',
        className: 'complaint-status-review',
        icon: AlertTriangle,
    },
    resolved: {
        label: 'Resolved',
        className: 'complaint-status-resolved',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Rejected',
        className: 'complaint-status-rejected',
        icon: XCircle,
    },
    disputed: {
        label: 'Disputed',
        className: 'complaint-status-disputed',
        icon: ShieldAlert,
    },
    escalated: {
        label: 'Escalated to Management',
        className: 'complaint-status-escalated',
        icon: AlertTriangle,
    },
};






const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'warden-resolved', label: 'Review Required' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'disputed', label: 'Disputed' },
    { value: 'escalated', label: 'Escalated' },
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
    const [currentTime, setCurrentTime] = useState(new Date());

    // ── Review / Dispute state ───────────────────────────────
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);

    // ── Real-time clock ──────────────────────────────────────
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // ── Helper: Calculate Remaining Time (48h Window) ────────
    const getTimeRemaining = (createdAt) => {
        if (!createdAt) return '—';
        const createdMs = createdAt.toMillis ? createdAt.toMillis() : new Date(createdAt).getTime();
        const expiryMs = createdMs + (48 * 60 * 60 * 1000); // 48 Hours from creation
        const remainingMs = expiryMs - currentTime.getTime();

        if (remainingMs <= 0) return 'Expired';

        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

        return `${hours}h ${minutes}m ${seconds}s left`;
    };
    // ── Fetch complaints in real-time ────────────────────────
    useEffect(() => {
        if (!user?.uid) return;

        // Only filter by studentId — no orderBy to avoid needing a composite index
        const q = query(
            collection(db, 'complaints'),
            where('studentId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                // Sort client-side: newest first
                data.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis?.() || 0;
                    const timeB = b.createdAt?.toMillis?.() || 0;
                    return timeB - timeA;
                });
                setComplaints(data);
                setHistoryLoading(false);
            },
            (err) => {
                console.error('Error fetching complaints:', err);
                setHistoryLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid]);

    // ── Filtered complaints ──────────────────────────────────
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

    // ── Compress image & convert to base64 data URL ────────────
    // Store directly in Firestore to avoid GCS CORS issues
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800;
                        const MAX_HEIGHT = 800;
                        let { width, height } = img;

                        // Scale down if necessary
                        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                            width = Math.round(width * ratio);
                            height = Math.round(height * ratio);
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress as JPEG at 0.7 quality (~100-200KB for most photos)
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        resolve(dataUrl);
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
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

            // Compress & encode image as base64 data URL (stored in Firestore directly)
            if (imageFile) {
                try {
                    setUploadProgress(30);
                    imageUrl = await compressImage(imageFile);
                    setUploadProgress(100);
                } catch (compressErr) {
                    console.warn('Image compression failed:', compressErr);
                    toast.warning('Image processing failed — complaint will be submitted without the attachment.');
                    imageUrl = null;
                }
            }

            const now = new Date();
            const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 Hours from now

            await addDoc(collection(db, 'complaints'), {
                studentId: user.uid,
                studentName: userData?.fullName || user.displayName || 'Student',
                studentEmail: user.email,
                collegeName: userData?.collegeName || '',
                managementId: userData?.managementId || '',
                roomNumber: userData?.roomNumber || '',
                category,
                title: title.trim(),
                description: description.trim(),
                imageUrl,
                status: 'pending',
                response: null,
                isEscalated: false,
                studentReviewStatus: null,
                disputeReason: null,
                disputeCount: 0,
                escalationReason: null,
                complaintHistory: [{
                    action: 'created',
                    timestamp: now.toISOString(),
                    by: 'student',
                }],
                expiresAt: expiresAt,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Reset form
            setCategory('');
            setTitle('');
            setDescription('');
            removeImage();
            toast.success('Complaint submitted successfully! 🎉');
        } catch (err) {
            console.error('Failed to submit complaint:', err);
            toast.error('Failed to submit complaint. Please try again.');
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
        setDisputeReason('');
    };

    // ── Accept Resolution (Student confirms issue is fixed) ──
    const handleAcceptResolution = async (complaint) => {
        setIsReviewing(true);
        try {
            const history = complaint.complaintHistory || [];
            history.push({
                action: 'student_accepted',
                timestamp: new Date().toISOString(),
                by: 'student',
            });

            await updateDoc(doc(db, 'complaints', complaint.id), {
                status: 'resolved',
                studentReviewStatus: 'accepted',
                complaintHistory: history,
                updatedAt: serverTimestamp(),
            });

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
    const handleDisputeResolution = async (complaint) => {
        if (!disputeReason.trim()) {
            toast.warning('Please provide a reason for your dispute');
            return;
        }

        setIsReviewing(true);
        try {
            const history = complaint.complaintHistory || [];
            history.push({
                action: 'student_disputed',
                reason: disputeReason.trim(),
                timestamp: new Date().toISOString(),
                by: 'student',
                disputeCount: (complaint.disputeCount || 0) + 1,
            });

            await updateDoc(doc(db, 'complaints', complaint.id), {
                status: 'disputed',
                studentReviewStatus: 'disputed',
                disputeReason: disputeReason.trim(),
                disputedAt: serverTimestamp(),
                disputeCount: (complaint.disputeCount || 0) + 1,
                complaintHistory: history,
                updatedAt: serverTimestamp(),
            });

            toast.success('Dispute submitted! The warden will be alerted.');
            setShowDisputeModal(false);
            setDisputeReason('');
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
                                        <ImageIcon size={13} /> Attach Image <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
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
                                                <div className="complaint-timer-display" style={{
                                                    marginTop: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    color: '#ef4444',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontWeight: '600'
                                                }}>
                                                    <Clock size={12} />
                                                    Auto-escalation in: {getTimeRemaining(complaint.createdAt)}
                                                </div>
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
            {selectedComplaint && (
                <div className="complaint-modal-backdrop" onClick={closeDetail}>
                    <div className="complaint-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="complaint-modal-header">
                            <h3>Complaint Details</h3>
                            <button className="complaint-modal-close" onClick={closeDetail}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="complaint-modal-body">
                            {/* Status */}
                            <div className="complaint-detail-row">
                                <span className="complaint-detail-label">Status</span>
                                <div style={{ marginTop: '0.25rem' }}>
                                    {(() => {
                                        const s = STATUS_CONFIG[selectedComplaint.status] || STATUS_CONFIG.pending;
                                        return (
                                            <div className={`complaint-status ${s.className}`}>
                                                <span className="complaint-status-dot" />
                                                {s.label}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Title */}
                            <div className="complaint-detail-row">
                                <span className="complaint-detail-label">Title</span>
                                <span className="complaint-detail-value" style={{ fontWeight: 600 }}>
                                    {selectedComplaint.title}
                                </span>
                            </div>

                            {/* Category */}
                            <div className="complaint-detail-row">
                                <span className="complaint-detail-label">Category</span>
                                <span className="complaint-detail-value">
                                    {getCategoryLabel(selectedComplaint.category)}
                                </span>
                            </div>

                            {/* Description */}
                            <div className="complaint-detail-row">
                                <span className="complaint-detail-label">Description</span>
                                <span className="complaint-detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedComplaint.description}
                                </span>
                            </div>

                            {/* Date */}
                            <div className="complaint-detail-row">
                                <span className="complaint-detail-label">Filed on</span>
                                <span className="complaint-detail-value">
                                    {formatDate(selectedComplaint.createdAt)}
                                </span>
                            </div>

                            {/* Attached Image */}
                            {selectedComplaint.imageUrl && (
                                <div className="complaint-detail-row">
                                    <span className="complaint-detail-label">Attached Image</span>
                                    <div className="complaint-detail-image">
                                        <img src={selectedComplaint.imageUrl} alt="Complaint attachment" />
                                    </div>
                                </div>
                            )}

                            {/* Response from hostel */}
                            {selectedComplaint.response && (
                                <div className="complaint-response-card">
                                    <h4>
                                        <MessageSquareText size={14} />
                                        Response from Hostel
                                    </h4>
                                    <p>{selectedComplaint.response}</p>
                                    {selectedComplaint.respondedBy && (
                                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            — {selectedComplaint.respondedBy}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── Review Section (Warden-Resolved) ── */}
                            {selectedComplaint.status === 'warden-resolved' && !showDisputeModal && (
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
                                            onClick={() => handleAcceptResolution(selectedComplaint)}
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
                            {showDisputeModal && selectedComplaint.status === 'warden-resolved' && (
                                <div className="complaint-dispute-form">
                                    <div className="complaint-review-header">
                                        <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                                        <h4>Dispute Resolution</h4>
                                    </div>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Explain why the issue is not resolved. This will be sent to the warden as an urgent alert.
                                        {selectedComplaint.disputeCount > 0 && (
                                            <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                                {' '}(Disputed {selectedComplaint.disputeCount} time{selectedComplaint.disputeCount !== 1 ? 's' : ''} before)
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
                                            onClick={() => handleDisputeResolution(selectedComplaint)}
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
                            {selectedComplaint.status === 'disputed' && selectedComplaint.disputeReason && (
                                <div className="complaint-dispute-info">
                                    <div className="complaint-review-header">
                                        <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                                        <h4>Your Dispute</h4>
                                    </div>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        &ldquo;{selectedComplaint.disputeReason}&rdquo;
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, marginTop: '0.5rem' }}>
                                        Waiting for warden to respond. If no response within 48 hours, this will be escalated to management automatically.
                                    </p>
                                </div>
                            )}

                            {/* ── Escalation Info ── */}
                            {selectedComplaint.status === 'escalated' && (
                                <div className="complaint-escalated-info">
                                    <div className="complaint-review-header">
                                        <AlertTriangle size={16} style={{ color: '#dc2626' }} />
                                        <h4>Escalated to Management</h4>
                                    </div>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                        {selectedComplaint.escalationReason || 'This complaint has been escalated to management for review.'}
                                    </p>
                                </div>
                            )}

                            {/* ── Complaint History Timeline ── */}
                            {selectedComplaint.complaintHistory && selectedComplaint.complaintHistory.length > 0 && (
                                <div className="complaint-history-section">
                                    <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                        <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                        Complaint Timeline
                                    </h4>
                                    <div className="complaint-timeline">
                                        {selectedComplaint.complaintHistory.map((entry, idx) => (
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
            )}
        </>
    );
};

export default StudentComplaints;