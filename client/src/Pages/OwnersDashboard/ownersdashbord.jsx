import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useModal } from "../../context/ModalContext";
import { HashLoader } from "react-spinners";
import * as cloudFunctions from "../../firebase/cloudFunctions";
import { useToast } from "../../components/Toast";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { dashboardTourSteps } from "./tourConfig";

// Import components
import Header from '../../components/OwnerServices/header';
import Avatar from "../../components/OwnerServices/Avatar";
import StatusBadge from "../../components/OwnerServices/StatusBadge";
import StatsCard from "../../components/OwnerServices/StatsCard";

import {
  Building2,
  Users,
  GraduationCap,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react";

// Main Dashboard Component
const OwnersDashboard = () => {
  const { isCollapsed } = useOutletContext();
  const { user, isAdmin, loading, adminChecked, logout } = useAuth();
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

  // Tour Driver Effect
  useEffect(() => {
    if (location.state?.startTour) {
      // Clear state
      window.history.replaceState({}, document.title);
      
      const driverObj = driver({
        showProgress: true,
        animate: true,
        steps: dashboardTourSteps(isDark),
        popoverClass: isDark ? 'driverjs-theme-dark' : 'driverjs-theme-light',
        onDestroy: () => {
             // Optional: Navigate back or show completion toast
        }
      });

      // Delay to ensure rendering
      setTimeout(() => {
        driverObj.drive();
      }, 1000);
    }
  }, [location.state, isDark]);

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

    if (!loading && adminChecked) {
      if (!user || !isAdmin) {
        navigate("/admin-login", { replace: true });
      }
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  // 🧪 TESTING MODE - Generate dummy data
  const ENABLE_TEST_DATA = false ; // Set to false to use real Firestore data
  
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

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate("/admin-login", { replace: true });
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
      console.error("Logout error:", error);
    }
  };

  // Handle status change - Call Cloud Function
  const handleStatusChange = async (userId, newStatus) => {
    if (newStatus === 'approved') setIsApproving(userId);
    if (newStatus === 'denied') setIsDenying(userId);
    try {
      if (newStatus === 'approved') {
        await cloudFunctions.approveUser(userId, 'owner');
      } else if (newStatus === 'denied') {
        await cloudFunctions.denyUser(userId, 'Denied by owner');
      }
      // Remove from selection after action
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error) {
      toast.error(`Failed to ${newStatus} user: ${error.message}`);
    } finally {
      if (newStatus === 'approved') setIsApproving(null);
      if (newStatus === 'denied') setIsDenying(null);
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
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

  // Open delete confirmation modal with context
  const handleOpenDeleteModal = async (college) => {
    setIsDeleteLoading(college.id);
    try {
      // Get college stats using Cloud Function
      const { stats } = await cloudFunctions.getCollegeStats(college.id);

      // Use context to open modal
      openDeleteModal({
        college: college,
        wardenCount: stats.wardens.total,
        studentCount: stats.students.total,
        onConfirm: async () => {
          const collegeId = college.id;
          await cloudFunctions.deleteCollege(collegeId);
          toast.success('College deleted successfully!');
        }
      });
    } catch (error) {
      openDeleteModal({
        college: college,
        wardenCount: 0,
        studentCount: 0,
        onConfirm: async () => {
          const collegeId = college.id;
          await cloudFunctions.deleteCollege(collegeId);
          toast.success('College deleted successfully!');
        }
      });
    } finally {
      setIsDeleteLoading(null);
    }
  };



  // Show loading while checking auth OR while admin status is being verified
  if (loading || !adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <HashLoader className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not admin after check, show nothing (will redirect)
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <HashLoader className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show loading for data
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <HashLoader className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Filter by active tab
  const getFilteredUsers = () => {
    switch (activeTab) {
      case "pending": return allUsers.filter(u => u.status === "pending");
      case "approved": return allUsers.filter(u => u.status === "approved");
      default: return allUsers;
    }
  };

  // Sort filtered users: Pending first, then by name
  const filteredUsers = getFilteredUsers().sort((a, b) => {
    // 1. Priority to pending status
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;

    // 2. Then sort by name
    const nameA = a.displayName || "";
    const nameB = b.displayName || "";
    return nameA.localeCompare(nameB);
  });

  // Calculate stats
  const pendingCount = allUsers.filter(u => u.status === "pending").length;
  const approvedCount = allUsers.filter(u => u.status === "approved").length;

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);



  // Check if all pending users on current page are selected
  const pendingOnPage = paginatedUsers.filter(u => u.status === 'pending');
  const allPendingSelected = pendingOnPage.length > 0 && pendingOnPage.every(u => selectedUsers.has(u.id));

  const roleIcons = {
    student: GraduationCap,
    warden: Shield,
    management: Building2,
  };

  const roleColors = {
    student: "from-blue-500 to-indigo-600",
    warden: "from-orange-500 to-amber-600",
    management: "from-emerald-500 to-teal-600",
  };

  return (
    <>
      {/* Header */}
      <Header pendingCount={pendingCount} handleLogout={handleLogout} user={user} title="Dashboard" isCollapsed={isCollapsed} />

      {/* Main Content */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <section id="tour-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
          <StatsCard
            icon={Building2}
            title="Total Principals"
            value={allUsers.length}
            subtitle="Registered Co-Admins"
            gradient="bg-gradient-to-br from-indigo-600 to-purple-800"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Approval Board</h2>
              <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Approve or deny 'CO-ADMIN' registrations</p>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2 h-2 rounded-full bg-green-500" /> Approved: {approvedCount}
              <span className="w-2 h-2 rounded-full bg-yellow-500 ml-2" /> Pending: {pendingCount}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "all", label: "All", count: allUsers.length },
              { id: "pending", label: "Pending", count: pendingCount },
              { id: "approved", label: "Approved", count: approvedCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : ""
                  }`}
                style={activeTab !== tab.id ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : undefined}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Bulk Actions Bar - Shows when pending users >= 10 AND on All/Pending tabs ONLY */}
          {pendingCount >= 10 && activeTab !== 'approved' && (activeTab === 'all' || activeTab === 'pending') && pendingOnPage.length > 0 && (
            <div 
              className="rounded-xl p-4 mb-6 border"
              style={{ 
                background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
                borderColor: 'rgba(99, 102, 241, 0.3)'
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {pendingOnPage.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                      {allPendingSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                      <span className="text-sm font-medium">
                        {allPendingSelected ? 'Deselect All' : 'Select All'} ({pendingOnPage.length})
                      </span>
                    </button>
                  )}
                  {selectedUsers.size > 0 && (
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold text-indigo-400">{selectedUsers.size}</span> selected
                    </span>
                  )}
                </div>
                {selectedUsers.size > 0 && (
                  <button
                    onClick={handleBulkApprove}
                    disabled={isBulkApproving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkApproving ? (
                      <>
                        <HashLoader size={20} color="#ffffff" />
                        Approving {selectedUsers.size} Colleges...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Approve Selected ({selectedUsers.size})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {fetchError ? (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Error Loading Users</h3>
              <p className="text-red-300 max-w-md mx-auto mb-4">{fetchError}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Make sure your Firestore security rules allow reading the users collection.
              </p>
            </div>
          ) : (dataLoading) ? (
            <div className="flex flex-col items-center justify-center py-30">
              <HashLoader color="#6366f1" size={80} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Users Found</h3>
              <p className="max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                {activeTab === "pending"
                  ? "No pending approvals at the moment."
                  : "When users register, they will appear here for your approval."
                }
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-[calc(100vh-28rem)]">
              {/* Scrollable List Container */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto pr-2 custom-scrollbar [&>*:not(:first-child)]:mt-3"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4B5563 transparent'
                }}
              >
                {paginatedUsers.map((userData) => {
                  const RoleIcon = roleIcons[userData.role] || Users;
                  const colorClass = roleColors[userData.role] || "from-gray-500 to-gray-600";
                  const isSelected = selectedUsers.has(userData.id);
                  const isPending = userData.status === 'pending';

                  return (
                    <div
                      key={userData.id}
                      className={`rounded-xl p-4 transition-all ${
                        isSelected ? 'border-indigo-500/50' : ''
                      }`}
                      style={{ 
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
                        border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-primary)'}`
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left: User Info */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Checkbox for pending users */}
                          {isPending && pendingCount >= 10 && (
                            <button
                              onClick={() => toggleUserSelection(userData.id)}
                              className="flex-shrink-0 p-1 rounded transition-colors"
                              style={{ backgroundColor: 'var(--bg-hover)' }}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-indigo-400" />
                              ) : (
                                <Square className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                              )}
                            </button>
                          )}
                          <Avatar image={userData.photoURL} name={userData.displayName} size="lg" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {userData.displayName || "Unknown User"}
                              </h3>
                              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${colorClass} text-white`}>
                                {userData.role}
                              </span>
                            </div>
                            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{userData.email}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
                              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                {userData.createdAt?.toDate?.()?.toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                }) || "Unknown"}
                              </p>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                {userData.createdAt?.toDate?.()?.toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                }) || "Unknown"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
                          {userData.status === "pending" ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleStatusChange(userData.id, "approved")}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors"
                                disabled={isApproving === userData.id}
                              >
                                {isApproving === userData.id ? (
                                  <>
                                    <HashLoader size={20} color="#ffffff" />
                                    Approving
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleStatusChange(userData.id, "denied")}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
                                disabled={isDenying === userData.id}
                              >
                                {isDenying === userData.id ? (
                                  <>
                                    <HashLoader size={20} color="#ffffff" />
                                    Denying
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    Deny
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <StatusBadge status={userData.status} />
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleOpenDeleteModal(userData)}
                            className="p-2 rounded-lg hover:bg-red-600/80 transition-colors"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                            title="Delete College"
                            disabled={isDeleteLoading === userData.id}
                          >
                            {isDeleteLoading === userData.id ? (
                              <HashLoader size={20} color="#ffffff" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls - Fixed at bottom */}
              {totalPages > 1 && (
                <div 
                  className="mt-4 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl p-4"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                >
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Showing <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{startIndex + 1}</span> to{' '}
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.min(endIndex, filteredUsers.length)}</span> of{' '}
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{filteredUsers.length}</span> colleges
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                currentPage === page
                                  ? 'bg-indigo-600 text-white'
                                  : ''
                              }`}
                              style={currentPage !== page ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : undefined}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2" style={{ color: 'var(--text-muted)' }}>...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default OwnersDashboard;
