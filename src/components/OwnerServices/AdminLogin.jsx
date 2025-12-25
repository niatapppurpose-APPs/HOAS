import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../../firebase/firebaseConfig";
import { Building2, LogIn, AlertCircle, Loader2, ShieldAlert, ArrowBigLeft } from "lucide-react";
import GoogleImage from "../../assets/GoogleImage.png";

const AdminLogin = () => {
  const { user, isAdmin, loading, adminChecked } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.log("Login Error:", e);
      setError("Login failed. Please try again.");
      setIsLoggingIn(false);
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
      <div className="w-full max-w-md">
 {/* Back to Home */}
        <div className="flex items-center justify-space-evently text-center mb-5">
          <ArrowBigLeft className="flex items-center justify-center text-white m-2" />
          <button
            onClick={() => navigate("/")}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
             Back to Home
          </button>
        </div>
        {/* Login Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-xl bg-amber-500/20 mb-4">
              <ShieldAlert className="w-20 h-20 text-amber-400" />
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
  );
};

export default AdminLogin;
