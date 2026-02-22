import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useOutletContext } from 'react-router-dom';
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
    const { isCollapsed, setIsCollapsed } = useOutletContext();

    useEffect(() => {
        if (!userDataLoading) {
            if (!userData) {
                navigate('/profile/student-profile');
            } else if (userData.status === 'pending' || userData.status === 'denied') {
                navigate('/waiting-approval');
            } else if (userData.role !== 'student') {
                navigate('/dashboard');
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
            {/* Header */}
            <StudentHeader
                title="Dashboard · Student Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            {/* Main Content */}
            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Welcome Card */}
                <div className="student-welcome-card mb-6 md:mb-8 p-6 md:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 relative z-10">Welcome back, {userData.fullName?.split(' ')[0]}! 👋</h2>
                    <p className="text-xs sm:text-sm text-blue-100 relative z-10">Your current status and quick overview</p>
                </div>

                {/* Profile Info Card */}
                <div className="rounded-2xl border p-4 sm:p-6 mb-6 md:mb-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Profile Summary</h3>
                    <div className="student-profile-grid">
                        <div className="student-profile-item">
                            <User className="student-profile-icon" />
                            <div>
                                <p className="text-[10px] md:text-xs" style={{ color: 'var(--text-muted)' }}>Name</p>
                                <p className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>{userData.fullName}</p>
                            </div>
                        </div>
                        <div className="student-profile-item">
                            <Phone className="student-profile-icon" />
                            <div>
                                <p className="text-[10px] md:text-xs" style={{ color: 'var(--text-muted)' }}>Mobile</p>
                                <p className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>{userData.phone}</p>
                            </div>
                        </div>
                        <div className="student-profile-item">
                            <Hash className="student-profile-icon" />
                            <div>
                                <p className="text-[10px] md:text-xs" style={{ color: 'var(--text-muted)' }}>Roll No</p>
                                <p className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>{userData.rollNumber}</p>
                            </div>
                        </div>
                        <div className="student-profile-item">
                            <Home className="student-profile-icon" />
                            <div>
                                <p className="text-[10px] md:text-xs" style={{ color: 'var(--text-muted)' }}>Room</p>
                                <p className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>{userData.roomNumber}</p>
                            </div>
                        </div>
                        <div className="student-profile-item sm:col-span-2">
                            <Building2 className="student-profile-icon" />
                            <div>
                                <p className="text-[10px] md:text-xs" style={{ color: 'var(--text-muted)' }}>Institute</p>
                                <p className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>{userData.collegeName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border p-4 sm:p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Operations</h3>
                    <div className="student-actions-grid">
                        <button className="student-action-card student-action-blue flex flex-col items-center sm:items-start text-center sm:text-left transition-transform hover:scale-[1.02]">
                            <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mb-2" />
                            <p className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>File Complaint</p>
                            <p className="text-[10px] md:text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Raise maintenance issues</p>
                        </button>
                        <button className="student-action-card student-action-green flex flex-col items-center sm:items-start text-center sm:text-left transition-transform hover:scale-[1.02]">
                            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-green-500 mb-2" />
                            <p className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>Apply for Leave</p>
                            <p className="text-[10px] md:text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Register your outing</p>
                        </button>
                        <button className="student-action-card student-action-purple flex flex-col items-center sm:items-start text-center sm:text-left transition-transform hover:scale-[1.02]">
                            <Bell className="w-6 h-6 md:w-8 md:h-8 text-purple-500 mb-2" />
                            <p className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>Notice Board</p>
                            <p className="text-[10px] md:text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Stay updated with news</p>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;