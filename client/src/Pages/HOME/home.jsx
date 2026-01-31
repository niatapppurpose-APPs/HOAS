import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion';
import {
    ShieldCheck,
    Users,
    Building2,
    GraduationCap,
    ArrowRight,
    CheckCircle2,
    LayoutDashboard,
    Zap,
    BarChart3,
    Lock,
    Menu,
    X,
    ChevronRight,
    Search,
    Info
} from 'lucide-react';
import AppLogo from '../../assets/AppLogo4k.png';
const Home = () => {
    const navigate = useNavigate();
    const targetRef = useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const { user, logout } = useAuth();
    const [activeTeamMember, setActiveTeamMember] = useState(null);

    const teamData = {
        'hq': {
            name: 'Hemanth Kumar',
            role: 'Lead Architect',
            location: 'Bangalore, India',
            desc: 'The visionary behind HOAS. specialized in scalable enterprise architecture and intuitive user adaptability.',
            initials: 'HK',
            gradient: 'from-indigo-500 to-purple-600'
        },
        'it': {
            name: 'System Ops',
            role: 'Infrastructure Team',
            location: 'Cloud Region: Asia-South',
            desc: 'Ensuring 99.9% uptime, end-to-end encryption, and seamless data replication across all availability zones.',
            initials: 'OP',
            gradient: 'from-slate-700 to-slate-500'
        }
    };

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

    // Smooth Scroll Handler
    const scrollToSection = (id) => {
        setIsMobileMenuOpen(false); // Close mobile menu if open
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start end", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

    // Enhanced Animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
    };

    const scaleIn = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    const slideInLeft = {
        hidden: { opacity: 0, x: -50 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    const slideInRight = {
        hidden: { opacity: 0, x: 50 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-indigo-500/10 supports-[backdrop-filter]:bg-slate-950/60">
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
                            <span className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors uppercase">HOAS</span>
                        </motion.div>

                        {/* Desktop Menu */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden md:flex justify-between relative left-20 items-center gap-8"
                        >
                            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-300 hover:text-white hover:scale-105 transition-all">Features</button>
                            <button onClick={() => scrollToSection('roles')} className="text-sm font-medium text-slate-300 hover:text-white hover:scale-105 transition-all">Roles</button>
                            <button onClick={() => scrollToSection('workflow')} className="text-sm font-medium text-slate-300 hover:text-white hover:scale-105 transition-all">Workflow</button>



                            <div className="flex items-center gap-4">
                                {!user ? (<button
                                    onClick={() => navigate('/login')}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-105 active:scale-95"
                                >
                                    Sign In
                                </button>) : null}
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.7)] transition-all duration-300 flex items-center gap-2 group hover:scale-105 active:scale-95"
                                >
                                    {!user ? 'Get Started' : 'Dashboard'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <button
                                onClick={() => setIsAboutOpen(true)}
                                className="relative left-35 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                title="About App"
                            >
                                <Info className="w-8 h-8" />
                            </button>
                        </motion.div>

                        {/* Mobile Menu Toggle */}
                        <div className="flex md:hidden items-center z-50">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-slate-300 hover:text-white transition-colors active:scale-90"
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
                            className="absolute top-0 left-0 w-full bg-slate-950 pt-24 px-6 md:hidden flex flex-col gap-6 overflow-hidden"
                        >
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
                                    <span className="text-3xl font-black text-white uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">HOAS</span>
                                </motion.div>
                                <motion.button variants={itemVariants} onClick={() => scrollToSection('features')} className="text-lg font-medium text-slate-300 hover:text-white py-2 border-b border-white/5 w-full">Features</motion.button>
                                <motion.button variants={itemVariants} onClick={() => scrollToSection('roles')} className="text-lg font-medium text-slate-300 hover:text-white py-2 border-b border-white/5 w-full">Roles</motion.button>
                                <motion.button variants={itemVariants} onClick={() => scrollToSection('workflow')} className="text-lg font-medium text-slate-300 hover:text-white py-2 border-b border-white/5 w-full">Workflow</motion.button>
                                <motion.button variants={itemVariants} onClick={() => { setIsMobileMenuOpen(false); setIsAboutOpen(true); }} className="text-lg font-medium text-slate-300 hover:text-white py-2 border-b border-white/5 w-full flex items-center justify-center gap-2">
                                    <Info className="w-5 h-5" /> About App
                                </motion.button>
                            </motion.div>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col gap-4 mt-4"
                            >
                                {!user ? (<motion.button
                                    onClick={() => navigate('/login')}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-105 active:scale-95"
                                >
                                    Sign In
                                </motion.button>) : null}
                                <motion.button
                                    variants={itemVariants}
                                    onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                                    className="w-full py-4 text-base font-semibold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    {!user ? 'Get Started' : 'Dashboard'} <ChevronRight className="w-4 h-4" />
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
                        className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs md:text-sm font-medium mb-6 md:mb-8 backdrop-blur-sm hover:bg-indigo-500/20 transition-colors cursor-default"
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
                        className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 md:mb-8 leading-[1.1]"
                    >
                        Simplify Complex <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-text bg-[length:200%_auto]">
                            Hostel Operations
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="max-w-2xl mx-auto text-base md:text-lg text-slate-400 mb-8 md:mb-10 leading-relaxed px-2"
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
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-200 transition-colors shadow-xl shadow-white/10"
                        >
                            Access Dashboard
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => scrollToSection('roles')}
                            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/10 text-white rounded-full font-bold text-lg transition-all backdrop-blur-sm"
                        >
                            Explore Features
                        </motion.button>
                    </motion.div>

                    {/* Floating UI Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 100, rotateX: 25 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 1.2, delay: 0.6, type: "spring", bounce: 0.4 }}
                        className="mt-12 md:mt-20 relative mx-auto max-w-5xl px-2 sm:px-4 perspective-1000"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 animate-pulse"></div>
                        <div className="relative rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[16/9] flex items-center justify-center group hover:border-white/20 transition-colors duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
                            {/* Simplified Mockup Content */}
                            <div className="grid grid-cols-4 gap-3 md:gap-6 p-4 md:p-8 w-full h-full opacity-80">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.5, duration: 0.8 }}
                                    className="hidden sm:block col-span-1 bg-white/5 rounded-xl h-full border border-white/5"
                                ></motion.div>
                                <div className="col-span-4 sm:col-span-3 flex flex-col gap-3 md:gap-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.7, duration: 0.8 }}
                                        className="h-10 md:h-16 bg-white/5 rounded-xl w-full border border-white/5"
                                    ></motion.div>
                                    <div className="flex-1 grid grid-cols-3 gap-3 md:gap-6">
                                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.9 }} className="bg-indigo-500/10 rounded-xl border border-indigo-500/20"></motion.div>
                                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.0 }} className="bg-purple-500/10 rounded-xl border border-purple-500/20"></motion.div>
                                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.1 }} className="bg-white/5 rounded-xl border border-white/5"></motion.div>
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 2.2, duration: 0.8 }}
                                        className="h-32 md:h-48 bg-white/5 rounded-xl w-full border border-white/5"
                                    ></motion.div>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 2.5, type: "spring" }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <div className="px-4 py-2 md:px-6 md:py-3 bg-slate-900/90 backdrop-blur-md rounded-full border border-indigo-500/30 shadow-2xl flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform">
                                    <span className="relative flex h-2 w-2 md:h-3 md:w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-green-500"></span>
                                    </span>
                                    <span className="text-xs md:text-sm font-mono text-indigo-300">System Active</span>
                                </div>
                            </motion.div>
                        </div>
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
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6">Designed for Every Stakeholder</h2>
                        <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto px-2">
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
                        />
                        <RoleCard
                            icon={ShieldCheck}
                            role="Management"
                            desc="Oversee campus operations, manage wardens, & monitor capacity limits."
                            color="from-emerald-500 to-teal-600"
                        />
                        <RoleCard
                            icon={Lock}
                            role="Warden"
                            desc="Direct student supervision, room allocation, & daily attendance tracking."
                            color="from-orange-500 to-amber-600"
                        />
                        <RoleCard
                            icon={GraduationCap}
                            role="Student"
                            desc="Apply for rooms, view allocation status, & raise maintenance requests."
                            color="from-pink-500 to-rose-600"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-16 md:py-24 bg-slate-900/50 border-y border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/0 to-slate-900/0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={slideInLeft}
                            className="text-center lg:text-left"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">
                                Enterprise-Grade <br className="hidden md:inline" />
                                <span className="text-indigo-400">Hostel Management</span>
                            </h2>
                            <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed">
                                HOAS replaces outdated spreadsheet systems with a powerful, real-time cloud platform.
                                Experience seamless integration of student data, room inventory, and administrative workflows.
                            </p>

                            <div className="space-y-4 md:space-y-6 text-left inline-block lg:block">
                                <FeatureItem title="Real-time Approvals" desc="Instant notifications and status updates for all applications." delay={0.1} />
                                <FeatureItem title="Role-Based Access Control" desc="Strict data security ensuring users only see what they need." delay={0.2} />
                                <FeatureItem title="Automated Analytics" desc="Visual insights into occupancy rates and administration performance." delay={0.3} />
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
                                <GlassCard icon={Zap} title="Fast & Reactive" delay={0.2} />
                                <GlassCard icon={LayoutDashboard} title="Modern Dashboard" delay={0.4} />
                            </div>
                            <div className="space-y-4">
                                <GlassCard icon={Shield} title="Secure Data" delay={0.3} />
                                <GlassCard icon={BarChart3} title="Smart Reports" delay={0.5} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="py-16 md:py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12 md:mb-20"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={itemVariants}
                    >
                        <h2 className="text-3xl font-bold text-white">Streamlined Workflow</h2>
                        <p className="text-slate-400 mt-4">How approvals flow through the system</p>
                    </motion.div>

                    <div className="relative">
                        {/* Connecting Lines with reveal animation */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent hidden lg:block -translate-y-1/2 origin-left"
                        ></motion.div>

                        <motion.div
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute top-0 left-8 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/10 via-indigo-500/30 to-indigo-500/10 lg:hidden block origin-top"
                        ></motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={containerVariants}
                            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
                        >
                            <WorkflowStep number="01" title="Registration" desc="Student creates profile & requests accommodation" role="Student" position="start" />
                            <WorkflowStep number="02" title="Verification" desc="Warden verifies details & available rooms" role="Warden" />
                            <WorkflowStep number="03" title="Approval" desc="Management reviews & grants final admission" role="Management" />
                            <WorkflowStep number="04" title="Oversight" desc="Owner monitors global stats & compliance" role="Owner" position="end" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Benefits / CTA */}
            <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-indigo-950/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

                <div className="max-w-5xl mx-auto px-4 text-center">
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={scaleIn}
                        className="text-3xl md:text-5xl font-bold text-white mb-6 md:mb-8"
                    >
                        Ready to modernize your institution?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-lg md:text-xl text-slate-400 mb-8 md:mb-10 max-w-2xl mx-auto"
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
                        className="w-full sm:w-auto px-10 py-4 bg-white text-indigo-900 rounded-lg font-bold text-xl hover:bg-slate-100 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                    >
                        {!user ? 'Login to Portal' : 'Go To Dashbaord'}
                    </motion.button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 border-t border-white/5 pt-12 md:pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="col-span-1 sm:col-span-2 md:col-span-1"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-12 h-12 bg-indigo-600 rounded-xl p-1.5 flex items-center justify-center border border-white/10"
                                >
                                    <div className="w-full h-full bg-white rounded-lg overflow-hidden flex items-center justify-center">
                                        <img src={AppLogo} alt="AppLogo" className="w-full h-full object-contain" />
                                    </div>
                                </motion.div>
                                <span className="text-2xl font-bold text-white tracking-tight uppercase">HOAS</span>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                                The standard for modern hostel administration. Built for security, designed for usability.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <h4 className="text-white font-semibold mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Owner Dashboard</li>
                                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Management Portal</li>
                                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Student App</li>
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <h4 className="text-white font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Documentation</li>
                                <li className="hover:text-indigo-400 cursor-pointer transition-colors">API Reference</li>
                                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Support</li>
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                        >
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Privacy Policy</li>
                                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Terms of Service</li>
                                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Compliance</li>
                            </ul>
                        </motion.div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                        <p className="text-slate-600 text-sm">© 2026 HOAS. All rights reserved.</p>
                        <div className="flex gap-4">
                            {/* Social placeholders */}
                            <motion.div whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"></motion.div>
                            <motion.div whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"></motion.div>
                            <motion.div whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"></motion.div>
                        </div>
                    </div>
                </div>
            </footer>
            {/* About App Modal */}
            {/* About App Modal */}
            <AnimatePresence>
                {isAboutOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setIsAboutOpen(false); setActiveTeamMember(null); }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: "-50%",
                                x: "-50%",
                                width: activeTeamMember ? "90%" : "90%",
                                maxWidth: activeTeamMember ? "900px" : "448px"
                            }}
                            exit={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            className="fixed top-1/2 left-1/2 z-[70] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row max-h-[85vh] w-[90%] md:w-auto overflow-hidden"
                        >
                            {/* Close Button - Moved to Main Container */}
                            <button
                                onClick={() => { setIsAboutOpen(false); setActiveTeamMember(null); }}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full transition-all z-50"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Main Info Section */}
                            <div className={`relative p-6 md:p-8 flex-shrink-0 w-full ${activeTeamMember ? 'md:w-1/2 border-b md:border-b-0 md:border-r border-white/10' : ''} overflow-y-auto custom-scrollbar max-h-[85vh]`}>

                                <div className="flex flex-col items-center text-center">
                                    <motion.div layoutId="app-logo" className="w-20 h-20 bg-indigo-600 rounded-2xl p-2 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-5">
                                        <div className="w-full h-full bg-white rounded-xl overflow-hidden flex items-center justify-center">
                                            <img src={AppLogo} alt="HOAS Logo" className="w-full h-full object-contain" />
                                        </div>
                                    </motion.div>

                                    <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">HOAS</h3>
                                    <p className="text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase mb-8">Hostel Operations Accountability System</p>

                                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">

                                        {/* Description Card */}
                                        <div className="col-span-1 sm:col-span-2 bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors group">
                                            <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 group-hover:text-indigo-400 transition-colors">System Overview</h4>
                                            <p className="text-slate-300 text-sm leading-relaxed">
                                                A comprehensive enterprise platform designed to streamline hostel management, ensuring transparency, automating approvals, and driving efficiency in accommodation processes.
                                            </p>
                                        </div>

                                        {/* Version Card */}
                                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Version</h4>
                                                <div className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">STABLE</div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xl font-mono font-bold text-white">v1.2.0</span>
                                                <span className="text-xs text-slate-500 mt-1">Build 2026.01.30</span>
                                            </div>
                                        </div>

                                        {/* Year Created Card */}
                                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Established</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
                                                    <LayoutDashboard className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className="block text-lg font-bold text-white">2026</span>
                                                    <span className="text-xs text-slate-500">Since Jan</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Organization Card */}
                                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Organization</h4>
                                            <div className="flex items-center gap-2 mb-1">
                                                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                                <span className="text-white font-semibold text-sm">Antigravity Inst.</span>
                                            </div>
                                            <p className="text-xs text-slate-500 pl-6">Enterprise License</p>
                                        </div>

                                        {/* Creator / Team Card */}
                                        <div className="col-span-1 sm:col-span-2 bg-white/5 rounded-2xl p-5 border border-white/5 transition-all">
                                            <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4">Developed By</h4>
                                            <div className="flex items-center justify-between">
                                                <span className="text-white font-medium text-sm">Admin Team</span>
                                                <div className="flex gap-3">
                                                    {['hq', 'it'].map((key) => (
                                                        <motion.button
                                                            key={key}
                                                            whileHover={{ scale: 1.1, y: -2 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setActiveTeamMember(activeTeamMember === key ? null : key)}
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 transition-all ${activeTeamMember === key ? 'border-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-110' : 'border-slate-800 opacity-80 hover:opacity-100'} bg-gradient-to-br ${teamData[key].gradient}`}
                                                        >
                                                            {teamData[key].initials}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="mt-8 flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                            <span>© 2026 HOAS</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span className="hover:text-indigo-400 cursor-pointer transition-colors">Privacy</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span className="hover:text-indigo-400 cursor-pointer transition-colors">Terms</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Panel */}
                            <AnimatePresence mode="popLayout">
                                {activeTeamMember && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="w-full md:w-1/2 bg-slate-900/50 backdrop-blur-xl p-8 pt-20 md:pt-16 flex flex-col justify-start relative overflow-y-auto custom-scrollbar max-h-[85vh]"
                                    >
                                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-slate-900/5 pointer-events-none" />

                                        <div className="relative z-10 flex flex-col h-full md:h-auto">
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${teamData[activeTeamMember].gradient} flex items-center justify-center shadow-2xl mb-6`}
                                            >
                                                <span className="text-3xl font-bold text-white tracking-widest">{teamData[activeTeamMember].initials}</span>
                                            </motion.div>

                                            <motion.h2
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="text-3xl font-bold text-white mb-2"
                                            >
                                                {teamData[activeTeamMember].name}
                                            </motion.h2>

                                            <motion.div
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.4 }}
                                                className="flex items-center gap-3 mb-6"
                                            >
                                                <span className="px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                                                    {teamData[activeTeamMember].role}
                                                </span>
                                                <span className="text-slate-500 text-sm flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    {teamData[activeTeamMember].location}
                                                </span>
                                            </motion.div>

                                            <motion.p
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                                className="text-slate-300 text-lg leading-relaxed mb-8"
                                            >
                                                {teamData[activeTeamMember].desc}
                                            </motion.p>

                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.6 }}
                                                className="flex gap-4"
                                            >
                                                <button className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg shadow-white/5 active:scale-95 duration-200">
                                                    View Profile
                                                </button>
                                                <button className="px-6 py-2.5 bg-white/5 text-white border border-white/10 rounded-xl font-medium text-sm hover:bg-white/10 transition-colors active:scale-95 duration-200">
                                                    Contact
                                                </button>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Sub Components ---

const RoleCard = ({ icon: Icon, role, desc, color }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
        }}
        whileHover={{ y: -10, transition: { duration: 0.3 } }}
        className="group relative p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors duration-300"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`} />
        <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-black/20 group-hover:shadow-indigo-500/20`}
        >
            <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </motion.div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{role}</h3>
        <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
    </motion.div>
);

const GlassCard = ({ icon: Icon, title, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay, duration: 0.5 }}
        whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        className="p-4 md:p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 md:gap-4 hover:bg-white/10 transition-colors cursor-default"
    >
        <div className="p-2 md:p-3 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <span className="font-semibold text-white text-sm md:text-base">{title}</span>
    </motion.div>
);

const FeatureItem = ({ title, desc, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay, duration: 0.5 }}
        className="flex gap-3 md:gap-4"
    >
        <div className="mt-1 shrink-0">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            </div>
        </div>
        <div>
            <h4 className="text-white font-bold mb-1">{title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);

const WorkflowStep = ({ number, title, desc, role, position }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", ease: "easeOut", duration: 0.8 } }
        }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="relative bg-slate-900 border border-white/10 p-6 rounded-2xl z-10 text-left lg:text-center pl-16 lg:pl-6"
    >
        <div className="absolute left-4 lg:relative lg:left-0 lg:mx-auto w-8 h-8 lg:w-12 lg:h-12 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 font-bold border border-white/10 mb-2 lg:mb-4 shadow-xl z-20">
            {number}
        </div>
        <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
        <div className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-indigo-300 mb-3">{role}</div>
        <p className="text-slate-400 text-sm">{desc}</p>
    </motion.div>
);

// Helper for icon import if needed, keeping it simple
const Shield = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

export default Home