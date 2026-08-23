import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

// ── RoleCard — premium SaaS style, click opens detail drawer ──
export const RoleCard = React.memo(({ icon: Icon, title, color, bullets = [], isDark = true, onSelect }) => (
    <motion.button
        type="button"
        onClick={() => onSelect?.()}
        variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } },
        }}
        whileHover={{ y: -10, transition: { duration: 0.25 } }}
        whileTap={{ scale: 0.98 }}
        className="group relative p-6 md:p-7 rounded-2xl border backdrop-blur-sm hover:shadow-xl transition-shadow duration-300 text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
            boxShadow: isDark ? 'none' : '0 4px 24px -8px rgba(15,23,42,0.08)',
        }}
    >
        {/* Gradient top accent */}
        <div
            className="absolute inset-x-0 top-0 h-1 rounded-t-2xl opacity-80 group-hover:opacity-100 transition-opacity"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }}
        />

        <motion.div
            whileHover={{ scale: 1.08, rotate: -3 }}
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
            style={{
                background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                boxShadow: `0 10px 24px -8px ${color}66`,
            }}
        >
            <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
        </motion.div>

        <h3 className="text-lg md:text-xl font-black tracking-tight mb-4" style={{ color }}>{title}</h3>

        <ul className="space-y-2.5 mb-6">
            {bullets.map((b) => (
                <li key={b} className="flex items-start justify-center gap-2 text-sm leading-snug" style={{ color: isDark ? '#CBD5E1' : '#334155' }}>
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color }} />
                    <span className="text-left">{b}</span>
                </li>
            ))}
        </ul>

        <span
            className="inline-flex items-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all duration-300"
            style={{ color }}
        >
            View details <span aria-hidden>→</span>
        </span>
    </motion.button>
));

RoleCard.displayName = 'RoleCard';

// ── GlassCard (kept for compatibility) ───────────────────────
export const GlassCard = React.memo(({ icon: Icon, title, delay, isDark = true }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        className="p-4 md:p-6 rounded-xl border backdrop-blur-md flex items-center gap-3 md:gap-4 transition-colors cursor-default"
        style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.15)',
            boxShadow: isDark ? 'none' : '0 4px 20px -5px rgba(0, 0, 0, 0.08)',
        }}
    >
        <div className="p-2 md:p-3 rounded-lg shrink-0"
            style={{
                backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.15)',
                color: isDark ? '#a78bfa' : '#7c3aed',
            }}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <span className="font-semibold text-sm md:text-base"
            style={{ color: isDark ? '#ffffff' : '#0f172a' }}>{title}</span>
    </motion.div>
));

GlassCard.displayName = 'GlassCard';

// ── FeatureItem (kept for compatibility) ─────────────────────
export const FeatureItem = React.memo(({ title, desc, delay, isDark = true }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="flex gap-3 md:gap-4"
    >
        <div className="mt-1 shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: isDark ? '#a78bfa' : '#7c3aed' }} />
            </div>
        </div>
        <div>
            <h4 className="font-bold mb-1"
                style={{ color: isDark ? '#ffffff' : '#0f172a' }}>{title}</h4>
            <p className="text-sm leading-relaxed"
                style={{ color: isDark ? '#64748b' : '#475569' }}>{desc}</p>
        </div>
    </motion.div>
));

FeatureItem.displayName = 'FeatureItem';

// ── Shield SVG icon ──────────────────────────────────────────
export const Shield = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);
