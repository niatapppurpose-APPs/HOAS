import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle";
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  Info,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import Applogo from "../../assets/Applogo.webp";
// ── Section components ──
import AnimatedBackground from "./components/AnimatedBackground";
import HeroVisual from "./components/HeroVisual";
// import TrustedBy from './components/TrustedBy';
import FeaturesGrid from "./components/FeaturesGrid";
import { WorkflowSteps, TechStack } from "./components/HowItWorks";
import { Testimonials, FAQ } from "./components/SocialProof";
import { RoleCard } from "./components/Cards";
import RoleDrawer from "./components/RoleDrawer";
import AboutModal from "./components/AboutModal";
import Footer from "./components/Footer";
import { ROLE_CARDS, HERO_CHIPS, itemVariants, scaleIn } from "./constants";

const ROLE_ICONS = {
  owner: Building2,
  management: ShieldCheck,
  warden: ShieldCheck,
  student: GraduationCap,
};

const NAV_LINKS = [
  { label: "Home", target: null },
  { label: "Roles", target: "roles" },
  { label: "Features", target: "features" },

  { label: "Workflow", target: "workflow" },
  { label: "FAQ", target: "faq" },
];

const Home = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, loading } = useAuth();
  const { isDark } = useTheme();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
  }, [isMobileMenuOpen]);

  // Navbar scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = useCallback((id) => {
    setIsMobileMenuOpen(false);
    if (!id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      window.scrollTo({
        top: elementPosition + window.pageYOffset - headerOffset,
        behavior: "smooth",
      });
    }
  }, []);

  const handleNavigate = useCallback(() => {
    if (loading) return; // Prevent navigation while auth is initializing
    if (isAdmin) navigate("/OwnersDashboard");
    else if (user) navigate("/dashboard");
    else navigate("/login");
  }, [isAdmin, user, loading, navigate]);

  const ctaLabel = user ? "Dashboard" : "Get Started";

  const glassNav = {
    backgroundColor: isDark
      ? scrolled
        ? "rgba(2,6,23,0.85)"
        : "rgba(2,6,23,0.45)"
      : scrolled
        ? "rgba(255,255,255,0.9)"
        : "rgba(255,255,255,0.55)",
    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)",
    boxShadow: scrolled ? "0 12px 40px -12px rgba(76,29,149,0.25)" : "none",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  };

  return (
    <div
      className="min-h-screen font-sans selection:bg-violet-500/30 selection:text-violet-900 dark:selection:text-violet-200 overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#020617" : "#F8FAFC",
        color: isDark ? "#f1f5f9" : "#0f172a",
      }}
    >
      {/* ══════════ Floating Glass Navbar ══════════ */}
      <motion.nav
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 left-0 right-0 z-50 px-4"
      >
        <div
          className="max-w-7xl mx-auto rounded-2xl border transition-all duration-300"
          style={glassNav}
        >
          <div className="flex justify-between items-center h-14 md:h-16 px-4 md:px-6">
            {/* Logo */}
            <button
              className="flex items-center gap-2.5 group"
              onClick={() => scrollToSection(null)}
            >
              <img src={Applogo} className="h-12 w-full" alt="" />
              {/* <span className="text-lg md:text-xl font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0f172a' }}>HOAS</span> */}
            </button>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, target }) => (
                <button
                  key={label}
                  onClick={() => scrollToSection(target)}
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-violet-500/10"
                  style={{ color: isDark ? "#CBD5E1" : "#475569" }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setIsAboutOpen(true)}
                className="p-2 rounded-xl hover:bg-violet-500/10 transition-colors"
                style={{ color: isDark ? "#CBD5E1" : "#475569" }}
                title="About App"
              >
                <Info size={18} />
              </button>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2.5">
              <ThemeToggle size="sm" />
              {!user && (
                <button
                  onClick={() => navigate("/login")}
                  className="hidden sm:block text-sm font-bold px-4 py-2 rounded-xl transition-colors hover:bg-violet-500/10"
                  style={{ color: isDark ? "#E2E8F0" : "#334155" }}
                >
                  Log in
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleNavigate}
                className="hidden sm:block text-sm font-bold px-5 py-2.5 rounded-xl text-white shadow-lg shadow-violet-600/30"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                }}
              >
                {ctaLabel}
              </motion.button>
              {/* Mobile toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl active:scale-90 transition-transform"
                style={{ color: isDark ? "#CBD5E1" : "#475569" }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "calc(100dvh - 5rem)" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden mt-2 rounded-2xl border overflow-hidden flex flex-col"
              style={glassNav}
            >
              <div className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map(({ label, target }) => (
                  <motion.button
                    key={label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => scrollToSection(target)}
                    className="text-left text-base font-bold py-3 px-4 rounded-xl"
                    style={{
                      color: isDark ? "#E2E8F0" : "#334155",
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(15,23,42,0.03)",
                    }}
                  >
                    {label}
                  </motion.button>
                ))}
                <motion.button
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAboutOpen(true);
                  }}
                  className="text-left text-base font-bold py-3 px-4 rounded-xl flex items-center gap-2"
                  style={{
                    color: isDark ? "#E2E8F0" : "#334155",
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(15,23,42,0.03)",
                  }}
                >
                  <Info size={18} /> About App
                </motion.button>
              </div>
              <div className="mt-auto p-4 grid grid-cols-2 gap-3 pb-6">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="py-3 rounded-xl font-bold text-sm border"
                  style={{
                    color: isDark ? "#E2E8F0" : "#334155",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(15,23,42,0.15)",
                  }}
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleNavigate();
                  }}
                  className="py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                  }}
                >
                  {ctaLabel} <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ══════════ Hero ══════════ */}
      <header className="relative pt-32 md:pt-40 pb-10 md:pb-20 px-4 overflow-hidden">
        <AnimatedBackground isDark={isDark} />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-8 items-center relative z-10">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-bold mb-6 backdrop-blur-md"
              style={{
                backgroundColor: isDark
                  ? "rgba(124,58,237,0.12)"
                  : "rgba(124,58,237,0.07)",
                borderColor: isDark
                  ? "rgba(167,139,250,0.3)"
                  : "rgba(124,58,237,0.25)",
                color: isDark ? "#C4B5FD" : "#6D28D9",
              }}
            >
              <Sparkles size={13} /> Smart. Secure. Simplified.
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-4xl sm:text-5xl xl:text-[4.2rem] font-black tracking-tight leading-[1.06] mb-6"
              style={{ color: isDark ? "#fff" : "#0f172a" }}
            >
              Modern Hostel Management for the{" "}
              <span className="relative inline-block">Digital Era</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              HOAS brings transparency, automation, and accountability to every
              corner of your hostel operations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 mb-9"
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNavigate}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold text-white shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                }}
              >
                Request a Demo <ChevronRight size={17} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => scrollToSection("features")}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold border backdrop-blur-md flex items-center justify-center gap-2"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(255,255,255,0.75)",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(15,23,42,0.12)",
                  color: isDark ? "#E2E8F0" : "#0f172a",
                }}
              >
                Explore Features <PlayCircle size={17} />
              </motion.button>
            </motion.div>

            {/* Trust chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2"
            >
              {HERO_CHIPS.map(({ label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                >
                  <ShieldCheck size={14} className="text-emerald-500" />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Dashboard mockup */}
          <HeroVisual isDark={isDark} />
        </div>
      </header>

      {/* ══════════ Trusted By + Stats ══════════ */}
      {/* <TrustedBy isDark={isDark} /> */}

      {/* ══════════ Roles ══════════ */}
      <section id="roles" className="relative py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={itemVariants}
            className="text-center mb-12 md:mb-16"
          >
            <h2
              className="text-3xl md:text-5xl font-black tracking-tight mb-4"
              style={{ color: isDark ? "#fff" : "#0f172a" }}
            >
              Built for{" "}
              <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
                Every Role
              </span>
            </h2>
            <p
              className="text-base md:text-lg max-w-xl mx-auto"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              HOAS adapts to your responsibilities and empowers you to do more.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
          >
            {ROLE_CARDS.map((role) => (
              <RoleCard
                key={role.key}
                icon={ROLE_ICONS[role.key]}
                title={role.title}
                color={role.color}
                bullets={role.bullets}
                isDark={isDark}
                onSelect={() =>
                  setSelectedRole({ ...role, icon: ROLE_ICONS[role.key] })
                }
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ Role detail drawer ══════════ */}
      <RoleDrawer
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
        isDark={isDark}
        onCTA={handleNavigate}
      />

      {/* ══════════ Features ══════════ */}
      <FeaturesGrid isDark={isDark} />

      {/* ══════════ Workflow + Tech Stack ══════════ */}
      <section id="workflow" className="relative py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={itemVariants}
          >
            <WorkflowSteps isDark={isDark} />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={scaleIn}
          >
            <TechStack isDark={isDark} />
          </motion.div>
        </div>
      </section>

      {/* ══════════ Testimonials ══════════ */}
      <Testimonials isDark={isDark} />

      {/* ══════════ FAQ ══════════ */}
      <FAQ isDark={isDark} />

      {/* ══════════ Footer ══════════ */}
      <Footer isDark={isDark} onNavigate={handleNavigate} />

      {/* About App Modal */}
      <AboutModal
        isAboutOpen={isAboutOpen}
        setIsAboutOpen={setIsAboutOpen}
        isDark={isDark}
      />
    </div>
  );
};

export default Home;
