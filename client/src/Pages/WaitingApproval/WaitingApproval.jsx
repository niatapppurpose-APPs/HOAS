import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { Clock, Building2, CheckCircle, Loader2, X, IndianRupee, Moon, Sun } from "lucide-react";
import AnimatedLogoutButton from "../../components/AnimatedLogoutButton";
import { ThemeToggle } from "../../components/ThemeToggle";

const WaitingApproval = () => {
  const { user, userData, userDataLoading, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // If not logged in, redirect to login
    if (!loading && !user) {
      navigate("/login", { replace: true });
      return;
    }

    // If user data is loaded and status is approved, redirect to dashboard
    if (!userDataLoading && userData) {
      const status = userData.status?.toLowerCase();
      
      if (status === "approved") {
        // Redirect based on role
        if (userData.role === "management") {
          navigate("/dashboard/management", { replace: true });
        } else if (userData.role === "warden") {
          navigate("/dashboard/warden", { replace: true });
        } else if (userData.role === "student") {
          const needsPayment = !userData?.feeDetails?.paidFee || userData?.feeDetails?.paidFee === 0;
          const unverified = !userData?.managementVerification || userData?.managementVerification === 'Unverified' || !userData?.wardenVerification || userData?.wardenVerification === 'Unverified';
          if (!needsPayment && !unverified) {
            navigate("/dashboard/student", { replace: true });
          }
        } else if (userData.role === "admin" || userData.role === "owner") {
          navigate("/OwnersDashboard", { replace: true });
        }
      } else if (status === "denied") {
        // Stay on this page but show denied message
      }
    }
  }, [user, userData, userDataLoading, loading, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading || userDataLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100'
      }`}>
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isDenied = userData?.status?.toLowerCase() === "denied";
  const isUnknownRole = !userData?.role || userData.role === "unknown";
  const needsPayment = userData?.role === "student" && (!userData?.feeDetails?.paidFee || userData?.feeDetails?.paidFee === 0);
  const unverifyReason = userData?.unverifyReason;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      <div className="w-full max-w-md">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>HOAS</h1>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Hostel Owner Admin System</p>
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl p-8 backdrop-blur-sm border ${
          isDark
            ? 'bg-slate-800/50 border-slate-700/50'
            : 'bg-white/50 border-gray-200/50 shadow-lg'
        }`}>
          {/* User Info */}
          <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${
            isDark ? 'border-slate-700/50' : 'border-gray-200/50'
          }`}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-14 h-14 rounded-full ring-2 ring-indigo-500/50"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold ring-2 ring-indigo-500/50">
                {user?.displayName?.charAt(0) || "U"}
              </div>
            )}
            <div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.displayName}</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{user?.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                isDark
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {isUnknownRole ? "Unknown" : userData?.role || "User"}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center">
            {isDenied ? (
              <>
                <div className={`inline-flex p-4 rounded-full mb-4 ${
                  isDark ? 'bg-red-500/20' : 'bg-red-50'
                }`}>
                  <svg className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Access Denied
                </h2>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your request has been reviewed and denied by the administration.
                  Please contact support if you believe this is an error.
                </p>
              </>
            ) : isUnknownRole ? (
              <>
                <div className={`inline-flex p-4 rounded-full mb-4 animate-pulse ${
                  isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'
                }`}>
                  <Clock className={`w-12 h-12 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Waiting for access
                </h2>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your login is valid, but no HOAS role has been assigned yet.
                  <br />
                  Please wait until an admin gives access.
                </p>
              </>
            ) : needsPayment ? (
              <>
                <div className={`inline-flex p-4 rounded-full mb-4 animate-bounce ${
                  isDark ? 'bg-amber-500/20' : 'bg-amber-50'
                }`}>
                  <IndianRupee className={`w-12 h-12 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Payment Required
                </h2>
                <div className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Account verification is locked until your initial payment is received.
                  <br />
                  <span className="text-indigo-400 font-semibold">Current Balance: ₹0</span>
                </div>
              </>
            ) : unverifyReason ? (
              <>
                <div className={`inline-flex p-4 rounded-full mb-4 ${
                  isDark ? 'bg-rose-500/20' : 'bg-rose-50'
                }`}>
                  <X className={`w-12 h-12 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Action Required
                </h2>
                <div className={`rounded-xl p-4 mb-4 text-left border ${
                  isDark
                    ? 'bg-rose-500/10 border-rose-500/20'
                    : 'bg-rose-50 border-rose-200'
                }`}>
                  <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${
                    isDark ? 'text-rose-400' : 'text-rose-600'
                  }`}>Reason from Management:</p>
                  <p className={`text-sm italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{unverifyReason}"</p>
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Please address the issue above and contact management if needed.
                </p>
              </>
            ) : (
              <>
                <div className={`inline-flex p-4 rounded-full mb-4 animate-pulse ${
                  isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'
                }`}>
                  <Clock className={`w-12 h-12 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  You're almost there!
                </h2>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your profile is being verified by your administration.
                  <br />
                  Please wait while we review your account.
                </p>
              </>
            )}
          </div>

          {/* Status Steps */}
          {!isDenied && (
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <CheckCircle className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Account created</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <CheckCircle className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Profile submitted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center animate-pulse ${
                  isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
                }`}>
                  <Clock className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>Waiting for admin approval</span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="mt-8 flex justify-center">
            <AnimatedLogoutButton
              onLogout={handleLogout}
              variant={isDark ? "dark" : "light"}
              text="Sign Out"
            />
          </div>
        </div>

        {/* Info Text */}
        <p className={`text-center text-xs mt-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          This page will automatically update when your status changes.
        </p>
      </div>
    </div>
  );
};

export default WaitingApproval;
