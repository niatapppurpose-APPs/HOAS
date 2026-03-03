import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import {
    ShieldCheck, Building2, GraduationCap,
    LayoutDashboard, Zap, BarChart3, Lock, Menu, X, ChevronRight, Info,
} from 'lucide-react';
import AppLogo from '../../assets/AppLogo4k.png';

// ── Extracted components ──
import { RoleCard, GlassCard, FeatureItem, Shield } from './components/Cards';
import WorkflowSection from './components/WorkflowSection';
import AboutModal from './components/AboutModal';
import Footer from './components/Footer';
import { containerVariants, itemVariants, scaleIn, slideInLeft, slideInRight } from './constants';

const Home = () => {
    const navigate = useNavigate();
    const targetRef = useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const { user, isAdmin, loading, adminChecked } = useAuth();
    const { isDark } = useTheme();

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    }, [isMobileMenuOpen]);

    // Smooth Scroll Handler (wrapped in useCallback)
    const scrollToSection = useCallback((id) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    }, []);

    const { scrollYProgress } = useScroll({ target: targetRef, offset: ['start end', 'end start'] });
    const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

    const handleNavigate = useCallback(() => {
        if (isAdmin) navigate('/OwnersDashboard');
        else if (user) navigate('/dashboard');
        else navigate('/login');
    }, [isAdmin, user, navigate]);

    return (
        <div className="min-h-screen font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden transition-colors duration-300"
            style={{
                backgroundColor: isDark ? '#020617' : '#f8fafc',
                color: isDark ? '#f1f5f9' : '#0f172a'
            }}>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-indigo-500/10 supports-[backdrop-filter]:transition-colors duration-300"
                style={{
                    backgroundColor: isDark ? 'rgba(2, 6, 23, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)'
                }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 cursor-pointer z-50 group"
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-xl p-1.5 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all duration-300 border border-white/10"
                            >
                                <div className="w-full h-full bg-white rounded-lg overflow-hidden flex items-center justify-center">
                                    <img src={AppLogo} alt="AppLogo" className="w-full h-full object-contain animate-logo-glow" />
                                </div>
                            </motion.div>
                            <span className="text-xl md:text-2xl font-bold tracking-tight group-hover:text-indigo-300 transition-colors uppercase"
                                style={{ color: isDark ? '#ffffff' : '#0f172a' }}>HOAS</span>
                        </motion.div>

                        {/* Desktop Menu */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden md:flex items-center gap-6 lg:gap-8"
                        >
                            <button onClick={() => scrollToSection('roles')}
                                className="text-sm font-medium hover:scale-105 transition-all hover:text-indigo-600"
                                style={{ color: isDark ? '#cbd5e1' : '#475569' }}>Roles</button>
                            <button onClick={() => scrollToSection('features')}
                                className="text-sm font-medium hover:scale-105 transition-all hover:text-indigo-600"
                                style={{ color: isDark ? '#cbd5e1' : '#475569' }}>Features</button>
                            <button onClick={() => scrollToSection('workflow')}
                                className="text-sm font-medium hover:scale-105 transition-all hover:text-indigo-600"
                                style={{ color: isDark ? '#cbd5e1' : '#475569' }}>Workflow</button>



                            <div className="flex items-center gap-4">
                                {/* Theme Toggle */}
                                <ThemeToggle size="sm" className="bg-white/5 hover:bg-white/10 border border-white/10" />




                                {/* Get Started / Dashboard button */}
                                {!loading && adminChecked && (
                                    <button
                                        onClick={handleNavigate}
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.7)] transition-all duration-300 flex items-center gap-2 group hover:scale-105 active:scale-95"
                                    >
                                        {isAdmin ? 'Dashboard' : user ? 'Dashboard' : 'Get Started'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setIsAboutOpen(true)}
                                className="p-2 hover:bg-white/10 rounded-full transition-all"
                                style={{ color: isDark ? '#cbd5e1' : '#475569' }}
                                title="About App"
                            >
                                <Info className="w-8 h-8" />
                            </button>
                        </motion.div>

                        {/* Mobile Menu Toggle */}
                        <div className="flex md:hidden items-center z-50">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 transition-colors active:scale-90"
                                style={{
                                    color: isDark ? '#cbd5e1' : '#475569'
                                }}
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: '100vh' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="absolute top-0 left-0 w-full pt-24 px-6 md:hidden flex flex-col gap-6 overflow-hidden"
                            style={{ backgroundColor: isDark ? '#020617' : '#f8fafc' }}>
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col gap-6 text-center"
                            >
                                <motion.div
                                    variants={itemVariants}
                                    className="flex flex-col items-center gap-6 mb-8"
                                >
                                    <motion.div
                                        animate={{ y: [0, -10, 0], rotate: [0, 1, 0, -1, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-24 h-24 bg-indigo-600 rounded-2xl p-2.5 flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] border border-white/10"
                                    >
                                        <div className="w-full h-full bg-white rounded-xl overflow-hidden flex items-center justify-center">
                                            <img src={AppLogo} alt="AppLogo" className="w-full h-full object-contain animate-logo-glow" />
                                        </div>
                                    </motion.div>
                                    <span className="text-3xl font-black uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-b"
                                        style={{
                                            backgroundImage: isDark
                                                ? 'linear-gradient(to bottom, #ffffff, #94a3b8)'
                                                : 'linear-gradient(to bottom, #0f172a, #475569)'
                                        }}>HOAS</span>
                                </motion.div>
                                <motion.button variants={itemVariants} onClick={() => scrollToSection('roles')}
                                    className="text-lg font-medium py-2 border-b w-full transition-colors"
                                    style={{
                                        color: isDark ? '#cbd5e1' : '#475569',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'
                                    }}>Roles</motion.button>
                                <motion.button variants={itemVariants} onClick={() => scrollToSection('features')}
                                    className="text-lg font-medium py-2 border-b w-full transition-colors"
                                    style={{
                                        color: isDark ? '#cbd5e1' : '#475569',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'
                                    }}>Features</motion.button>
                                <motion.button variants={itemVariants} onClick={() => scrollToSection('workflow')}
                                    className="text-lg font-medium py-2 border-b w-full transition-colors"
                                    style={{
                                        color: isDark ? '#cbd5e1' : '#475569',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'
                                    }}>Workflow</motion.button>
                                <motion.button variants={itemVariants} onClick={() => { setIsMobileMenuOpen(false); setIsAboutOpen(true); }}
                                    className="text-lg font-medium py-2 border-b w-full flex items-center justify-center gap-2 transition-colors"
                                    style={{
                                        color: isDark ? '#cbd5e1' : '#475569',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'
                                    }}>
                                    <Info className="w-5 h-5" /> About App
                                </motion.button>
                            </motion.div>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col gap-4 mt-4"
                            >
                                {/* Mobile Theme Toggle */}
                                <div className="flex justify-center">
                                    <ThemeToggle size="md" className="bg-white/5 hover:bg-white/10 border border-white/10" />
                                </div>

                                <motion.button
                                    variants={itemVariants}
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        handleNavigate();
                                    }}
                                    className="w-full py-4 text-base font-semibold rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    style={{
                                        backgroundColor: '#6366f1',
                                        color: '#ffffff',
                                        boxShadow: '0 10px 25px -3px rgba(99, 102, 241, 0.3)'
                                    }}
                                >
                                    {isAdmin ? 'Dashboard' : user ? 'Dashboard' : 'Get Started'} <ChevronRight className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-28 pb-16 md:pt-32 md:pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-4">
                {/* Abstract Background Elements */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden"
                >
                    <div className="absolute top-0 left-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-indigo-500/20 rounded-full blur-[60px] md:blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-500/20 rounded-full blur-[60px] md:blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
                </motion.div>

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border text-xs md:text-sm font-medium mb-6 md:mb-8 backdrop-blur-sm transition-colors cursor-default"
                        style={{
                            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.12)',
                            borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)',
                            color: isDark ? '#a5b4fc' : '#4338ca'
                        }}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Next Generation Institutional Management
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8 leading-[1.1]"
                        style={{ color: isDark ? '#ffffff' : '#0f172a' }}
                    >
                        Simplify Complex <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r animate-text bg-[length:200%_auto]"
                            style={{
                                backgroundImage: isDark
                                    ? 'linear-gradient(to right, #818cf8, #c084fc, #818cf8)'
                                    : 'linear-gradient(to right, #4f46e5, #7c3aed, #4f46e5)'
                            }}>
                            Hostel Operations
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="max-w-2xl mx-auto text-base md:text-lg mb-8 md:mb-10 leading-relaxed px-2"
                        style={{ color: isDark ? '#94a3b8' : '#475569' }}
                    >
                        The comprehensive platform for colleges and institutions to manage housing, automate approvals, and ensure accountability with role-based precision.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 sm:px-0"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNavigate}
                            className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-xl"
                            style={{
                                backgroundColor: isDark ? '#ffffff' : '#0f172a',
                                color: isDark ? '#0f172a' : '#ffffff',
                                boxShadow: isDark ? '0 25px 50px -12px rgba(255, 255, 255, 0.1)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                        >
                            Access Dashboard
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => scrollToSection('roles')}
                            className="w-full sm:w-auto px-8 py-4 bg-transparent border rounded-full font-bold text-lg transition-all backdrop-blur-sm"
                            style={{
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(79, 70, 229, 0.3)',
                                color: isDark ? '#ffffff' : '#4f46e5'
                            }}
                        >
                            Explore Features
                        </motion.button>
                    </motion.div>
                </div>
            </div>

            {/* Role Overview */}
            <section id="roles" className="py-16 md:py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={itemVariants}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6"
                            style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Designed for Every Stakeholder</h2>
                        <p className="text-base md:text-lg max-w-3xl mx-auto px-2"
                            style={{ color: isDark ? '#94a3b8' : '#475569' }}>
                            A unified ecosystem providing tailored experiences for every role in the accommodation process.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                    >
                        <RoleCard
                            icon={Building2}
                            role="Owner / Admin"
                            desc="Super Admin control over all colleges, global settings, & detailed analytics."
                            color="from-indigo-500 to-blue-600"
                            isDark={isDark}
                        />
                        <RoleCard
                            icon={ShieldCheck}
                            role="Management"
                            desc="Oversee campus operations, manage wardens, & monitor capacity limits."
                            color="from-emerald-500 to-teal-600"
                            isDark={isDark}
                        />
                        <RoleCard
                            icon={Lock}
                            role="Warden"
                            desc="Direct student supervision, room allocation, & daily attendance tracking."
                            color="from-orange-500 to-amber-600"
                            isDark={isDark}
                        />
                        <RoleCard
                            icon={GraduationCap}
                            role="Student"
                            desc="Apply for rooms, view allocation status, & raise maintenance requests."
                            color="from-pink-500 to-rose-600"
                            isDark={isDark}
                        />
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-16 md:py-24 border-y relative overflow-hidden"
                style={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'
                }}>
                <div className="absolute inset-0"
                    style={{
                        background: isDark
                            ? 'radial-gradient(ellipse at top right, rgba(79, 70, 229, 0.2), transparent)'
                            : 'radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.08), transparent)'
                    }}></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={slideInLeft}
                            className="text-center lg:text-left"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">
                                <span style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Enterprise-Grade</span> <br className="hidden md:inline" />
                                <span className="text-indigo-400">Hostel Management</span>
                            </h2>
                            <p className="text-base md:text-lg mb-8 leading-relaxed"
                                style={{ color: isDark ? '#94a3b8' : '#475569' }}>
                                HOAS replaces outdated spreadsheet systems with a powerful, real-time cloud platform.
                                Experience seamless integration of student data, room inventory, and administrative workflows.
                            </p>

                            <div className="space-y-4 md:space-y-6 text-left inline-block lg:block">
                                <FeatureItem title="Real-time Approvals" desc="Instant notifications and status updates for all applications." delay={0.1} isDark={isDark} />
                                <FeatureItem title="Access Control" desc="Strict data security ensuring users only see what they need." delay={0.2} isDark={isDark} />
                                <FeatureItem title="Automated Analytics" desc="Visual insights into occupancy rates and administration performance." delay={0.3} isDark={isDark} />
                            </div>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={slideInRight}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                            <div className="space-y-4 sm:translate-y-8">
                                <GlassCard icon={Zap} title="Fast & Reactive" delay={0.2} isDark={isDark} />
                                <GlassCard icon={LayoutDashboard} title="Modern Dashboard" delay={0.4} isDark={isDark} />
                            </div>
                            <div className="space-y-4">
                                <GlassCard icon={Shield} title="Secure Data" delay={0.3} isDark={isDark} />
                                <GlassCard icon={BarChart3} title="Smart Reports" delay={0.5} isDark={isDark} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Workflow Section - Scroll Locked Animation */}
            <WorkflowSection isDark={isDark} itemVariants={itemVariants} />

            {/* Benefits / CTA */}
            <section className="py-16 md:py-24 relative overflow-hidden"
                style={{
                    background: isDark
                        ? 'linear-gradient(to bottom, #0f172a, rgba(30, 27, 75, 0.2))'
                        : 'linear-gradient(to bottom, #eef2ff, #e0e7ff)'
                }}>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

                <div className="max-w-5xl mx-auto px-4 text-center">
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={scaleIn}
                        className="text-3xl md:text-5xl font-bold mb-6 md:mb-8"
                        style={{ color: isDark ? '#ffffff' : '#1e1b4b' }}
                    >
                        Ready to modernize your institution?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-lg md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto"
                        style={{ color: isDark ? '#94a3b8' : '#475569' }}
                    >
                        Join leading colleges in establishing transparency, efficiency, and accountability in hostel operations.
                    </motion.p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, type: "spring" }}
                        onClick={() => navigate('/login')}
                        className="w-full sm:w-auto px-10 py-4 rounded-lg font-bold text-xl transition-all hover:scale-105 active:scale-95"
                        style={{
                            backgroundColor: isDark ? '#ffffff' : '#4f46e5',
                            color: isDark ? '#312e81' : '#ffffff',
                            boxShadow: isDark
                                ? '0 0 40px -10px rgba(255, 255, 255, 0.3)'
                                : '0 0 40px -10px rgba(79, 70, 229, 0.4)'
                        }}
                    >
                        {!user ? 'Get Started Here 👋' : 'Go To Dashbaord 👉'}
                    </motion.button>
                </div>
            </section>

            {/* Footer */}
            <Footer isDark={isDark} />

            {/* About App Modal */}
            <AboutModal isAboutOpen={isAboutOpen} setIsAboutOpen={setIsAboutOpen} isDark={isDark} />
        </div>
    );
};

export default Home