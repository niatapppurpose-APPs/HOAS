import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "./LoginButton";
import { FcCheckmark } from "react-icons/fc";
import { Loader2 } from 'lucide-react';
import Applogo from '../../assets/Applogo.png'
import { ChevronLeft, ArrowLeft } from 'lucide-react'
const Login = () => {
  const { user, userData, userDataLoading, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Don't navigate if still loading auth state
    if (loading) return;
    
    if (user && !userDataLoading) {
      if (userData) {
        const { role, status } = userData;
        if (status === "approved") {
          navigate(`/dashboard/${role}`, { replace: true });
        } else {
          navigate("/waiting-approval", { replace: true });
        }
      } else {
        navigate("/role", { replace: true });
      }
    }
  }, [user, userData, userDataLoading, loading, navigate]);

  // Show loading state while checking auth after redirect
  if (loading || (user && userDataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container">

        <button className="fixed top-6 left-6 z-30 flex items-center gap-2 border-2 rounded-md bg-transparent p-2 hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400"
          onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Go Home</span>
        </button>
      </div>
      <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white animate-gradient-move dist-bg dist-font">

        {/* Left Section (responsive) */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-start p-6 md:p-20 relative font-sans text-center md:text-left">
          <div className="relative z-10 max-w-lg w-full">
            <img
              src={Applogo}
              alt="HOAS Logo"
              className="w-20 sm:w-24 md:w-28 mb-4 sm:mb-6 animate-fade-in-up border rounded-md mx-auto md:mx-0"
              style={{ animationDelay: '100ms' }}
            />
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2 md:mb-3 leading-tight text-white animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              HOAS — better housing, faster
            </h1>
            <p
              className="text-sm sm:text-base text-gray-300 mb-4 md:mb-6 max-w-md mx-auto md:mx-0 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              Tools to run housing operations—securely and simply.
            </p>

            <ul
              className="hidden md:block space-y-3 text-sm text-gray-300 animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              <li className="flex items-start gap-3">
                <FcCheckmark size={18} className="mt-1 flex-shrink-0 text-indigo-400" />
                <span>Fewer manual tasks</span>
              </li>
              <li className="flex items-start gap-3">
                <FcCheckmark size={18} className="mt-1 flex-shrink-0 text-indigo-400" />
                <span>Enterprise-grade security</span>
              </li>
              <li className="flex items-start gap-3">
                <FcCheckmark size={18} className="mt-1 flex-shrink-0 text-indigo-400" />
                <span>Real‑time visibility</span>
              </li>
            </ul>
          </div>

          {/* Visual anchors (soft, non-distracting) - hidden on small screens */}
          <div className="hidden md:block absolute right-[-8%] top-10 w-72 md:w-96 h-72 md:h-96 rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/10 opacity-40 filter blur-3xl pointer-events-none" aria-hidden="true"></div>
          <div className="hidden md:block absolute left-10 bottom-8 w-56 h-36 bg-[url('/grid.svg')] bg-[length:14px_14px] opacity-10 filter blur-sm pointer-events-none -z-20" aria-hidden="true"></div>
        </div>

        {/* Right Section */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-8">
          <div
            className="w-full max-w-[420px] bg-white/6 backdrop-blur-md px-6 sm:px-8 py-8 sm:py-10 rounded-2xl shadow-[0_10px_30px_rgba(2,6,23,0.6)] border border-white/10 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20 animate-card-entrance mx-auto"
            role="region"
            aria-labelledby="signin-heading"
            style={{ animationDelay: '500ms' }}
          >
            <h2 id="signin-heading" className="text-xl md:text-2xl font-semibold text-center mb-2 text-white">
              Sign in to HOAS
            </h2>
            <p className="text-center text-gray-300 mb-6">
              Fast, secure access to your workspace.
            </p>
            <LoginButton />
          </div>
        </div>

        <style jsx>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-move {
          background-size: 180% 180%;
          /* very slow subtle movement for depth */
          animation: gradient-move 40s linear infinite;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 260ms cubic-bezier(.16,.84,.44,1) both;
        }

        @keyframes card-entrance {
          from { opacity: 0; transform: translateY(12px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-entrance {
          opacity: 0;
          animation: card-entrance 260ms cubic-bezier(.16,.84,.44,1) both;
          will-change: transform, opacity;
        }

        @keyframes error-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .error-in { animation: error-in 180ms ease-out both; }

        /* Respect users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-gradient-move,
          .animate-fade-in-up,
          .animate-card-entrance,
          .error-in {
            animation: none !important;
            opacity: 1; /* Ensure content is visible */
            transform: none !important;
          }
        }
      `}</style>
      </div>
    </>
  );
};

export default Login;
