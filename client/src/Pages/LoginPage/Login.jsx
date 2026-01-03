import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import LoginButton from "./LoginButton";
import { Loader2 } from "lucide-react";

const Login = () => {
  const { user, userData, userDataLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !userDataLoading) {
      // If user has existing profile, redirect based on role and status
      if (userData) {
        const { role, status } = userData;
        if (status === 'approved') {
          navigate(`/dashboard/${role}`, { replace: true });
        } else {
          navigate('/waiting-approval', { replace: true });
        }
      } else {
        // New user - go to role selection
        navigate("/role", { replace: true });
      }
    }
  }, [user, userData, userDataLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to HOAS</h1>
          <p className="text-slate-400">Please sign in to continue with your dashboard</p>
        </div>
        
        {userDataLoading && user ? (
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading your profile...</span>
          </div>
        ) : (
          <LoginButton />
        )}
      </div>
    </div>
  );
};

export default Login;
