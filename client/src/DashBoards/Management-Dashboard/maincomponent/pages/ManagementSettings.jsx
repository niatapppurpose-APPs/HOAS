import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseConfig';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useToast } from '../../../../components/Toast';
import LocationAutocomplete from '../../../../components/LocationAutocomplete';
import ManagementHeader from '../../components/layout/ManagementHeader';
import { MapPin, Save, Building2, Loader2, CheckCircle } from 'lucide-react';

const ManagementSettings = () => {
    const { user, userData } = useAuth();
    const { isDark } = useTheme();
    const { isCollapsed } = useOutletContext();
    const toast = useToast();

    const [collegeLocation, setCollegeLocation] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load current location from userData
    useEffect(() => {
        if (userData?.collegeLocation) {
            setCollegeLocation(userData.collegeLocation);
        }
    }, [userData]);

    // Track changes
    useEffect(() => {
        const currentLocation = userData?.collegeLocation || '';
        setHasChanges(collegeLocation !== currentLocation);
        setSaved(false);
    }, [collegeLocation, userData]);

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
            />

            <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
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
            </div>
        </>
    );
};

export default ManagementSettings;
