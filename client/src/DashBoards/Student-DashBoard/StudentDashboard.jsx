import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { useTranslation } from '../../hooks/useTranslation';
import StudentHeader from './components/layout/StudentHeader';
import StatsCard from '../../components/OwnerServices/StatsCard';
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
} from 'lucide-react';

const StudentDashboard = () => {
    const { user, userData, userDataLoading } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const { translatePage, translating } = useTranslation(toast);

    useEffect(() => {
        if (!userDataLoading) {
            if (!userData) {
                navigate('/profile/student-profile');
            } else if (userData.status === 'pending' || userData.status === 'denied') {
                navigate('/waiting-approval');
            } else if (userData.role !== 'student') {
                navigate('/role');
            }
        }
    }, [userData, userDataLoading, navigate]);

    if (userDataLoading || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <>
            {/* Translation Loader Overlay */}
            {translating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="p-6 rounded-lg shadow-lg flex items-center gap-3" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span style={{ color: 'var(--text-primary)' }}>Translating page...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <StudentHeader 
                title="Dashboard · Student Portal" 
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            {/* Main Content */}
            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Welcome Card */}
                <div className="student-welcome-card mb-8">
                    <h2 className="text-2xl font-bold mb-2 relative z-10">Welcome back, {userData.fullName?.split(' ')[0]}! 👋</h2>
                    <p className="text-blue-100 relative z-10">Here's what's happening in your hostel today.</p>
                </div>

                {/* Profile Info Card */}
                <div className="rounded-2xl border p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Profile</h3>
                    <div className="student-profile-grid">
                        <div className="student-profile-item">
                            <User className="student-profile-icon" />
                            <div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Full Name</p>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{userData.fullName}</p>
                            </div>
                        </div>
                        <div className="student-profile-item">
                            <Phone className="student-profile-icon" />
                            <div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Phone</p>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{userData.phone}</p>
                            </div>
                        </div>
                        <div className="student-profile-item">
                            <Hash className="student-profile-icon" />
                            <div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Roll Number</p>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{userData.rollNumber}</p>
                            </div>
                        </div>
                        <div className="student-profile-item">
                            <Home className="student-profile-icon" />
                            <div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Room Number</p>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{userData.roomNumber}</p>
                            </div>
                        </div>
                        <div className="student-profile-item sm:col-span-2">
                            <Building2 className="student-profile-icon" />
                            <div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>College</p>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{userData.collegeName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
                    <div className="student-actions-grid">
                        <button className="student-action-card student-action-blue">
                            <FileText className="w-8 h-8 text-blue-500 mb-2" />
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>File Complaint</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Report issues or problems</p>
                        </button>
                        <button className="student-action-card student-action-green">
                            <Calendar className="w-8 h-8 text-green-500 mb-2" />
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Apply for Leave</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Request hostel leave</p>
                        </button>
                        <button className="student-action-card student-action-purple">
                            <Bell className="w-8 h-8 text-purple-500 mb-2" />
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>View Notices</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Check announcements</p>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;