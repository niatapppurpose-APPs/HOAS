import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, LayoutDashboard, Info } from 'lucide-react';
import { teamData } from '../constants';
import AppLogo from '../../../assets/AppLogo4k.png';

const AboutModal = React.memo(({ isAboutOpen, setIsAboutOpen, isDark }) => {
    const [activeTeamMember, setActiveTeamMember] = useState(null);

    const handleClose = () => {
        setIsAboutOpen(false);
        setActiveTeamMember(null);
    };

    return (
        <AnimatePresence>
            {isAboutOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: '-50%',
                            x: '-50%',
                            width: activeTeamMember ? '90%' : '90%',
                            maxWidth: activeTeamMember ? '900px' : '448px',
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        className="fixed top-1/2 left-1/2 z-[70] border rounded-3xl shadow-2xl flex flex-col md:flex-row max-h-[85vh] w-[90%] md:w-auto overflow-hidden"
                        style={{
                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-full transition-all z-50"
                            style={{
                                color: isDark ? '#94a3b8' : '#64748b',
                                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                            }}
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

                                <h3 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>HOAS</h3>
                                <p className="text-xs font-bold tracking-[0.2em] uppercase mb-8" style={{ color: isDark ? '#818cf8' : '#4f46e5' }}>
                                    Hostel Operations Accountability System
                                </p>

                                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                    {/* Description Card */}
                                    <div className="col-span-1 sm:col-span-2 rounded-2xl p-5 border hover:bg-opacity-80 transition-colors group"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
                                        }}>
                                        <h4 className="text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-indigo-400 transition-colors" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>System Overview</h4>
                                        <p className="text-sm leading-relaxed" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                                            A comprehensive enterprise platform designed to streamline hostel management, ensuring transparency, automating approvals, and driving efficiency in accommodation processes.
                                        </p>
                                    </div>

                                    {/* Version Card */}
                                    <div className="rounded-2xl p-5 border hover:bg-opacity-80 transition-colors"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
                                        }}>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Version</h4>
                                            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                                                    color: isDark ? '#a5b4fc' : '#4338ca',
                                                    border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.3)',
                                                }}>STABLE</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xl font-mono font-bold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>v1.2.0</span>
                                            <span className="text-xs mt-1" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Build 2026.01.30</span>
                                        </div>
                                    </div>

                                    {/* Year Created Card */}
                                    <div className="rounded-2xl p-5 border hover:bg-opacity-80 transition-colors"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
                                        }}>
                                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Established</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: isDark ? '#cbd5e1' : '#475569' }}>
                                                <LayoutDashboard className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="block text-lg font-bold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>2026</span>
                                                <span className="text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Since Jan</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Organization Card */}
                                    <div className="rounded-2xl p-5 border hover:bg-opacity-80 transition-colors"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
                                        }}>
                                        <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Organization</h4>
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                            <span className="font-semibold text-sm" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Antigravity Inst.</span>
                                        </div>
                                        <p className="text-xs pl-6" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Enterprise License</p>
                                    </div>

                                    {/* Creator / Team Card */}
                                    <div className="col-span-1 sm:col-span-2 rounded-2xl p-5 border transition-all"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
                                        }}>
                                        <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Developed By</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Admin Team</span>
                                            <div className="flex gap-3">
                                                {['faziya', 'hemanth'].map((key) => (
                                                    <motion.button
                                                        key={key}
                                                        whileHover={{ scale: 1.1, y: -2 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setActiveTeamMember(activeTeamMember === key ? null : key)}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 transition-all overflow-hidden ${activeTeamMember === key
                                                            ? isDark
                                                                ? 'border-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-110'
                                                                : 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white scale-110'
                                                            : isDark
                                                                ? 'border-slate-800 opacity-80 hover:opacity-100'
                                                                : 'border-slate-300 opacity-80 hover:opacity-100'
                                                            }`}
                                                    >
                                                        {teamData[key].image ? (
                                                            <img src={teamData[key].image} alt={teamData[key].name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${teamData[key].gradient}`}>{teamData[key].initials}</span>
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                                        <span>© 2026 HOAS</span>
                                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: isDark ? '#475569' : '#cbd5e1' }}></span>
                                        <span className="hover:text-indigo-400 cursor-pointer transition-colors">Privacy</span>
                                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: isDark ? '#475569' : '#cbd5e1' }}></span>
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
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    className="w-full md:w-1/2 backdrop-blur-xl p-8 pt-20 md:pt-16 flex flex-col justify-start relative overflow-y-auto custom-scrollbar max-h-[85vh]"
                                    style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.95)' }}
                                >
                                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-slate-900/5 pointer-events-none" />

                                    <div className="relative z-10 flex flex-col h-full md:h-auto">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${teamData[activeTeamMember].gradient} flex items-center justify-center shadow-2xl mb-6 overflow-hidden`}
                                        >
                                            {teamData[activeTeamMember].image ? (
                                                <img src={teamData[activeTeamMember].image} alt={teamData[activeTeamMember].name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-bold text-white tracking-widest">{teamData[activeTeamMember].initials}</span>
                                            )}
                                        </motion.div>

                                        <motion.h2
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-3xl font-bold mb-2"
                                            style={{ color: isDark ? '#ffffff' : '#0f172a' }}
                                        >
                                            {teamData[activeTeamMember].name}
                                        </motion.h2>

                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="flex items-center gap-3 mb-6"
                                        >
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.12)',
                                                    color: isDark ? '#a5b4fc' : '#4338ca',
                                                }}>
                                                {teamData[activeTeamMember].role}
                                            </span>
                                            <span className="text-sm flex items-center gap-1" style={{ color: isDark ? '#64748b' : '#64748b' }}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                {teamData[activeTeamMember].location}
                                            </span>
                                        </motion.div>

                                        <motion.p
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="text-lg leading-relaxed mb-8"
                                            style={{ color: isDark ? '#cbd5e1' : '#475569' }}
                                        >
                                            {teamData[activeTeamMember].desc}
                                        </motion.p>

                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                            className="flex gap-4"
                                        >
                                            <button className="px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg active:scale-95 duration-200"
                                                style={{
                                                    backgroundColor: isDark ? '#ffffff' : '#4f46e5',
                                                    color: isDark ? '#0f172a' : '#ffffff',
                                                    boxShadow: isDark ? '0 10px 15px -3px rgba(255,255,255,0.05)' : '0 10px 15px -3px rgba(79,70,229,0.2)',
                                                }}
                                                onClick={() => {
                                                    if (activeTeamMember === 'faziya') {
                                                        window.open('https://www.linkedin.com/in/faziya-tasneem-shaik/', '_blank');
                                                    } else if (activeTeamMember === 'hemanth') {
                                                        window.open('https://www.linkedin.com/in/hemanth-atthuluri/', '_blank');
                                                    }
                                                }}>
                                                View Profile
                                            </button>
                                            <a
                                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=niatapppurpose@gmail.com&su=${encodeURIComponent(activeTeamMember === 'faziya' ? 'Contact - Frontend Developer (Shaik Faziya Tasneem)' : 'Contact - Backend Developer (Hemanth Atthuluri)')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-2.5 border rounded-xl font-medium text-sm transition-colors active:scale-95 duration-200 text-center"
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(79,70,229,0.08)',
                                                    color: isDark ? '#ffffff' : '#4f46e5',
                                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(79,70,229,0.25)',
                                                }}
                                            >
                                                Contact
                                            </a>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});

AboutModal.displayName = 'AboutModal';

export default AboutModal;
