import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
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
  MapPin,
  LogOut,
  Loader2,
} from "lucide-react";

// Mock Data - Easily replaceable with database calls
const mockCollegesData = [
  {
    id: "col_001",
    name: "St. Xavier's College",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop",
    email: "admin@stxaviers.edu",
    location: "Mumbai, Maharashtra",
    status: "PENDING", // PENDING, APPROVED, DENIED
    campusCount: 3,
    coAdmin: {
      name: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@stxaviers.edu",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    students: [
      { id: "STU001", name: "Amit Sharma", image: null, status: "APPROVED" },
      { id: "STU002", name: "Priya Patel", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", status: "APPROVED" },
      { id: "STU003", name: "Rahul Verma", image: null, status: "PENDING" },
      { id: "STU004", name: "Sneha Gupta", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", status: "APPROVED" },
    ],
    wardens: [
      { id: "WAR001", name: "Mr. Suresh Menon", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", status: "APPROVED" },
      { id: "WAR002", name: "Mrs. Lakshmi Iyer", image: null, status: "APPROVED" },
    ],
  },
  {
    id: "col_002",
    name: "Delhi Public School",
    logo: null,
    email: "principal@dps.edu",
    location: "New Delhi",
    status: "APPROVED",
    campusCount: 5,
    coAdmin: {
      name: "Mrs. Anita Singh",
      email: "anita.singh@dps.edu",
      image: null,
    },
    students: [
      { id: "STU005", name: "Vikram Reddy", image: null, status: "APPROVED" },
      { id: "STU006", name: "Anjali Nair", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", status: "APPROVED" },
      { id: "STU007", name: "Karan Malhotra", image: null, status: "DENIED" },
    ],
    wardens: [
      { id: "WAR003", name: "Dr. Arun Joshi", image: null, status: "APPROVED" },
    ],
  },
  {
    id: "col_003",
    name: "Presidency University",
    logo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop",
    email: "registrar@presidency.edu",
    location: "Kolkata, West Bengal",
    status: "DENIED",
    campusCount: 2,
    coAdmin: {
      name: "Prof. Subhash Bose",
      email: "subhash.bose@presidency.edu",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    },
    students: [
      { id: "STU008", name: "Deepika Sen", image: null, status: "PENDING" },
      { id: "STU009", name: "Arjun Das", image: null, status: "PENDING" },
    ],
    wardens: [
      { id: "WAR004", name: "Mr. Bidhan Roy", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", status: "PENDING" },
    ],
  },
  {
    id: "col_004",
    name: "IIT Bombay Hostels",
    logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100&h=100&fit=crop",
    email: "hostel@iitb.ac.in",
    location: "Mumbai, Maharashtra",
    status: "PENDING",
    campusCount: 8,
    coAdmin: {
      name: "Dr. Vikram Sarabhai",
      email: "vikram.s@iitb.ac.in",
      image: null,
    },
    students: [
      { id: "STU010", name: "Neha Kapoor", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", status: "APPROVED" },
      { id: "STU011", name: "Siddharth Rao", image: null, status: "APPROVED" },
      { id: "STU012", name: "Meera Krishnan", image: null, status: "PENDING" },
      { id: "STU013", name: "Rohan Mehta", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", status: "APPROVED" },
      { id: "STU014", name: "Tanya Bhatia", image: null, status: "APPROVED" },
    ],
    wardens: [
      { id: "WAR005", name: "Prof. Ramesh Chandra", image: null, status: "APPROVED" },
      { id: "WAR006", name: "Dr. Sunita Yadav", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop", status: "APPROVED" },
      { id: "WAR007", name: "Mr. Prakash Dubey", image: null, status: "PENDING" },
    ],
  },
];

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
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name) => {
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
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[status]}`}
    >
      {statusIcons[status]}
      {status}
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

// User List Item Component
const UserListItem = ({ user, type }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar image={user.image} name={user.name} size="sm" />
        <div>
          <p className="text-white font-medium text-sm">{user.name}</p>
          <p className="text-slate-400 text-xs">
            {type === "warden" ? `ID: ${user.id}` : user.id ? `ID: ${user.id}` : "Student"}
          </p>
        </div>
      </div>
      <StatusBadge status={user.status} />
    </div>
  );
};

// College Detail Section (Accordion Content)
const CollegeDetails = ({ college }) => {
  return (
    <div className="px-6 pb-6 space-y-6 animate-fadeIn">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <GraduationCap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{college.students.length}</p>
              <p className="text-blue-300 text-sm">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{college.wardens.length}</p>
              <p className="text-purple-300 text-sm">Total Wardens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wardens List */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Wardens
          </h4>
          <div className="space-y-2">
            {college.wardens.map((warden) => (
              <UserListItem key={warden.id} user={warden} type="warden" />
            ))}
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            Students
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {college.students.map((student) => (
              <UserListItem key={student.id} user={student} type="student" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// College Row Component
const CollegeRow = ({ college, onStatusChange, isExpanded, onToggle }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/50 transition-all duration-300">
      {/* Main Row */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: College Info */}
          <div className="flex items-center gap-4">
            <Avatar image={college.logo} name={college.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg truncate">
                {college.name}
              </h3>
              <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {college.location}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Co-Admin: {college.coAdmin.name}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 text-sm hidden lg:block">
              Displaying Co-Admin Dashboard
            </span>
            
            {college.status === "PENDING" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onStatusChange(college.id, "APPROVED")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Access
                </button>
                <button
                  onClick={() => onStatusChange(college.id, "DENIED")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Denied
                </button>
              </div>
            ) : (
              <StatusBadge status={college.status} />
            )}

            <button
              onClick={onToggle}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && <CollegeDetails college={college} />}
    </div>
  );
};

// Main Dashboard Component
const OwnersDashboard = () => {
  const { user, isAdmin, loading, adminChecked } = useAuth();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState(mockCollegesData);
  const [expandedId, setExpandedId] = useState(null);

  // Protect the route - redirect if not admin
  useEffect(() => {
    // Only redirect after loading is complete AND admin status has been checked
    if (!loading && adminChecked) {
      if (!user || !isAdmin) {
        console.log("Redirecting to admin-login: user=", user?.email, "isAdmin=", isAdmin);
        navigate("/admin-login", { replace: true });
      }
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin-login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
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

  // Calculate stats
  const totalColleges = colleges.length;
  const totalCampuses = colleges.reduce((acc, col) => acc + col.campusCount, 0);
  const pendingApprovals = colleges.filter((col) => col.status === "PENDING").length;

  // Handle status change
  const handleStatusChange = (collegeId, newStatus) => {
    setColleges((prev) =>
      prev.map((college) =>
        college.id === collegeId ? { ...college, status: newStatus } : college
      )
    );
  };

  // Toggle expanded college
  const toggleExpanded = (collegeId) => {
    setExpandedId((prev) => (prev === collegeId ? null : collegeId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HOAS</h1>
                <p className="text-xs text-slate-400">Owner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {pendingApprovals > 0 && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium border border-yellow-500/30">
                  {pendingApprovals} Pending
                </span>
              )}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              <Avatar
                image={user?.photoURL}
                name={user?.displayName || "Admin"}
                size="md"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <StatsCard
            icon={Building2}
            title="Total Colleges"
            value={totalColleges}
            subtitle="Registered institutions"
            gradient="bg-gradient-to-br from-blue-600 to-blue-800"
          />
          <StatsCard
            icon={Users}
            title="HOAS"
            value="Super Admin"
            subtitle="Hostel Owner Admin System"
            gradient="bg-gradient-to-br from-indigo-600 to-purple-800"
          />
          <StatsCard
            icon={MapPin}
            title="Campus Overview"
            value={totalCampuses}
            subtitle="Total campuses managed"
            gradient="bg-gradient-to-br from-teal-600 to-emerald-800"
          />
        </section>

        {/* Co-Admin Approval List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Co-Admin Management
              </h2>
              <p className="text-slate-400 mt-1">
                Approve or deny access for registered colleges
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Active
              <span className="w-2 h-2 rounded-full bg-yellow-500 ml-2" /> Pending
              <span className="w-2 h-2 rounded-full bg-red-500 ml-2" /> Denied
            </div>
          </div>

          <div className="space-y-4">
            {colleges.map((college) => (
              <CollegeRow
                key={college.id}
                college={college}
                onStatusChange={handleStatusChange}
                isExpanded={expandedId === college.id}
                onToggle={() => toggleExpanded(college.id)}
              />
            ))}
          </div>
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.8);
        }
      `}</style>
    </div>
  );
};

export default OwnersDashboard;
