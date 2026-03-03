import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useToast } from '../../../components/Toast';

const ViewPasswordModal = React.memo(({ isOpen, onClose, user, selectedManagement, isDark }) => {
    const toast = useToast();
    const [ownerPassword, setOwnerPassword] = useState('');
    const [managementPassword, setManagementPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const handleClose = () => {
        setOwnerPassword('');
        setManagementPassword('');
        setPasswordError('');
        setIsPasswordVisible(false);
        onClose();
    };

    const handleVerifyAndShowPassword = async (e) => {
        e.preventDefault();
        if (!ownerPassword) {
            setPasswordError('Please enter your password');
            return;
        }

        setIsVerifying(true);
        setPasswordError('');

        try {
            const credential = EmailAuthProvider.credential(user.email, ownerPassword);
            await reauthenticateWithCredential(user, credential);

            const credDoc = await getDoc(doc(db, 'managementCredentials', selectedManagement.id));

            if (credDoc.exists()) {
                setManagementPassword(credDoc.data().password);
                setIsPasswordVisible(true);
            } else {
                setPasswordError('Password not found. It may have been created before this feature.');
            }
        } catch (error) {
            console.error('Verification error:', error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setPasswordError('Incorrect credentials. Please try again.');
            } else {
                setPasswordError('Verification failed. Please try again.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    if (!isOpen || !selectedManagement) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div
                className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl p-6"
                style={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                            <Lock size={20} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: isDark ? '#fff' : '#000' }}>
                            View Password
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
                    </button>
                </div>

                {/* College Info */}
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                    <p className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>College</p>
                    <p className="font-medium" style={{ color: isDark ? '#fff' : '#000' }}>
                        {selectedManagement.collegeName || selectedManagement.displayName}
                    </p>
                    <p className="text-sm mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                        {selectedManagement.email}
                    </p>
                </div>

                {!isPasswordVisible ? (
                    <form onSubmit={handleVerifyAndShowPassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                                Enter Your Password to Continue
                            </label>
                            <input
                                type="password"
                                value={ownerPassword}
                                onChange={(e) => {
                                    setOwnerPassword(e.target.value);
                                    if (passwordError) setPasswordError('');
                                }}
                                placeholder="Your admin password"
                                className="w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                style={{
                                    backgroundColor: isDark ? '#374151' : '#f9fafb',
                                    borderColor: passwordError ? '#ef4444' : (isDark ? '#4b5563' : '#d1d5db'),
                                    color: isDark ? '#fff' : '#000',
                                }}
                                autoFocus
                            />
                            {passwordError && (
                                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2.5 rounded-lg border font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                style={{
                                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                                    color: isDark ? '#d1d5db' : '#374151',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isVerifying}
                                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50"
                            >
                                {isVerifying ? 'Verifying...' : 'Verify & Show'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                                Management Password
                            </label>
                            <div
                                className="flex items-center gap-2 p-3 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? '#374151' : '#f9fafb',
                                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                                }}
                            >
                                <code
                                    className="flex-1 font-mono text-lg tracking-wider"
                                    style={{ color: isDark ? '#10b981' : '#059669' }}
                                >
                                    {managementPassword}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(managementPassword);
                                        toast.success('Password copied to clipboard!');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs mt-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                                ⚠️ Share this password securely with the principal
                            </p>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

ViewPasswordModal.displayName = 'ViewPasswordModal';

export default ViewPasswordModal;
