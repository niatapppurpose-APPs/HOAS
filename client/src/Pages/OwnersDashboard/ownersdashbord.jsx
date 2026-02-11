import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useModal } from "../../context/ModalContext";
import * as cloudFunctions from "../../firebase/cloudFunctions";
import { useToast } from "../../components/Toast";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { dashboardTourSteps } from "./tourConfig";

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

import { Building2, CheckCircle, Clock, GraduationCap, Shield, LayoutDashboard, X, Plus, Eye, EyeOff, Lock } from "lucide-react";

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

  // Add Management Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newManagement, setNewManagement] = useState({
    collegeName: '',
    principalName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [formError, setFormError] = useState('');

  // View Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedManagementForPassword, setSelectedManagementForPassword] = useState(null);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [managementPassword, setManagementPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Open password view modal
  const handleViewPassword = (management) => {
    setSelectedManagementForPassword(management);
    setOwnerPassword('');
    setManagementPassword('');
    setPasswordError('');
    setIsPasswordVisible(false);
    setIsPasswordModalOpen(true);
  };

  // Verify owner password and fetch management password
  const handleVerifyAndShowPassword = async (e) => {
    e.preventDefault();
    if (!ownerPassword) {
      setPasswordError('Please enter your password');
      return;
    }

    setIsVerifying(true);
    setPasswordError('');

    try {
      // Re-authenticate owner
      const credential = EmailAuthProvider.credential(user.email, ownerPassword);
      await reauthenticateWithCredential(user, credential);

      // Fetch password from Firestore
      const credDoc = await getDoc(doc(db, 'managementCredentials', selectedManagementForPassword.id));

      if (credDoc.exists()) {
        setManagementPassword(credDoc.data().password);
        setIsPasswordVisible(true);
      } else {
        setPasswordError('Password not found. It may have been created before this feature.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setPasswordError('Incorrect credentials. Please try again.');
      } else {
        setPasswordError('Verification failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Close password modal
  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setSelectedManagementForPassword(null);
    setOwnerPassword('');
    setManagementPassword('');
    setPasswordError('');
    setIsPasswordVisible(false);
  };

  // Generate password when college name changes
  const generatePassword = (collegeName) => {
    const cleanName = collegeName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).slice(-6);
    const specialChars = '!@#$%';
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
    const randomNum = Math.floor(Math.random() * 100);
    return `${cleanName}${randomSpecial}${randomPart}${randomNum}`;
  };

  // Update password when college name changes
  const handleCollegeNameChange = (value) => {
    const password = value ? generatePassword(value) : '';
    setNewManagement(prev => ({ ...prev, collegeName: value, password }));
  };

  const NewManagement = async (event) => {
    event.preventDefault()
    // Clear previous error
    setFormError('');

    if (!newManagement.collegeName || !newManagement.principalName || !newManagement.email) {
      toast.warning('Please fill all required fields');
      return;
    }

    // Validate official college email (must end with .edu, .ac.in, etc.)
    const emailPattern = /\.(edu|ac\.in|co\.in|edu\.in|org|com)$/i;
    if (!emailPattern.test(newManagement.email)) {
      setFormError('Please enter the college official E-mail Address (e.g., .edu, .ac.in)');
      return;
    }


    try {
      await cloudFunctions.createManagement({
        collegeName: newManagement.collegeName,
        principalName: newManagement.principalName,
        email: newManagement.email,
        phone: newManagement.phone || '',
        password: newManagement.password
      })
      toast.success('Management added Successfully 🎉')

      setNewManagement({ collegeName: '', principalName: '', email: '', phone: '', password: '' });
      setIsAddModalOpen(false);
    } catch (error) {
      toast.error(`Failed to add management: ${error.message}`);
    }



  }
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
  const handleOpenDeleteModal = async (college) => {
    setIsDeleteLoading(college.id);
    try {
      // Fetch actual counts first (using managementId as the field name)
      const wardensQuery = query(
        collection(db, "users"),
        where("role", "==", "warden"),
        where("managementId", "==", college.id)
      );
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("managementId", "==", college.id)
      );

      const [wardensSnapshot, studentsSnapshot] = await Promise.all([
        getDocs(wardensQuery),
        getDocs(studentsQuery)
      ]);

      const wardenCount = wardensSnapshot.size;
      const studentCount = studentsSnapshot.size;

      // Open modal with actual counts
      openDeleteModal({
        college: college,
        wardenCount: wardenCount,
        studentCount: studentCount,
        onConfirm: async () => {
          const collegeId = college.id;
          await cloudFunctions.deleteCollege(collegeId);
          toast.success('College deleted successfully!');
        }
      });
    } catch (error) {
      toast.error('Failed to load college data');
      console.error('Delete modal error:', error);
    } finally {
      setIsDeleteLoading(null);
    }
  };



  // Show loading while checking auth OR while admin status is being verified
  if (loading || !adminChecked) {
    return <LoadingState message="Verifying admin access..." />;
  }

  // If not admin after check, show nothing (will redirect)
  if (!user || !isAdmin) {
    return <LoadingState message="Redirecting..." />;
  }

  // Show loading for data
  if (dataLoading) {
    return <LoadingState message="Loading dashboard data..." />;
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
      <Header pendingCount={pendingCount} handleLogout={handleLogout} user={user} title="Dashboard · Admin Overview" isCollapsed={isCollapsed} />

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Approval Board</h2>
              <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Approve or deny 'CO-ADMIN' registrations</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="border border-1 p-2 px-4 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: isDark ? '#fff' : '#000',
                color: isDark ? '#000' : '#fff',
                borderColor: isDark ? '#374151' : '#9ca3af'
              }}
            >
              <Plus size={18} />
              Add Management
            </button>
          </div>

          <UserListTabs
            activeTab={activeTab}
            allUsersCount={allUsers.length}
            pendingCount={pendingCount}
            approvedCount={approvedCount}
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
                  onViewPassword={handleViewPassword}
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
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl p-6"
            style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Building2 size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold" style={{ color: isDark ? '#fff' : '#000' }}>
                  Add Management
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={NewManagement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                  College Name *
                </label>
                <input
                  type="text"
                  value={newManagement.collegeName}
                  onChange={(e) => handleCollegeNameChange(e.target.value)}
                  placeholder="Enter college name"
                  className="w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#f9fafb',
                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                    color: isDark ? '#fff' : '#000'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                  Principal Name *
                </label>
                <input
                  type="text"
                  value={newManagement.principalName}
                  onChange={(e) => setNewManagement(prev => ({ ...prev, principalName: e.target.value }))}
                  placeholder="Enter principal name"
                  className="w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#f9fafb',
                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                    color: isDark ? '#fff' : '#000'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newManagement.email}
                  onChange={(e) => {
                    setNewManagement(prev => ({ ...prev, email: e.target.value }));
                    if (formError) setFormError('');
                  }}
                  placeholder="principal@college.edu"
                  className="w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#f9fafb',
                    borderColor: formError ? '#ef4444' : (isDark ? '#4b5563' : '#d1d5db'),
                    color: isDark ? '#fff' : '#000'
                  }}
                />
                {formError && <p className="text-red-500 text-sm mt-1">{formError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newManagement.phone}
                  onChange={(e) => setNewManagement(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#f9fafb',
                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                    color: isDark ? '#fff' : '#000'
                  }}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  style={{
                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                    color: isDark ? '#d1d5db' : '#374151'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  Add Management
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePasswordModal}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl p-6"
            style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <Lock size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold" style={{ color: isDark ? '#fff' : '#000' }}>
                  View Password
                </h3>
              </div>
              <button
                onClick={closePasswordModal}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
              </button>
            </div>

            {/* College Info */}
            {selectedManagementForPassword && (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                <p className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>College</p>
                <p className="font-medium" style={{ color: isDark ? '#fff' : '#000' }}>
                  {selectedManagementForPassword.collegeName || selectedManagementForPassword.displayName}
                </p>
                <p className="text-sm mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  {selectedManagementForPassword.email}
                </p>
              </div>
            )}

            {!isPasswordVisible ? (
              /* Password Verification Form */
              <form onSubmit={handleVerifyAndShowPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                    Enter Your Password to Continue
                  </label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => {
                      setOwnerPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Your admin password"
                    className="w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    style={{
                      backgroundColor: isDark ? '#374151' : '#f9fafb',
                      borderColor: passwordError ? '#ef4444' : (isDark ? '#4b5563' : '#d1d5db'),
                      color: isDark ? '#fff' : '#000'
                    }}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="flex-1 px-4 py-2.5 rounded-lg border font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{
                      borderColor: isDark ? '#4b5563' : '#d1d5db',
                      color: isDark ? '#d1d5db' : '#374151'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify & Show'}
                  </button>
                </div>
              </form>
            ) : (
              /* Password Display */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                    Management Password
                  </label>
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg border"
                    style={{
                      backgroundColor: isDark ? '#374151' : '#f9fafb',
                      borderColor: isDark ? '#4b5563' : '#d1d5db'
                    }}
                  >
                    <code
                      className="flex-1 font-mono text-lg tracking-wider"
                      style={{ color: isDark ? '#10b981' : '#059669' }}
                    >
                      {managementPassword}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(managementPassword);
                        toast.success('Password copied to clipboard!');
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                    ⚠️ Share this password securely with the principal
                  </p>
                </div>

                <button
                  onClick={closePasswordModal}
                  className="w-full px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default OwnersDashboard;