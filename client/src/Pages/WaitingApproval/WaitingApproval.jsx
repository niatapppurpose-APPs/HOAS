import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { Clock, Building2, CheckCircle, LogOut, Loader2 } from "lucide-react";

const WaitingApproval = () => {
  const { user, userData, userDataLoading, loading } = useAuth();
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
          navigate("/dashboard/student", { replace: true });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isDenied = userData?.status?.toLowerCase() === "denied";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">HOAS</h1>
          <p className="text-slate-400 mt-2">Hostel Owner Admin System</p>
        </div>

        {/* Status Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
          {/* User Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
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
              <p className="text-white font-semibold">{user?.displayName}</p>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium capitalize">
                {userData?.role || "User"}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center">
            {isDenied ? (
              <>
                <div className="inline-flex p-4 rounded-full bg-red-500/20 mb-4">
                  <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Access Denied
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Your request has been reviewed and denied by the administration.
                  Please contact support if you believe this is an error.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex p-4 rounded-full bg-yellow-500/20 mb-4 animate-pulse">
                  <Clock className="w-12 h-12 text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  You're almost there!
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
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
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-slate-300 text-sm">Account created</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-slate-300 text-sm">Profile submitted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-yellow-400 text-sm font-medium">Waiting for admin approval</span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out and try different account
          </button>
        </div>

        {/* Info Text */}
        <p className="text-center text-slate-500 text-xs mt-6">
          This page will automatically update when your status changes.
        </p>
      </div>
    </div>
  );
};

export default WaitingApproval;
