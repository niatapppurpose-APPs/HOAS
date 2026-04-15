import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import StudentHeader from './components/layout/StudentHeader';
import StatsCard from '../../components/OwnerServices/StatsCard';
import { useToast } from '../../components/Toast';
import Avatar from '../../components/OwnerServices/Avatar';
import { useDashboardTour, studentTourSteps } from '../../tours';
import './StudentDashboard.css';
import {
    GraduationCap,
    Building2,
    User,
    Phone,
    Hash,
    Loader2,
    Home,
    Calendar,
    Bell,
    FileText,
    Edit2,
    Check,
    X,
    Clock,
    ArrowRight,
    MessageSquare,
    ClipboardCheck,
    ChevronRight,
} from 'lucide-react';

const StudentDashboard = () => {
    const { user, userData, userDataLoading, createUserProfile } = useAuth();
    const navigate = useNavigate();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);

    // Auto-start tour on first visit (waits for data to load)
    useDashboardTour('student', studentTourSteps, { ready: !userDataLoading });

    const [isSaving, setIsSaving] = useState(false);
    const [complaints, setComplaints] = useState([]);
    const [complaintsLoading, setComplaintsLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        roomNumber: '',
        collegeName: '',
        studentId: '',
        hostelBlock: '',
    });

    useEffect(() => {
        if (userData) {
            setFormData({
                fullName: userData.fullName || '',
                phone: userData.phone || '',
                roomNumber: userData.roomNumber || '',
                collegeName: userData.collegeName || '',
                studentId: userData.studentId || '',
                hostelBlock: userData.hostelBlock || '',
            });
        }
    }, [userData]);

    // Fetch student's recent complaints
    useEffect(() => {
        if (!user?.uid) return;

        setComplaintsLoading(true);
        const q = query(
            collection(db, 'complaints'),
            where('studentId', '==', user.uid)
        );

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
            }).slice(0, 5);
            setComplaints(list);

            // Re-fetch all to get total pending count if needed, or filter current list if limit is enough
            const pending = list.filter(c => c.status === 'pending').length;
            setPendingCount(pending);
            setComplaintsLoading(false);
        }, (error) => {
            console.error('Complaints fetch error:', error);
            setComplaintsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (!userDataLoading) {
            if (!userData) {
                navigate('/');
            } else if (userData.status === 'pending' || userData.status === 'denied') {
                navigate('/waiting-approval');
            } else if (userData.role !== 'student') {
                navigate('/dashboard');
            } else {
                const needsPayment = !userData.feeDetails?.paidFee || userData.feeDetails?.paidFee === 0;
                const unverified = !userData.managementVerification || userData.managementVerification === 'Unverified' || !userData.wardenVerification || userData.wardenVerification === 'Unverified';
                if (needsPayment || unverified) {
                    navigate('/waiting-approval');
                }
            }
        }
    }, [userData, userDataLoading, navigate]);

    const handleAction = (action) => {
        // Placeholder for quick actions
        console.log(`Action: ${action}`);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const success = await createUserProfile('student', {
                ...formData,
                status: userData.status,
                updatedAt: new Date().toISOString()
            });
            if (success) {
                setIsEditing(false);
                toast.success('Profile updated successfully!');
            } else {
                toast.error('Failed to update profile.');
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error('An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        });
    };

    const quickActions = [
        {
            title: 'File Complaint',
            desc: 'Raise maintenance issues',
            icon: FileText,
            path: 'complaints',
            color: 'blue'
        },
        {
            title: 'My Complaints',
            desc: 'View status updates',
            icon: MessageSquare,
            path: 'complaints',
            color: 'indigo'
        },
        {
            title: 'Apply Leave',
            desc: 'Register outing',
            icon: Calendar,
            path: 'leave',
            color: 'green'
        },
        {
            title: 'Notice Board',
            desc: 'Hostel announcements',
            icon: Bell,
            path: 'announcements',
            color: 'purple'
        },
    ];

    if (userDataLoading || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <StudentHeader
                title="Student Dashboard · Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            {/* Main Content */}
            <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Welcome Banner */}
                <div id="student-tour-welcome" className="relative mb-6 md:mb-8 overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-10 border shadow-2xl transition-all hover:shadow-blue-500/10"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-primary)',
                        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)'
                    }}>
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-blue-500/10 blur-[80px]" />
                    <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 rounded-full bg-indigo-500/5 blur-[60px]" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                Welcome, <span className="bg-clip-text text-blue-500">{userData.fullName?.split(' ')[0]} 👋</span>
                            </h1>
                            <p className="mt-2 text-sm md:text-base opacity-70" style={{ color: 'var(--text-secondary)' }}>Your quick overview and hostel status</p>
                            <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                                <button onClick={() => navigate('help')} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform flex items-center gap-2">
                                    <FileText size={14} className="md:w-4 md:h-4" /> Need Help?
                                </button>
                                <button onClick={() => navigate('profile')} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl border font-bold text-xs md:text-sm hover:bg-blue-500/5 transition-all flex items-center gap-2" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <User size={14} className="md:w-4 md:h-4" /> View Profile
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
                                    <div className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-inner">
                                        <p className="text-xl md:text-2xl font-black text-blue-500 leading-none">{pendingCount}</p>
                                        <p className="mt-1 md:mt-1.5 text-[10px] md:text-xs font-bold text-blue-500 uppercase tracking-widest">Active Issues</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
                    {/* Left Column: Action Grid and Recent Activity */}
                    <div className="lg:col-span-8 space-y-6 md:space-y-8">
                        {/* Quick Actions Grid */}
                        <div id="student-tour-actions" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(action.path)}
                                    className="group relative flex flex-col items-center justify-center rounded-[1.25rem] md:rounded-[1.5rem] border p-4 md:p-6 transition-all hover:scale-[1.05] hover:shadow-2xl"
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border-primary)'
                                    }}
                                >
                                    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-${action.color}-500/10 text-${action.color}-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300`}>
                                        <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="mt-3 md:mt-4 text-[11px] md:text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>{action.title}</h3>
                                </button>
                            ))}
                        </div>

                        {/* Recent Complaints Activity */}
                        <div id="student-tour-activity" className="rounded-[1.25rem] md:rounded-[1.5rem] border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <div className="p-5 md:p-8 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                                <div>
                                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>My Recent Activity</h3>
                                    <p className="text-[10px] md:text-xs font-bold mt-1 opacity-60 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Latest updates on your filed complaints</p>
                                </div>
                                <button onClick={() => navigate('complaints')} className="group flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-500 hover:gap-3 transition-all">
                                    Full Hub <ArrowRight size={14} className="md:w-4 md:h-4" />
                                </button>
                            </div>

                            <div className="divide-y max-h-[380px] overflow-y-auto student-scrollbar" style={{ borderColor: 'var(--border-primary)' }}>
                                {complaintsLoading ? (
                                    <div className="p-10 md:p-12 text-center">
                                        <Loader2 className="w-7 h-7 md:w-8 md:h-8 animate-spin mx-auto text-blue-500" />
                                        <p className="mt-3 md:mt-4 text-[10px] md:text-xs font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-muted)' }}>Syncing Activity Feed...</p>
                                    </div>
                                ) : complaints.length === 0 ? (
                                    <div className="p-10 md:p-12 text-center">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-500/10">
                                            <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-blue-500 opacity-30" />
                                        </div>
                                        <p className="text-xs md:text-sm font-bold" style={{ color: 'var(--text-muted)' }}>No Complaints</p>
                                        <p className="text-[10px] md:text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>You haven't raised any complaints yet.</p>
                                    </div>
                                ) : (
                                    complaints.map((c) => (
                                        <div key={c.id} className="p-4 md:p-5 flex items-center gap-3 md:gap-4 hover:bg-blue-500/5 transition-all cursor-pointer group" onClick={() => navigate('complaints')}>
                                            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                <FileText className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm md:text-base font-bold truncate group-hover:text-blue-600 transition-colors" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                                                    <span className="text-[10px] md:text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-1.5 md:gap-2">
                                                        <Clock className="w-3 h-3 text-blue-500" />
                                                        <p className="text-[10px] md:text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{c.category || 'General'} · Room {userData.roomNumber || 'N/A'}</p>
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

                    {/* Right Column: Profile Summary */}
                    <div className="lg:col-span-4 space-y-6 md:space-y-8">
                        {/* Profile Info Card */}
                        <div id="student-tour-info" className="rounded-[1.25rem] md:rounded-[1.5rem] border p-6 md:p-8 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-20 h-20 rounded-xl overflow-hidden mb-4 shadow-xl border-2 border-blue-500/20">
                                    <Avatar name={userData?.fullName} image={userData?.photoURL || user?.photoURL} email={userData?.email || user?.email} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>{userData.fullName}</h3>
                                <div className="mt-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                                    Identity Verified
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Profile Details</h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-all border border-blue-500/10"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            disabled={isSaving}
                                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-500/10 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
                                        >
                                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="student-profile-item">
                                    <Phone className="student-profile-icon" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>Mobile</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="student-profile-input"
                                            />
                                        ) : (
                                            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{userData.phone || '—'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="student-profile-item">
                                    <Home className="student-profile-icon" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>Room & Hostel</p>
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    name="roomNumber"
                                                    value={formData.roomNumber}
                                                    onChange={handleChange}
                                                    className="student-profile-input"
                                                    placeholder="Room"
                                                />
                                                <input
                                                    type="text"
                                                    name="hostelBlock"
                                                    value={formData.hostelBlock}
                                                    onChange={handleChange}
                                                    className="student-profile-input"
                                                    placeholder="Block A"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{userData.roomNumber || 'N/A'} · {userData.hostelBlock || '—'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="student-profile-item">
                                    <Hash className="student-profile-icon" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>Student ID</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="studentId"
                                                value={formData.studentId}
                                                onChange={handleChange}
                                                className="student-profile-input"
                                            />
                                        ) : (
                                            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{userData.studentId || '—'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="student-profile-item">
                                    <Building2 className="student-profile-icon" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>Institute</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="collegeName"
                                                value={formData.collegeName}
                                                onChange={handleChange}
                                                className="student-profile-input"
                                            />
                                        ) : (
                                            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{userData.collegeName || '—'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('profile')}
                                className="w-full mt-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Full Profile View
                            </button>
                        </div>

                        {/* Leave/Notice Box */}
                        <div id="student-tour-gatepass" className="rounded-[1.25rem] md:rounded-[1.5rem] border p-6 flex items-center gap-4 transition-all hover:shadow-lg"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                                <ClipboardCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Gate Pass Status</h4>
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">No active stay-out</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;