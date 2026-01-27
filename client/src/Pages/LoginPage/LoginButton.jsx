import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase/firebaseConfig";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowBigRightDash } from "lucide-react";
const LoginButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reduceMotion = useReducedMotion();

  const login = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.log("Login Error Please Try Again:", e);
      // Handle popup closed or cancelled errors gracefully
      const code = e?.code || "";
      const message = e?.message || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" || message.toLowerCase().includes("popup")) {
        setError("Sign-in popup was closed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>

      <div className="flex flex-col items-stretch gap-4 w-full">

        <div className="flex items-center bg-transparent rounded-lg">
          <button
            className="w-full border-2 border-[#ffffff] text-[20px] cursor-pointer inline-flex items-center justify-center gap-3 px-5 py-3 rounded-lg font-medium text-base shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition duration-150 ease-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={login}
            disabled={loading}
            aria-busy={loading}
            aria-label="Continue with Google"
          >

            {loading ? (
              <AiOutlineLoading3Quarters className="animate-spin" size={18} />
            ) : (
              <FcGoogle size={20} />
            )}
            <span className="sr-only">Sign in with Google</span>
            <span className="ml-1">{loading ? "Signing in..." : "Continue with Google"}</span>      <ArrowBigRightDash className="relative left-5" />
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
              role="alert"
              aria-live="assertive"
              className="mt-2 text-sm text-red-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4 flex-shrink-0 text-red-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-10h2v5H9V8zm0-3h2v2H9V5z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default LoginButton;
