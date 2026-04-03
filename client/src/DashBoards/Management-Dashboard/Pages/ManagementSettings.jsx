import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../components/Toast';
import LocationAutocomplete from '../../../components/LocationAutocomplete';
import ManagementHeader from '../components/layout/ManagementHeader';
import { MapPin, Save, Building2, Loader2, CheckCircle, ImagePlus, Upload, X, Camera, Layout } from 'lucide-react';
import AppLogo4k from '../../../assets/AppLogo4k.png';

/** Compress an image File to a base64 string ≤ maxKB. */
function compressImage(file, maxKB = 200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const maxDim = 600;
                if (width > maxDim || height > maxDim) {
                    const ratio = Math.min(maxDim / width, maxDim / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                let quality = 0.9;
                let result;
                do {
                    result = canvas.toDataURL('image/jpeg', quality);
                    quality -= 0.1;
                } while (result.length > maxKB * 1024 * 1.37 && quality > 0.1);
                resolve(result);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const ManagementSettings = () => {
    const { user, userData } = useAuth();
    const { isDark } = useTheme();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const navigate = useNavigate();
    const toast = useToast();

    // ── Location state ──
    const [collegeLocation, setCollegeLocation] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // ── Logo state ──
    const [logoPreview, setLogoPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLogoSaving, setIsLogoSaving] = useState(false);
    const [logoSaved, setLogoSaved] = useState(false);
    const fileInputRef = useRef(null);

    // Load location + logo from userData
    useEffect(() => {
        if (userData?.collegeLocation) setCollegeLocation(userData.collegeLocation);
        if (userData?.collegeLogo) setLogoPreview(userData.collegeLogo);
    }, [userData]);

    // Track location changes
    useEffect(() => {
        const currentLocation = userData?.collegeLocation || '';
        setHasChanges(collegeLocation !== currentLocation);
        setSaved(false);
    }, [collegeLocation, userData]);

    // ── Logo handlers ──
    const processLogoFile = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            toast.error('Please select a valid image file (PNG, JPG, etc.)');
            return;
        }
        try {
            const compressed = await compressImage(file, 200);
            setLogoPreview(compressed);
            setLogoSaved(false);
        } catch {
            toast.error('Failed to process image. Try another file.');
        }
    };

    const handleFileInput = (e) => processLogoFile(e.target.files?.[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processLogoFile(e.dataTransfer.files?.[0]);
    };

    const handleSaveLogo = async () => {
        if (!user || !logoPreview) return;
        setIsLogoSaving(true);
        try {
            await setDoc(
                doc(db, 'users', user.uid),
                { collegeLogo: logoPreview, updatedAt: new Date().toISOString() },
                { merge: true }
            );
            toast.success('College logo updated! 🎉');
            setLogoSaved(true);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save logo. Please try again.');
        } finally {
            setIsLogoSaving(false);
        }
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        setLogoSaved(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const hasLogoChanged = logoPreview !== (userData?.collegeLogo || null);

    const handleSave = async () => {
        if (!user) {
            toast.error('You must be signed in');
            return;
        }

        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(
                userDocRef,
                {
                    collegeLocation: collegeLocation.trim(),
                    updatedAt: new Date().toISOString(),
                },
                { merge: true }
            );

            toast.success('Location updated successfully! 📍');
            setSaved(true);
            setHasChanges(false);
        } catch (error) {
            console.error('Error updating location:', error);
            toast.error('Failed to update location. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <ManagementHeader
                title="Settings"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-20 sm:pt-24 px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h2
                        className="text-2xl md:text-3xl font-bold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        College Settings
                    </h2>
                    <p
                        className="mt-2 text-sm md:text-base"
                        style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}
                    >
                        Update your college information and preferences
                    </p>
                </div>
                <div className='flex justify-around items-center'>
                    {/* Settings Card */}
                    <div
                        className="max-w-2xl rounded-2xl p-6 sm:p-8 border"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-primary)',
                        }}
                    >
                        {/* College Info Section */}
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                            <div
                                className="p-2.5 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                                }}
                            >
                                <Building2
                                    className="w-5 h-5"
                                    style={{ color: 'var(--accent-primary, #6366f1)' }}
                                />
                            </div>
                            <div>
                                <h3
                                    className="text-lg font-semibold"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {userData?.collegeName || 'Your College'}
                                </h3>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Manage your college details
                                </p>
                            </div>
                        </div>

                        {/* Location Field */}
                        <div className="space-y-4">
                            <div>
                                <label
                                    className="flex items-center gap-2 text-sm font-medium mb-3"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <MapPin className="w-4 h-4 text-emerald-500" />
                                    College Location
                                </label>

                                <LocationAutocomplete
                                    value={collegeLocation}
                                    onChange={(val) => setCollegeLocation(val)}
                                    onSelect={(suggestion) => setCollegeLocation(suggestion.display_name)}
                                    placeholder="Search your college location..."
                                />

                                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Start typing to see location suggestions. This will be visible to the system owner.
                                </p>
                            </div>

                            {/* Current Location Display */}
                            {userData?.collegeLocation && !hasChanges && (
                                <div
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl"
                                    style={{
                                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                    }}
                                >
                                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Current location: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{userData.collegeLocation}</span>
                                    </p>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !hasChanges || !collegeLocation.trim()}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: hasChanges
                                            ? 'linear-gradient(135deg, #10b981, #059669)'
                                            : 'var(--bg-tertiary)',
                                        boxShadow: hasChanges
                                            ? '0 4px 15px rgba(16, 185, 129, 0.3)'
                                            : 'none',
                                        color: hasChanges ? '#fff' : 'var(--text-muted)',
                                    }}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : saved ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Saved!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Location
                                        </>
                                    )}
                                </button>

                                {hasChanges && (
                                    <button
                                        onClick={() => setCollegeLocation(userData?.collegeLocation || '')}
                                        className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                        style={{
                                            color: 'var(--text-muted)',
                                            backgroundColor: 'var(--bg-tertiary)',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── College Logo Section ── */}
                    <div
                        className="max-w-2xl rounded-2xl p-6 sm:p-8 border mt-6"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                            <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))' }}>
                                <Camera className="w-5 h-5" style={{ color: 'var(--accent-primary,#6366f1)' }} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>College Logo</h3>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Upload your college branding — used across the dashboard &amp; profile banner</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            {/* Dropzone */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className="relative flex-shrink-0 w-36 h-36 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden"
                                style={{
                                    border: isDragging
                                        ? '2px dashed #6366f1'
                                        : logoPreview ? '2px solid rgba(99,102,241,0.3)' : '2px dashed rgba(99,102,241,0.4)',
                                    backgroundColor: isDragging ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
                                    transform: isDragging ? 'scale(1.03)' : 'scale(1)',
                                }}
                            >
                                {logoPreview ? (
                                    <>
                                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <ImagePlus className="w-8 h-8 mb-2" style={{ color: 'rgba(99,102,241,0.6)' }} />
                                        <span className="text-xs text-center px-2" style={{ color: 'var(--text-muted)' }}>
                                            {isDragging ? 'Drop it here!' : 'Click or drag & drop'}
                                        </span>
                                    </>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileInput}
                            />

                            {/* Info + actions */}
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Logo Requirements</p>
                                    <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                                        <li>• PNG, JPG, SVG or WEBP</li>
                                        <li>• Auto-compressed to ≤ 200 KB</li>
                                        <li>• Recommended: square or landscape</li>
                                        <li>• Color is sampled for the profile banner</li>
                                    </ul>
                                </div>

                                {/* Current logo indicator */}
                                {userData?.collegeLogo && !hasLogoChanged && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Logo already uploaded</p>
                                    </div>
                                )}

                                {/* Save button */}
                                <button
                                    onClick={handleSaveLogo}
                                    disabled={isLogoSaving || !logoPreview || !hasLogoChanged}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: hasLogoChanged && logoPreview
                                            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                            : 'var(--bg-tertiary)',
                                        boxShadow: hasLogoChanged && logoPreview ? '0 4px 15px rgba(99,102,241,0.35)' : 'none',
                                        color: hasLogoChanged && logoPreview ? '#fff' : 'var(--text-muted)',
                                    }}
                                >
                                    {isLogoSaving ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                                    ) : logoSaved ? (
                                        <><CheckCircle className="w-4 h-4" />Saved!</>
                                    ) : (
                                        <><Upload className="w-4 h-4" />Save Logo</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Dashboard Tour Section ── */}
                    <div
                        className="max-w-2xl rounded-2xl p-6 sm:p-8 border mt-6"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                    >
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                            <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))' }}>
                                <Layout className="w-5 h-5" style={{ color: 'var(--accent-primary,#6366f1)' }} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Interactive Tour</h3>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Re-run the dashboard onboarding tour to see all available management features.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/dashboard/management', { state: { startTour: true } })}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
                            }}
                        >
                            Restart Dashboard Tour
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ManagementSettings;
