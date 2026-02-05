import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { auth, provider } from "../../firebase/firebaseConfig";
import { useToast } from "../Toast";
import { LogIn, AlertCircle, Loader2, ShieldAlert, ArrowBigLeft } from "lucide-react";
import GoogleImage from "../../assets/GoogleImage.png";
import AddmingImage from '../../assets/AddminloginImage.jpg'
// Detect if user is on mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

const AdminLogin = () => {
  const { user, isAdmin, loading, adminChecked } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isMobile = isMobileDevice();
  const toast = useToast();

  useEffect(() => {
    if (!loading && adminChecked) {
      if (user && isAdmin) {
        navigate("/OwnersDashboard", { replace: true });
      } else if (user && !isAdmin) {
        setError("Access Denied: You are not authorized as an admin you can't login without proper access. Please contact the system administrator.");

      }
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  const handleAdminLogin = async () => {
    setError("");
    setIsLoggingIn(true);

    try {
      // Use redirect for mobile, popup for desktop
      if (isMobile) {
        toast.info('Redirecting to Google Sign-In for admin login...', 3000);
        await signInWithRedirect(auth, provider);
        // Page will redirect, loading state will persist
      } else {
        toast.info('Opening admin sign-in popup...', 2000);
        await signInWithPopup(auth, provider);
        toast.success('Admin authentication successful!', 3000);
      }
    } catch (e) {
      console.error("Admin Login Error:", e);
      const errorMsg = "Admin login failed. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg, 4000);
      // Only reset loading for popup (desktop), redirect will navigate away
      if (!isMobile) {
        setIsLoggingIn(false);
      }
    }
  };
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
      <div className="w-full max-w-5xl">
        {/* Back to Home */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-2 border border-slate-600 rounded-lg cursor-pointer text-slate-400 hover:text-white hover:border-slate-500 text-sm transition-colors"
          >
            <ArrowBigLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-16 rounded-2xl p-6 lg:p-10">

          {/* Image Section - Hidden on small mobile, visible on larger screens */}
          <div className="hidden sm:block text-center">
            <div className="inline-flex p-3 rounded-xl">
              <img src={AddmingImage} className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-xl object-cover" alt="Admin" />
            </div>
          </div>

          {/* Login Form Section */}
          <div className="flex flex-col justify-center text-center items-center w-full max-w-md">
            <div className="flex flex-col p-2 mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-white">Admin Access Only</h2>
              <p className="text-slate-400 text-sm mt-2">
                This portal is restricted to authorized administrators only.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3 w-full">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm text-left">{error}</p>
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
                  <div className="bg-white rounded p-0.5 flex items-center justify-center">
                    <img src={GoogleImage} alt="Google" className="w-6 h-6" />
                  </div>
                  Continue with Google
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Footer */}
            <p className="text-slate-500 text-xs text-center mt-6">
              Only users with admin privileges can access this dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;