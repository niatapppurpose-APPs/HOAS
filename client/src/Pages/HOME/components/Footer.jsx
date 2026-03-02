import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { socialLinks } from '../constants';
import AppLogo from '../../../assets/AppLogo4k.png';

const Footer = React.memo(({ isDark }) => {
    // Use CSS :hover instead of direct DOM manipulation
    return (
        <footer className="pt-12 md:pt-16 pb-8 border-t"
            style={{
                backgroundColor: isDark ? '#020617' : '#f1f5f9',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
            }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="col-span-1 sm:col-span-2 md:col-span-1"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-12 h-12 bg-indigo-600 rounded-xl p-1.5 flex items-center justify-center"
                                style={{ border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.3)' }}
                            >
                                <div className="w-full h-full bg-white rounded-lg overflow-hidden flex items-center justify-center">
                                    <img src={AppLogo} alt="AppLogo" className="w-full h-full object-contain" />
                                </div>
                            </motion.div>
                            <span className="text-2xl font-bold tracking-tight uppercase" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>HOAS</span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#64748b' }}>
                            The standard for modern hostel administration. Built for security, designed for usability.
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                        <h4 className="font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Platform</h4>
                        <ul className="space-y-2 text-sm" style={{ color: '#64748b' }}>
                            <li className="hover:text-indigo-500 cursor-pointer transition-colors">Owner Dashboard</li>
                            <li className="hover:text-indigo-500 cursor-pointer transition-colors">Management Portal</li>
                            <li className="hover:text-indigo-500 cursor-pointer transition-colors">Student App</li>
                        </ul>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                        <h4 className="font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Resources</h4>
                        <ul className="space-y-2 text-sm" style={{ color: '#64748b' }}>
                            <li className="hover:text-indigo-500 cursor-pointer transition-colors">Documentation</li>
                            <li className="hover:text-indigo-500 cursor-pointer transition-colors">API Reference</li>
                            <li className="hover:text-indigo-500 cursor-pointer transition-colors">Support</li>
                        </ul>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
                        <h4 className="font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Legal</h4>
                        <ul className="space-y-2 text-sm" style={{ color: '#64748b' }}>
                            <li className="hover:text-indigo-500 cursor-pointer transition-colors">Privacy Policy</li>
                            <li className="hover:text-indigo-500 cursor-pointer transition-colors">Terms of Service</li>
                            <li className="hover:text-indigo-500 cursor-pointer transition-colors">Compliance</li>
                        </ul>
                    </motion.div>
                </div>

                <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left"
                    style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }}>
                    <p className="text-sm" style={{ color: isDark ? '#475569' : '#94a3b8' }}>© 2026 HOAS. All rights reserved.</p>
                    <div className="flex gap-3">
                        {socialLinks.map(({ icon: Icon, href, label, hoverColor }) => (
                            <motion.a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                whileHover={{ scale: 1.15, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="social-icon-link w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 group"
                                style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                                    '--hover-color': hoverColor,
                                }}
                            >
                                <Icon className="w-4 h-4 transition-colors duration-300" style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
});

Footer.displayName = 'Footer';

export default Footer;
