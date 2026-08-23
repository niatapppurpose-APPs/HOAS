import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { socialLinks } from '../constants';
import PreviewModal from './PreviewModal';
import AppLogo from '../../../assets/Applogo.webp';

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: EASE, delay },
    }),
};

const Footer = React.memo(({ isDark, onNavigate }) => {
    const navigate = useNavigate();
    const [previewRole, setPreviewRole] = useState(null);
    const [ctaHover, setCtaHover] = useState(false);

    const handleLinkClick = (path, role = null) => {
        if (role) {
            setPreviewRole(role);
            return;
        }
        if (path === null) return;
        if (path.startsWith('scroll:')) {
            const el = document.getElementById(path.replace('scroll:', ''));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        if (path.startsWith('http')) {
            window.open(path, '_blank');
        } else if (path.startsWith('alert:')) {
            alert(path.replace('alert:', ''));
        } else {
            navigate(path);
            window.scrollTo(0, 0);
        }
    };

    const goDashboard = () => {
        if (onNavigate) onNavigate();
        else navigate('/login');
    };

    const heading = 'text-[11px] font-extrabold uppercase tracking-[0.18em] mb-5 text-violet-300/80';
    const link =
        'text-sm font-medium text-slate-300/90 hover:text-white hover:translate-x-[3px] inline-block transition-all duration-200 cursor-pointer';

    return (
        <footer
            id="contact"
            className="relative overflow-hidden"
            style={{
                background: isDark
                    ? 'linear-gradient(175deg, #070511 0%, #0B0820 45%, #100B2E 100%)'
                    : 'linear-gradient(175deg, #080613 0%, #0D0922 50%, #130C33 100%)',
            }}
        >
            {/* Ambient glows — extremely subtle */}
            <div
                className="absolute -top-32 right-[10%] w-[28rem] h-[28rem] rounded-full blur-[140px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.14), transparent 65%)' }}
            />
            <div
                className="absolute top-[35%] right-[2%] w-80 h-80 rounded-full blur-[120px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 65%)' }}
            />
            <div
                className="absolute -bottom-24 left-[5%] w-96 h-96 rounded-full blur-[130px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07), transparent 70%)' }}
            />

            {/* Faint blueprint grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
                    backgroundSize: '44px 44px',
                    maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                }}
            />

            {/* Top hairline accent */}
            <div
                className="absolute top-0 inset-x-0 h-px pointer-events-none"
                style={{
                    background: 'linear-gradient(90deg, transparent 5%, rgba(139,92,246,0.5) 35%, rgba(59,130,246,0.35) 60%, transparent 95%)',
                }}
            />

            <div className="relative max-w-[1240px] mx-auto px-6 sm:px-8 lg:px-10 pt-20 md:pt-24 pb-8">
                {/* ── Top grid ── */}
                <div className="grid gap-12 md:gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr_1.5fr] mb-16">
                    {/* Brand */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-white shadow-lg shadow-violet-950/40">
                                <img src={AppLogo} alt="HOAS logo" className="w-full h-full object-contain p-1" />
                            </span>
                            <span className="text-[26px] font-extrabold tracking-tight text-white">HOAS</span>
                        </div>
                        <p className="text-sm leading-[1.7] text-slate-400 max-w-[300px] mb-5">
                            Empowering hostels with transparency, automation, and accountability.
                        </p>
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse" />
                            Built for modern hostel operations
                        </span>
                    </motion.div>

                    {/* Product */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.06}>
                        <h4 className={heading}>Product</h4>
                        <ul className="space-y-3">
                            <li><a onClick={() => handleLinkClick('scroll:features')} className={link}>Features</a></li>
                            <li><a onClick={() => handleLinkClick('scroll:roles')} className={link}>Roles</a></li>
                            <li><a onClick={() => handleLinkClick('scroll:workflow')} className={link}>Workflow</a></li>
                            <li><a onClick={() => handleLinkClick('scroll:faq')} className={link}>FAQ</a></li>
                        </ul>
                    </motion.div>

                    {/* Resources */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.12}>
                        <h4 className={heading}>Resources</h4>
                        <ul className="space-y-3">
                            <li><a onClick={() => handleLinkClick('https://github.com/niatapppurpose-APPs/HOAS#readme')} className={link}>Documentation</a></li>
                            <li><a onClick={() => handleLinkClick(null, 'Support')} className={link}>Help Center</a></li>
                            <li><a onClick={() => handleLinkClick(null, 'Support')} className={link}>Contact</a></li>
                        </ul>
                    </motion.div>

                    {/* Company */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.18}>
                        <h4 className={heading}>Company</h4>
                        <ul className="space-y-3">
                            <li><a onClick={() => handleLinkClick(null, 'About Us')} className={link}>About Us</a></li>
                            <li><a onClick={() => handleLinkClick('alert:Privacy Policy — coming soon.')} className={link}>Privacy Policy</a></li>
                            <li><a onClick={() => handleLinkClick('alert:Terms of Service — coming soon.')} className={link}>Terms of Service</a></li>
                        </ul>
                    </motion.div>

                    {/* CTA glass card — visual focal point */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, ease: EASE, delay: 0.22 }}
                        onMouseEnter={() => setCtaHover(true)}
                        onMouseLeave={() => setCtaHover(false)}
                        whileHover={{ y: -3 }}
                        className="relative overflow-hidden rounded-[24px] p-7 self-start w-full transition-colors duration-300"
                        style={{
                            background: ctaHover
                                ? 'linear-gradient(135deg, rgba(139,92,246,0.26), rgba(59,130,246,0.17))'
                                : 'linear-gradient(135deg, rgba(139,92,246,0.20), rgba(59,130,246,0.12))',
                            border: `1px solid ${ctaHover ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.10)'}`,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
                        }}
                    >
                        {/* Subtle decorative orb + light sweep */}
                        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }} />
                        <div
                            className="absolute inset-y-0 w-1/2 pointer-events-none transition-transform duration-700 ease-out"
                            style={{
                                background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)',
                                transform: ctaHover ? 'translateX(220%) skewX(-12deg)' : 'translateX(-160%) skewX(-12deg)',
                            }}
                        />

                        <div className="relative">
                            <h4 className="text-[23px] font-extrabold text-white leading-tight tracking-tight mb-2.5">
                                Ready to Transform Your Hostel Management?
                            </h4>
                            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                Join modern institutions using HOAS to simplify hostel operations.
                            </p>
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={goDashboard}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-shadow duration-300"
                                style={{
                                    background: ctaHover
                                        ? 'linear-gradient(135deg, #9F67FF, #7C3AED)'
                                        : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                                    boxShadow: ctaHover
                                        ? '0 14px 34px -8px rgba(139,92,246,0.55)'
                                        : '0 8px 22px -8px rgba(109,40,217,0.5)',
                                }}
                            >
                                Get Started Free <ArrowRight size={15} />
                            </motion.button>
                            <div className="flex items-center gap-4 mt-5 text-[11px] font-semibold text-slate-500">
                                <span>16 modules</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                <span>4 roles</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                <span>Realtime</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Divider ── */}
                <div className="border-t border-white/[0.07]" />

                {/* ── Bottom bar ── */}
                <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-5">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 order-2 md:order-1">
                        <p className="text-xs text-slate-500">© 2026 HOAS. All rights reserved.</p>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-600" />
                        <button type="button" onClick={() => handleLinkClick('alert:Privacy Policy — coming soon.')} className="text-xs text-slate-500 hover:text-violet-300 transition-colors">
                            Privacy
                        </button>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <button type="button" onClick={() => handleLinkClick('alert:Terms of Service — coming soon.')} className="text-xs text-slate-500 hover:text-violet-300 transition-colors">
                            Terms
                        </button>
                    </div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                        className="flex gap-3 order-1 md:order-2"
                    >
                        {socialLinks.map(({ icon: Icon, href, label }) => (
                            <motion.a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                title={label}
                                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-[13px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-violet-600 hover:border-violet-500 transition-all duration-200"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 20px -6px rgba(139,92,246,0.5)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <Icon size={18} />
                            </motion.a>
                        ))}
                    </motion.div>
                </div>
            </div>

            <PreviewModal
                isOpen={!!previewRole}
                onClose={() => setPreviewRole(null)}
                role={previewRole}
                isDark={isDark}
            />
        </footer>
    );
});

Footer.displayName = 'Footer';

export default Footer;
