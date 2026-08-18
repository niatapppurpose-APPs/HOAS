import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, provider } from "../../firebase/firebaseConfig";
import { useToast } from "../../components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, IdCard } from "lucide-react";
import { HashLoader } from 'react-spinners';
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const resolveStudentEmailByIdentifier = async (identifier) => {
  const rawInput = String(identifier || '').trim();

  if (!rawInput) return null;

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const response = await fetch(`${apiBase}/api/auth/resolve-student?studentId=${encodeURIComponent(rawInput)}`);
  if (response.ok) {
    const data = await response.json();
    return data.email || null;
  }

  return null;
};

const LoginButton = () => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changeToggle, setChangeToggle] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const toast = useToast();

  // Pre-fill email from ?email= query param (e.g. when arriving from welcome email link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) setEmail(emailParam.trim().replace(/\s+/g, ''));
  }, []);
  const handleLogin = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      toast.warning('Please fill in all fields.', 3000);
      return;
    }
    setLoading(true);

    try {
      let loginEmail = email;

      // If logging in as Student (using ID), find their email first
      if (changeToggle) {
        const resolvedEmail = await resolveStudentEmailByIdentifier(email);

        if (!resolvedEmail) {
          throw { code: "auth/user-not-found", message: "Student ID not found" };
        }

        loginEmail = resolvedEmail;
        console.log("Found student email:", loginEmail);
      }

      const credential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const authUser = credential?.user || auth.currentUser;
      const displayName = authUser?.displayName || (authUser?.email ? authUser.email.split('@')[0] : 'User');
      toast.success(`Welcome back ${displayName} 👋`, 3000);
    } catch (e) {
      console.error('Login error:', e.code, e.message);

      const code = e?.code || "";
      let errorMsg = "Login failed. Please try again.";
      if (code === "auth/user-not-found") {
        errorMsg = changeToggle ? "Student ID not found." : "No account found with this email.";
      } else if (code === "auth/too-many-requests") {
        errorMsg = "Too many attempts. Try again later.";
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/invalid-email") {
        const isTunnelHost = /(?:^|\.)((ngrok-free\.dev)|(ngrok\.io)|(loca\.lt)|(localhost\.run))$/i.test(window.location.hostname);
        const emulatorFlag = localStorage.getItem('VITE_USE_FIREBASE_EMULATOR') === 'true';
        if (isTunnelHost && emulatorFlag) {
          errorMsg = "This ngrok link uses production Firebase. Use a production account/password (or disable emulator mode locally before sharing).";
        } else {
          errorMsg = "Invalid credentials ⚠️";
        }
      } else if (code === "auth/network-request-failed") {
        errorMsg = "Network error. Check your internet connection and try again.";
      } else if (code === "auth/internal-error") {
        errorMsg = "Authentication service error. Please try again in a moment.";
      } else if (code === "auth/configuration-not-found") {
        errorMsg = "Sign-in method not enabled. Please contact support.";
      }
      toast.error(errorMsg, 4000);
    } finally {
      setLoading(false);
    }
  };

  // Shared input styling
  const inputStyle = (field) => ({
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(241, 245, 249, 0.8)',
    borderColor: focusedField === field
      ? (isDark ? '#6366f1' : '#4f46e5')
      : (isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.2)'),
    color: isDark ? '#f1f5f9' : '#0f172a',
    boxShadow: focusedField === field
      ? (isDark
        ? '0 0 0 3px rgba(99, 102, 241, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.2)'
        : '0 0 0 3px rgba(99, 102, 241, 0.12), inset 0 1px 2px rgba(0, 0, 0, 0.04)')
      : (isDark
        ? 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'
        : 'inset 0 1px 2px rgba(0, 0, 0, 0.04)')
  });

  return (
    <>
      {/* Pill-shaped Email/ID Toggle */}
      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-sm grid grid-cols-2 rounded-full p-[3px]"
          style={{
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(99, 102, 241, 0.2)'
          }}>
          {/* Sliding active indicator */}
          <div
            className="absolute top-[3px] bottom-[3px] rounded-full transition-all duration-100 ease-out"
            style={{
              width: 'calc(50% - 3px)',
              left: !changeToggle ? '3px' : 'calc(50%)',
              background: isDark
                ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                : 'linear-gradient(135deg, #4f46e5, #6366f1)',
              boxShadow: isDark
                ? '0 2px 8px rgba(79, 70, 229, 0.4)'
                : '0 2px 8px rgba(79, 70, 229, 0.3)'
            }}
          />

          <button
            className="relative z-10 px-3 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2"
            style={{
              color: !changeToggle ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
            }}
            type="button"
            onClick={() => {
              setChangeToggle(false);
              setEmail("");
            }}
            aria-label="Login with Email"
            aria-pressed={!changeToggle}
          >
            <Mail className="w-4 h-3.5" />
            Management
          </button>

          <button
            className="relative z-10 px-3 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2"
            style={{
              color: changeToggle ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
            }}
            type="button"
            onClick={() => {
              setChangeToggle(true);
              setEmail("");
            }}
            aria-label="Login with ID Number"
            aria-pressed={changeToggle}
          >
            <IdCard className="w-4 h-3.5" />
            Student ID
          </button>
        </div>
      </div>

      <form onSubmit={handleLogin} className="w-full">
        <div className="flex flex-col gap-4">

          {/* Email / ID Input */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
              {changeToggle ? 'ID Number' : 'Email Address'}
            </label>
            <div className="relative">
              {!changeToggle ? (
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors"
                  style={{ color: focusedField === 'email' ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#475569' : '#94a3b8') }} />
              ) : (
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
                  style={{ color: focusedField === 'email' ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#475569' : '#94a3b8') }} />
              )}
              <input
              
                type={changeToggle ? "text" : "email"}
                value={email}
                onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))}
                onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text').trim();
                  setEmail(pasted);
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder={changeToggle ? 'Enter your ID' : 'you@example.com'}
                className="w-full h-12 pl-11 pr-4 rounded-xl border text-sm transition-all duration-200 outline-none placeholder-opacity-50"
                style={{
                  ...inputStyle('email'),
                  '::placeholder': { color: isDark ? '#475569' : '#94a3b8' }
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors"
                style={{ color: focusedField === 'password' ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#475569' : '#94a3b8') }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value.trim())}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                className="w-full h-12 pl-11 pr-12 rounded-xl border text-sm transition-all duration-200 outline-none"
                style={inputStyle('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: showPassword
                    ? (isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)')
                    : 'transparent',
                  color: isDark ? '#94a3b8' : '#64748b'
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015, y: loading ? 0 : -1 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full h-12 mt-2 rounded-xl font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center relative overflow-hidden cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: loading
                ? (isDark ? 'linear-gradient(135deg, #3730a3, #5b21b6)' : 'linear-gradient(135deg, #4338ca, #6d28d9)')
                : (isDark ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #4f46e5, #6366f1)'),
              boxShadow: isDark
                ? '0 4px 20px rgba(79, 70, 229, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 4px 20px rgba(79, 70, 229, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Shimmer effect */}
            {!loading && (
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.08) 10%, transparent 20%)',
                    animation: 'spin 3s linear infinite'
                  }} />
              </div>
            )}

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <HashLoader size={18} color="#ffffff" />
                  <span className="text-white/90">Signing in...</span>
                </motion.div>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="tracking-wide"
                >
                  Sign In
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </form>
    </>
  );
};

export default LoginButton;
