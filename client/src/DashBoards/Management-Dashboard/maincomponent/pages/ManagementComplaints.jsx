import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseConfig';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import ManagementHeader from '../../components/layout/ManagementHeader';
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
    Tag
} from 'lucide-react';
import { useToast } from '../../../../components/Toast';

const ManagementComplaints = () => {
    const { userData } = useAuth();
    const { isCollapsed } = useOutletContext();
    const toast = useToast();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, escalated, pending
    const [searchTerm, setSearchTerm] = useState('');

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

            // Check for auto-escalations (if expired and still pending)
            const now = new Date();
            const processedList = list.map(c => {
                const expiryDate = c.expiresAt?.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt);
                const isOverdue = c.status === 'pending' && expiryDate < now;
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

        if (filter === 'escalated') return matchesSearch && (c.isEscalated || c.isAutoEscalated);
        if (filter === 'pending') return matchesSearch && c.status === 'pending';
        if (filter === 'resolved') return matchesSearch && c.status === 'resolved';
        return matchesSearch;
    });

    const stats = {
        total: complaints.length,
        escalated: complaints.filter(c => c.isEscalated || c.isAutoEscalated).length,
        pending: complaints.filter(c => c.status === 'pending').length,
        resolved: complaints.filter(c => c.status === 'resolved').length
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    return (
        <div className="management-complaints-page">
            <ManagementHeader
                title="Complaints & Escalations"
                isCollapsed={isCollapsed}
            />

            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                    <div className="p-4 rounded-2xl border bg-orange-500/5" style={{ borderColor: 'rgba(249, 115, 22, 0.2)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-orange-600/70">Escalated / Overdue</p>
                                <p className="text-xl font-bold text-orange-600">{stats.escalated}</p>
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
                        {['all', 'escalated', 'pending', 'resolved'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {f}
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
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading complaints...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <MessageSquare size={48} />
                                                <p className="text-sm font-bold">No complaints found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map((c) => (
                                        <tr key={c.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.studentName}</span>
                                                    <span className="text-[11px] font-medium opacity-60" style={{ color: 'var(--text-secondary)' }}>Room {c.roomNumber || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col max-w-md">
                                                    <div className="flex items-center gap-2">
                                                        {(c.isEscalated || c.isAutoEscalated) && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500 text-white uppercase">Overdue</span>
                                                        )}
                                                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.title}</span>
                                                    </div>
                                                    <span className="text-[11px] opacity-60 truncate" style={{ color: 'var(--text-secondary)' }}>{c.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${c.status === 'resolved' ? 'bg-green-500/10 text-green-600' :
                                                    c.status === 'in-progress' ? 'bg-blue-500/10 text-blue-600' :
                                                        'bg-amber-500/10 text-amber-600'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'resolved' ? 'bg-green-600' :
                                                        c.status === 'in-progress' ? 'bg-blue-600' :
                                                            'bg-amber-600'
                                                        }`} />
                                                    {c.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500">
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagementComplaints;
