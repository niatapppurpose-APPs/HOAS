import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import WardenHeader from '../layout/WardenHeader';
import { db } from '../../../../firebase/firebaseConfig';
import {
    collection, addDoc, query, where, onSnapshot,
    serverTimestamp, doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import {
    Bell, Megaphone, Plus, X, Pin, Edit2, Trash2,
    Loader2, Search, ChevronDown, ChevronUp,
    Send, AlertCircle, AlertTriangle, Info,
    Calendar, User, Eye, EyeOff, Check
} from 'lucide-react';

const PRIORITY_OPTIONS = [
    { value: 'urgent', label: 'Urgent', icon: '🔴', color: 'red' },
    { value: 'important', label: 'Important', icon: '🟡', color: 'amber' },
    { value: 'normal', label: 'Normal', icon: '🔵', color: 'blue' },
    { value: 'low', label: 'Info', icon: '⚪', color: 'gray' },
];

const PRIORITY_CONFIG = {
    urgent: { label: 'Urgent', bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', icon: AlertCircle },
    important: { label: 'Important', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', icon: AlertTriangle },
    normal: { label: 'Normal', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', icon: Info },
    low: { label: 'Info', bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20', icon: Info },
};

const WardenAnnouncements = () => {
    const { user, userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const toast = useToast();

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal',
        pinned: false,
    });

    // Fetch announcements
    useEffect(() => {
        if (!userData?.managementId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'announcements'),
            where('managementId', '==', userData.managementId)
        );

        const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
            if (snapshot.metadata.fromCache && snapshot.empty) return;

            const list = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })).sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                const tA = a.createdAt?.toMillis?.() ?? 0;
                const tB = b.createdAt?.toMillis?.() ?? 0;
                return tB - tA;
            });
            setAnnouncements(list);
            setLoading(false);
        }, (error) => {
            console.error('Announcements fetch error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.managementId]);

    const resetForm = () => {
        setFormData({ title: '', content: '', priority: 'normal', pinned: false });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error('Title and content are required');
            return;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, 'announcements', editingId), {
                    ...formData,
                    updatedAt: serverTimestamp(),
                });
                toast.success('Announcement updated!');
            } else {
                await addDoc(collection(db, 'announcements'), {
                    ...formData,
                    managementId: userData?.managementId || '',
                    collegeName: userData?.collegeName || '',
                    hostelBlock: userData?.hostelBlock || '',
                    postedBy: userData?.fullName || user?.displayName || 'Warden',
                    postedById: user.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast.success('Announcement posted!');
            }
            resetForm();
        } catch (err) {
            console.error('Submit error:', err);
            toast.error('Failed to save announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (announcement) => {
        setFormData({
            title: announcement.title || '',
            content: announcement.content || '',
            priority: announcement.priority || 'normal',
            pinned: announcement.pinned || false,
        });
        setEditingId(announcement.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement permanently?')) return;
        try {
            await deleteDoc(doc(db, 'announcements', id));
            toast.success('Announcement deleted');
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to delete');
        }
    };

    const handleTogglePin = async (announcement) => {
        try {
            await updateDoc(doc(db, 'announcements', announcement.id), {
                pinned: !announcement.pinned,
                updatedAt: serverTimestamp(),
            });
            toast.success(announcement.pinned ? 'Unpinned' : 'Pinned to top');
        } catch (err) {
            console.error('Pin error:', err);
            toast.error('Failed to update pin status');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const filtered = announcements.filter(a => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                a.title?.toLowerCase().includes(q) ||
                a.content?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <>
            <WardenHeader
                title="Announcements · Warden Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                            <Megaphone className="inline w-6 h-6 text-purple-500 mr-2 -mt-1" />
                            Announcements
                        </h2>
                        <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
                            Post and manage hostel notices • {filtered.length} total
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none sm:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search notices..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
                                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowForm(!showForm); }}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all"
                        >
                            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showForm ? 'Cancel' : 'New Post'}
                        </button>
                    </div>
                </div>

                {/* Create/Edit Form */}
                {showForm && (
                    <div className="rounded-2xl border p-6 md:p-8 mb-6 shadow-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <h3 className="text-lg font-black mb-5" style={{ color: 'var(--text-primary)' }}>
                            <Send className="inline w-5 h-5 text-orange-500 mr-2 -mt-0.5" />
                            {editingId ? 'Edit Announcement' : 'Post New Announcement'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Announcement title..."
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Content *</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                                    placeholder="Write your announcement here..."
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Priority</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PRIORITY_OPTIONS.map(p => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, priority: p.value }))}
                                                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 ${formData.priority === p.value
                                                    ? `bg-${p.color}-500/10 text-${p.color}-600 border-${p.color}-500 ring-1 ring-${p.color}-500/30`
                                                    : ''}`}
                                                style={formData.priority !== p.value ? { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' } : undefined}
                                            >
                                                {p.icon} {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Options</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, pinned: !p.pinned }))}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${formData.pinned
                                            ? 'bg-purple-500/10 text-purple-600 border-purple-500'
                                            : ''}`}
                                        style={!formData.pinned ? { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' } : undefined}
                                    >
                                        <Pin className={`w-4 h-4 ${formData.pinned ? 'rotate-45' : ''}`} />
                                        {formData.pinned ? 'Pinned' : 'Pin to Top'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={resetForm}
                                    className="px-5 py-2.5 rounded-xl border text-sm font-bold"
                                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {submitting ? 'Posting...' : editingId ? 'Update' : 'Post Announcement'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Announcements List */}
                {loading ? (
                    <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
                        <p className="mt-4 text-xs font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading announcements...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <div className="w-16 h-16 bg-purple-500/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/10">
                            <Megaphone className="w-8 h-8 text-purple-500 opacity-30" />
                        </div>
                        <p className="text-base font-bold" style={{ color: 'var(--text-muted)' }}>No Announcements</p>
                        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                            Create your first announcement to notify students.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((announcement) => {
                            const pCfg = PRIORITY_CONFIG[announcement.priority] || PRIORITY_CONFIG.normal;
                            const PIcon = pCfg.icon;
                            const isExpanded = expandedId === announcement.id;

                            return (
                                <div
                                    key={announcement.id}
                                    className={`rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${announcement.pinned ? 'ring-1 ring-purple-500/30' : ''}`}
                                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                                >
                                    <div
                                        className="p-5 md:p-6 cursor-pointer hover:bg-orange-500/5 transition-all"
                                        onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl ${pCfg.bg} flex items-center justify-center`}>
                                                <PIcon className={`w-5 h-5 md:w-6 md:h-6 ${pCfg.text}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {announcement.pinned && <Pin className="w-3.5 h-3.5 text-purple-500 rotate-45" />}
                                                    <h3 className="text-sm md:text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                                        {announcement.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className={`text-[9px] md:text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${pCfg.bg} ${pCfg.text} border ${pCfg.border}`}>
                                                        {pCfg.label}
                                                    </span>
                                                    <span className="text-[10px] md:text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                                        {formatDate(announcement.createdAt)} {formatTime(announcement.createdAt)}
                                                    </span>
                                                </div>
                                                {!isExpanded && announcement.content && (
                                                    <p className="mt-2 text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                                                        {announcement.content}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isExpanded ? <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="px-5 md:px-6 pb-5 md:pb-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                            <div className="pt-4">
                                                <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                                                        {announcement.content}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                                                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                                            Posted by: {announcement.postedBy || 'Warden'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleTogglePin(announcement); }}
                                                            className={`p-2 rounded-lg transition-all hover:scale-105 ${announcement.pinned ? 'bg-purple-500/10 text-purple-600' : ''}`}
                                                            style={!announcement.pinned ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' } : undefined}
                                                            title={announcement.pinned ? 'Unpin' : 'Pin to top'}
                                                        >
                                                            <Pin className={`w-4 h-4 ${announcement.pinned ? 'rotate-45' : ''}`} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(announcement); }}
                                                            className="p-2 rounded-lg transition-all hover:scale-105"
                                                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(announcement.id); }}
                                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 transition-all hover:scale-105 hover:bg-red-500/20"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default WardenAnnouncements;