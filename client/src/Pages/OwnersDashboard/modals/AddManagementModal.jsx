import React, { useState, useEffect, useCallback } from 'react';
import { Building2, X, Plus, UploadIcon } from 'lucide-react';
import { HashLoader } from 'react-spinners';
import * as cloudFunctions from '../../../firebase/cloudFunctions';
import { useToast } from '../../../components/Toast';
import { compressLogoForModal } from '../utils/compressLogo';
import CollegeSelect from '../components/CollegeSelect';

const AddManagementModal = React.memo(({ isOpen, onClose, isDark }) => {
    const toast = useToast();
    const [newManagement, setNewManagement] = useState({
        collegeName: '',
        principalName: '',
        email: '',
        phone: '',
        password: '',
    });
    const [formError, setFormError] = useState('');
    const [isAddingManagement, setIsAddingManagement] = useState(false);
    const [modalLogoFile, setModalLogoFile] = useState(null);
    const [modalLogoPreview, setModalLogoPreview] = useState(null);

    // Cleanup object URL on unmount or when preview changes
    useEffect(() => {
        return () => {
            if (modalLogoPreview) URL.revokeObjectURL(modalLogoPreview);
        };
    }, [modalLogoPreview]);

    const generatePassword = useCallback((collegeName) => {
        const cleanName = collegeName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
        const randomPart = Math.random().toString(36).slice(-6);
        const specialChars = '!@#$%';
        const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
        const randomNum = Math.floor(Math.random() * 100);
        return `${cleanName}${randomSpecial}${randomPart}${randomNum}`;
    }, []);

    const handleCollegeNameChange = useCallback((value) => {
        const password = value ? generatePassword(value) : '';
        setNewManagement(prev => ({ ...prev, collegeName: value, password }));
    }, [generatePassword]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError('');

        if (!newManagement.collegeName || !newManagement.principalName || !newManagement.email) {
            toast.warning('Please fill all required fields');
            return;
        }

        const emailPattern = /\.(edu|ac\.in|co\.in|edu\.in|org)$/i;
        if (!emailPattern.test(newManagement.email)) {
            setFormError('Please enter the college official E-mail Address (e.g., .edu, .ac.in)');
            return;
        }

        setIsAddingManagement(true);

        try {
            let logoUrl = null;
            if (modalLogoFile) {
                logoUrl = await compressLogoForModal(modalLogoFile);
            }

            await cloudFunctions.createManagement({
                collegeName: newManagement.collegeName,
                principalName: newManagement.principalName,
                email: newManagement.email,
                phone: newManagement.phone || '',
                password: newManagement.password,
                collegeLogo: logoUrl || null,
            });
            toast.success('Management added Successfully 🎉');

            setNewManagement({ collegeName: '', principalName: '', email: '', phone: '', password: '' });
            setModalLogoFile(null);
            setModalLogoPreview(null);
            onClose();
        } catch (error) {
            toast.error(`Failed to add management: ${error.message}`);
        } finally {
            setIsAddingManagement(false);
        }
    };

    const handleRemoveLogo = useCallback(() => {
        if (modalLogoPreview) URL.revokeObjectURL(modalLogoPreview);
        setModalLogoFile(null);
        setModalLogoPreview(null);
    }, [modalLogoPreview]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
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
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                            <Building2 size={20} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: isDark ? '#fff' : '#000' }}>
                            Add Management
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                            College Name *
                        </label>
                        <CollegeSelect
                            value={newManagement.collegeName}
                            onChange={handleCollegeNameChange}
                            isDark={isDark}
                            placeholder="Query or enter college name..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                            Principal Name *
                        </label>
                        <input
                            type="text"
                            value={newManagement.principalName}
                            onChange={(e) => setNewManagement(prev => ({ ...prev, principalName: e.target.value }))}
                            placeholder="Enter principal name"
                            className="w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            style={{
                                backgroundColor: isDark ? '#374151' : '#f9fafb',
                                borderColor: isDark ? '#4b5563' : '#d1d5db',
                                color: isDark ? '#fff' : '#000',
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                            Email Address *
                        </label>
                        <input
                            type="email"
                            value={newManagement.email}
                            onChange={(e) => {
                                setNewManagement(prev => ({ ...prev, email: e.target.value }));
                                if (formError) setFormError('');
                            }}
                            placeholder="principal@college.edu"
                            className="w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            style={{
                                backgroundColor: isDark ? '#374151' : '#f9fafb',
                                borderColor: formError ? '#ef4444' : (isDark ? '#4b5563' : '#d1d5db'),
                                color: isDark ? '#fff' : '#000',
                            }}
                        />
                        {formError && <p className="text-red-500 text-sm mt-1">{formError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={newManagement.phone}
                            onChange={(e) => setNewManagement(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+91 9876543210"
                            className="w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            style={{
                                backgroundColor: isDark ? '#374151' : '#f9fafb',
                                borderColor: isDark ? '#4b5563' : '#d1d5db',
                                color: isDark ? '#fff' : '#000',
                            }}
                        />
                    </div>

                    {/* College Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                            College Logo (Optional)
                        </label>
                        <p className="text-xs mb-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                            Recommended: <span style={{ color: '#10b981', fontWeight: 500 }}>400×400 pixels</span> for best results
                        </p>

                        {!modalLogoPreview ? (
                            <label
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:border-emerald-500/50"
                                style={{
                                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                                    backgroundColor: isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.5)',
                                    color: isDark ? '#9ca3af' : '#6b7280',
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 5 * 1024 * 1024) {
                                                toast.warning('Logo must be smaller than 5 MB');
                                                return;
                                            }
                                            setModalLogoFile(file);
                                            setModalLogoPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                <UploadIcon size={18} />
                                <span className="text-sm font-medium">Upload College Logo</span>
                            </label>
                        ) : (
                            <div
                                className="flex items-center gap-3 p-3 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? 'rgba(55, 65, 81, 0.3)' : '#f9fafb',
                                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                                }}
                            >
                                <img
                                    src={modalLogoPreview}
                                    alt="Logo preview"
                                    className="w-12 h-12 rounded-lg object-cover"
                                    style={{ border: '2px solid rgba(16, 185, 129, 0.3)' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: isDark ? '#fff' : '#000' }}>
                                        {modalLogoFile?.name}
                                    </p>
                                    <p className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Ready to upload</p>
                                </div>
                                <button
                                    type="button"
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
                                    style={{
                                        color: '#ef4444',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                    }}
                                    onClick={handleRemoveLogo}
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
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
                            disabled={isAddingManagement}
                            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAddingManagement ? (
                                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                    <HashLoader color="#ffffff" size={16} />
                                    <span className="text-sm">Adding Management...</span>
                                </div>
                            ) : (
                                'Add Management'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

AddManagementModal.displayName = 'AddManagementModal';

export default AddManagementModal;
