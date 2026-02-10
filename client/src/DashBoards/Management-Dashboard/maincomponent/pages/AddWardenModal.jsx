import { useState } from 'react';
import { createWarden } from '../../../../firebase/cloudFunctions';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useToast } from '../../../../components/Toast';
import {
    X, User, Mail, Lock, Phone, Building2, Eye, EyeOff,
    ShieldCheck, Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';

/**
 * AddWardenModal - Modal for Management to manually add a warden
 */
const AddWardenModal = ({ isOpen, onClose, collegeName }) => {
    const { userData, user } = useAuth();
    const { isDark } = useTheme();
    const toast = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        hostelBlock: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const college = collegeName || userData?.collegeName || '';

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) return 'Full name is required';
        if (!formData.email.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format';
        if (!formData.password) return 'Password is required';
        if (formData.password.length < 6) return 'Password must be at least 6 characters';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createWarden({
                fullName: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                password: formData.password,
                hostelBlock: formData.hostelBlock.trim(),
                collegeName: college,
                managementId: userData?.uid || user?.uid,
            });

            setSuccess(true);
            toast.success(`Warden "${formData.fullName}" created successfully! 🎉`);
        } catch (err) {
            console.error('Create warden error:', err);
            const msg = err.message || 'Failed to create warden';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({ fullName: '', email: '', phone: '', password: '', hostelBlock: '' });
        setSuccess(false);
        setError('');
        setShowPassword(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    // Theme colors
    const bg = isDark ? '#111827' : '#ffffff';
    const bgSecondary = isDark ? '#1f2937' : '#f8fafc';
    const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const inputBg = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(243, 244, 246, 0.9)';
    const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && !loading && handleClose()}
        >
            <div
                className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: bg, border: `1px solid ${border}` }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: `1px solid ${border}` }}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: textPrimary }}>Add Warden</h2>
                            <p className="text-xs" style={{ color: textSecondary }}>{college}</p>
                        </div>
                    </div>
                    {!loading && (
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                            style={{ color: textSecondary }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    {/* SUCCESS STATE */}
                    {success ? (
                        <div className="text-center space-y-5 py-4">
                            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: textPrimary }}>Warden Created! 🎉</h3>
                                <p className="text-sm mt-2" style={{ color: textSecondary }}>
                                    <strong>{formData.fullName}</strong> can now login with:
                                </p>
                            </div>

                            {/* Credentials Box */}
                            <div
                                className="rounded-xl p-4 text-left space-y-2"
                                style={{ backgroundColor: bgSecondary, border: `1px solid ${border}` }}
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4" style={{ color: '#6366f1' }} />
                                    <span style={{ color: textSecondary }}>Email:</span>
                                    <span className="font-mono font-medium" style={{ color: textPrimary }}>{formData.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Lock className="w-4 h-4" style={{ color: '#6366f1' }} />
                                    <span style={{ color: textSecondary }}>Password:</span>
                                    <span className="font-mono font-medium" style={{ color: textPrimary }}>{formData.password}</span>
                                </div>
                                {formData.hostelBlock && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Building2 className="w-4 h-4" style={{ color: '#6366f1' }} />
                                        <span style={{ color: textSecondary }}>Hostel:</span>
                                        <span className="font-medium" style={{ color: textPrimary }}>{formData.hostelBlock}</span>
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border"
                                    style={{ borderColor: border, color: textPrimary, backgroundColor: bgSecondary }}
                                >
                                    <User className="w-4 h-4" />
                                    Add Another
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* FORM STATE */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="text-xs font-semibold mb-1.5 block" style={{ color: textSecondary }}>
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    <input
                                        type="text"
                                        placeholder="Enter warden's full name"
                                        value={formData.fullName}
                                        onChange={(e) => handleChange('fullName', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-xs font-semibold mb-1.5 block" style={{ color: textSecondary }}>
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    <input
                                        type="email"
                                        placeholder="warden@example.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone & Hostel Block Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: textSecondary }}>
                                        Phone
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                        <input
                                            type="tel"
                                            placeholder="Phone number"
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: textSecondary }}>
                                        Hostel Block
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                        <input
                                            type="text"
                                            placeholder="Block A"
                                            value={formData.hostelBlock}
                                            onChange={(e) => handleChange('hostelBlock', e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs font-semibold mb-1.5 block" style={{ color: textSecondary }}>
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min 6 characters"
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        className="w-full h-11 pl-10 pr-12 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }}
                                        disabled={loading}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors"
                                        style={{ color: textSecondary }}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div
                                    className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2',
                                        border: `1px solid ${isDark ? 'rgba(220,38,38,0.2)' : '#fecaca'}`,
                                        color: isDark ? '#f87171' : '#dc2626'
                                    }}
                                >
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{
                                    background: loading
                                        ? (isDark ? '#374151' : '#9ca3af')
                                        : 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    boxShadow: loading ? 'none' : '0 4px 15px rgba(245,158,11,0.4)'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating Warden...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5" />
                                        Create Warden
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddWardenModal;
