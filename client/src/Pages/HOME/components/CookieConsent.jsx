import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CookieConsent Component
 * Follows the design provided by the user:
 * - Cute cookie icon
 * - "Have a cookie :)" heading
 * - Explanatory text with a link
 * - "UNDERSTOOD. YUM!" action button
 */
const CookieConsent = ({ isDark }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted cookies
        const hasConcented = localStorage.getItem('hoas-cookie-consent');
        if (!hasConcented) {
            // Show after a short delay for better entry effect
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('hoas-cookie-consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: 100, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 50, opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    // Moved to bottom-right (right-6) and adjusted width for corner placement
                    className="fixed bottom-6 right-6 z-[400] w-[calc(100%-3rem)] sm:w-[380px] overflow-hidden rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 backdrop-blur-xl"
                    style={{
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                        color: isDark ? '#f1f5f9' : '#0f172a',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(124, 58, 237, 0.2)',
                    }}
                >
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-5">
                            {/* Smaller, side-aligned icon */}
                            <motion.div 
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="text-5xl select-none"
                            >
                                🍪
                            </motion.div>
                            <h2 className="text-2xl font-black tracking-tight leading-none">
                                Have a cookie :)
                            </h2>
                        </div>

                        <p className="text-[0.9rem] leading-relaxed font-medium opacity-60">
                            We use cookies to ensure that we give you the best experience on our website. 
                            We also use cookies to ensure we show you advertising that is relevant to you.
                        </p>

                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAccept}
                                className="flex-grow py-3.5 text-sm font-black text-white rounded-2xl shadow-xl transition-all"
                                style={{
                                    // Using website's theme color (Violet) instead of pink/red
                                    backgroundColor: '#7c3aed',
                                    boxShadow: '0 10px 20px -5px rgba(124, 58, 237, 0.4)',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                UNDERSTOOD. YUM!
                            </motion.button>
                            <button className="px-2 text-xs font-bold opacity-30 hover:opacity-100 transition-opacity uppercase tracking-widest">
                                Settings
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
