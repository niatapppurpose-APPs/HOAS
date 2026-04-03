import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useModal } from "../../context/ModalContext";
import { useSystemSettings } from "../../hooks/useSystemSettings";
import * as cloudFunctions from "../../firebase/cloudFunctions";
import { useToast } from "../../components/Toast";
import { useDashboardTour, ownerTourSteps } from "../../tours";

// Import components
import Header from '../../components/OwnerServices/header';
import StatsCard from "../../components/OwnerServices/StatsCard";

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

import { Building2, CheckCircle, Clock, Plus } from "lucide-react";

// Main Dashboard Component
const OwnersDashboard = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const { user, isAdmin, loading, adminChecked, logout } = useAuth();
  const { isApprovalsEnabled } = useSystemSettings();
  const navigate = useNavigate();
  const location = useLocation();
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



  // Auto-start tour on first visit (waits for both auth and dashboard data to load)
  useDashboardTour('owner', ownerTourSteps, { 
    ready: !loading && adminChecked && !dataLoading && !!user && isAdmin
  });

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

  useEffect(() => {

    if (!loading) {
      if (!user) {
        navigate("/login", { replace: true });
      } else if (adminChecked && !isAdmin) {
        navigate("/login", { replace: true });
      }
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

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

    // Real Firestore data fetching
    if (!adminChecked || !user || !isAdmin) {
      return;
    }

    setDataLoading(true);

    // Real-time listener for management users only
    const usersQuery = query(collection(db, "users"), where("role", "==", "management"));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllUsers(usersData);
      setDataLoading(false);
      setFetchError(null);
    }, (error) => {
      setFetchError(error.message);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin, adminChecked]);





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
      <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <section id="tour-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
          <StatsCard
            icon={Building2}
            title="Total Colleges"
            value={allUsers.length}
            subtitle="Registered Institutions"
            gradient="bg-gradient-to-br from-indigo-600 to-purple-700"
          />
          <StatsCard
            icon={Clock}
            title="Pending Requests"
            value={pendingCount}
            subtitle="Awaiting Approval"
            gradient="bg-gradient-to-br from-orange-600 to-amber-700"
          />
          <StatsCard
            icon={CheckCircle}
            title="Active Principals"
            value={approvedCount}
            subtitle="Approved Access"
            gradient="bg-gradient-to-br from-emerald-600 to-teal-700"
          />
        </section>

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