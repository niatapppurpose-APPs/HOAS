import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";

// Import components
import Header from '../../components/OwnerServices/header';
import Avatar from "../../components/OwnerServices/Avatar";
import StatusBadge from "../../components/OwnerServices/StatusBadge";
import StatsCard from "../../components/OwnerServices/StatsCard";
import DeleteConfirmModal from "../../components/OwnerServices/DeleteConfirmModal";
import Sidebar from '../../components/OwnerServices/Sidebar';

import {
  Building2,
  Users,
  GraduationCap,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";

// Main Dashboard Component
const OwnersDashboard = () => {
  const { user, isAdmin, loading, adminChecked } = useAuth();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, college: null, wardenCount: 0, studentCount: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);


  useEffect(() => {

    if (!loading && adminChecked) {
      if (!user || !isAdmin) {
        console.log("Redirecting to admin-login: user=", user?.email, "isAdmin=", isAdmin);
        navigate("/admin-login", { replace: true });
      }
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  // Fetch ALL users from Firestore
  useEffect(() => {

    if (!adminChecked || !user || !isAdmin) {
      console.log("Skipping fetch - adminChecked:", adminChecked, "user:", user?.email, "isAdmin:", isAdmin);
      return;
    }

    console.log("Starting to fetch users...");
    setDataLoading(true);

    // Real-time listener for management users only
    const usersQuery = query(collection(db, "users"), where("role", "==", "management"));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Fetched users:", usersData.length, usersData);
      setAllUsers(usersData);
      setDataLoading(false);
      setFetchError(null);
    }, (error) => {
      console.error("Error fetching users:", error);
      setFetchError(error.message);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin, adminChecked]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin-login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle status change - Update in Firestore
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        approvedBy: user.uid,
        approvedAt: new Date().toISOString(),
      });
      console.log(`User ${userId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = async (college) => {
    try {
      // Count wardens and students under this college
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

      const [wardensSnap, studentsSnap] = await Promise.all([
        getDocs(wardensQuery),
        getDocs(studentsQuery)
      ]);

      setDeleteModal({
        isOpen: true,
        college: college,
        wardenCount: wardensSnap.docs.length,
        studentCount: studentsSnap.docs.length
      });
    } catch (error) {
      console.error("Error counting users:", error);
      setDeleteModal({
        isOpen: true,
        college: college,
        wardenCount: 0,
        studentCount: 0
      });
    }
  };

  // Handle delete college and all associated users
  const handleDeleteCollege = async () => {
    if (!deleteModal.college) return;

    setIsDeleting(true);
    try {
      const collegeId = deleteModal.college.id;
      const batch = writeBatch(db);

      // Get all wardens under this college
      const wardensQuery = query(
        collection(db, "users"),
        where("role", "==", "warden"),
        where("managementId", "==", collegeId)
      );
      const wardensSnap = await getDocs(wardensQuery);
      wardensSnap.docs.forEach((docSnap) => {
        batch.delete(doc(db, "users", docSnap.id));
      });

      // Get all students under this college
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("managementId", "==", collegeId)
      );
      const studentsSnap = await getDocs(studentsQuery);
      studentsSnap.docs.forEach((docSnap) => {
        batch.delete(doc(db, "users", docSnap.id));
      });

      // Delete the college/management user
      batch.delete(doc(db, "users", collegeId));

      // Commit the batch
      await batch.commit();

      console.log(`Successfully deleted college ${collegeId} and ${wardensSnap.docs.length} wardens, ${studentsSnap.docs.length} students`);
      setDeleteModal({ isOpen: false, college: null, wardenCount: 0, studentCount: 0 });
    } catch (error) {
      console.error("Error deleting college:", error);
      alert("Failed to delete college. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading while checking auth OR while admin status is being verified
  if (loading || !adminChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not admin after check, show nothing (will redirect)
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Filter users by role (Only management users are fetched now)
  // const students = []; 
  // const wardens = [];
  // const management = allUsers;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Header */}
      <Header pendingCount={pendingCount} handleLogout={handleLogout} user={user} />

      {/* Main Content */}
      <main className={`transition-all duration-300 px-4 sm:px-6 lg:px-8 py-8 ${isCollapsed ? "lg:ml-20" : "lg:ml-72"}`}>
        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
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
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Approval Board</h2>
              <p className="text-slate-400 mt-1">Approve or deny 'CO-ADMIN' registrations</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
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
                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {fetchError ? (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Users</h3>
              <p className="text-red-300 max-w-md mx-auto mb-4">{fetchError}</p>
              <p className="text-slate-400 text-sm">
                Make sure your Firestore security rules allow reading the users collection.
              </p>
            </div>
          ) : dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <span className="text-slate-400 ml-3">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                {activeTab === "pending"
                  ? "No pending approvals at the moment."
                  : "When users register, they will appear here for your approval."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((userData) => {
                const RoleIcon = roleIcons[userData.role] || Users;
                const colorClass = roleColors[userData.role] || "from-gray-500 to-gray-600";

                return (
                  <div
                    key={userData.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: User Info */}
                      <div className="flex items-center gap-4">
                        <Avatar image={userData.photoURL} name={userData.displayName} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold truncate">
                              {userData.displayName || "Unknown User"}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${colorClass} text-white`}>
                              {userData.role}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm truncate">{userData.email}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-slate-500 text-xs mt-1">
                              {userData.createdAt?.toDate?.()?.toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) || "Unknown"}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
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
                      <div className="flex items-center gap-3">
                        {userData.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(userData.id, "approved")}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(userData.id, "denied")}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Deny
                            </button>
                          </div>
                        ) : (
                          <StatusBadge status={userData.status} />
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => openDeleteModal(userData)}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-600/80 text-slate-400 hover:text-white transition-colors"
                          title="Delete College"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, college: null, wardenCount: 0, studentCount: 0 })}
        onConfirm={handleDeleteCollege}
        collegeName={deleteModal.college?.displayName || deleteModal.college?.collegeName || "this college"}
        isDeleting={isDeleting}
        wardenCount={deleteModal.wardenCount}
        studentCount={deleteModal.studentCount}
      />
    </div>
  );
};

export default OwnersDashboard;
