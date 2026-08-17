import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "./LoginButton";
import RedirectingPage from "./RedirectingPage";
import { Loader2, ArrowLeft, Shield, Zap, Eye } from 'lucide-react';
import Applogo from '../../assets/Applogo.png'
import { useTheme } from "../../context/ThemeContext";
import { useRegistrationCheck } from "../../hooks/useSystemSettings";
import { ThemeToggle } from "../../components/ThemeToggle";

const Login = () => {
  const { user, userData, userDataLoading, loading, isAdmin, claims } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme()
  const [showRedirecting, setShowRedirecting] = useState(false);
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const { allowed: registrationAllowed, message: registrationMessage, loading: regLoading } = useRegistrationCheck();

  // Track if user was already logged in when this component first mounted
  // (as opposed to a fresh login that happened while on this page)
  const wasAlreadyLoggedInRef = useRef(null); // null = not yet determined
  const previousUserRef = useRef(null);

  // On first render (after auth loading completes), record whether user was already logged in
  useEffect(() => {
    if (loading) return; // wait until auth state is known
    if (wasAlreadyLoggedInRef.current === null) {
      // First time we know the auth state
      wasAlreadyLoggedInRef.current = !!user;
    }
  }, [loading, user]);

  // Detect when user logs in (user changes from null to a value)
  useEffect(() => {
    if (!previousUserRef.current && user) {
      // User just transitioned from logged-out → logged-in
      // Only show the redirecting animation if this was a FRESH login (not a page reload)
      if (wasAlreadyLoggedInRef.current === false) {
        // Fresh login — show the animation
        setShowRedirecting(true);
        setMinDelayPassed(false);
      }
    }
    previousUserRef.current = user;
  }, [user]);

  // Guarantee navigation even if the animation timer is somehow lost
  useEffect(() => {
    if (!showRedirecting) return;
    const timer = setTimeout(() => setMinDelayPassed(true), 5000);
    return () => clearTimeout(timer);
  }, [showRedirecting]);

  useEffect(() => {
    // Don't navigate if still loading auth state
    if (loading) return;

if (user && (!userDataLoading || minDelayPassed)) {
      // If user was already logged in when page loaded, navigate immediately (no delay)
      // If it's a fresh login, wait for the minimum delay
      const alreadyLoggedIn = wasAlreadyLoggedInRef.current === true;
      if (alreadyLoggedIn || minDelayPassed) {
        if (userData) {
          const { role, status } = userData;
          if (status === "approved") {
            if (role === 'admin' || role === 'owner') {
              navigate('/OwnersDashboard', { replace: true });
            } else {
              navigate(`/dashboard/${role}`, { replace: true });
            }
          } else if (status === 'pending') {
            navigate("/waiting-approval", { replace: true });
          } else if (status === 'denied') {
            navigate("/waiting-approval", { replace: true });
          } else {
            // Unknown status - default to pending
            navigate("/waiting-approval", { replace: true });
          }
        } else {
          // No userData yet — if the user has admin/owner claim we can bypass waiting
          if (isAdmin || userData?.role === 'admin' || userData?.role === 'owner') {
            navigate('/OwnersDashboard', { replace: true });
          } else {
            navigate("/waiting-approval", { replace: true });
          }
        }
      }
    }
  
  }, [user, userData, userDataLoading, loading, navigate, minDelayPassed]);

  // Show redirecting page only for fresh logins, while waiting for data or delay
  if (showRedirecting && user && (userDataLoading || !minDelayPassed)) {
    // choose display name from various sources in priority order
    const nameFromAuth = user?.displayName;
    const nameFromFirestore = userData?.displayName || userData?.fullName || userData?.name;
    const fallbackName = user?.email ? user.email.split('@')[0] : 'User';
    const firstName = (nameFromAuth || nameFromFirestore ||fallbackName || 'User').split(' ')[0];

    return (
      <RedirectingPage
        userName={firstName}
        showToast={false}
      />
    );
  }

  // Show loading state while checking initial auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #030712, #0c0a1e, #050816)'
            : 'linear-gradient(135deg, #f8fafc, #eef2ff, #f1f5f9)'
        }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const features = [
    { icon: Zap, text: "Fewer manual tasks" },
    { icon: Shield, text: "Enterprise-grade security" },
    { icon: Eye, text: "Real‑time visibility" },
  ];

  return (
    <>
      <div className="min-h-screen relative overflow-hidden"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #030712 0%, #0c0a1e 40%, #050816 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 40%, #f1f5f9 100%)'
        }}>

        {/* Ambient background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
            style={{ background: isDark ? 'radial-gradient(circle, #4f46e5, transparent)' : 'radial-gradient(circle, #a5b4fc, transparent)' }} />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
            style={{ background: isDark ? 'radial-gradient(circle, #7c3aed, transparent)' : 'radial-gradient(circle, #c4b5fd, transparent)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[140px]"
            style={{ background: isDark ? 'radial-gradient(circle, #6366f1, transparent)' : 'radial-gradient(circle, #e0e7ff, transparent)' }} />
        </div>

        {/* Go Home button */}
       <div className="relative z-30 flex justify-between">
         <button
          type="button"
          className="fixed top-6 left-6 z-30 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium backdrop-blur-md border transition-all duration-300 hover:scale-105 active:scale-95 group"
          onClick={() => navigate('/')}
          style={{
            color: isDark ? '#cbd5e1' : '#475569',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.7)'
          }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Go Home
        </button>
       <div className="fixed top-6 right-6 z-10 p-2 border border-2 rounded-lg">
         <ThemeToggle />
       </div>
       </div>

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:px-8 py-12 lg:py-0 gap-8 lg:gap-16 xl:gap-24">

          {/* Left Section — Branding */}
          <div className="w-full max-w-lg lg:max-w-xl text-center lg:text-left flex-shrink-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>

            {/* Logo */}
            <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 inline-flex items-center justify-center"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.3), rgba(124, 58, 237, 0.3))'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                  border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.25)'
                }}>
                <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
                  <img src={Applogo} alt="HOAS Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] mb-4 animate-fade-in-up"
              style={{
                animationDelay: '250ms',
                color: isDark ? '#ffffff' : '#0f172a'
              }}>
              HOAS — better{' '}
              <span className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: isDark
                    ? 'linear-gradient(135deg, #818cf8, #a78bfa)'
                    : 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                }}>
                housing
              </span>
              , faster
            </h1>

            <p className="text-base sm:text-lg mb-8 max-w-md mx-auto lg:mx-0 animate-fade-in-up"
              style={{
                animationDelay: '350ms',
                color: isDark ? '#94a3b8' : '#64748b'
              }}>
              Tools to run housing operations — securely and simply.
            </p>

            {/* Feature list */}
            <div className="hidden md:flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
              {features.map((item, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                      border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.15)'
                    }}>
                    <item.icon className="w-4 h-4" style={{ color: isDark ? '#818cf8' : '#4f46e5' }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section — Login Card */}
          <div className="w-full max-w-[420px] flex-shrink-0 animate-card-entrance" style={{ animationDelay: '400ms' }}>
            {/* Neon glow behind card */}
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-[22px] opacity-60 blur-sm pointer-events-none"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))'
                }} />

              {/* Gradient border wrapper */}
              <div className="relative rounded-[20px] p-[1px]"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.4))'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.25))'
                }}>

                {/* Card body */}
                <div className="rounded-[19px] backdrop-blur-xl px-6 sm:px-8 py-8 sm:py-10 relative overflow-hidden"
                  role="region"
                  aria-labelledby="signin-heading"
                  style={{
                    backgroundColor: isDark ? 'rgba(10, 15, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                    boxShadow: isDark
                      ? '0 25px 60px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      : '0 25px 60px -12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  }}>

                  {/* Subtle shine effect */}
                  <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{
                      background: isDark
                        ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)'
                    }} />

                  {/* Card header */}
                  <div className="text-center mb-8">
                    <h2 id="signin-heading" className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight"
                      style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                      Sign in to HOAS
                    </h2>
                    <p className="text-sm"
                      style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                      Fast, secure access to your workspace.
                    </p>
                  </div>

                  <LoginButton />

                  {/* Registration disabled banner */}
                  {!regLoading && !registrationAllowed && (
                    <div className="mt-4 p-3 rounded-xl border flex items-start gap-2.5"
                      style={{
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.3)',
                      }}>
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                      <div>
                        <p className="text-xs font-semibold text-amber-500">New Registrations Paused</p>
                        <p className="text-[11px] mt-0.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                          {registrationMessage || 'New registrations are currently disabled. Existing users can still sign in.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 500ms cubic-bezier(.16,.84,.44,1) both;
        }
        @keyframes card-entrance {
          from { opacity: 0; transform: translateY(20px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-entrance {
          opacity: 0;
          animation: card-entrance 600ms cubic-bezier(.16,.84,.44,1) both;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up,
          .animate-card-entrance {
            animation: none !important;
            opacity: 1;
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default Login;
