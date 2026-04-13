import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '../../components/Toast';
import WardenHeader from './components/layout/WardenHeader';
import { useDashboardTour, wardenTourSteps } from '../../tours';
import './WardenDashboard.css';
import {
    Building2,
    User,
    Phone,
    Loader2,
    FileText,
    Bell,
    Users,
    ArrowRight,
    MessageSquare,
    ClipboardCheck,
    ChevronRight,
} from 'lucide-react';
import Avatar from '../../components/OwnerServices/Avatar';

const WardenDashboard = () => {
    const { user, userData, userDataLoading, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const { isCollapsed, setIsCollapsed } = useOutletContext();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    // Auto-start tour on first visit (waits for data to load)
    useDashboardTour('warden', wardenTourSteps, { ready: !loading && !userDataLoading });

    useEffect(() => {
        if (!userDataLoading) {
            if (!userData) {
                navigate('/');
            } else if (userData.status === 'pending' || userData.status === 'denied') {
                navigate('/waiting-approval');
            } else if (userData.role !== 'warden') {
                navigate('/dashboard');
            }
        }
    }, [userData, userDataLoading, navigate]);

    // Fetch recent complaints
    useEffect(() => {
        if (!userData?.managementId) return;

        setLoading(true);
        const q = query(
            collection(db, 'complaints'),
            where('managementId', '==', userData.managementId),
        );

        let isInitialLoad = true;

        const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
            // Skip empty cache results — wait for the real network response
            if (snapshot.metadata.fromCache && snapshot.empty) return;

            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => {
                const tA = a.createdAt?.toMillis?.() ?? 0;
                const tB = b.createdAt?.toMillis?.() ?? 0;
                return tB - tA;
            });

            // Notification Logic for Warden
            if (!isInitialLoad) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added" && change.doc.data().status === 'pending') {
                        const newComplaint = change.doc.data();
                        // Show visual notification
                        toast.info(`🔔 New Complaint: ${newComplaint.title}`, {
                            description: `From Room ${newComplaint.roomNumber || 'N/A'}`,
                            duration: 10000
                        });
                    }
                });
            }

            setComplaints(list);
            setLoading(false);
            isInitialLoad = false;

            // Count pending
            const pending = list.filter(c => c.status === 'pending').length;
            setPendingCount(pending);
        }, (error) => {
            console.error('Complaints fetch error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData?.managementId]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (userDataLoading || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        );
    }

    const quickActions = [
        {
            title: 'Complaints',
            desc: 'Review student issues',
            icon: MessageSquare,
            path: 'complaints',
            color: 'orange',
            count: pendingCount > 0 ? pendingCount : null
        },
        {
            title: 'Students',
            desc: 'View student directory',
            icon: Users,
            path: 'students',
            color: 'blue'
        },
        {
            title: 'Notice Board',
            desc: 'Post announcements',
            icon: Bell,
            path: 'announcements',
            color: 'purple'
        },
        {
            title: 'Attendance',
            desc: 'Daily hostel check',
            icon: ClipboardCheck,
            path: 'students',
            color: 'green'
        },

    ];

    const formatDate = (timestamp) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <>
            {/* Header */}
            <WardenHeader
                pendingCount={pendingCount}
                title="Warden Overview · Command Center"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                handleLogout={handleLogout}
            />

            {/* Main Content */}
            <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-6 md:pb-0">
                {/* Welcome Banner */}
                <div id="warden-tour-welcome" className="relative mb-6 md:mb-8 overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-10 border shadow-2xl transition-all hover:shadow-orange-500/10"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-primary)',
                        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)'
                    }}>
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-orange-500/10 blur-[80px]" />
                    <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 rounded-full bg-amber-500/5 blur-[60px]" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                Welcome back, <span className="bg-clip-text  ">{userData.fullName} 👋</span>
                            </h1>
                            <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                                <Link to="complaints" className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform flex items-center gap-2">
                                    <MessageSquare size={14} className="md:w-4 md:h-4" /> Manage Complaints
                                </Link>
                                <button onClick={() => navigate('profile')} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl border font-bold text-xs md:text-sm hover:bg-orange-500/5 transition-all flex items-center gap-2" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <User size={14} className="md:w-4 md:h-4" /> Profile Details
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-8">
                            {/* Date Widget */}
                            <div className="flex flex-col items-center md:items-start p-3 md:p-5 rounded-2xl border backdrop-blur-md transition-all hover:scale-105"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--border-primary)',
                                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
                                }}>
                                <p className="text-2xl md:text-3xl font-black tracking-tighter leading-none" style={{ color: 'var(--text-primary)' }}>
                                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </p>
                                <p className="mt-1 text-[9px] md:text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>
                                    {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
                                </p>
                            </div>

                            <div className="flex gap-4 md:gap-8">
                                <div className="text-center">
                                    <div className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
                                        <p className="text-xl md:text-2xl font-black text-amber-500 leading-none">{pendingCount}</p>
                                        <p className="mt-1 md:mt-1.5 text-[10px] md:text-xs font-bold text-amber-500">Issues</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
                    {/* Left Column: Action Hub and Activity */}
                    <div className="lg:col-span-8 space-y-6 md:y-8">
                        {/* Action Center Grid */}
                        <div id="warden-tour-actions" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickActions.map((action, idx) => (
                                <Link
                                    key={idx}
                                    to={action.path}
                                    className="group relative flex flex-col items-center justify-center rounded-[1.25rem] md:rounded-[1.5rem] border p-4 md:p-6  hover:shadow-2xl"
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border-primary)'
                                    }}
                                >
                                    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-${action.color}-500/10 text-${action.color}-500 group-hover:bg-${action.color}-500  transition-all duration-300`}>
                                        <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="mt-3 md:mt-4 text-xs md:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{action.title}</h3>
                                    {action.count && (
                                        <div className="absolute top-2 right-2 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-orange-500 text-[9px] md:text-[10px] font-bold text-white shadow-lg">
                                            {action.count}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* Recent Activity: Complaints Feed */}
                        <div className='p-5'>
                            <div id="warden-tour-activity" className="rounded-[1.25rem] md:rounded-[1.5rem] border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <div className="p-5 md:p-8 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                                <div>
                                    <h3 className="text-lg md:text-xl font-black" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
                                    <p className="text-xs md:text-sm font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>Latest updates from students</p>
                                </div>
                                <Link to="complaints" className="group flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-orange-500 hover:gap-3 transition-all">
                                    <span className="hidden sm:inline">View Service Hub</span> <ArrowRight size={14} className="md:w-4 md:h-4" />
                                </Link>
                            </div>

                            <div className="divide-y max-h-[320px] overflow-y-auto warden-scrollbar" style={{ borderColor: 'var(--border-primary)' }}>
                                {loading ? (
                                    <div className="p-10 md:p-12 text-center">
                                        <Loader2 className="w-7 h-7 md:w-8 md:h-8 animate-spin mx-auto text-orange-500" />
                                        <p className="mt-3 md:mt-4 text-xs md:text-sm font-medium animate-pulse" style={{ color: 'var(--text-muted)' }}>Syncing data...</p>
                                    </div>
                                ) : complaints.length === 0 ? (
                                    <div className="p-10 md:p-12 text-center">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-500/10">
                                            <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-orange-500 opacity-30" />
                                        </div>
                                        <p className="text-xs md:text-sm font-bold" style={{ color: 'var(--text-muted)' }}>No Complaints</p>
                                        <p className="text-[10px] md:text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>No complaints have been raised yet.</p>
                                    </div>
                                ) : (
                                    complaints.map((c) => (
                                        <div key={c.id} className="p-4 md:p-5 flex items-center gap-3 md:gap-4 hover:bg-orange-500/5 transition-all cursor-pointer group" onClick={() => navigate('complaints')}>
                                            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                                <FileText className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm md:text-base font-bold truncate group-hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                                                    <span className="text-[10px] md:text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-1.5 md:gap-2">
                                                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-orange-500" />
                                                        <p className="text-[10px] md:text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{c.studentName || 'Student'} · {c.roomNumber || 'N/A'}</p>
                                                    </div>
                                                    <span className={`text-[9px] md:text-[10px] px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg font-black tracking-wider uppercase ${c.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                                        c.status === 'in-progress' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                                                            'bg-green-500/10 text-green-600 border border-green-500/20'
                                                        }`}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="hidden sm:block w-4 h-4 md:w-5 md:h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Right Column: Mini Profile & System Status */}
                    <div className="lg:col-span-4 space-y-6 md:y-8 relative lg:top-15">
                        {/* Warden Info Card */}
                        <div id="warden-tour-info" className="rounded-[1.25rem] md:rounded-[1.5rem] border p-6 md:p-8 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-lg md:w-24 md:h-24 p-1 mb-4 md:mb-6 shadow-xl hover:rotate-0 ">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Avatar name={userData?.fullName || userData?.displayName} image={userData?.photoURL || user?.photoURL} email={userData?.email || user?.email} alt="Warden" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <h3 className="font-black text-xl md:text-2xl" style={{ color: 'var(--text-primary)' }}>{userData.fullName}</h3>
                                <div className="mt-2 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-orange-500/10 text-orange-600 text-[10px] font-black uppercase tracking-widest">
                                    Authorized Warden
                                </div>
                            </div>

                            <div className="mt-6 md:mt-8 space-y-2 md:space-y-3">
                                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-colors hover:bg-orange-500/5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                    <Phone className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>Contact</p>
                                        <p className="text-xs md:text-sm font-bold truncate" style={{ color: 'var(--text-secondary)' }}>{userData.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-colors hover:bg-orange-500/5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                    <Building2 className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>College</p>
                                        <p className="text-xs md:text-sm font-bold truncate" style={{ color: 'var(--text-secondary)' }}>{userData.collegeName}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('profile')}
                                className="w-full mt-6 md:mt-8 py-3 md:py-4 rounded-xl md:rounded-[1.25rem] text-[11px] md:text-xs font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WardenDashboard;
