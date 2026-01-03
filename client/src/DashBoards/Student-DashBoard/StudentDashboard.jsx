import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    GraduationCap, 
    Building2, 
    User, 
    Phone, 
    Hash, 
    LogOut, 
    Loader2,
    Home,
    Calendar,
    Bell,
    FileText,
    Settings
} from 'lucide-react';

const StudentDashboard = () => {
    const { user, userData, userDataLoading, logout } = useAuth();
    const navigate = useNavigate();

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

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (userDataLoading || !userData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const menuItems = [
        { icon: Home, label: 'Dashboard', active: true },
        { icon: FileText, label: 'Complaints', active: false },
        { icon: Calendar, label: 'Leave Requests', active: false },
        { icon: Bell, label: 'Announcements', active: false },
        { icon: Settings, label: 'Settings', active: false },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">HOAS</h1>
                                <p className="text-xs text-gray-500">Student Portal</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <div className="flex items-center gap-3">
                                <img
                                    src={user?.photoURL || '/default-avatar.png'}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                    {userData.fullName}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-4">
                            <nav className="space-y-1">
                                {menuItems.map((item, index) => (
                                    <button
                                        key={index}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                            item.active
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Welcome Card */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                            <h2 className="text-2xl font-bold mb-2">Welcome back, {userData.fullName?.split(' ')[0]}! 👋</h2>
                            <p className="text-blue-100">Here's what's happening in your hostel today.</p>
                        </div>

                        {/* Profile Info Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <User className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Full Name</p>
                                        <p className="font-medium text-gray-900">{userData.fullName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Phone className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="font-medium text-gray-900">{userData.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Hash className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Roll Number</p>
                                        <p className="font-medium text-gray-900">{userData.rollNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Home className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Room Number</p>
                                        <p className="font-medium text-gray-900">{userData.roomNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">College</p>
                                        <p className="font-medium text-gray-900">{userData.collegeName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <button className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all text-left">
                                    <FileText className="w-8 h-8 text-blue-600 mb-2" />
                                    <p className="font-medium text-gray-900">File Complaint</p>
                                    <p className="text-xs text-gray-500 mt-1">Report issues or problems</p>
                                </button>
                                <button className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all text-left">
                                    <Calendar className="w-8 h-8 text-green-600 mb-2" />
                                    <p className="font-medium text-gray-900">Apply for Leave</p>
                                    <p className="text-xs text-gray-500 mt-1">Request hostel leave</p>
                                </button>
                                <button className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100 hover:shadow-md transition-all text-left">
                                    <Bell className="w-8 h-8 text-purple-600 mb-2" />
                                    <p className="font-medium text-gray-900">View Notices</p>
                                    <p className="text-xs text-gray-500 mt-1">Check announcements</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;