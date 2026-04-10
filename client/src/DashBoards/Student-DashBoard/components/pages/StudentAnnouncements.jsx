import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import StudentHeader from '../layout/StudentHeader';
import { db } from '../../../../firebase/firebaseConfig';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import {
    Bell, Megaphone, Calendar, Pin, Search,
    Loader2, ChevronDown, ChevronUp, User,
    AlertCircle, Info, AlertTriangle, Star,
    Filter
} from 'lucide-react';

const PRIORITY_CONFIG = {
    urgent: { label: 'Urgent', color: 'red', icon: AlertCircle, bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
    important: { label: 'Important', color: 'amber', icon: AlertTriangle, bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
    normal: { label: 'Normal', color: 'blue', icon: Info, bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
    low: { label: 'Info', color: 'gray', icon: Info, bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20' },
};

const StudentAnnouncements = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState('all');

    // Fetch announcements for student's college/hostel
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
                // Pinned first, then by date
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

    const getTimeSince = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(timestamp);
    };

    const getScheduledTimeDisplay = (announcement) => {
        if (announcement.status !== 'scheduled') return null;
        if (!announcement.scheduledTime) return null;
        const scheduledDate = announcement.scheduledTime.toDate ? announcement.scheduledTime.toDate() : new Date(announcement.scheduledTime);
        const now = new Date();
        if (scheduledDate > now) {
            const diffMs = scheduledDate - now;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            if (diffHours > 0) {
                return `Scheduled in ${diffHours}h ${diffMins}m`;
            } else {
                return `Scheduled in ${diffMins}m`;
            }
        }
        return `Coming at ${scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const filtered = announcements.filter(a => {
        // Hide drafts - never show drafts to students
        if (a.status === 'draft') return false;

        // If the announcement targets a specific hostelBlock, only show it to
        // students in that same hostel. Empty/missing hostelBlock = college-wide.
        if (a.hostelBlock && userData?.hostelBlock && a.hostelBlock !== userData.hostelBlock) {
            return false;
        }
        if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                a.title?.toLowerCase().includes(q) ||
                a.content?.toLowerCase().includes(q) ||
                a.postedBy?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <>
            <StudentHeader
                title="Announcements · Student Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                            <Bell className="inline w-6 h-6 text-purple-500 mr-2 -mt-1" />
                            Notice Board
                        </h2>
                        <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
                            {filtered.length} announcement{filtered.length !== 1 ? 's' : ''} • {userData?.collegeName || 'Your College'}
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
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border text-sm"
                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">All Priority</option>
                            <option value="urgent">Urgent</option>
                            <option value="important">Important</option>
                            <option value="normal">Normal</option>
                            <option value="low">Info</option>
                        </select>
                    </div>
                </div>

                {/* Announcements List */}
                {loading ? (
                    <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                        <p className="mt-4 text-xs font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading announcements...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <div className="w-16 h-16 bg-purple-500/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/10">
                            <Megaphone className="w-8 h-8 text-purple-500 opacity-30" />
                        </div>
                        <p className="text-base font-bold" style={{ color: 'var(--text-muted)' }}>No Announcements</p>
                        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                            {searchQuery || filterPriority !== 'all'
                                ? 'No announcements match your filters.'
                                : 'No announcements have been posted yet. Check back later!'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((announcement) => {
                            const priorityCfg = PRIORITY_CONFIG[announcement.priority] || PRIORITY_CONFIG.normal;
                            const PriorityIcon = priorityCfg.icon;
                            const isExpanded = expandedId === announcement.id;

                            return (
                                <div
                                    key={announcement.id}
                                    className={`rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${announcement.pinned ? 'ring-1 ring-purple-500/30' : ''}`}
                                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                                >
                                    {/* Header */}
                                    <div
                                        className="p-5 md:p-6 cursor-pointer hover:bg-purple-500/5 transition-all"
                                        onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl ${priorityCfg.bg} flex items-center justify-center`}>
                                                <PriorityIcon className={`w-5 h-5 md:w-6 md:h-6 ${priorityCfg.text}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {announcement.pinned && (
                                                                <Pin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 rotate-45" />
                                                            )}
                                                            <h3 className="text-sm md:text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                                                {announcement.title}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className={`text-[9px] md:text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${priorityCfg.bg} ${priorityCfg.text} border ${priorityCfg.border}`}>
                                                                {priorityCfg.label}
                                                            </span>
                                                            {announcement.status === 'scheduled' && getScheduledTimeDisplay(announcement) ? (
                                                                <span className="text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-md text-amber-600 bg-amber-500/10 border border-amber-500/20">
                                                                    ⏰ {getScheduledTimeDisplay(announcement)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] md:text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                                                    {getTimeSince(announcement.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isExpanded
                                                        ? <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                                                        : <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                                                    }
                                                </div>
                                                {!isExpanded && announcement.content && (
                                                    <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                                                        {announcement.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                            <div className="pt-4">
                                                {announcement.content && (
                                                    <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                                                            {announcement.content}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between flex-wrap gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                                                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                                            Posted by: {announcement.postedBy || 'Warden'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                                                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                                            {formatDate(announcement.createdAt)} {formatTime(announcement.createdAt)}
                                                        </p>
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

export default StudentAnnouncements;