import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { socialLinks } from '../constants';
import PreviewModal from './PreviewModal';

const Footer = React.memo(({ isDark }) => {
    const navigate = useNavigate();
    const [previewRole, setPreviewRole] = useState(null);

    const handleLinkClick = (path, role = null) => {
        if (role) {
            setPreviewRole(role);
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

    // Use CSS :hover instead of direct DOM manipulation
    return (
        <footer className="pt-12 md:pt-16 pb-8 border-t"
            style={{
                backgroundColor: isDark ? '#020617' : '#f1f5f9',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
            }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-20 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="flex-shrink-0"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-[100px] leading-none font-bold tracking-tighter uppercase" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>HOAS</span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#64748b' }}>
                            The standard for modern hostel administration. Built for security, designed for usability.
                        </p>
                    </motion.div>

                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-100 md:gap-16 pt-4'>
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                            <h4 className="font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Platform</h4>
                            <ul className="space-y-2 text-sm" style={{ color: '#64748b' }}>
                                <li onClick={() => handleLinkClick('/OwnersDashboard', 'Owner Dashboard')} className="hover:text-violet-500 cursor-pointer transition-colors">Owner Dashboard</li>
                                <li onClick={() => handleLinkClick('/dashboard', 'Management Portal')} className="hover:text-violet-500 cursor-pointer transition-colors">Management Portal</li>
                                <li onClick={() => handleLinkClick('/login', 'Warden Dashboard')} className="hover:text-violet-500 cursor-pointer transition-colors">Warden Dashboard</li>
                                <li onClick={() => handleLinkClick('/login', 'Student App')} className="hover:text-violet-500 cursor-pointer transition-colors">Student App</li>
                            </ul>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                            <h4 className="font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Resources</h4>
                            <ul className="space-y-2 text-sm" style={{ color: '#64748b' }}>
                                <li onClick={() => handleLinkClick('https://github.com/niatapppurpose-APPs/HOAS#readme')} className="hover:text-violet-500 cursor-pointer transition-colors">Documentation</li>
                                <li onClick={() => handleLinkClick(null, 'API Reference')} className="hover:text-violet-500 cursor-pointer transition-colors">API Reference</li>
                                <li onClick={() => handleLinkClick(null, 'Support')} className="hover:text-violet-500 cursor-pointer transition-colors">Support</li>
                            </ul>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
                            <h4 className="font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Legal</h4>
                            <ul className="space-y-2 text-sm" style={{ color: '#64748b' }}>
                                <li onClick={() => handleLinkClick(null, 'Privacy Policy')} className="hover:text-violet-500 cursor-pointer transition-colors">Privacy Policy</li>
                                <li onClick={() => handleLinkClick(null, 'Terms of Service')} className="hover:text-violet-500 cursor-pointer transition-colors">Terms of Service</li>
                                <li onClick={() => handleLinkClick(null, 'Compliance')} className="hover:text-violet-500 cursor-pointer transition-colors">Compliance</li>
                            </ul>
                        </motion.div>
                    </div>
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
