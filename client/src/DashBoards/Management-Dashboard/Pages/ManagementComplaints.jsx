import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useAuth } from '../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import ManagementHeader from '../components/layout/ManagementHeader';
import {
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    User,
    Home,
    Search,
    Filter,
    MessageSquare,
    ChevronDown,
    MoreVertical,
    Eye,
    Tag,
    ShieldAlert,
    Flag,
    X,
    FileText,
    MessageSquareText,
} from 'lucide-react';
import { useToast } from '../../../components/Toast';

const ManagementComplaints = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const toast = useToast();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, escalated, pending, disputed, resolved
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    useEffect(() => {
        if (!userData || !userData.managementId) return;

        // Fetch all complaints for this management/college
        const q = query(
            collection(db, 'complaints'),
            where('managementId', '==', userData.managementId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Check for auto-escalations (if expired and still pending or in-progress)
            const now = new Date();
            const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            const processedList = list.map(c => {
                const createdAt = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
                const isOverdue = (c.status === 'pending' || c.status === 'in-progress') && createdAt < cutoff48h;
                return { ...c, isAutoEscalated: isOverdue };
            });

            setComplaints(processedList);
            setLoading(true);
            setTimeout(() => setLoading(false), 500); // Smooth transition
        }, (err) => {
            console.error("Error fetching complaints for management:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData]);

    const filteredComplaints = complaints.filter(c => {
        const matchesSearch =
            c.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'escalated') return matchesSearch && (c.isEscalated || c.isAutoEscalated || c.status === 'escalated');
        if (filter === 'disputed') return matchesSearch && c.status === 'disputed';
        if (filter === 'pending') return matchesSearch && c.status === 'pending';
        if (filter === 'resolved') return matchesSearch && c.status === 'resolved';
        return matchesSearch;
    });

    const stats = {
        total: complaints.length,
        escalated: complaints.filter(c => c.isEscalated || c.isAutoEscalated || c.status === 'escalated').length,
        disputed: complaints.filter(c => c.status === 'disputed').length,
        pending: complaints.filter(c => c.status === 'pending').length,
        resolved: complaints.filter(c => c.status === 'resolved').length
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status, isEscalated, isAutoEscalated) => {
        if (status === 'escalated' || isEscalated || isAutoEscalated) {
            return { bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-600', label: 'ESCALATED' };
        }
        if (status === 'disputed') {
            return { bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-600', label: 'DISPUTED' };
        }
        if (status === 'warden-resolved') {
            return { bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-600', label: 'AWAITING REVIEW' };
        }
        if (status === 'resolved') {
            return { bg: 'bg-green-500/10', text: 'text-green-600', dot: 'bg-green-600', label: 'RESOLVED' };
        }
        if (status === 'in-progress') {
            return { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-600', label: 'IN PROGRESS' };
        }
        if (status === 'rejected') {
            return { bg: 'bg-gray-500/10', text: 'text-gray-600', dot: 'bg-gray-600', label: 'REJECTED' };
        }
        return { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-600', label: 'PENDING' };
    };

    return (
        <div className="management-complaints-page">
            <ManagementHeader
                title="Complaints & Escalations"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-20 sm:pt-24 px-3 sm:px-4 lg:px-8 py-4 sm:pb-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Total Complaints</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl border" style={{ backgroundColor: stats.escalated > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)', borderColor: stats.escalated > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-primary)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-red-600/70">Escalated</p>
                                <p className="text-xl font-bold text-red-600">{stats.escalated}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl border" style={{ backgroundColor: stats.disputed > 0 ? 'rgba(249, 115, 22, 0.05)' : 'var(--bg-card)', borderColor: stats.disputed > 0 ? 'rgba(249, 115, 22, 0.3)' : 'var(--border-primary)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-orange-600/70">Disputed</p>
                                <p className="text-xl font-bold text-orange-600">{stats.disputed}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Pending Warden</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.pending}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Resolved</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.resolved}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        {['all', 'escalated', 'disputed', 'pending', 'resolved'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f
                                    ? f === 'escalated' ? 'bg-red-600 text-white shadow-lg'
                                        : f === 'disputed' ? 'bg-orange-600 text-white shadow-lg'
                                            : 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {f === 'disputed' && '🚩 '}{f}
                                {f === 'escalated' && stats.escalated > 0 && ` (${stats.escalated})`}
                                {f === 'disputed' && stats.disputed > 0 && ` (${stats.disputed})`}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search student, title or room..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>

                {/* Complaints Table */}
                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[11px] font-black uppercase tracking-widest border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                                <tr>
                                    <th className="px-6 py-4">Student & Room</th>
                                    <th className="px-6 py-4">Complaint Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Filed</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading complaints...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                {filter === 'escalated' ? (
                                                    <>
                                                        <AlertTriangle size={48} />
                                                        <p className="text-sm font-bold">No escalated complaints</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <MessageSquare size={48} />
                                                        <p className="text-sm font-bold">No complaints found</p>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map((c) => {
                                        const badge = getStatusBadge(c.status, c.isEscalated, c.isAutoEscalated);
                                        return (
                                            <tr key={c.id} className={`group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${c.status === 'escalated' || c.status === 'disputed' ? 'bg-red-500/5' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.studentName}</span>
                                                        <span className="text-[11px] font-medium opacity-60" style={{ color: 'var(--text-secondary)' }}>Room {c.roomNumber || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col max-w-md">
                                                        <div className="flex items-center gap-2">
                                                            {(c.status === 'escalated' || c.isEscalated || c.isAutoEscalated) && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500 text-white uppercase animate-pulse">ESCALATED</span>
                                                            )}
                                                            {c.status === 'disputed' && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-orange-500 text-white uppercase">DISPUTED</span>
                                                            )}
                                                            <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.title}</span>
                                                        </div>
                                                        <span className="text-[11px] opacity-60 truncate" style={{ color: 'var(--text-secondary)' }}>{c.description}</span>
                                                        {c.escalationReason && (
                                                            <span className="text-[10px] mt-1 text-red-500 font-medium">{c.escalationReason}</span>
                                                        )}
                                                        {c.disputeReason && c.status === 'disputed' && (
                                                            <span className="text-[10px] mt-1 text-orange-500 font-medium italic">Student: &ldquo;{c.disputeReason}&rdquo;</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                        {badge.label}
                                                    </div>
                                                    {c.disputeCount > 0 && (
                                                        <div className="text-[9px] text-orange-500 font-bold mt-1">
                                                            Disputed {c.disputeCount}x
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                                        {formatDate(c.createdAt)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500"
                                                        onClick={() => setSelectedComplaint(c)}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Detail Modal ─────────────────────────────────── */}
            {selectedComplaint && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setSelectedComplaint(null)}
                >
                    <div
                        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Complaint Details</h3>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Full complaint information & history</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedComplaint(null)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                            >
                                <X size={18} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {/* Escalation / Dispute Alert */}
                            {(selectedComplaint.status === 'escalated' || selectedComplaint.isEscalated || selectedComplaint.isAutoEscalated) && (
                                <div className="p-4 rounded-xl border-2 border-red-500/30 bg-red-500/5">
                                    <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-2">
                                        <AlertTriangle size={16} />
                                        ESCALATED COMPLAINT — Requires Management Action
                                    </div>
                                    {selectedComplaint.escalationReason && (
                                        <p className="text-xs text-red-600/80 mb-1">{selectedComplaint.escalationReason}</p>
                                    )}
                                </div>
                            )}

                            {selectedComplaint.status === 'disputed' && (
                                <div className="p-4 rounded-xl border-2 border-orange-500/30 bg-orange-500/5">
                                    <div className="flex items-center gap-2 text-orange-600 font-bold text-sm mb-2">
                                        <ShieldAlert size={16} />
                                        STUDENT DISPUTED WARDEN RESOLUTION
                                    </div>
                                    {selectedComplaint.disputeReason && (
                                        <p className="text-xs text-orange-600/80 italic mb-1">
                                            Student says: &ldquo;{selectedComplaint.disputeReason}&rdquo;
                                        </p>
                                    )}
                                    {selectedComplaint.disputeCount > 1 && (
                                        <p className="text-[10px] text-orange-500 font-bold">
                                            This complaint has been disputed {selectedComplaint.disputeCount} times.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Student Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Student</p>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedComplaint.studentName}</p>
                                    <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{selectedComplaint.studentEmail}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Room</p>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedComplaint.roomNumber || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Complaint Details */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Title</p>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{selectedComplaint.title}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Category</p>
                                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedComplaint.category}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Description</p>
                                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{selectedComplaint.description}</p>
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Status</p>
                                {(() => {
                                    const badge = getStatusBadge(selectedComplaint.status, selectedComplaint.isEscalated, selectedComplaint.isAutoEscalated);
                                    return (
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                                            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                                            {badge.label}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Filed Date */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Filed On</p>
                                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedComplaint.createdAt)}</p>
                            </div>

                            {/* Image */}
                            {selectedComplaint.imageUrl && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Attached Image</p>
                                    <img
                                        src={selectedComplaint.imageUrl}
                                        alt="Complaint"
                                        className="w-full max-w-sm rounded-xl border"
                                        style={{ borderColor: 'var(--border-primary)' }}
                                    />
                                </div>
                            )}

                            {/* Warden Response */}
                            {selectedComplaint.response && (
                                <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                        <MessageSquareText size={12} />
                                        Warden Response
                                    </p>
                                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedComplaint.response}</p>
                                    {selectedComplaint.respondedBy && (
                                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            — {selectedComplaint.respondedBy}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Complaint Timeline */}
                            {selectedComplaint.complaintHistory && selectedComplaint.complaintHistory.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                        <Clock size={12} />
                                        Complaint Timeline
                                    </p>
                                    <div className="space-y-2">
                                        {selectedComplaint.complaintHistory.map((entry, idx) => (
                                            <div key={idx} className="flex items-start gap-3 pl-2">
                                                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{
                                                    backgroundColor: entry.action === 'auto_escalated' ? '#ef4444'
                                                        : entry.action === 'student_disputed' ? '#f97316'
                                                            : entry.action === 'student_accepted' ? '#10b981'
                                                                : '#3b82f6'
                                                }} />
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                        {entry.action === 'created' && 'Complaint Filed'}
                                                        {entry.action === 'warden_resolved' && 'Warden Marked Resolved'}
                                                        {entry.action === 'student_accepted' && 'Student Accepted Resolution'}
                                                        {entry.action === 'student_disputed' && 'Student Disputed Resolution'}
                                                        {entry.action === 'auto_escalated' && 'Auto-Escalated to Management'}
                                                        {entry.action?.startsWith('status_') && `Status: ${entry.action.replace('status_', '')}`}
                                                    </p>
                                                    {entry.reason && (
                                                        <p className="text-[11px] italic" style={{ color: 'var(--text-secondary)' }}>{entry.reason}</p>
                                                    )}
                                                    <p className="text-[10px]" style={{ color: 'var(--text-muted, var(--text-secondary))' }}>
                                                        {new Date(entry.timestamp).toLocaleString('en-IN')}
                                                    </p>
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
        </div>
    );
};

export default ManagementComplaints;
