import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import {
  Building2,
  Users,
  GraduationCap,
  Shield,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Loader2,
  UserPlus,
  Home,
} from "lucide-react";

// Avatar Component with fallback to initials
const Avatar = ({ image, name, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];


  const getColorFromName = (name) => {
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white/20`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getColorFromName(name)} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white/20`}
    >
      {getInitials(name)}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toUpperCase() || "PENDING";
  const statusStyles = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
    DENIED: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusIcons = {
    PENDING: <Clock className="w-3 h-3" />,
    APPROVED: <CheckCircle className="w-3 h-3" />,
    DENIED: <XCircle className="w-3 h-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[normalizedStatus] || statusStyles.PENDING}`}
    >
      {statusIcons[normalizedStatus] || statusIcons.PENDING}
      {normalizedStatus}
    </span>
  );
};

// Stats Card Component
const StatsCard = ({ icon: Icon, title, value, subtitle, gradient }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient}`}>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          <p className="text-white/80 font-medium mt-1">{title}</p>
          {subtitle && (
            <p className="text-white/60 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// User Card Component
const UserCard = ({ userItem, onStatusChange, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPending = (userItem.status || "pending").toUpperCase() === "PENDING";

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all duration-300">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar image={userItem.photoURL} name={userItem.displayName} size="md" />
            <div>
              <p className="text-white font-medium">{userItem.displayName}</p>
              <p className="text-slate-400 text-sm">{userItem.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onStatusChange(userItem.uid, "approved")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => onStatusChange(userItem.uid, "denied")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Deny
                </button>
              </div>
            ) : (
              <StatusBadge status={userItem.status} />
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-700/50 space-y-2 animate-fadeIn">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Role</p>
              <p className="text-slate-300 capitalize">{type}</p>
            </div>
            <div>
              <p className="text-slate-500">Joined</p>
              <p className="text-slate-300">
                {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
            {userItem.collegeName && (
              <div className="col-span-2">
                <p className="text-slate-500">College</p>
                <p className="text-slate-300">{userItem.collegeName}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const ManagementDashboard = () => {
  const { user, userData, userDataLoading, loading } = useAuth();
  const navigate = useNavigate();
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
        navigate("/role", { replace: true });
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

    console.log("Setting up listeners for management dashboard...");
    console.log("Current user UID:", user.uid);
    setDataLoading(true);

    // Set up real-time listeners
    const wardensQuery = query(
      collection(db, "users"),
      where("role", "==", "warden"),
      where("managementId", "==", user.uid)
    );

    const studentsQuery = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("managementId", "==", user.uid)
    );

    console.log("Querying for wardens and students with managementId:", user.uid);

    const unsubWardens = onSnapshot(wardensQuery, (snapshot) => {
      console.log("Wardens snapshot received, count:", snapshot.docs.length);
      const wardensData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
      console.log("Wardens data:", wardensData);
      // Sort: Pending first, then by name
      wardensData.sort((a, b) => {
        const statusA = (a.status || "pending").toLowerCase();
        const statusB = (b.status || "pending").toLowerCase();
        if (statusA === "pending" && statusB !== "pending") return -1;
        if (statusA !== "pending" && statusB === "pending") return 1;
        return (a.displayName || "").localeCompare(b.displayName || "");
      });
      setWardens(wardensData);
    }, (error) => {
      console.error("Error fetching wardens:", error);
    });

    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
      console.log("Students snapshot received, count:", snapshot.docs.length);
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
      console.log("Students data:", studentsData);
      // Sort: Pending first, then by name
      studentsData.sort((a, b) => {
        const statusA = (a.status || "pending").toLowerCase();
        const statusB = (b.status || "pending").toLowerCase();
        if (statusA === "pending" && statusB !== "pending") return -1;
        if (statusA !== "pending" && statusB === "pending") return 1;
        return (a.displayName || "").localeCompare(b.displayName || "");
      });
      setStudents(studentsData);
      setDataLoading(false); // Set loading to false after initial data
    }, (error) => {
      console.error("Error fetching students:", error);
      setDataLoading(false);
    });

    return () => {
      unsubWardens();
      unsubStudents();
    };
    // Only re-run if user ID changes. userData content changes shouldn't trigger re-subscription
  }, [user?.uid, userData?.role, userData?.status]);

  // Handle status change for wardens/students
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
      console.error("Error updating user status:", error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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

  // Calculate stats
  const totalWardens = wardens.length;
  const totalStudents = students.length;
  const pendingWardens = wardens.filter((w) => (w.status || "pending").toUpperCase() === "PENDING").length;
  const pendingStudents = students.filter((s) => (s.status || "pending").toUpperCase() === "PENDING").length;
  const totalPending = pendingWardens + pendingStudents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {userData?.collegeName || "Co-Admin Dashboard"}
                </h1>
                <p className="text-xs text-slate-400">Management Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {totalPending > 0 && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium border border-yellow-500/30">
                  {totalPending} Pending
                </span>
              )}
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              <Avatar
                image={user?.photoURL}
                name={user?.displayName || "Management"}
                size="md"
              />
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