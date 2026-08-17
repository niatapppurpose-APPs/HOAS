import { useState, useEffect, useRef, useMemo } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useModal } from "../../context/ModalContext";
import { useSystemSettings } from "../../hooks/useSystemSettings";
import * as cloudFunctions from "../../firebase/cloudFunctions";
import { useToast } from "../../components/Toast";

// Import components
import Header from '../../components/OwnerServices/header';

// Import page components
import BulkActionsBar from "./components/BulkActionsBar";
import UserListTabs from "./components/UserListTabs";
import UserCard from "./components/UserCard";
import PaginationControls from "./components/PaginationControls";
import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";
import LoadingState from "./components/LoadingState";

// Import extracted modals
import AddManagementModal from "./modals/AddManagementModal";


// Import constants (hoisted outside component)
import { roleColors } from "./constants";

import { Building2, BarChart3, Users, Ticket, ShieldCheck, User, Plus } from "lucide-react";

// Main Dashboard Component
const OwnersDashboard = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const { user, isAdmin, loading, adminChecked, logout } = useAuth();
  const { isApprovalsEnabled } = useSystemSettings();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const toast = useToast();
  const { openDeleteModal } = useModal();
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isApproving, setIsApproving] = useState(null);
  const [isDenying, setIsDenying] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const { isDark } = useTheme();

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // Add Management Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ── Stable auth check — runs once after initial mount, prevents navigation loops ──────────
  const authReady = !loading && user && isAdmin && adminChecked;
  if (!authReady) {
    if (!user) return <Navigate to="/login" replace />;
    if (!isAdmin || !adminChecked) return <Navigate to="/login" replace />;
  }



  // Auto-start tour on first visit (waits for both auth and dashboard data to load)
// Removed to prevent re-render loops when MongoDB is empty
// useDashboardTour('owner', ownerTourSteps, { 
//   ready: !loading && adminChecked && !dataLoading && !!user && isAdmin
// });

  // Reset to page 1 when changing tabs
  useEffect(() => {
    setCurrentPage(1);
    setSelectedUsers(new Set());
  }, [activeTab]);

  // Scroll to top when page changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  

  // 🧪 TESTING MODE - Generate dummy data
  const ENABLE_TEST_DATA = false; // Set to false to use real Firestore data

  useEffect(() => {
    if (ENABLE_TEST_DATA) {
      // Generate 25 dummy colleges for testing
      const dummyUsers = Array.from({ length: 25 }, (_, i) => ({
        id: `dummy-college-${i + 1}`,
        displayName: `${['MIT', 'IIT', 'NIT', 'VIT', 'SRM', 'BITS', 'DTU', 'IIIT', 'Anna University', 'Amrita'][i % 10]} College ${i + 1}`,
        email: `principal${i + 1}@college${i + 1}.edu`,
        role: 'management',
        status: i < 15 ? 'pending' : 'approved', // First 15 are pending, rest approved
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=College${i + 1}`,
        createdAt: {
          toDate: () => new Date(2025, 0, 7 - Math.floor(i / 3))
        }
      }));

      // Simulate loading delay
      setTimeout(() => {
        setAllUsers(dummyUsers);
        setDataLoading(false);
        setFetchError(null);
      }, 1500);

      return;
    }

    // Real backend data fetching
    if (!adminChecked || !user || !isAdmin) {
      return;
    }

    let cancelled = false;
    setDataLoading(true);

    cloudFunctions.getAllManagementUsers()
      .then(({ users }) => {
        if (cancelled) return;
        
        // If we have MongoDB data, use it
        if (users && users.length > 0) {
          const mapped = users.map(u => ({
            id: u._id,
            uid: u.uid,
            displayName: u.name,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            isOnline: u.isOnline,
            photoURL: u.photoURL,
            collegeName: u.collegeId?.name,
            collegeLocation: u.collegeId?.location,
            createdAt: u.createdAt,
          }));
          setAllUsers(mapped);
          setDataLoading(false);
          setFetchError(null);
          return;
        }
        
// If no MongoDB data but user is logged in, stabilise state
        // User may be in Firebase Auth but not yet synced to MongoDB
        if (!user) {
          setDataLoading(false);
          return;
        }
        
        // User logged in but MongoDB empty - stabilise without flipping
        // The UI will show appropriate pending/approved state based on tab selection
        setDataLoading(false);
        setFetchError(null);
        // Keep allUsers empty - UI rendering handles the pending/approved display
        // based on the active tab and existing counts
        return;
      })
      .catch((error) => {
        if (cancelled) return;
        setFetchError(error.message);
        setDataLoading(false);
        setAllUsers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [adminChecked, user, isAdmin]);





  //---------------------------------- Handle logout--------------------------------------------------
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate("/", { replace: true });
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
      console.error("Logout error:", error);
    }
  };




  //------------------------------------------- Handle status change - Call Cloud Function -------------------------------------------------
  const handleStatusChange = async (userId, newStatus) => {
    // Check if approvals are enabled
    if (!isApprovalsEnabled()) {
      toast.warning('Approval workflows are currently disabled in System Settings.');
      return;
    }
    if (newStatus === 'approved') setIsApproving(userId);
    if (newStatus === 'denied') setIsDenying(userId);

    try {
      // Add timeout for faster user feedback
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), 15000)
      );

      const operationPromise = newStatus === 'approved'
        ? cloudFunctions.approveUser(userId, 'owner')
        : cloudFunctions.denyUser(userId, 'Denied by owner');

      await Promise.race([operationPromise, timeoutPromise]);

      // Remove from selection after action
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });

      toast.success(`User ${newStatus} successfully!`);
    } catch (error) {
      if (error.message === 'Operation timed out') {
        toast.error(`${newStatus} operation is taking longer than expected. Please check the result manually.`);
      } else {
        toast.error(`Failed to ${newStatus} user: ${error.message}`);
      }
    } finally {
      if (newStatus === 'approved') setIsApproving(null);
      if (newStatus === 'denied') setIsDenying(null);
    }
  };




  // Handle bulk approve
  const handleBulkApprove = async () => {
    // Check if approvals are enabled
    if (!isApprovalsEnabled()) {
      toast.warning('Approval workflows are currently disabled in System Settings.');
      return;
    }
    if (selectedUsers.size === 0) {
      toast.warning('No colleges selected for approval');
      return;
    }

    // Show confirmation toast
    const confirmed = await toast.confirm(
      `Are you sure you want to approve ${selectedUsers.size} college${selectedUsers.size > 1 ? 's' : ''}?`
    );

    if (!confirmed) return;

    setIsBulkApproving(true);
    const userIds = Array.from(selectedUsers);
    let successCount = 0;
    let failCount = 0;

    try {
      // Process approvals in parallel (max 5 at a time to avoid overwhelming)
      const batchSize = 5;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(userId => cloudFunctions.approveUser(userId, 'owner'))
        );

        results.forEach(result => {
          if (result.status === 'fulfilled') successCount++;
          else failCount++;
        });
      }

      setSelectedUsers(new Set());

      if (failCount === 0) {
        toast.success(`Successfully approved ${successCount} college${successCount > 1 ? 's' : ''}!`);
      } else {
        toast.warning(`Approved ${successCount} colleges. ${failCount} failed.`);
      }
    } catch (error) {
      toast.error(`Bulk approval error: ${error.message}`);
    } finally {
      setIsBulkApproving(false);
    }
  };






  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };




  // Select all pending users on current page
  const handleSelectAll = () => {
    const pendingOnPage = paginatedUsers.filter(u => u.status === 'pending');
    if (selectedUsers.size === pendingOnPage.length && pendingOnPage.every(u => selectedUsers.has(u.id))) {
      // Deselect all
      setSelectedUsers(new Set());
    } else {
      // Select all pending on current page
      setSelectedUsers(new Set(pendingOnPage.map(u => u.id)));
    }
  };




  //---------------------------------------- Open delete confirmation modal with context -------------------------------------------------
  // Handles delete for management users (calls deleteUserAccount)
  const handleOpenDeleteModal = async (user) => {
    setIsDeleteLoading(user.id);
    try {
      // Confirm deletion
      const confirmed = await toast.confirm(`Are you sure you want to delete management user "${user.displayName || user.email}"? This will remove their account Sub user accounts and College account`);
      if (!confirmed) return;
      await cloudFunctions.deleteUserAccount(user.id);
      toast.success('Management user deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete management user');
      console.error('Delete management user error:', error);
    } finally {
      setIsDeleteLoading(null);
    }
  };

  // ── Memoized derived data (must be before early returns — Rules of Hooks) ──
  const filteredUsers = useMemo(() => {
    let users;
    switch (activeTab) {
      case "pending": users = allUsers.filter(u => u.status === "pending"); break;
      case "approved": users = allUsers.filter(u => u.status === "approved"); break;
      case "suspended": users = allUsers.filter(u => u.status === "suspended"); break;
      default: users = allUsers;
    }
    return users.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      const nameA = a.displayName || "";
      const nameB = b.displayName || "";
      return nameA.localeCompare(nameB);
    });
  }, [allUsers, activeTab]);

  const pendingCount = useMemo(() => allUsers.filter(u => u.status === "pending").length, [allUsers]);
  const approvedCount = useMemo(() => allUsers.filter(u => u.status === "approved").length, [allUsers]);
  const suspendedCount = useMemo(() => allUsers.filter(u => u.status === "suspended").length, [allUsers]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = useMemo(() => filteredUsers.slice(startIndex, endIndex), [filteredUsers, startIndex, endIndex]);

  const pendingOnPage = paginatedUsers.filter(u => u.status === 'pending');
  const allPendingSelected = pendingOnPage.length > 0 && pendingOnPage.every(u => selectedUsers.has(u.id));

  // ── Early returns (after all hooks) ──
  if (loading || !adminChecked) {
    return <LoadingState message="Verifying admin access..." />;
  }

  if (!user || !isAdmin) {
    return <LoadingState message="Redirecting..." />;
  }

  if (dataLoading) {
    return <LoadingState message="Loading dashboard data..." />;
  }

  return (
    <>
      {/* Header */}
      <Header pendingCount={pendingCount} handleLogout={handleLogout} user={user} title="Dashboard · Admin Overview" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        {/* Welcome section */}
        <div id="tour-stats" className="relative mb-6 md:mb-8 overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-10 border shadow-2xl transition-all"
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
                        Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">{user?.displayName || 'Admin'} 👋</span>
                    </h1>
                    <p className="mt-2 text-sm md:text-base opacity-70" style={{ color: 'var(--text-secondary)' }}>Your owner command center</p>
                    <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                        <button onClick={() => navigate("/OwnersDashboard/wardens")} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform flex items-center gap-2">
                            <ShieldCheck size={14} className="md:w-4 md:h-4" /> Manage Wardens
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl border font-bold text-xs md:text-sm hover:bg-indigo-500/5 transition-all flex items-center gap-2" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                            <User size={14} className="md:w-4 md:h-4" /> Add Management
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-8">
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
                                <p className="text-xl md:text-2xl font-black text-indigo-600 leading-none">{pendingCount}</p>
                                <p className="mt-1 md:mt-1.5 text-[10px] md:text-xs font-bold text-indigo-600 uppercase tracking-widest">Pending</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Actions Grid */}
        <div id="tour-actions" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
            {[
                { title: 'Wardens', icon: Building2, path: '/OwnersDashboard/wardens', cls: 'bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-600' },
                { title: 'Students', icon: Users, path: '/OwnersDashboard/students', cls: 'bg-blue-500/10 text-blue-600 group-hover:bg-blue-600' },
                { title: 'Analytics', icon: BarChart3, path: '/OwnersDashboard/analytics', cls: 'bg-violet-500/10 text-violet-600 group-hover:bg-violet-600' },
                { title: 'Support Tickets', icon: Ticket, path: '/OwnersDashboard/support-tickets', cls: 'bg-orange-500/10 text-orange-600 group-hover:bg-orange-600' },
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
                    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${action.cls} group-hover:text-white transition-all duration-300`}>
                        <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h3 className="mt-3 md:mt-4 text-[11px] md:text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>{action.title}</h3>
                </button>
            ))}
        </div>

        {/* User Management */}
        <section id="tour-approval-board">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Approval Board</h2>
              <p className="mt-1.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>List of Collages manage By 'ADMIN' registrations securely</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/25 group"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              <Plus size={18} className="transition-transform group-hover:rotate-90" />
              Add Management
            </button>
          </div>

          <UserListTabs
            activeTab={activeTab}
            allUsersCount={allUsers.length}
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            suspendedCount={suspendedCount}
            onTabChange={setActiveTab}
          />

          {/* Bulk Actions Bar */}
          {pendingCount >= 10 && activeTab !== 'approved' && (activeTab === 'all' || activeTab === 'pending') && pendingOnPage.length > 0 && (
            <BulkActionsBar
              pendingOnPage={pendingOnPage}
              selectedUsers={selectedUsers}
              allPendingSelected={allPendingSelected}
              isBulkApproving={isBulkApproving}
              onSelectAll={handleSelectAll}
              onBulkApprove={handleBulkApprove}
            />
          )}

          {fetchError ? (
            <ErrorState error={fetchError} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState activeTab={activeTab} />
          ) : (
            <div ref={scrollContainerRef} className="flex flex-col gap-6">
              {paginatedUsers.map((userData, index) => (
                <UserCard
                  key={userData.id}
                  userData={userData}
                  isSelected={selectedUsers.has(userData.id)}
                  isPending={userData.status === 'pending'}
                  showCheckbox={pendingCount >= 10}
                  isApproving={isApproving}
                  isDenying={isDenying}
                  isDeleteLoading={isDeleteLoading}
                  roleColors={roleColors}
                  isFirst={index === 0}
                  onToggleSelection={toggleUserSelection}
                  onStatusChange={handleStatusChange}
                  onDelete={handleOpenDeleteModal}
                />
              ))}
            </div>
          )}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={filteredUsers.length}
            onPageChange={setCurrentPage}
          />
        </section>
      </div>

      {/* Add Management Modal */}
      <AddManagementModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        isDark={isDark}
      />

    </>
  );
};

export default OwnersDashboard;
