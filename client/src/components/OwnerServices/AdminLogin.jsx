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

    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full border border-white">
        {/* Back to Home */}
        <div className="flex items-center justify-space-evently text-center relative border border-white rounded-lg w-fit px-1 py-1 md:left-5 md:bottom-45 cursor-pointer">
          <ArrowBigLeft className="flex items-center justify-center text-white m-2" />
          <button
            onClick={() => navigate("/")}
            className="cursor-pointer text-slate-400 hover:text-white text-sm transition-colors"
          >
            Back to Home
          </button>
        </div>


        {/* Login Card */}
        <div className="flex flex-row  justify-around items-center rounded-2xl p-10 relative lg:left-20 relative bottom-10 ">

          <div className="text-center mb-6 relative lg:left-20">
            <div className="inline-flex p-3 rounded-xl mb-4">
              <img src={AddmingImage} className="w-80 h-80 " />
            </div>

          </div>


          <div className="flex flex-col justify-center text-center  items-center relative lg:right-70">
            <div className="flex flex-col p-2">
            <h2 className="text-xl font-semibold text-white">Admin Access Only</h2>
            <p className="text-slate-400 text-sm mt-2">
              This portal is restricted to authorized administrators only.
            </p>
          </div>
         

          {/* Login Button */}
          <button
            onClick={handleAdminLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-5 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                Continue with Google<LogIn className="flex items-center justify-center" />
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
 {/* Error Message */}
          {/* {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )} */}