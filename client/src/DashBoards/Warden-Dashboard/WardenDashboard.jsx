import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import * as cloudFunctions from '../../firebase/cloudFunctions';
import { useToast } from '../../components/Toast';
import WardenHeader from './components/layout/WardenHeader';
import StatsCard from '../../components/OwnerServices/StatsCard';
import './WardenDashboard.css';
import {
    Shield,
    Building2,
    User,
    Phone,
    Briefcase,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    GraduationCap,
} from 'lucide-react';

const WardenDashboard = () => {
    const { userData, userDataLoading, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const { isCollapsed, setIsCollapsed } = useOutletContext();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        if (!userDataLoading) {
            if (!userData) {
                navigate('/profile/warden-profile');
            } else if (userData.status === 'pending' || userData.status === 'denied') {
                navigate('/waiting-approval');
            } else if (userData.role !== 'warden') {
                navigate('/role');
            }
        }
    }, [userData, userDataLoading, navigate]);

    // Fetch students from same college
    useEffect(() => {
        if (!userData?.collegeId) return;

        const q = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('collegeId', '==', userData.collegeId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const studentList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStudents(studentList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.collegeId]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleStatusChange = async (studentId, newStatus) => {
        try {
            if (newStatus === 'approved') {
                await cloudFunctions.approveUser(studentId, 'warden');
            } else if (newStatus === 'denied') {
                await cloudFunctions.denyUser(studentId, 'Denied by warden');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(`Failed to ${newStatus} student: ${error.message}`);
        }
    };

    if (userDataLoading || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        );
    }

    const filteredStudents = students.filter(s => s.status === activeTab);
    const stats = {
        pending: students.filter(s => s.status === 'pending').length,
        approved: students.filter(s => s.status === 'approved').length,
        denied: students.filter(s => s.status === 'denied').length
    };

    return (
        <>
            {/* Header */}
            <WardenHeader
                pendingCount={stats.pending}
                title="Dashboard · Warden Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            {/* Main Content */}
            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Stats Section */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    <StatsCard
                        icon={Clock}
                        title="Pending Students"
                        value={stats.pending}
                        gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                    />
                    <StatsCard
                        icon={CheckCircle}
                        title="Approved Students"
                        value={stats.approved}
                        gradient="bg-gradient-to-br from-emerald-500 to-green-600"
                    />
                    <StatsCard
                        icon={XCircle}
                        title="Denied Students"
                        value={stats.denied}
                        gradient="bg-gradient-to-br from-red-500 to-rose-600"
                    />
                </section>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Profile</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <User className="w-4 h-4 text-orange-500" />
                                    <span>{userData.fullName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <Phone className="w-4 h-4 text-orange-500" />
                                    <span>{userData.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <Briefcase className="w-4 h-4 text-orange-500" />
                                    <span>{userData.designation}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <Building2 className="w-4 h-4 text-orange-500" />
                                    <span>{userData.collegeName}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Student Management Card */}
                        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Student Management</h3>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                    Manage student registrations for {userData.collegeName}
                                </p>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                {['pending', 'approved', 'denied'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-3 text-sm font-medium transition-all relative ${activeTab === tab ? 'text-orange-500' : ''
                                            }`}
                                        style={activeTab !== tab ? { color: 'var(--text-secondary)' } : {}}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)} ({
                                            tab === 'pending' ? stats.pending :
                                                tab === 'approved' ? stats.approved : stats.denied
                                        })
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Student List */}
                            <div className="p-6 max-h-[500px] overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                                    </div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="text-center py-12">
                                        <GraduationCap className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                                        <p style={{ color: 'var(--text-muted)' }}>No {activeTab} students</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className="flex items-center justify-between p-4 rounded-xl"
                                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={student.photoURL || '/default-avatar.png'}
                                                        alt={student.fullName}
                                                        className="w-12 h-12 rounded-full object-cover border-2"
                                                        style={{ borderColor: 'var(--border-primary)' }}
                                                    />
                                                    <div>
                                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{student.fullName}</p>
                                                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{student.email}</p>
                                                        <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            <span>Roll: {student.rollNumber}</span>
                                                            <span>Room: {student.roomNumber}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {activeTab === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'approved')}
                                                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm rounded-lg hover:opacity-90 transition-all flex items-center gap-1"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'denied')}
                                                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm rounded-lg hover:opacity-90 transition-all flex items-center gap-1"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Deny
                                                        </button>
                                                    </div>
                                                )}
                                                {activeTab === 'approved' && (
                                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
                                                        Active
                                                    </span>
                                                )}
                                                {activeTab === 'denied' && (
                                                    <button
                                                        onClick={() => handleStatusChange(student.id, 'approved')}
                                                        className="px-4 py-2 text-sm rounded-lg transition-colors border"
                                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                                                    >
                                                        Restore
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WardenDashboard;