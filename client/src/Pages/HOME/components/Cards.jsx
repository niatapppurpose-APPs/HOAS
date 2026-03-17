import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

// ── RoleCard ─────────────────────────────────────────────────
export const RoleCard = React.memo(({ icon: Icon, role, desc, color, isDark = true }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } },
        }}
        whileHover={{ y: -10, transition: { duration: 0.3 } }}
        className="group relative p-6 md:p-8 rounded-2xl border transition-colors duration-300"
        style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(124, 58, 237, 0.15)',
            boxShadow: isDark ? 'none' : '0 4px 20px -5px rgba(0, 0, 0, 0.08)',
        }}
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`} />
        <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 md:mb-6 shadow-lg group-hover:shadow-violet-500/20`}
            style={{ boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
        >
            <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </motion.div>
        <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3"
            style={{ color: isDark ? '#ffffff' : '#0f172a' }}>{role}</h3>
        <p className="leading-relaxed text-sm"
            style={{ color: isDark ? '#94a3b8' : '#475569' }}>{desc}</p>
    </motion.div>
));

RoleCard.displayName = 'RoleCard';

// ── GlassCard ────────────────────────────────────────────────
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

// ── FeatureItem ──────────────────────────────────────────────
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
                    border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)',
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
