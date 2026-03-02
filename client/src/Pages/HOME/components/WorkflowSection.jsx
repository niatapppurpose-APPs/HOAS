import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Building2, Users, GraduationCap } from 'lucide-react';

// ── Workflow steps data (hoisted — no re-creation) ──
const workflowSteps = [
    { number: '01', title: 'Account Setup', desc: 'Initializes system and creates management accounts.', role: 'Super Admin', icon: ShieldCheck },
    { number: '02', title: 'Configuration', desc: 'Creates warden accounts and uploads student data.', role: 'Management', icon: Building2 },
    { number: '03', title: 'Verification & Action', desc: 'Verifies students and reviews raised issues.', role: 'Warden', icon: Users },
    { number: '04', title: 'Request & Tracking', desc: 'Raises issues and tracks approval status.', role: 'Student', icon: GraduationCap },
];

// ── Individual card with staggered animation ──
const ScrollWorkflowCard = React.memo(({ number, title, desc, role, icon: Icon, isDark, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{
            duration: 0.6,
            delay: index * 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
        }}
        whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.2 } }}
        className="relative p-6 rounded-2xl border text-center backdrop-blur-sm"
        style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
            boxShadow: isDark
                ? '0 20px 40px -15px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                : '0 20px 40px -15px rgba(0, 0, 0, 0.1)',
        }}
    >
        <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
                background: isDark
                    ? 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
            }}
        />
        <motion.div
            className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 relative"
            initial={{ scale: 0.5, rotate: -10 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 + 0.2, type: 'spring', stiffness: 200 }}
            style={{
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                border: '2px solid rgba(99, 102, 241, 0.4)',
            }}
        >
            <Icon size={28} style={{ color: '#6366f1' }} />
            <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 + 0.4, type: 'spring' }}
                style={{ backgroundColor: '#6366f1', color: '#ffffff' }}
            >
                {number}
            </motion.div>
        </motion.div>
        <h3 className="font-bold text-lg mb-2" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
            {title}
        </h3>
        <div
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
            style={{
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                color: isDark ? '#818cf8' : '#4338ca',
                border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
        >
            {role}
        </div>
        <p className="text-sm leading-relaxed" style={{ color: isDark ? '#94a3b8' : '#475569' }}>
            {desc}
        </p>
        <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            whileInView={{ width: '60%' }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 + 0.5, duration: 0.4 }}
        />
    </motion.div>
));

ScrollWorkflowCard.displayName = 'ScrollWorkflowCard';

// ── Workflow Section ──
const WorkflowSection = React.memo(({ isDark }) => {
    const containerRef = useRef(null);

    return (
        <section
            id="workflow"
            ref={containerRef}
            className="relative py-20 md:py-32"
            style={{
                background: isDark
                    ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                    : 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                        Streamlined Workflow
                    </h2>
                    <p style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        How approvals flow through the system
                    </p>
                </motion.div>
                <div className="relative">
                    <motion.div
                        className="absolute top-1/2 left-[10%] right-[10%] h-1 hidden lg:block -translate-y-1/2 z-0"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                        style={{ transformOrigin: 'left' }}
                    >
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600" />
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative z-10">
                        {workflowSteps.map((step, index) => (
                            <ScrollWorkflowCard key={step.number} {...step} isDark={isDark} index={index} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
});

WorkflowSection.displayName = 'WorkflowSection';

export default WorkflowSection;
