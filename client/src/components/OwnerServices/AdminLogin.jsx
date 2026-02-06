import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
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
  const { isDark } = useTheme();
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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)'
            : 'linear-gradient(135deg, #f8fafc, #e2e8f0, #f1f5f9)'
        }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p 
            className="mt-4"
            style={{ color: isDark ? '#cbd5e1' : '#475569' }}
          >
            {user ? "Verifying admin access..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)'
          : 'linear-gradient(135deg, #f8fafc, #e2e8f0, #f1f5f9)'
      }}
    >
      <div className="w-full max-w-5xl">
        {/* Back to Home */}
        <div className="flex items-center mb-6 relative bottom-20">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors"
            style={{
              borderColor: isDark ? '#475569' : '#cbd5e1',
              color: isDark ? '#cbd5e1' : '#475569',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = isDark ? '#64748b' : '#94a3b8';
              e.currentTarget.style.color = isDark ? '#ffffff' : '#1e293b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
              e.currentTarget.style.color = isDark ? '#cbd5e1' : '#475569';
            }}
          >
            <ArrowBigLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-16 rounded-2xl p-6 lg:p-10">

          {/* Image Section - Hidden on small mobile, visible on larger screens */}
          <div className="text-center">
            <div className="inline-flex p-3 rounded-xl drop-shadow-[0_10px_20px_rgba(255,255,255,0.3)] sm:drop-shadow-[0_15px_30px_rgba(255,255,255,0.4)] lg:drop-shadow-[0_20px_40px_rgba(255,255,255,0.5)]">
              <img src={AddmingImage} className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-sm sm:rounded-xl object-cover" alt="Admin" />
            </div>
          </div>

          {/* Login Form Section */}
          <div className="flex flex-col justify-center text-center items-center w-full max-w-md">
            <div className="flex flex-col p-2 mb-6">
              <h2 
                className="text-xl md:text-2xl font-semibold"
                style={{ color: isDark ? '#ffffff' : '#0f172a' }}
              >
                Admin Access Only
              </h2>
              <p 
                className="text-sm mt-2"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                This portal is restricted to authorized administrators only.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="mb-6 p-4 rounded-xl flex items-start gap-3 w-full"
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'
                }}
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p 
                  className="text-sm text-left"
                  style={{ color: isDark ? '#fca5a5' : '#dc2626' }}
                >
                  {error}
                </p>
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
                <div className="flex items-center justify-around gap-5">
                  <div className="bg-white rounded-full p-2 flex items-center justify-center">
                    <img src={GoogleImage} alt="Google" className="w-8 h-8 sm:w-8 sm:h-8 object-contain" />
                  </div>
                  <span className="text-sm sm:text-base md:text-lg">Continue with Google</span>
                  <LogIn className="w-5 h-5 hidden sm:block" />
                </div>
              )}
            </button>

            {/* Footer */}
            <p 
              className="text-xs text-center mt-6"
              style={{ color: isDark ? '#64748b' : '#94a3b8' }}
            >
              Only users with admin privileges can access this dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;