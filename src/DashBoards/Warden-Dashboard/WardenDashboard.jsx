import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
    Shield, 
    Building2, 
    User, 
    Phone, 
    Briefcase, 
    LogOut, 
    Loader2,
    Users,
    Bell,
    FileText,
    Settings,
    CheckCircle,
    XCircle,
    Clock,
    GraduationCap
} from 'lucide-react';

const WardenDashboard = () => {
    const { user, userData, userDataLoading, logout } = useAuth();
    const navigate = useNavigate();
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
            await updateDoc(doc(db, 'users', studentId), {
                status: newStatus,
                updatedAt: serverTimestamp(),
                approvedBy: user.uid,
                approverName: userData.fullName
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (userDataLoading || !userData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
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

    const menuItems = [
        { icon: Users, label: 'Students', active: true },
        { icon: FileText, label: 'Complaints', active: false },
        { icon: Bell, label: 'Announcements', active: false },
        { icon: Settings, label: 'Settings', active: false },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">HOAS</h1>
                                <p className="text-xs text-gray-500">Warden Portal</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                                <Bell className="w-5 h-5" />
                                {stats.pending > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                                        {stats.pending}
                                    </span>
                                )}
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
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg p-4">
                            <nav className="space-y-1">
                                {menuItems.map((item, index) => (
                                    <button
                                        key={index}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                            item.active
                                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Profile</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-orange-600" />
                                    <span className="text-gray-600">{userData.fullName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-orange-600" />
                                    <span className="text-gray-600">{userData.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Briefcase className="w-4 h-4 text-orange-600" />
                                    <span className="text-gray-600">{userData.designation}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="w-4 h-4 text-orange-600" />
                                    <span className="text-gray-600">{userData.collegeName}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Stats Cards */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="bg-white rounded-2xl shadow-lg p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Pending</p>
                                        <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-amber-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Approved</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Denied</p>
                                        <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Management */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Student Management</h3>
                                <p className="text-sm text-gray-500 mt-1">Manage student registrations for {userData.collegeName}</p>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-100">
                                {['pending', 'approved', 'denied'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-3 text-sm font-medium transition-all ${
                                            activeTab === tab
                                                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)} ({
                                            tab === 'pending' ? stats.pending :
                                            tab === 'approved' ? stats.approved : stats.denied
                                        })
                                    </button>
                                ))}
                            </div>

                            {/* Student List */}
                            <div className="p-6">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                                    </div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="text-center py-12">
                                        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No {activeTab} students</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={student.photoURL || '/default-avatar.png'}
                                                        alt={student.fullName}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{student.fullName}</p>
                                                        <p className="text-sm text-gray-500">{student.email}</p>
                                                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                                            <span>Roll: {student.rollNumber}</span>
                                                            <span>Room: {student.roomNumber}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {activeTab === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'approved')}
                                                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'denied')}
                                                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Deny
                                                        </button>
                                                    </div>
                                                )}
                                                {activeTab === 'approved' && (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                                        Active
                                                    </span>
                                                )}
                                                {activeTab === 'denied' && (
                                                    <button
                                                        onClick={() => handleStatusChange(student.id, 'approved')}
                                                        className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
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
        </div>
    );
};

export default WardenDashboard;