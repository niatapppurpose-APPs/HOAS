import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { GraduationCap, Shield, Building2, ArrowRight, Loader2, School } from "lucide-react";

const UserRole = () => {
  const [role, setUserRole] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, userData, userDataLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  // Redirect if user already has a profile
  useEffect(() => {
    // Only redirect if userData exists AND it has a role
    if (!userDataLoading && userData && userData.role) {
      if ((userData.status || "").toLowerCase() === "approved") {
        navigate(`/dashboard/${userData.role}`, { replace: true });
      } else {
        navigate("/waiting-approval", { replace: true });
      }
    }
  }, [userData, userDataLoading, navigate]);

  // Fetch colleges (management users)
  useEffect(() => {
    const fetchColleges = async () => {
      setLoadingColleges(true);
      try {
        // Fetch all management users and filter for approved ones
        const q = query(
          collection(db, "users"),
          where("role", "==", "management")
        );
        const querySnapshot = await getDocs(q);
        console.log("Raw management users from Firestore:", querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const collegesData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => (doc.status || "").toLowerCase() === "approved");
        
        console.log("Filtered approved colleges:", collegesData);
        setColleges(collegesData);
      } catch (error) {
        console.error("Error fetching colleges:", error);
      } finally {
        setLoadingColleges(false);
      }
    };

    fetchColleges();
  }, []);

  const roles = [
    {
      id: "student",
      title: "Student",
      description: "Access your hostel services and submit requests",
      icon: GraduationCap,
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      id: "warden",
      title: "Warden",
      description: "Manage students and handle hostel operations",
      icon: Shield,
      gradient: "from-orange-500 to-amber-600"
    },
    {
      id: "management",
      title: "Management",
      description: "Oversee hostels, wardens and administrative tasks",
      icon: Building2,
      gradient: "from-emerald-500 to-teal-600"
    }
  ];

  const handleContinue = async () => {
    if (!user || !role) return;
    
    // If role is student or warden, college selection is required
    if ((role === "student" || role === "warden") && !selectedCollege) return;

    setIsSubmitting(true);
    try {
      const userDataToSave = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add college info if student or warden
      if (role === "student" || role === "warden") {
        const college = colleges.find(c => c.id === selectedCollege);
        if (college) {
          userDataToSave.managementId = selectedCollege;
          userDataToSave.collegeName = college.collegeName || college.displayName;
        }
      }

      // Create user profile in Firestore with pending status
      await setDoc(doc(db, "users", user.uid), userDataToSave);

      // Redirect to waiting approval page
      navigate("/waiting-approval", { replace: true });
    } catch (error) {
      console.error("Error creating profile:", error);
      setIsSubmitting(false);
    }
  };

  if (loading || userDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* User Info */}
        {user && (
          <div className="flex items-center justify-center gap-3 mb-8">
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-12 h-12 rounded-full ring-2 ring-indigo-500/50"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <p className="text-white font-medium">{user.displayName}</p>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Select Your Role</h1>
          <p className="text-slate-400">Choose the role that best describes you</p>
        </div>

        <div className="space-y-4">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setUserRole(r.id)}
              disabled={isSubmitting}
              className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 flex items-center gap-5 text-left ${
                role === r.id
                  ? "bg-slate-800/80 border-indigo-500/70 shadow-lg shadow-indigo-500/20"
                  : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600"
              } disabled:opacity-50`}
            >
              <div className={`p-4 rounded-xl bg-gradient-to-br ${r.gradient}`}>
                <r.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{r.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{r.description}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                role === r.id
                  ? "border-indigo-500 bg-indigo-500"
                  : "border-slate-600"
              }`}>
                {role === r.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* College Selection Dropdown */}
        {(role === "student" || role === "warden") && (
          <div className="mt-6 animate-fadeIn">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Your College/Institute
            </label>
            <div className="relative">
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full p-4 pl-12 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all"
              >
                <option value="">Select a college...</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.collegeName || college.displayName || "Unknown College"}
                  </option>
                ))}
              </select>
              <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {colleges.length === 0 && !loadingColleges && (
              <p className="text-amber-400 text-xs mt-2">
                No registered colleges found. Please contact your administrator.
              </p>
            )}
          </div>
        )}

        <button
          disabled={!role || isSubmitting || ((role === "student" || role === "warden") && !selectedCollege)}
          onClick={handleContinue}
          className="w-full mt-8 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-slate-500 text-sm text-center mt-4">
          Your request will be sent to the administrator for approval
        </p>
      </div>
    </div>
  );
};

export default UserRole;