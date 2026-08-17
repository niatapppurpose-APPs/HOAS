import { useState, useEffect } from "react";
import { useNavigate, useOutletContext, Link } from "react-router-dom";
import { Users, Bell, MessageSquare, User, ShieldCheck, Building } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import * as cloudFunctions from "../../firebase/cloudFunctions";
import { useToast } from "../../components/Toast";
import { useDashboardTour, managementTourSteps } from "../../tours";

// Import components
import ManagementHeader from "./components/layout/ManagementHeader";
import StatusTable from "./components/dashboard/StatusTable";
// Import styles
import "./ManagementDashboard.css";

const mapUser = (u) => ({
  id: u._id,
  uid: u.uid,
  displayName: u.name || u.displayName,
  fullName: u.name || u.displayName,
  email: u.email,
  isOnline: u.isOnline,
  photoURL: u.avatarUrl || u.photoURL,
  role: u.role,
  status: u.status,
  createdAt: u.createdAt,
  hostelBlock: u.hostelBlock,
  collegeName: u.collegeName,
});

const ManagementDashboard = () => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isCollapsed, setIsCollapsed } = useOutletContext();

  // State
  const [wardens, setWardens] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-start tour on first visit (waits for data to load)
  useDashboardTour('management', managementTourSteps, { ready: false });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // show 10 users per page in status table

  // College logo (from colleges collection)
  const [collegeLogo, setCollegeLogo] = useState(null);

  // Fetch wardens and students belonging to this management only
  useEffect(() => {
    if (!userData?.uid) return; // wait until we know who the current management is

    let cancelled = false;

    const fetchUsers = async () => {
      try {
        const [wardensRes, studentsRes] = await Promise.all([
          cloudFunctions.listUsers({ role: 'warden' }),
          cloudFunctions.listUsers({ role: 'student' }),
        ]);
        if (cancelled) return;
        setWardens((wardensRes.users || []).map(mapUser));
        setStudents((studentsRes.users || []).map(mapUser));
      } catch (error) {
        console.error('Failed to fetch wardens/students:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [userData?.uid]);

  // College logo (from user profile, already loaded)
  useEffect(() => {
    setCollegeLogo(userData?.collegeLogo || null);
  }, [userData]);

  // search state for status table
  const [statusSearch, setStatusSearch] = useState('');
  const [statusSearchFilter, setStatusSearchFilter] = useState('all');

  useEffect(() => {
    setCurrentPage(1);
  }, [statusSearch, statusSearchFilter]);

  // Calculate statistics
  const stats = {
    totalWardens: wardens.length,
    pendingWardens: wardens.filter(w => w.status === 'pending').length,
    totalStudents: students.length,
    pendingStudents: students.filter(s => s.status === 'pending').length,
    totalPending: wardens.filter(w => w.status === 'pending').length +
      students.filter(s => s.status === 'pending').length,
    totalHostels: userData?.hostelCount || 0
  };

  // Get pending users for recent activity
  const allPendingUsers = [
    ...wardens.filter(w => w.status === 'pending'),
    ...students.filter(s => s.status === 'pending')
  ].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
    return dateB - dateA;
  });

  // keep full list for RecentActivity so it can paginate internally
  const recentUsers = allPendingUsers;
  // Get users for table
  const allUsers = [...wardens, ...students].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
    return dateB - dateA;
  });

  // apply status table search filter
  const filteredUsers = allUsers.filter(u => {
    const q = statusSearch.trim().toLowerCase();
    if (!q) return true;

    if (statusSearchFilter === 'name') return (u.displayName || '').toLowerCase().includes(q);
    if (statusSearchFilter === 'email') return (u.email || '').toLowerCase().includes(q);
    if (statusSearchFilter === 'role') return (u.role || '').toLowerCase().includes(q);

    const name = u.displayName?.toLowerCase() || '';
    const mail = u.email?.toLowerCase() || '';
    const role = u.role?.toLowerCase() || '';
    return name.includes(q) || mail.includes(q) || role.includes(q);
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const [approvingUserId, setApprovingUserId] = useState(null);

  const handleApprove = async (userId) => {
    console.log('handleApprove called', { userId, user });

    if (!user) {
      toast.error("You must be signed in to approve users");
      return;
    }

    setApprovingUserId(userId);
    try {
      toast.info('Approving user...');
      await cloudFunctions.approveUser(userId);
      toast.success("User approved successfully");
    } catch (error) {
      const msg = error?.message || error?.code || 'Unknown error';
      toast.error(`Failed to approve user: ${msg}`);
      console.error('approveUser error:', error);
    } finally {
      setApprovingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <ManagementHeader
        pendingCount={stats.totalPending}
        title="Dashboard · Management Overview"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        collegeLogo={collegeLogo}
      />

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        {/* Welcome section for tour targeting */}
        <div id="mgmt-tour-welcome" className="relative mb-6 md:mb-8 overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-10 border shadow-2xl transition-all hover:shadow-indigo-500/10"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)'
            }}>
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 rounded-full bg-violet-500/5 blur-[60px]" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Welcome back, <span className="bg-clip-text text-indigo-500">{userData.collegeName || 'Management'} 👋</span>
                    </h1>
                    <p className="mt-2 text-sm md:text-base opacity-70" style={{ color: 'var(--text-secondary)' }}>Your management command center</p>
                    <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                        <Link to="wardens" className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform flex items-center gap-2">
                            <ShieldCheck size={14} className="md:w-4 md:h-4" /> Manage Wardens
                        </Link>
                        <button onClick={() => navigate('profile')} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl border font-bold text-xs md:text-sm hover:bg-indigo-500/5 transition-all flex items-center gap-2" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
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
                            <div className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                                <p className="text-xl md:text-2xl font-black text-indigo-600 leading-none">{stats.totalPending}</p>
                                <p className="mt-1 md:mt-1.5 text-[10px] md:text-xs font-bold text-indigo-600 uppercase tracking-widest">Pending</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Actions Grid */}
        <div id="mgmt-tour-actions" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
            {[
                { title: 'Wardens', icon: ShieldCheck, path: 'wardens', color: 'indigo', count: stats.pendingWardens > 0 ? stats.pendingWardens : null },
                { title: 'Students', icon: Users, path: 'students', color: 'blue', count: stats.pendingStudents > 0 ? stats.pendingStudents : null },
                { title: 'Complaints', icon: MessageSquare, path: 'complaints', color: 'orange' },
                { title: 'Hostels', icon: Building, path: 'hostels', color: 'red' },
            ].map((action, idx) => (
                <button
                    key={idx}
                    onClick={() => navigate(action.path)}
                    className="group relative flex flex-col items-center justify-center rounded-[1.25rem] md:rounded-[1.5rem] border p-4 md:p-6 transition-all hover:scale-[1.05] hover:shadow-2xl"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-primary)'
                    }}
                >
                    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-${action.color}-500/10 text-${action.color}-600 group-hover:bg-${action.color}-600 group-hover:text-white transition-all duration-300`}>
                        <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h3 className="mt-3 md:mt-4 text-[11px] md:text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>{action.title}</h3>
                    {action.count && (
                        <div className="absolute top-2 right-2 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-[9px] md:text-[10px] font-bold text-white shadow-lg">
                            {action.count}
                        </div>
                    )}
                </button>
            ))}
        </div>

        {/* Top Row: KPI Cards */}
        

        

        {/* Bottom Row: Status Table + Visualization */}
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 mt-4 sm:mt-8">
          <div id="mgmt-tour-status-table" className="flex-1 w-full min-w-0 overflow-x-auto">
            <StatusTable
              users={paginatedUsers}
              currentPage={currentPage}
              totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              searchTerm={statusSearch}
              onSearchChange={setStatusSearch}
              searchFilter={statusSearchFilter}
              onSearchFilterChange={setStatusSearchFilter}
            />
          </div>
          {/* <div className="w-full xl:w-[400px] 2xl:w-[500px] flex-shrink-0">
            <StatusVisualization
              wardens={wardensViz}
              students={studentsViz}
            />
          </div> */}
        </div>
      </div>
    </>
  );
};

export default ManagementDashboard;
