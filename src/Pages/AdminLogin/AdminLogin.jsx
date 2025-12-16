import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../../firebase/firebaseConfig";
import { Building2, LogIn, AlertCircle, Loader2, ShieldAlert } from "lucide-react";

const AdminLogin = () => {
  const { user, isAdmin, loading, adminChecked } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Only redirect when loading is complete AND admin status has been verified
    if (!loading && adminChecked) {
      if (user && isAdmin) {
        console.log("Admin verified, redirecting to dashboard...");
        navigate("/OwnersDashboard", { replace: true });
      } else if (user && !isAdmin) {
        // User is logged in but not admin - show error and sign out
        setError("Access Denied: You are not authorized as an admin. Please contact the system administrator.");
        signOut(auth);
      }
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  const handleAdminLogin = async () => {
    setError("");
    setIsLoggingIn(true);

    try {
      await signInWithPopup(auth, provider);
      console.log("Login successful, waiting for auth state update...");
      // The useEffect will handle the redirect once adminChecked becomes true
    } catch (e) {
      console.log("Login Error:", e);
      setError("Login failed. Please try again.");
      setIsLoggingIn(false);
    }
  };

  // Show loading while auth is initializing
  if (loading || (user && !adminChecked)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">
            {user ? "Verifying admin access..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

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

        {/* Login Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-xl bg-amber-500/20 mb-4">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Admin Access Only</h2>
            <p className="text-slate-400 text-sm mt-2">
              This portal is restricted to authorized administrators only.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleAdminLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Footer */}
          <p className="text-slate-500 text-xs text-center mt-6">
            Only users with admin privileges can access this dashboard.
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
