import React, { useState, useEffect } from "react";
import { signInWithPopup, signInWithRedirect, signInWithEmailAndPassword } from "firebase/auth";
import { auth, provider } from "../../firebase/firebaseConfig";
import { useToast } from "../../components/Toast";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, IdCard } from "lucide-react";
import { HashLoader } from 'react-spinners'
import { useTheme } from "../../context/ThemeContext";
// Detect if user is on mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

const LoginButton = () => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changeToggle, setChangeToggle] = useState(false)
  const toast = useToast();

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      toast.warning('Please fill in all fields.', 3000);
      return;
    }
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success(`Welcome back ${email} 👋`, 3000);

    } catch (e) {
      console.error('Login error:', e.code, e.message);
      if (changeToggle == true) {
        toast.info('We are Working on it please go it with Email field!.')
      }
      const code = e?.code || "";
      let errorMsg = "Login failed. Please try again.";
      if (code === "auth/user-not-found") {
        errorMsg = "No account found with this email.";
      } else if (code === "auth/too-many-requests") {
        errorMsg = "Too many attempts. Try again later.";
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/invalid-email") {
        errorMsg = "Invalid credentials ⚠️";
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


  return (
    <form onSubmit={handleLogin} className="w-full">
      <div className="flex flex-col gap-4">
        {/* Email/ID Input and Toggle Button - unified width */}
        <div className="flex flex-row items-center gap-2 w-full">
          <div className="relative flex-grow">
            {!changeToggle ? (
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
            ) : (
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7" style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
            )}
            <input
              type={changeToggle ? "number" : "email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={changeToggle ? 'ID Number' : 'Email'}
              className="w-full h-12 pl-10 pr-4 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
              style={{
                backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(243, 244, 246, 0.9)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                color: isDark ? '#ffffff' : '#1f2937',
                '--tw-ring-color': isDark ? '#4f46e5' : '#6366f1',
                '--tw-ring-offset-color': isDark ? '#111827' : '#f9fafb'
              }}
            />
          </div>
          <button
            className="flex-shrink-0 border p-2 rounded transition-colors w-16 h-12 flex items-center justify-center"
            style={{
              borderColor: isDark ? "#fff" : "#000",
              backgroundColor: isDark ? "#ffffff" : "#000",
              color: isDark ? "#000" : "#fff"
            }}
            type="button"
            onClick={() => setChangeToggle(prev => !prev)}
            aria-label={changeToggle ? "Switch to Email" : "Switch to ID"}
          >
            {!changeToggle ? 'ID' : 'Email'}
          </button>
        </div>

        {/* Password Input */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-12 pl-10 pr-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
            style={{
              backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(243, 244, 246, 0.9)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              color: isDark ? '#ffffff' : '#1f2937',
              '--tw-ring-color': isDark ? '#4f46e5' : '#6366f1',
              '--tw-ring-offset-color': isDark ? '#111827' : '#f9fafb'
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
            ) : (
              <Eye className="w-5 h-5" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
            )}
          </button>
        </div>

        {/* Login Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full h-12 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)'
          }}
        >
          <AnimatePresence>
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center cursor-not-allowed"
              >
                <HashLoader size={20} color="#ffffff" />
                <span>Logging in...</span>
              </motion.div>
            ) : (
              <motion.span
                key="text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="cursor-pointer"

              >
                Login
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </form>
  );
};

export default LoginButton;
