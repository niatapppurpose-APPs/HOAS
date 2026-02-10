import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "./LoginButton";
import RedirectingPage from "./RedirectingPage";
import { FcCheckmark } from "react-icons/fc";
import { Loader2 } from 'lucide-react';
import Applogo from '../../assets/Applogo.png'
import { useTheme } from "../../context/ThemeContext";
import { ChevronLeft, ArrowLeft } from 'lucide-react'
const Login = () => {
  const { user, userData, userDataLoading, loading } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme()
  const [showRedirecting, setShowRedirecting] = useState(false);
  const [minDelayPassed, setMinDelayPassed] = useState(false);

  const previousUserRef = useRef(null);

  // Detect when user logs in (user changes from null to a value)
  useEffect(() => {
    if (!previousUserRef.current && user) {
      // User just logged in - show redirecting page
      setShowRedirecting(true);
      setMinDelayPassed(false);

      // Minimum 3 second delay before allowing navigation
      const timer = setTimeout(() => {
        setMinDelayPassed(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
    previousUserRef.current = user;
  }, [user]);

  useEffect(() => {
    // Don't navigate if still loading auth state
    if (loading) return;

    // Wait for both: data loaded AND minimum delay passed
    if (user && !userDataLoading && minDelayPassed) {
      if (userData) {
        const { role, status } = userData;
        if (status === "approved") {
          if (role === 'admin' || role === 'owner') {
            navigate('/OwnersDashboard', { replace: true });
          } else {
            navigate(`/dashboard/${role}`, { replace: true });
          }
        } else {
          navigate("/waiting-approval", { replace: true });
        }
      } else {
        navigate("/role", { replace: true });
      }
    }
  }, [user, userData, userDataLoading, loading, navigate, minDelayPassed]);

  // Show redirecting page while user is logged in and either loading data or waiting for delay
  if (showRedirecting && user && (userDataLoading || !minDelayPassed)) {
    return (
      <RedirectingPage
        userName={user?.displayName?.split(' ')[0] || 'User'}
        message="Please do not go back or reload the page"
      />
    );
  }

  // Show loading state while checking initial auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #111827, #0f172a, #000000)'
            : 'linear-gradient(135deg, #f8fafc, #e2e8f0, #f1f5f9)'
        }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-lg" style={{ color: isDark ? '#d1d5db' : '#4b5563' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="container" >

          <button className="fixed top-6 left-6 z-30 flex items-center gap-2 border-2 rounded-md bg-transparent p-2 hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400"
            onClick={() => navigate('/')}
            style={{
              color: isDark ? '#ffffff' : '#0f172a',
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
            }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Go Home</span>
          </button>
        </div>
        <div className="min-h-screen flex flex-col items-center justify-center md:flex-row animate-gradient-move dist-bg dist-font"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #111827, #0f172a, #000000)'
              : 'linear-gradient(135deg, #f8fafc, #e2e8f0, #f1f5f9)'
          }}>

          {/* Left Section (responsive) */}
          <div className="md:flex-[5] flex flex-col justify-center items-center  p-6 md:pl-20 md:pr-8 md:py-20 relative font-sans text-center md:text-left">
            <div className="relative z-10 max-w-lg w-full">
              <img
                src={Applogo}
                alt="HOAS Logo"
                className="w-20 sm:w-24 md:w-28 mb-4 sm:mb-6 animate-fade-in-up border rounded-md mx-auto md:mx-0"
                style={{
                  animationDelay: '100ms',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
              />
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2 md:mb-3 leading-tight animate-fade-in-up"
                style={{
                  animationDelay: '200ms',
                  color: isDark ? '#ffffff' : '#0f172a'
                }}
              >
                HOAS — better housing, faster
              </h1>
              <p
                className="text-sm sm:text-base mb-4 md:mb-6 max-w-md mx-auto md:mx-0 animate-fade-in-up"
                style={{
                  animationDelay: '300ms',
                  color: isDark ? '#d1d5db' : '#475569'
                }}
              >
                Tools to run housing operations—securely and simply.
              </p>

              <ul
                className="hidden md:block space-y-3 text-sm animate-fade-in-up"
                style={{
                  animationDelay: '400ms',
                  color: isDark ? '#d1d5db' : '#475569'
                }}
              >
                <li className="flex items-start gap-3">
                  <FcCheckmark size={18} className="mt-1 flex-shrink-0" />
                  <span>Fewer manual tasks</span>
                </li>
                <li className="flex items-start gap-3">
                  <FcCheckmark size={18} className="mt-1 flex-shrink-0" />
                  <span>Enterprise-grade security</span>
                </li>
                <li className="flex items-start gap-3">
                  <FcCheckmark size={18} className="mt-1 flex-shrink-0" />
                  <span>Real‑time visibility</span>
                </li>
              </ul>
            </div>

            {/* Visual anchors (soft, non-distracting) - hidden on small screens */}
            <div className="hidden md:block absolute right-[-8%] top-10 w-72 md:w-96 h-72 md:h-96 rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/10 opacity-40 filter blur-3xl pointer-events-none" aria-hidden="true"></div>
            <div className="hidden md:block absolute left-10 bottom-8 w-56 h-36 bg-[url('/grid.svg')] bg-[length:14px_14px] opacity-10 filter blur-sm pointer-events-none -z-20" aria-hidden="true"></div>
          </div>

          {/* Right Section */}
          <div className="md:flex-[6] flex items-center justify-center p-6 md:pl-4 md:pr-8 md:py-8">
            <div
              className="w-full max-w-[420px] backdrop-blur-xl px-6 sm:px-8 py-8 sm:py-10 rounded-2xl border transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl animate-card-entrance mx-auto"
              role="region"
              aria-labelledby="signin-heading"
              style={{
                animationDelay: '500ms',
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                boxShadow: isDark
                  ? '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                  : '0 10px 30px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h2 id="signin-heading" className="text-2xl md:text-3xl font-bold text-center mb-2"
                style={{ color: isDark ? '#ffffff' : '#111827' }}>
                Sign in to HOAS
              </h2>
              <p className="text-center text-sm mb-8"
                style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                Fast, secure access to your workspace.
              </p>
              <LoginButton />
            </div>
          </div>
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

    </>
  );
};

export default Login;
