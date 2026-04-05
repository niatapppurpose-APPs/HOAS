import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, BarChart3, Target, Cookie } from 'lucide-react';

/**
 * CookieConsent Component
 * Follows the design provided by the user:
 * - Cute cookie icon
 * - "Have a cookie :)" heading
 * - Explanatory text with a link
 * - "UNDERSTOOD. YUM!" action button
 * - Settings modal for granular cookie preferences
 */
const CookieConsent = ({ isDark }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState({
        necessary: true, // Always required
        analytics: true,
        marketing: false,
    });

    useEffect(() => {
        // Check if user has already accepted cookies
        const hasConcented = localStorage.getItem('hoas-cookie-consent');
        if (!hasConcented) {
            // Show after a short delay for better entry effect
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            // Load saved preferences
            const savedPrefs = localStorage.getItem('hoas-cookie-preferences');
            if (savedPrefs) {
                setPreferences(JSON.parse(savedPrefs));
            }
        }
    }, []);

    const handleAccept = () => {
        // Accept all cookies
        const allAccepted = { necessary: true, analytics: true, marketing: true };
        localStorage.setItem('hoas-cookie-consent', 'true');
        localStorage.setItem('hoas-cookie-preferences', JSON.stringify(allAccepted));
        setPreferences(allAccepted);
        setIsVisible(false);
    };

    const handleSavePreferences = () => {
        localStorage.setItem('hoas-cookie-consent', 'true');
        localStorage.setItem('hoas-cookie-preferences', JSON.stringify(preferences));
        setShowSettings(false);
        setIsVisible(false);
    };

    const togglePreference = (key) => {
        if (key === 'necessary') return; // Can't disable necessary cookies
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const cookieTypes = [
        {
            key: 'necessary',
            icon: Shield,
            title: 'Necessary',
            description: 'Essential for the website to function. Cannot be disabled.',
            required: true,
        },
        {
            key: 'analytics',
            icon: BarChart3,
            title: 'Analytics',
            description: 'Help us understand how visitors use our website.',
            required: false,
        },
        {
            key: 'marketing',
            icon: Target,
            title: 'Marketing',
            description: 'Used to show you relevant ads on other sites.',
            required: false,
        },
    ];

    return (
        <AnimatePresence>
            {isVisible && !showSettings && (
                <motion.div
                    initial={{ x: 100, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 50, opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 right-6 z-[400] w-[calc(100%-3rem)] sm:w-[380px] overflow-hidden rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 backdrop-blur-xl"
                    style={{
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                        color: isDark ? '#f1f5f9' : '#0f172a',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(124, 58, 237, 0.2)',
                    }}
                >
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-5">
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
                                    backgroundColor: '#7c3aed',
                                    boxShadow: '0 10px 20px -5px rgba(124, 58, 237, 0.4)',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                UNDERSTOOD. YUM!
                            </motion.button>
                            <button 
                                onClick={() => setShowSettings(true)}
                                className="px-2 text-xs font-bold opacity-30 hover:opacity-100 transition-opacity uppercase tracking-widest"
                            >
                                Settings
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Cookie Settings Modal */}
            {showSettings && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[500] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setShowSettings(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                        style={{
                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                            color: isDark ? '#f1f5f9' : '#0f172a',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b"
                            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                        >
                            <div className="flex items-center gap-3">
                                <Cookie className="w-6 h-6 text-violet-500" />
                                <h3 className="text-xl font-bold">Cookie Settings</h3>
                            </div>
                            <button 
                                onClick={() => setShowSettings(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cookie Options */}
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm opacity-60 mb-4">
                                Manage your cookie preferences below. Some cookies are essential for the site to work properly.
                            </p>

                            {cookieTypes.map((cookie) => {
                                const Icon = cookie.icon;
                                return (
                                    <div 
                                        key={cookie.key}
                                        className="flex items-start gap-4 p-4 rounded-2xl transition-colors"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        }}
                                    >
                                        <div className="p-2 rounded-xl bg-violet-500/10">
                                            <Icon className="w-5 h-5 text-violet-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold">{cookie.title}</h4>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={preferences[cookie.key]}
                                                        onChange={() => togglePreference(cookie.key)}
                                                        disabled={cookie.required}
                                                        className="sr-only peer"
                                                    />
                                                    <div className={`w-11 h-6 rounded-full peer transition-colors ${
                                                        preferences[cookie.key] 
                                                            ? 'bg-violet-500' 
                                                            : isDark ? 'bg-gray-700' : 'bg-gray-300'
                                                    } ${cookie.required ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                                            preferences[cookie.key] ? 'translate-x-5' : 'translate-x-0'
                                                        }`} />
                                                    </div>
                                                </label>
                                            </div>
                                            <p className="text-xs opacity-50 mt-1">{cookie.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t flex gap-3"
                            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                        >
                            <button
                                onClick={() => {
                                    setPreferences({ necessary: true, analytics: false, marketing: false });
                                }}
                                className="flex-1 py-3 text-sm font-semibold rounded-xl transition-colors"
                                style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                }}
                            >
                                Reject All
                            </button>
                            <button
                                onClick={handleSavePreferences}
                                className="flex-1 py-3 text-sm font-bold text-white rounded-xl bg-violet-500 hover:bg-violet-600 transition-colors"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
