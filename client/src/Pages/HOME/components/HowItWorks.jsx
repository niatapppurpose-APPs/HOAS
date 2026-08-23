import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Settings2, ClipboardList, LineChart } from 'lucide-react';
import { WORKFLOW_STEPS, TECH_STACK, containerVariants, itemVariants } from '../constants';

const STEP_ICONS = [UserPlus, Settings2, ClipboardList, LineChart];

export const WorkflowSteps = ({ isDark }) => {
    const card = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
    const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
    const muted = isDark ? '#94A3B8' : '#64748B';

    return (
        <div className="rounded-3xl border p-6 md:p-8 backdrop-blur-sm h-full" style={{ backgroundColor: card, borderColor: border }}>
            <h3 className="text-xl md:text-2xl font-black tracking-tight mb-1" style={{ color: isDark ? '#fff' : '#0f172a' }}>How HOAS Works</h3>
            <p className="text-sm mb-8" style={{ color: muted }}>A simple workflow for complex operations.</p>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={containerVariants}
                className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-x-4 sm:gap-y-8"
            >
                {/* Connector line (desktop) */}
                <div className="hidden lg:block absolute top-[26px] left-[12%] right-[12%] border-t-2 border-dashed" style={{ borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.15)' }} />

                {WORKFLOW_STEPS.map(({ step, title, desc, color }, i) => {
                    const Icon = STEP_ICONS[i];
                    return (
                        <motion.div key={step} variants={itemVariants} className="relative flex items-start gap-4 sm:block sm:text-center">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="relative z-10 w-[52px] h-[52px] shrink-0 rounded-2xl flex items-center justify-center sm:mx-auto sm:mb-4"
                                style={{ backgroundColor: `${color}1a`, border: `2px solid ${color}50` }}
                            >
                                <Icon size={22} style={{ color }} />
                            </motion.div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>{step}</p>
                                <p className="font-bold text-sm mb-1" style={{ color: isDark ? '#fff' : '#0f172a' }}>{title}</p>
                                <p className="text-xs leading-relaxed sm:px-1" style={{ color: muted }}>{desc}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export const TechStack = ({ isDark }) => {
    const card = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
    const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
    const muted = isDark ? '#94A3B8' : '#64748B';

    const logoColor = ({ tint, mono }) => {
        if (!mono) return tint.replace('#', '');
        return isDark ? 'FFFFFF' : '334155';
    };

    return (
        <div className="rounded-3xl border p-6 md:p-8 backdrop-blur-sm h-full" style={{ backgroundColor: card, borderColor: border }}>
            <h3 className="text-xl md:text-2xl font-black tracking-tight mb-1" style={{ color: isDark ? '#fff' : '#0f172a' }}>Built with Modern Technology</h3>
            <p className="text-sm mb-8" style={{ color: muted }}>Secure, scalable and future-ready.</p>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={containerVariants}
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
                {TECH_STACK.map(({ name, slug, tint, mono }) => (
                    <motion.div
                        key={name}
                        variants={itemVariants}
                        whileHover={{ y: -5, rotate: -1.5, boxShadow: `0 12px 30px -10px ${tint === '#FFFFFF' ? (isDark ? '#FFFFFF' : '#94A3B8') : tint}66` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="flex items-center gap-2.5 rounded-xl border px-3 py-3 cursor-default"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFC', borderColor: border }}
                    >
                        <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                                backgroundColor: `${tint === '#FFFFFF' ? (isDark ? '#FFFFFF' : '#94A3B8') : tint}22`,
                                border: `1.5px solid ${tint === '#FFFFFF' ? (isDark ? '#FFFFFF' : '#94A3B8') : tint}55`,
                            }}
                        >
                            <img
                                src={`https://cdn.simpleicons.org/${slug}/${logoColor({ tint, mono })}`}
                                alt={`${name} logo`}
                                loading="lazy"
                                className="w-4.5 h-4.5"
                                style={{ width: '18px', height: '18px' }}
                            />
                        </span>
                        <span className="text-xs font-bold truncate" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>{name}</span>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};
