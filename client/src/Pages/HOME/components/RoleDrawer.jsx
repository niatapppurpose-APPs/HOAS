import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

// Abstract dashboard preview skeleton, tinted per role
const PreviewCard = ({ color, stats, isDark }) => {
    const base = isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC';
    const line = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)';

    return (
        <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: line }}
        >
            {/* Window chrome */}
            <div className="flex items-center gap-1 px-3 py-2 border-b" style={{ borderColor: line }}>
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{stats[0]} · Live</span>
            </div>
            <div className="p-3 space-y-2.5">
                {/* Stat chips */}
                <div className="grid grid-cols-3 gap-2">
                    {stats.map((s) => (
                        <div key={s} className="rounded-lg p-2 border" style={{ backgroundColor: base, borderColor: line }}>
                            <p className="text-[8px] font-bold truncate" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>{s}</p>
                            <div className="h-2 w-8 rounded mt-1" style={{ backgroundColor: `${color}55` }} />
                        </div>
                    ))}
                </div>
                {/* Chart bars */}
                <div className="rounded-lg p-2.5 flex items-end gap-1.5 h-16 border" style={{ backgroundColor: base, borderColor: line }}>
                    {[35, 55, 42, 70, 58, 88, 64].map((h, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: 0.3 + i * 0.07, duration: 0.5, ease: 'easeOut' }}
                            className="flex-1 rounded-t"
                            style={{ backgroundColor: i % 2 ? `${color}66` : color }}
                        />
                    ))}
                </div>
                {/* List rows */}
                {[80, 62].map((w, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5 border" style={{ backgroundColor: base, borderColor: line }}>
                        <span className="w-4 h-4 rounded-md shrink-0" style={{ backgroundColor: `${color}44` }} />
                        <span className="h-1.5 rounded" style={{ width: `${w * 0.55}%`, backgroundColor: line }} />
                        <span className="ml-auto h-1.5 w-6 rounded" style={{ backgroundColor: `${color}33` }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const RoleDrawer = ({ role, onClose, isDark, onCTA }) => {
    // Close on Escape + lock body scroll while open
    useEffect(() => {
        if (!role) return;
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = 'unset';
        };
    }, [role, onClose]);

    const panelBg = isDark ? '#12121C' : '#ffffff';
    const muted = isDark ? '#94A3B8' : '#64748B';
    const heading = isDark ? '#F8FAFC' : '#0F172A';

    return (
        <AnimatePresence>
            {role && (
                <div className="fixed inset-0 z-[60]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                        className="absolute right-0 top-0 h-full w-full max-w-md shadow-2xl flex flex-col"
                        style={{ backgroundColor: panelBg }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${role.title} details`}
                    >
                        {/* Header banner */}
                        <div
                            className="relative px-6 pt-7 pb-6 text-white overflow-hidden shrink-0"
                            style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}B3)` }}
                        >
                            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
                                aria-label="Close panel"
                            >
                                <X size={17} />
                            </button>
                            <motion.span
                                initial={{ scale: 0.6, rotate: -8 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                                className="inline-flex w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center mb-4 border border-white/30"
                            >
                                {React.createElement(role.icon, { size: 26 })}
                            </motion.span>
                            <h3 className="text-2xl font-black tracking-tight">{role.title} Dashboard</h3>
                            <p className="text-sm text-white/85 font-medium mt-1">{role.tagline}</p>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
                            {/* Preview */}
                            <section>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: role.color }}>
                                    Dashboard preview
                                </p>
                                <PreviewCard color={role.color} stats={role.previewStats} isDark={isDark} />
                            </section>

                            {/* Abilities */}
                            <section>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: role.color }}>
                                    What it does
                                </p>
                                <ul className="space-y-3">
                                    {role.abilities.map((a) => (
                                        <li key={a} className="flex items-start gap-2.5 text-sm leading-snug" style={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                                            <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: role.color }} />
                                            {a}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* CTA */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => { onClose(); onCTA?.(); }}
                                className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg"
                                style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}CC)`, boxShadow: `0 12px 28px -10px ${role.color}77` }}
                            >
                                Go to {role.title} Dashboard →
                            </motion.button>
                        </div>
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
};

export default React.memo(RoleDrawer);
