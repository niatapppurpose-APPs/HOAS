import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Quote } from 'lucide-react';
import { FAQS, containerVariants, itemVariants } from '../constants';

// ── Testimonials ─────────────────────────────────────────────
export const Testimonials = ({ isDark }) => {
    const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
    const muted = isDark ? '#94A3B8' : '#64748B';

    return (
        <section className="relative py-16 md:py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                    variants={itemVariants}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                        Loved by <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">Institutions</span>
                    </h2>
                    <p className="text-base md:text-lg" style={{ color: muted }}>Real stories from institutions using HOAS are on the way.</p>
                </motion.div>

                {/* Transparent placeholder cards — testimonials coming soon */}
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
                    variants={containerVariants}
                    className="grid sm:grid-cols-3 gap-5"
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -6 }}
                            className={`rounded-2xl border border-dashed p-7 flex flex-col items-center justify-center text-center backdrop-blur-sm ${i === 1 ? 'sm:translate-y-4' : ''}`}
                            style={{
                                backgroundColor: 'transparent',
                                borderColor: i === 0 ? 'rgba(124,58,237,0.35)' : border,
                            }}
                        >
                            <span
                                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                                style={{
                                    backgroundColor: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.07)',
                                    color: isDark ? '#a78bfa' : '#7c3aed',
                                }}
                            >
                                {i === 0 ? <Sparkles size={19} /> : <Quote size={19} />}
                            </span>
                            {i === 0 ? (
                                <>
                                    <span
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest mb-2"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
                                            color: isDark ? '#c4b5fd' : '#7c3aed',
                                            border: '1px solid rgba(124,58,237,0.3)',
                                        }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                        Coming Soon
                                    </span>
                                    <p className="text-xs leading-relaxed max-w-[200px]" style={{ color: muted }}>
                                        Testimonials from our partner institutions will appear here.
                                    </p>
                                </>
                            ) : (
                                <p
                                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                                    style={{ color: muted, opacity: 0.55 }}
                                >
                                    Your institution here
                                </p>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

// ── FAQ accordion ────────────────────────────────────────────
const FAQItem = ({ q, a, isOpen, onToggle, isDark }) => {
    const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
    const muted = isDark ? '#94A3B8' : '#64748B';

    return (
        <div className="rounded-xl border overflow-hidden transition-colors duration-300"
            style={{
                backgroundColor: isOpen ? (isDark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.04)') : (isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'),
                borderColor: isOpen ? 'rgba(124,58,237,0.4)' : border,
            }}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
            >
                <span className="font-bold text-sm md:text-[15px]" style={{ color: isDark ? '#fff' : '#0f172a' }}>{q}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isOpen ? '#7C3AED' : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'), color: isOpen ? '#fff' : muted }}
                >
                    <Plus size={15} strokeWidth={2.5} />
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: muted }}>{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const FAQ = ({ isDark }) => {
    const [openIndex, setOpenIndex] = useState(0);
    const left = FAQS.slice(0, Math.ceil(FAQS.length / 2));
    const right = FAQS.slice(Math.ceil(FAQS.length / 2));

    return (
        <section id="faq" className="relative py-16 md:py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                    variants={itemVariants}
                    className="mb-10 md:mb-14"
                >
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                        Frequently Asked <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">Questions</span>
                    </h2>
                    <p className="text-base md:text-lg" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                        Find answers to common questions about HOAS.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-4 items-start">
                    <div className="space-y-4">
                        {left.map((f, i) => (
                            <FAQItem key={f.q} {...f} isDark={isDark}
                                isOpen={openIndex === i}
                                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
                        ))}
                    </div>
                    <div className="space-y-4">
                        {right.map((f, i) => (
                            <FAQItem key={f.q} {...f} isDark={isDark}
                                isOpen={openIndex === left.length + i}
                                onToggle={() => setOpenIndex(openIndex === left.length + i ? -1 : left.length + i)} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
