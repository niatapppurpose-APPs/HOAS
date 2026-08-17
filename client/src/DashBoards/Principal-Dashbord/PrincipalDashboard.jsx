import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";
import * as cloudFunctions from "../../firebase/cloudFunctions";
import {
  Building2,
  GraduationCap,
  Shield,
  Loader2,
  UserPlus,
  Home,
} from "lucide-react";
import Avatar from "../../components/OwnerServices/Avatar";
import AnimatedLogoutButton from "../../components/AnimatedLogoutButton";
import NotificationBell from "../../components/OwnerServices/NotificationBell";
import { StatsCard } from "./principalDashboardComponents";
import UserCard from "./PrincipalUserCard";

// Main Dashboard Component
const ManagementDashboard = () => {
  const { user, userData, userDataLoading, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [wardens, setWardens] = useState([]);
  const [students, setStudents] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("wardens");

  // Protect the route - check if user is approved management
  useEffect(() => {
    if (!loading && !userDataLoading) {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      
      if (!userData) {
        // Role-selection removed — send new users to waiting-approval until owner/management provisions them
        navigate("/waiting-approval", { replace: true });
        return;
      }

      if (userData.role !== "management") {
        navigate("/dashboard", { replace: true });
        return;
      }

      if ((userData.status || "").toLowerCase() !== "approved") {
        navigate("/waiting-approval", { replace: true });
        return;
      }
    }
  }, [user, userData, userDataLoading, loading, navigate]);

  // Fetch wardens and students for this management's college
  useEffect(() => {
    // Only run if we have a valid approved management user
    if (!user || !userData || userData.role !== "management" || (userData.status || "").toLowerCase() !== "approved") return;

    setDataLoading(true);

    let cancelled = false;

    const loadWardens = async () => {
      try {
        const { users } = await cloudFunctions.listUsers({ role: "warden", status: "all", limit: 500 });
        if (cancelled) return;
        const wardensData = (users || []).map(u => ({ ...u, uid: u._id, displayName: u.name }));
        wardensData.sort((a, b) => {
          const statusA = (a.status || "pending").toLowerCase();
          const statusB = (b.status || "pending").toLowerCase();
          if (statusA === "pending" && statusB !== "pending") return -1;
          if (statusA !== "pending" && statusB === "pending") return 1;
          return (a.displayName || "").localeCompare(b.displayName || "");
        });
        setWardens(wardensData);
      } catch (error) {
        console.error("Error fetching wardens:", error);
      }
    };

    const loadStudents = async () => {
      try {
        const { users } = await cloudFunctions.listUsers({ role: "student", status: "all", limit: 500 });
        if (cancelled) return;
        const studentsData = (users || []).map(u => ({ ...u, uid: u._id, displayName: u.name }));
        studentsData.sort((a, b) => {
          const statusA = (a.status || "pending").toLowerCase();
          const statusB = (b.status || "pending").toLowerCase();
          if (statusA === "pending" && statusB !== "pending") return -1;
          if (statusA !== "pending" && statusB === "pending") return 1;
          return (a.displayName || "").localeCompare(b.displayName || "");
        });
        setStudents(studentsData);
        setDataLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setDataLoading(false);
      }
    };

    loadWardens();
    loadStudents();

    return () => {
      cancelled = true;
    };
    // Only re-run if user ID changes. userData content changes shouldn't trigger re-subscription
  }, [user?.uid, userData?.role, userData?.status]);

  // Handle status change for wardens/students - Call Cloud Function
  const handleStatusChange = useCallback(async (userId, newStatus) => {
    try {
      if (newStatus === 'approved') {
        await cloudFunctions.approveUser(userId, 'management');
      } else if (newStatus === 'denied') {
        await cloudFunctions.denyUser(userId, 'Denied by management');
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(`Failed to ${newStatus} user: ${error.message}`);
    }
  }, [toast]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [navigate]);

  // Show loading while checking auth
  if (loading || userDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate stats (memoised to avoid recalculating on every render)
  const { totalWardens, totalStudents, pendingWardens, pendingStudents, totalPending } = useMemo(() => {
    const tw = wardens.length;
    const ts = students.length;
    const pw = wardens.filter((w) => (w.status || "pending").toUpperCase() === "PENDING").length;
    const ps = students.filter((s) => (s.status || "pending").toUpperCase() === "PENDING").length;
    return { totalWardens: tw, totalStudents: ts, pendingWardens: pw, pendingStudents: ps, totalPending: pw + ps };
  }, [wardens, students]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-white truncate">
                  {userData?.collegeName || "Co-Admin Dashboard"}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Management Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
              {totalPending > 0 && (
                <span className="px-2 sm:px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] sm:text-sm font-medium border border-yellow-500/30 flex-shrink-0">
                  <span className="hidden sm:inline">{totalPending} Pending</span>
                  <span className="sm:hidden">{totalPending}</span>
                </span>
              )}

              <div className="flex-shrink-0">
                <NotificationBell />
              </div>

              <div className="flex-shrink-0">
                <AnimatedLogoutButton 
                  onLogout={handleLogout}
                  variant="dark"
                  text="Log Out"
                />
              </div>

              <div className="flex-shrink-0 hidden sm:block">
                <Avatar
                  uid={user?.uid}
                  image={userData?.photoURL || user?.photoURL}
                  name={user?.displayName || "Management"}
                  email={user?.email}
                  size="md"
                  rounded="full"
                  collections={["users"]}
                  editable
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {user?.displayName?.split(" ")[0]}!
          </h2>
          <p className="text-slate-400 mt-1">
            Manage your wardens and students from here.
          </p>
        </div>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatsCard
            icon={Shield}
            title="Total Wardens"
            value={totalWardens}
            subtitle={pendingWardens > 0 ? `${pendingWardens} pending` : "All approved"}
            gradient="bg-gradient-to-br from-purple-600 to-purple-800"
          />
          <StatsCard
            icon={GraduationCap}
            title="Total Students"
            value={totalStudents}
            subtitle={pendingStudents > 0 ? `${pendingStudents} pending` : "All approved"}
            gradient="bg-gradient-to-br from-blue-600 to-blue-800"
          />
          <StatsCard
            icon={UserPlus}
            title="Pending Approvals"
            value={totalPending}
            subtitle="Needs your attention"
            gradient="bg-gradient-to-br from-yellow-600 to-orange-700"
          />
          <StatsCard
            icon={Home}
            title="Hostels"
            value={userData?.hostelCount || 0}
            subtitle="Under management"
            gradient="bg-gradient-to-br from-teal-600 to-emerald-800"
          />
        </section>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("wardens")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "wardens"
                ? "bg-purple-600 text-white"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Wardens ({totalWardens})
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "students"
                ? "bg-blue-600 text-white"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4 inline mr-2" />
            Students ({totalStudents})
          </button>
        </div>

        {/* User Lists */}
        <section>
          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : activeTab === "wardens" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Warden Management
                </h3>
              </div>
              {wardens.length === 0 ? (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
                  <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No wardens registered yet.</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Wardens will appear here once they register and select your college.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {wardens.map((warden) => (
                    <UserCard
                      key={warden.uid}
                      userItem={warden}
                      onStatusChange={handleStatusChange}
                      type="warden"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  Student Management
                </h3>
              </div>
              {students.length === 0 ? (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
                  <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No students registered yet.</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Students will appear here once they register and select your college.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {students.map((student) => (
                    <UserCard
                      key={student.uid}
                      userItem={student}
                      onStatusChange={handleStatusChange}
                      type="student"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ManagementDashboard;