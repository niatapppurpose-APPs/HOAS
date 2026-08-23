import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ArrowLeft,
    ShieldCheck,
    Zap,
    BadgeCheck,
    Layers,
    MapPin,
    Building2,
    BriefcaseBusiness,
    GraduationCap,
} from 'lucide-react';
import { teamData, APP_INFO } from '../constants';
import AppLogo from '../../../assets/AppLogo4k.webp';

const EASE = [0.22, 1, 0.36, 1];

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return isMobile;
};

const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (delay) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: EASE, delay },
    }),
};

const Section = ({ delay, children, className = '' }) => (
    <motion.div
        custom={delay}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className={className}
    >
        {children}
    </motion.div>
);

const PRODUCT_METRICS = [
    {
        icon: ShieldCheck,
        num: '01',
        title: 'Role-Based',
        desc: 'Scoped access for every user role.',
    },
    {
        icon: Zap,
        num: '02',
        title: 'Real-Time',
        desc: 'Live updates across every workflow.',
    },
    {
        icon: BadgeCheck,
        num: '03',
        title: 'Accountable',
        desc: 'Auditable actions end to end.',
    },
    {
        icon: Layers,
        num: '04',
        title: 'Centralized',
        desc: 'One platform for all operations.',
    },
];

const ROLE_SUMMARIES = [
    {
        icon: Building2,
        role: 'Owner',
        desc: 'Complete operational visibility and accountability.',
    },
    {
        icon: BriefcaseBusiness,
        role: 'Management',
        desc: 'Manage operations, users, finances, and reports.',
    },
    {
        icon: ShieldCheck,
        role: 'Warden',
        desc: 'Handle daily activities, complaints, leaves, and emergencies.',
    },
    {
        icon: GraduationCap,
        role: 'Student',
        desc: 'Access rooms, complaints, fees, leave, notices, and SOS.',
    },
];

const TEAM_LINKS = {
    faziya: 'https://www.linkedin.com/in/faziya-tasneem-shaik/',
    hemanth: 'https://www.linkedin.com/in/hemanth-atthuluri/',
};

const MEMBER_MAIL = {
    faziya: 'Contact - Frontend Developer (Shaik Faziya Tasneem)',
    hemanth: 'Contact - Backend Developer (Hemanth Atthuluri)',
};

const MAIL_TO = 'niatapppurpose@gmail.com';

const AboutDrawer = React.memo(({ isAboutOpen, setIsAboutOpen, isDark }) => {
    const [activeMember, setActiveMember] = React.useState(null);
    const isMobile = useIsMobile();

    const handleClose = () => setIsAboutOpen(false);
    const closeMember = () => setActiveMember(null);

    useEffect(() => {
        if (!isAboutOpen) return undefined;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (activeMember) closeMember();
                else handleClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [isAboutOpen, activeMember]);

    useEffect(() => {
        if (!isAboutOpen) setActiveMember(null);
    }, [isAboutOpen]);

    const palette = {
        bg: isDark ? '#070B17' : '#ffffff',
        bgPanel: isDark ? '#0B1020' : '#f8fafc',
        surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
        border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        borderStrong: isDark ? 'rgba(139,92,246,0.35)' : 'rgba(124,58,237,0.3)',
        text: isDark ? '#F8FAFC' : '#0f172a',
        textMuted: isDark ? '#94a3b8' : '#475569',
        accent: isDark ? '#8B5CF6' : '#7C3AED',
        accentSoft: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(124,58,237,0.08)',
    };

    return (
        <AnimatePresence>
            {isAboutOpen && (
                <>
                    {/* ── Backdrop ── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        onClick={handleClose}
                        aria-hidden="true"
                        className="fixed inset-0 z-[80]"
                        style={{
                            backgroundColor: 'rgba(2, 6, 23, 0.55)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                        }}
                    />

                    {/* ── Main drawer — right side on desktop, bottom sheet on mobile ── */}
                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label="About HOAS"
                        initial={isMobile ? { y: '100%' } : { x: '100%' }}
                        animate={isMobile ? { y: 0 } : { x: 0 }}
                        exit={isMobile ? { y: '100%' } : { x: '100%' }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className={`fixed z-[90] flex flex-col overflow-hidden ${
                            isMobile ? 'bottom-0 left-0 right-0 h-[92dvh]' : 'top-0 right-0 h-[100dvh]'
                        }`}
                        style={{
                            width: isMobile ? '100%' : 'min(560px, 94vw)',
                            backgroundColor: palette.bg,
                            borderLeft: isMobile ? 'none' : `1px solid ${palette.border}`,
                            borderTop: isMobile ? `1px solid ${palette.border}` : 'none',
                            borderRadius: isMobile ? '28px 28px 0 0' : '28px 0 0 28px',
                            boxShadow: isDark
                                ? '0 -32px 80px -20px rgba(0,0,0,0.7)'
                                : '0 -32px 80px -24px rgba(15,23,42,0.25)',
                        }}
                    >
                        {/* ── Header ── */}
                        <Section delay={0.05}>
                            <div
                                className="flex items-center justify-between px-6 md:px-8 pt-3 md:pt-6 pb-4"
                                style={{ borderBottom: `1px solid ${palette.border}` }}
                            >
                                {isMobile && (
                                    <span
                                        className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full pointer-events-none"
                                        style={{ backgroundColor: palette.textMuted, opacity: 0.35 }}
                                    />
                                )}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-11 h-11 rounded-xl p-1.5 flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: `linear-gradient(135deg, ${palette.accent}, #6D28D9)`,
                                            boxShadow: `0 8px 24px -8px ${palette.accent}`,
                                        }}
                                    >
                                        <div className="w-full h-full bg-white rounded-lg overflow-hidden flex items-center justify-center">
                                            <img src={AppLogo} alt="HOAS logo" className="w-full h-full object-contain" />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p
                                            className="text-sm font-bold tracking-tight leading-tight truncate"
                                            style={{ color: palette.text }}
                                        >
                                            About HOAS
                                        </p>
                                        <p className="text-xs truncate" style={{ color: palette.textMuted }}>
                                            Product information &amp; team
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={handleClose}
                                    whileHover={{ scale: 1.08, rotate: 90 }}
                                    whileTap={{ scale: 0.92 }}
                                    transition={{ duration: 0.2 }}
                                    aria-label="Close about"
                                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-md"
                                    style={{
                                        backgroundColor: palette.surface,
                                        border: `1px solid ${palette.border}`,
                                        color: palette.textMuted,
                                    }}
                                >
                                    <X size={17} />
                                </motion.button>
                            </div>
                        </Section>

                        {/* ── Scrollable content ── */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-6 space-y-8">
                            {/* ── Hero product section ── */}
                            <Section delay={0.1}>
                                <h2
                                    className="text-3xl font-black tracking-tight leading-tight mb-1"
                                    style={{ color: palette.text }}
                                >
                                    {APP_INFO.name}
                                </h2>
                                <p
                                    className="text-base font-semibold mb-3"
                                    style={{ color: palette.accent }}
                                >
                                    Hostel Operations
                                    <br />
                                    Accountability System
                                </p>
                                <span
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold mb-4"
                                    style={{
                                        backgroundColor: palette.accentSoft,
                                        color: palette.accent,
                                        border: `1px solid ${palette.borderStrong}`,
                                    }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                                        style={{ backgroundColor: palette.accent }}
                                    />
                                    Enterprise Hostel Management Platform
                                </span>
                                <p
                                    className="text-sm leading-relaxed max-w-md"
                                    style={{ color: palette.textMuted }}
                                >
                                    HOAS is a role-based hostel operations platform designed to
                                    centralize accommodation, complaints, fees, leave management,
                                    emergency response, and communication into one accountable
                                    digital workflow.
                                </p>
                            </Section>

                            {/* ── Product metrics ── */}
                            <Section delay={0.15}>
                                <div className="grid grid-cols-2 gap-3">
                                    {PRODUCT_METRICS.map(({ icon: Icon, num, title, desc }) => (
                                        <motion.div
                                            key={num}
                                            whileHover={{ y: -3 }}
                                            transition={{ duration: 0.25, ease: EASE }}
                                            className="rounded-2xl p-4 backdrop-blur-md group"
                                            style={{
                                                backgroundColor: palette.surface,
                                                border: `1px solid ${palette.border}`,
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2.5">
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-violet-500"
                                                    style={{
                                                        backgroundColor: palette.accentSoft,
                                                        color: palette.accent,
                                                    }}
                                                >
                                                    <Icon size={15} />
                                                </div>
                                                <span
                                                    className="text-[10px] font-mono font-bold"
                                                    style={{ color: palette.textMuted, opacity: 0.6 }}
                                                >
                                                    {num}
                                                </span>
                                            </div>
                                            <p
                                                className="text-sm font-bold mb-0.5"
                                                style={{ color: palette.text }}
                                            >
                                                {title}
                                            </p>
                                            <p
                                                className="text-xs leading-snug"
                                                style={{ color: palette.textMuted }}
                                            >
                                                {desc}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </Section>

                            {/* ── Built for every role ── */}
                            <Section delay={0.2}>
                                <h4
                                    className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3"
                                    style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                                >
                                    Built for Every Role
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {ROLE_SUMMARIES.map(({ icon: Icon, role, desc }) => (
                                        <motion.div
                                            key={role}
                                            whileHover={{ y: -3 }}
                                            transition={{ duration: 0.25, ease: EASE }}
                                            className="rounded-2xl p-4 backdrop-blur-md flex items-start gap-3"
                                            style={{
                                                backgroundColor: palette.surface,
                                                border: `1px solid ${palette.border}`,
                                            }}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 hover:bg-violet-500 hover:text-white"
                                                style={{
                                                    backgroundColor: palette.accentSoft,
                                                    color: palette.accent,
                                                }}
                                            >
                                                <Icon size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p
                                                    className="text-[11px] font-black uppercase tracking-wider mb-0.5"
                                                    style={{ color: palette.text }}
                                                >
                                                    {role}
                                                </p>
                                                <p
                                                    className="text-xs leading-snug"
                                                    style={{ color: palette.textMuted }}
                                                >
                                                    {desc}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </Section>

                            {/* ── Development team ── */}
                            <Section delay={0.25}>
                                <h4
                                    className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3"
                                    style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                                >
                                    The Team Behind HOAS
                                </h4>
                                <div className="space-y-3">
                                    {Object.entries(teamData).map(([key, member]) => (
                                        <motion.button
                                            key={key}
                                            onClick={() => setActiveMember(key)}
                                            whileHover={{ y: -3 }}
                                            whileTap={{ scale: 0.98 }}
                                            transition={{ duration: 0.25, ease: EASE }}
                                            aria-label={`View ${member.name} profile`}
                                            className="w-full text-left flex items-center gap-4 rounded-2xl p-3.5 backdrop-blur-md group transition-colors duration-300 cursor-pointer"
                                            style={{
                                                backgroundColor:
                                                    activeMember === key
                                                        ? palette.accentSoft
                                                        : palette.surface,
                                                border: `1px solid ${
                                                    activeMember === key
                                                        ? palette.borderStrong
                                                        : palette.border
                                                }`,
                                            }}
                                        >
                                            <div
                                                className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-gradient-to-br ring-1 ring-violet-500/40 ${member.gradient}`}
                                            >
                                                {member.image ? (
                                                    <img
                                                        src={member.image}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-bold text-white">
                                                        {member.initials}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="text-sm font-bold truncate"
                                                    style={{ color: palette.text }}
                                                >
                                                    {member.name}
                                                </p>
                                                <p
                                                    className="text-[11px] font-semibold uppercase tracking-wider mt-0.5"
                                                    style={{ color: palette.accent }}
                                                >
                                                    {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                                                </p>
                                            </div>
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: palette.accentSoft,
                                                    color: palette.accent,
                                                }}
                                            >
                                                View
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </Section>

                            {/* ── Release info ── */}
                            <Section delay={0.3}>
                                <h4
                                    className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3"
                                    style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                                >
                                    Release
                                </h4>
                                <div
                                    className="rounded-2xl p-4 grid grid-cols-2 gap-x-4 gap-y-3 backdrop-blur-md"
                                    style={{
                                        backgroundColor: palette.surface,
                                        border: `1px solid ${palette.border}`,
                                    }}
                                >
                                    <div>
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                                            style={{ color: palette.textMuted }}
                                        >
                                            Current Version
                                        </p>
                                        <p
                                            className="text-sm font-mono font-bold"
                                            style={{ color: palette.text }}
                                        >
                                            {APP_INFO.version}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                            style={{ color: palette.textMuted }}
                                        >
                                            Status
                                        </p>
                                        <span
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                            style={{
                                                backgroundColor: isDark
                                                    ? 'rgba(16,185,129,0.15)'
                                                    : 'rgba(16,185,129,0.12)',
                                                color: isDark ? '#34D399' : '#059669',
                                            }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Stable
                                        </span>
                                    </div>
                                    <div>
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                                            style={{ color: palette.textMuted }}
                                        >
                                            Build
                                        </p>
                                        <p
                                            className="text-sm font-mono font-bold"
                                            style={{ color: palette.text }}
                                        >
                                            {APP_INFO.build.replace('Build ', '')}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                                            style={{ color: palette.textMuted }}
                                        >
                                            Established
                                        </p>
                                        <p
                                            className="text-sm font-bold"
                                            style={{ color: palette.text }}
                                        >
                                            {APP_INFO.established}
                                        </p>
                                    </div>
                                </div>
                            </Section>

                            {/* ── Footer ── */}
                            <Section delay={0.35}>
                                <div
                                    className="pt-5 pb-2 text-center"
                                    style={{ borderTop: `1px solid ${palette.border}` }}
                                >
                                    <p
                                        className="text-sm font-bold tracking-tight"
                                        style={{ color: palette.text }}
                                    >
                                        {APP_INFO.name}
                                    </p>
                                    <p
                                        className="text-[11px] mt-0.5"
                                        style={{ color: palette.textMuted }}
                                    >
                                        {APP_INFO.fullName}
                                    </p>
                                    <div
                                        className="flex items-center justify-center gap-2 mt-3 text-[11px]"
                                        style={{ color: palette.textMuted }}
                                    >
                                        <span>© {APP_INFO.established} {APP_INFO.name}</span>
                                        <span
                                            className="w-1 h-1 rounded-full"
                                            style={{ backgroundColor: palette.textMuted, opacity: 0.5 }}
                                        />
                                        <button type="button" className="hover:text-violet-400 transition-colors">
                                            Privacy
                                        </button>
                                        <span
                                            className="w-1 h-1 rounded-full"
                                            style={{ backgroundColor: palette.textMuted, opacity: 0.5 }}
                                        />
                                        <button type="button" className="hover:text-violet-400 transition-colors">
                                            Terms
                                        </button>
                                    </div>
                                </div>
                            </Section>
                        </div>
                    </motion.aside>

                    {/* ── Member profile drawer (separate right bar) ── */}
                    <AnimatePresence>
                        {activeMember && teamData[activeMember] && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                    onClick={closeMember}
                                    aria-hidden="true"
                                    className="fixed inset-0 z-[95]"
                                    style={{ backgroundColor: 'rgba(2, 6, 23, 0.45)' }}
                                />
                                <motion.aside
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label={`${teamData[activeMember].name} profile`}
                                    initial={isMobile ? { y: '100%' } : { x: '100%' }}
                                    animate={isMobile ? { y: 0 } : { x: 0 }}
                                    exit={isMobile ? { y: '100%' } : { x: '100%' }}
                                    transition={{ duration: 0.4, ease: EASE }}
                                    className={`fixed z-[96] flex flex-col overflow-hidden ${
                                        isMobile
                                            ? 'bottom-0 left-0 right-0 h-[88dvh]'
                                            : 'top-0 right-0 h-[100dvh]'
                                    }`}
                                    style={{
                                        width: isMobile ? '100%' : 'min(420px, 92vw)',
                                        backgroundColor: palette.bgPanel,
                                        borderLeft: isMobile ? 'none' : `1px solid ${palette.border}`,
                                        borderTop: isMobile ? `1px solid ${palette.border}` : 'none',
                                        borderRadius: isMobile ? '28px 28px 0 0' : '28px 0 0 28px',
                                        boxShadow: isDark
                                            ? '0 -32px 80px -20px rgba(0,0,0,0.8)'
                                            : '0 -32px 80px -24px rgba(15,23,42,0.3)',
                                    }}
                                >
                                    {/* Profile header */}
                                    <div
                                        className="relative px-6 pt-8 md:pt-6 pb-6"
                                        style={{
                                            background: `linear-gradient(160deg, ${palette.accentSoft}, transparent 70%)`,
                                            borderBottom: `1px solid ${palette.border}`,
                                        }}
                                    >
                                        {isMobile && (
                                            <span
                                                className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full pointer-events-none"
                                                style={{ backgroundColor: palette.textMuted, opacity: 0.35 }}
                                            />
                                        )}
                                        <motion.button
                                            onClick={closeMember}
                                            whileHover={{ scale: 1.08, x: -2 }}
                                            whileTap={{ scale: 0.92 }}
                                            transition={{ duration: 0.2 }}
                                            aria-label="Back to about"
                                            className="absolute top-5 left-6 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
                                            style={{
                                                backgroundColor: palette.surface,
                                                border: `1px solid ${palette.border}`,
                                                color: palette.textMuted,
                                            }}
                                        >
                                            <ArrowLeft size={17} />
                                        </motion.button>
                                        <motion.button
                                            onClick={closeMember}
                                            whileHover={{ scale: 1.08, rotate: 90 }}
                                            whileTap={{ scale: 0.92 }}
                                            transition={{ duration: 0.2 }}
                                            aria-label={`Close ${teamData[activeMember].name} profile`}
                                            className="absolute top-5 right-6 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
                                            style={{
                                                backgroundColor: palette.surface,
                                                border: `1px solid ${palette.border}`,
                                                color: palette.textMuted,
                                            }}
                                        >
                                            <X size={17} />
                                        </motion.button>

                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.92 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
                                            className="flex flex-col items-center text-center mt-8"
                                        >
                                            <div
                                                className={`w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br shadow-xl mb-4 ring-2 ring-violet-500/60 ${teamData[activeMember].gradient}`}
                                                style={{
                                                    boxShadow: `0 16px 40px -12px ${palette.accent}`,
                                                }}
                                            >
                                                {teamData[activeMember].image ? (
                                                    <img
                                                        src={teamData[activeMember].image}
                                                        alt={teamData[activeMember].name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-bold text-white">
                                                        {teamData[activeMember].initials}
                                                    </span>
                                                )}
                                            </div>
                                            <h3
                                                className="text-xl font-black tracking-tight"
                                                style={{ color: palette.text }}
                                            >
                                                {teamData[activeMember].name}
                                            </h3>
                                            <span
                                                className="mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em]"
                                                style={{
                                                    backgroundColor: palette.accentSoft,
                                                    color: palette.accent,
                                                    border: `1px solid ${palette.borderStrong}`,
                                                }}
                                            >
                                                {teamData[activeMember].role}
                                            </span>
                                            <span
                                                className="mt-3 inline-flex items-center gap-1.5 text-xs"
                                                style={{ color: palette.textMuted }}
                                            >
                                                <MapPin size={13} />
                                                {teamData[activeMember].location}
                                            </span>
                                        </motion.div>
                                    </div>

                                    {/* Profile body */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, ease: EASE, delay: 0.15 }}
                                        className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6"
                                    >
                                        <div>
                                            <h4
                                                className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2"
                                                style={{ color: palette.textMuted }}
                                            >
                                                About
                                            </h4>
                                            <p
                                                className="text-sm leading-relaxed"
                                                style={{ color: palette.text }}
                                            >
                                                {teamData[activeMember].desc}
                                            </p>
                                        </div>

                                        {/* Highlighted social accounts */}
                                        <div>
                                            <h4
                                                className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3"
                                                style={{ color: palette.textMuted }}
                                            >
                                                Connect
                                            </h4>
                                            <div className="space-y-2.5">
                                                {(teamData[activeMember].socials || [])
                                                    .filter((s) => s.href)
                                                    .map(({ icon: Icon, href, label }) => (
                                                        <motion.a
                                                            key={label}
                                                            href={href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            whileHover={{ x: 4 }}
                                                            transition={{ duration: 0.2, ease: EASE }}
                                                            className="flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md group transition-colors duration-300"
                                                            style={{
                                                                backgroundColor: palette.surface,
                                                                border: `1px solid ${palette.border}`,
                                                                color: palette.text,
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor =
                                                                    palette.borderStrong;
                                                                e.currentTarget.style.backgroundColor =
                                                                    palette.accentSoft;
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor =
                                                                    palette.border;
                                                                e.currentTarget.style.backgroundColor =
                                                                    palette.surface;
                                                            }}
                                                        >
                                                            <span
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 group-hover:bg-violet-500 group-hover:text-white"
                                                                style={{
                                                                    backgroundColor: palette.accentSoft,
                                                                    color: palette.accent,
                                                                }}
                                                            >
                                                                <Icon size={15} />
                                                            </span>
                                                            <span className="text-sm font-semibold flex-1">
                                                                {label}
                                                            </span>
                                                            <ChevronRightSmall />
                                                        </motion.a>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Contact actions */}
                                        <div className="flex gap-3 pt-1">
                                            <a
                                                href={TEAM_LINKS[activeMember] || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg"
                                                style={{
                                                    background: `linear-gradient(135deg, ${palette.accent}, #6D28D9)`,
                                                    boxShadow: `0 10px 28px -10px ${palette.accent}`,
                                                }}
                                            >
                                                View Profile
                                            </a>
                                            <a
                                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${MAIL_TO}&su=${encodeURIComponent(MEMBER_MAIL[activeMember] || 'Contact')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-sm text-center transition-colors hover:text-violet-400"
                                                style={{
                                                    backgroundColor: palette.surface,
                                                    border: `1px solid ${palette.border}`,
                                                    color: palette.text,
                                                }}
                                            >
                                                Contact
                                            </a>
                                        </div>
                                    </motion.div>
                                </motion.aside>
                            </>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
});

const ChevronRightSmall = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.35 }}
        aria-hidden="true"
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);

AboutDrawer.displayName = 'AboutDrawer';

export default AboutDrawer;
