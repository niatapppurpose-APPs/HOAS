import React from 'react';
import { motion } from 'framer-motion';
import {
    BedDouble, Users, AlertTriangle, UserCheck,
    Bell, Wrench, BarChart3, ShieldCheck,
} from 'lucide-react';
import { FEATURE_CARDS, containerVariants, itemVariants } from '../constants';

const ICONS = [BedDouble, Users, AlertTriangle, UserCheck, Bell, Wrench, BarChart3, ShieldCheck];

const FeaturesGrid = ({ isDark }) => {
    const card = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
    const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
    const muted = isDark ? '#94A3B8' : '#64748B';

    return (
        <section id="features" className="relative py-16 md:py-24 px-4">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={itemVariants}
                    className="text-center mb-12 md:mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                        Powerful <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">Features</span>
                    </h2>
                    <p className="text-base md:text-lg max-w-xl mx-auto" style={{ color: muted }}>
                        Everything you need to run your hostel operations seamlessly.
                    </p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    variants={containerVariants}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
                >
                    {FEATURE_CARDS.map(({ title, desc, color }, i) => {
                        const Icon = ICONS[i % ICONS.length];
                        return (
                            <motion.div
                                key={title}
                                variants={itemVariants}
                                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                                className="group rounded-2xl border p-6 backdrop-blur-sm hover:shadow-xl hover:shadow-violet-500/10 transition-shadow duration-300"
                                style={{ backgroundColor: card, borderColor: border }}
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300"
                                    style={{ backgroundColor: `${color}1a`, border: `1.5px solid ${color}40` }}
                                >
                                    <Icon size={20} style={{ color }} />
                                </div>
                                <h3 className="font-bold text-[15px] mb-1.5" style={{ color: isDark ? '#fff' : '#0f172a' }}>{title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: muted }}>{desc}</p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default React.memo(FeaturesGrid);
