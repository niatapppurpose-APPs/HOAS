import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Eye, Info } from 'lucide-react';
import OwnerImg from '../../../assets/owner_preview.png';
import ManagementImg from '../../../assets/management_preview.png';
import WardenImg from '../../../assets/warden_preview.png';
import StudentImg from '../../../assets/student_preview.png';

const PreviewModal = ({ isOpen, onClose, role, isDark }) => {
    // Utility for dynamic colors since Tailwind JIT can't predict them
    const colorMap = {
        'blue': '#7c3aed',
        'teal': '#14b8a6',
        'amber': '#f59e0b',
        'sky': '#8b5cf6'
    };

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
    }, [isOpen]);

    const previewData = {
        'Owner Dashboard': {
            img: OwnerImg,
            title: 'Owner/Super Admin Dashboard',
            features: [
                'Complete access to multiple colleges',
                'Global revenue and performance analytics',
                'Property and institution management',
                'Advanced system configuration'
            ],
            color: 'blue'
        },
        'Management Portal': {
            img: ManagementImg,
            title: 'Management Control Center',
            features: [
                'Warden performance monitoring',
                'Campus-wide occupancy statistics',
                'Automated maintenance queue',
                'Resource allocation control'
            ],
            color: 'teal'
        },
        'Warden Dashboard': {
            img: WardenImg,
            title: 'Warden Management Suite',
            features: [
                'Daily student attendance tracking',
                'Room allocation systems',
                'Gate pass request approvals',
                'Real-time incident reporting'
            ],
            color: 'amber'
        },
        'Student App': {
            img: StudentImg,
            title: 'Student Experience App',
            features: [
                'Easy room application process',
                'Digital gate pass generation',
                'Maintenance request submission',
                'Fee payment and billing history'
            ],
            color: 'sky'
        },
        'API Reference': {
            title: 'API Reference (Coming Soon)',
            desc: 'We are currently developing a robust developer portal and public API system to allow institutions to build custom integrations.',
            features: [
                'Upcoming REST API endpoints',
                'Developer documentation portal',
                'Sandboxed testing environment',
                'Secured OAuth2 integration'
            ],
            color: 'blue',
            isInfo: true
        },
        'Support': {
            title: 'Institutional Support',
            desc: 'We provide 24/7 technical support for campus administrators and emergency assistance for wardens.',
            features: [
                'Standard Email support tracking',
                'Dedicated account managers for institutions',
                'Community knowledge base and forums',
                'Direct emergency warden hotline'
            ],
            color: 'sky',
            isInfo: true
        },
        'Privacy Policy': {
            title: 'Data Privacy Policy',
            desc: 'We take data security seriously. Student information is encrypted and only accessible to authorized personnel.',
            features: [
                'End-to-end encryption for student PII',
                'Strict GDPR and local compliance',
                'No third-party data sharing',
                'Regular security audits and logging'
            ],
            color: 'teal',
            isInfo: true
        },
        'Terms of Service': {
            title: 'Standard Service Agreement',
            desc: 'Use of HOAS is governed by our service agreement with each institution to ensure fair usage and accountability.',
            features: [
                'Institutional license agreements',
                'Uptime SLA guarantees (99.9%)',
                'Proper usage guidelines for students',
                'Automated liability and audit trails'
            ],
            color: 'blue',
            isInfo: true
        },
        'Compliance': {
            title: 'Compliance & Safety',
            desc: 'HOAS ensures your institution meets all regulatory standards for student housing and safety records.',
            features: [
                'Digital record keeping for fire audits',
                'Automated capacity limit enforcement',
                'Transparent attendance audit trails',
                'Localized regulatory reporting tools'
            ],
            color: 'teal',
            isInfo: true
        }
    };

    const current = previewData[role] || {};

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 backdrop-blur-md bg-black/60"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl flex flex-col md:flex-row"
                    style={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                        color: isDark ? '#f1f5f9' : '#1e293b'
                    }}
                >
                    {/* Left: Content */}
                    <div className="p-6 md:p-10 md:w-2/5 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                                    {current.title}
                                </h3>
                                <div className="h-1 w-20 rounded-full" style={{ backgroundColor: colorMap[current.color] || '#7c3aed' }} />
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors hidden md:block">
                                <X className="w-6 h-6" style={{ color: isDark ? '#94a3b8' : '#64748b' }} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8 flex-grow">
                            <p className="text-sm md:text-base leading-relaxed" style={{ color: isDark ? '#94a3b8' : '#475569' }}>
                                {current.desc || `A dedicated portal designed to empower ${role.split(' ')[0]}s with all the tools needed for efficient operations.`}
                            </p>

                            <ul className="space-y-3">
                                {current.features?.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm" style={{ color: isDark ? '#cbd5e1' : '#1e293b' }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorMap[current.color] || '#7c3aed' }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-white"
                            style={{ 
                                backgroundColor: colorMap[current.color] || '#7c3aed',
                                boxShadow: `0 10px 15px -3px ${colorMap[current.color]}40`
                            }}
                        >
                            {!current.isInfo ? 'Explore Live System' : 'Close Information'} {!current.isInfo && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Right: Image Preview */}
                    <div className="md:w-3/5 flex items-center justify-center p-4 relative overflow-hidden" 
                        style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)' }}>
                        {current.img ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="relative z-10 w-full"
                            >
                                <img
                                    src={current.img}
                                    alt={current.title}
                                    className="w-full h-auto rounded-xl shadow-2xl border"
                                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                                />
                            </motion.div>
                        ) : (
                            <div className="relative z-10 text-center p-10">
                                <Info className="w-20 h-20 mx-auto mb-6 opacity-20" style={{ color: isDark ? '#ffffff' : '#0f172a' }} />
                                <p className="text-lg font-medium opacity-40">Section Overview</p>
                            </div>
                        )}

                        {/* Background glow using inline styles for dynamic colors */}
                        <div className="absolute inset-0 blur-[100px] opacity-15 rounded-full" 
                            style={{ backgroundColor: colorMap[current.color] || '#7c3aed' }} />
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors md:hidden z-50 text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PreviewModal;
