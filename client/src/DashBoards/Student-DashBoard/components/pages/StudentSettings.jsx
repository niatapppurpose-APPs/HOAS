import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import { useTheme } from '../../../../context/ThemeContext';
import StudentHeader from '../layout/StudentHeader';
import { auth } from '../../../../firebase/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { updateProfile } from '../../../../firebase/cloudFunctions';
import PWAUpdateSettings from '../../../../components/PWAUpdateSettings';
// import { useNotifications } from '../../../../context/NotificationContext';
import {
    Settings, Moon, Sun, Bell, Shield, Lock,
    Eye, EyeOff, Loader2, Check, User,
    Globe, Palette, BellRing, KeyRound,
    Monitor, ChevronRight, Layout, RefreshCw, Trash2, FileText, XCircle
} from 'lucide-react';

const StudentSettings = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const toast = useToast();

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false, new: false, confirm: false
    });
    const [changingPassword, setChangingPassword] = useState(false);

    // Notification prefs (persisted in Firestore under users/{uid})
    const [notifPrefs, setNotifPrefs] = useState({
        complaints: true,
        leaveUpdates: true,
        announcements: true,
        systemAlerts: true,
        soundAlerts: true,
    });
    const [prefsLoaded, setPrefsLoaded] = useState(false);

    // load / save notification preferences when userData.uid changes
    useEffect(() => {
        if (!userData?.uid) return;
        if (userData?.notificationPrefs) {
            setNotifPrefs(userData.notificationPrefs);
        }
        setPrefsLoaded(true);
    }, [userData?.uid]);

    useEffect(() => {
        if (!prefsLoaded || !userData?.uid) return;
        updateProfile({ notificationPrefs: notifPrefs }).catch(err => console.error('Failed to save notification prefs', err));
    }, [notifPrefs, prefsLoaded, userData?.uid]);

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Please fill all password fields');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setChangingPassword(true);
        try {
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, passwordData.newPassword);
            toast.success('Password changed successfully!');
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Password change error:', error);
            if (error.code === 'auth/wrong-password') {
                toast.error('Current password is incorrect');
            } else if (error.code === 'auth/requires-recent-login') {
                toast.error('Please log out and log in again before changing password');
            } else {
                toast.error('Failed to change password: ' + error.message);
            }
        } finally {
            setChangingPassword(false);
        }
    };

    const updatePref = (key) => {
        setNotifPrefs(p => {
            const updated = { ...p, [key]: !p[key] };
            if (userData?.uid) {
                updateProfile({ notificationPrefs: updated })
                    .then(() => toast.success('Notification preferences saved'))
                    .catch(err => {
                        console.error('Failed to save notification prefs', err);
                        toast.error('Could not save preferences');
                    });
            }
            return updated;
        });
    };

    const [trashedItems, setTrashedItems] = useState([]);
    const [loadingTrash, setLoadingTrash] = useState(true);

    useEffect(() => {
        const fetchTrash = async () => {
            if (!userData?.uid) return;
            try {
                const stored = localStorage.getItem(`trashedFeeReports_${userData.uid}`);
                let currentTrash = stored ? JSON.parse(stored) : [];
                const now = new Date();
                
                // Auto-delete items older than 15 days
                const filteredTrash = currentTrash.filter(item => {
                    const trashedDate = new Date(item.trashedAt);
                    const diffTime = Math.abs(now - trashedDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 15;
                });

                // If items were auto-deleted, persist the filtered list
                if (filteredTrash.length !== currentTrash.length) {
                    localStorage.setItem(`trashedFeeReports_${userData.uid}`, JSON.stringify(filteredTrash));
                }

                setTrashedItems(filteredTrash);
            } catch (error) {
                console.error("Error fetching trash:", error);
            } finally {
                setLoadingTrash(false);
            }
        };

        fetchTrash();
    }, [userData?.uid]);

    const handleRestoreItem = async (index) => {
        if (!userData?.uid) return;
        try {
            const itemToRestore = trashedItems[index];
            const updatedTrash = trashedItems.filter((_, i) => i !== index);
            
            // Remove 'trashedAt' for restoration
            const { trashedAt, ...restoredItem } = itemToRestore;

            localStorage.setItem(`trashedFeeReports_${userData.uid}`, JSON.stringify(updatedTrash));
            
            setTrashedItems(updatedTrash);
            toast.success("Document restored from trash");
        } catch (error) {
            toast.error("Failed to restore document");
        }
    };

    const handlePermanentDelete = async (index) => {
        const confirm = await toast.confirm("Permanently delete this document? This action cannot be undone.");
        if (!confirm || !userData?.uid) return;

        try {
            const updatedTrash = trashedItems.filter((_, i) => i !== index);
            localStorage.setItem(`trashedFeeReports_${userData.uid}`, JSON.stringify(updatedTrash));
            
            setTrashedItems(updatedTrash);
            toast.success("Document permanently deleted");
        } catch (error) {
            toast.error("Failed to delete document");
        }
    };

    const SettingsCard = ({ icon: Icon, title, description, children, iconColor = 'text-blue-500' }) => (
        <div className="rounded-2xl border p-5 md:p-6 transition-all hover:shadow-md"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-2.5 rounded-xl bg-opacity-10 ${iconColor.replace('text-', 'bg-')}/10`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                    <p className="text-xs mt-0.5 opacity-60" style={{ color: 'var(--text-muted)' }}>{description}</p>
                    <div className="mt-4">{children}</div>
                </div>
            </div>
        </div>
    );

    const Toggle = ({ checked, onChange, label }) => (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <button
                onClick={onChange}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${checked ? 'bg-blue-600' : ''}`}
                style={!checked ? { backgroundColor: 'var(--bg-tertiary)' } : undefined}
            >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );

    return (
        <>
            <StudentHeader
                title="Settings · Student Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                <div className="mb-6">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                        <Settings className="inline w-6 h-6 text-gray-500 mr-2 -mt-1" />
                        Settings
                    </h2>
                    <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
                        Manage your account preferences and security settings
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                    {/* Appearance */}
                    <SettingsCard icon={Palette} title="Appearance" description="Customize your visual experience" iconColor="text-purple-500">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="flex items-center gap-3">
                                    {isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                                        <p className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>Currently using {isDark ? 'dark' : 'light'} theme</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isDark ? 'bg-indigo-600' : 'bg-amber-400'}`}
                                >
                                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${isDark ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'}`}>
                                        {isDark ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                                    </div>
                                </button>
                            </div>

                            <div className="pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                <button
                                    onClick={() => navigate('/dashboard/student', { state: { startTour: true } })}
                                    className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
                                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <Layout className="w-4 h-4 text-purple-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Restart Dashboard Tour</p>
                                            <p className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>Learn how to use your portal</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            </div>
                        </div>
                    </SettingsCard>

                    {/* Security */}
                    <SettingsCard icon={Shield} title="Security" description="Password and account security" iconColor="text-green-500">
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <KeyRound className="w-4 h-4 text-green-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Change Password</p>
                                        <p className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>Update your login password</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            </button>

                            <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="flex items-center gap-3">
                                    <Lock className="w-4 h-4 text-green-500" />
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Login Email</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{userData?.email || auth.currentUser?.email || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SettingsCard>

                    {/* Notifications */}
                    <SettingsCard icon={BellRing} title="Notifications" description="Control what alerts you receive" iconColor="text-amber-500">
                        <div className="space-y-1">
                            <Toggle
                                checked={notifPrefs.complaints}
                                onChange={() => updatePref('complaints')}
                                label="Complaint Updates"
                            />
                            <Toggle
                                checked={notifPrefs.leaveUpdates}
                                onChange={() => updatePref('leaveUpdates')}
                                label="Leave Request Updates"
                            />
                            <Toggle
                                checked={notifPrefs.announcements}
                                onChange={() => updatePref('announcements')}
                                label="New Announcements"
                            />
                            <Toggle
                                checked={notifPrefs.systemAlerts}
                                onChange={() => updatePref('systemAlerts')}
                                label="System Alerts"
                            />
                            <Toggle
                                checked={notifPrefs.soundAlerts}
                                onChange={() => updatePref('soundAlerts')}
                                label="Sound Alerts"
                            />
                        </div>
                    </SettingsCard>

                    {/* Account Info */}
                    <SettingsCard icon={User} title="Account Information" description="Your account details" iconColor="text-blue-500">
                        <div className="space-y-3">
                            {[
                                { label: 'Name', value: userData?.fullName || '—' },
                                { label: 'Role', value: 'Student' },
                                { label: 'College', value: userData?.collegeName || '—' },
                                { label: 'Room', value: userData?.roomNumber || '—' },
                                { label: 'Hostel Block', value: userData?.hostelBlock || '—' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-1.5">
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </SettingsCard>

                    {/* App Updates */}
                    <SettingsCard icon={RefreshCw} title="App Updates" description="Control how the app updates" iconColor="text-violet-500">
                        <PWAUpdateSettings />
                    </SettingsCard>

                    {/* Trash Management */}
                    <SettingsCard icon={Trash2} title="Trash Management" description="Items are kept for 15 days before permanent deletion" iconColor="text-rose-500">
                        <div className="space-y-3">
                            {loadingTrash ? (
                                <div className="py-6 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                </div>
                            ) : trashedItems.length > 0 ? (
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                    {trashedItems.map((item, i) => {
                                        const trashedDate = new Date(item.trashedAt);
                                        const expiryDate = new Date(trashedDate);
                                        expiryDate.setDate(expiryDate.getDate() + 15);
                                        const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                                        
                                        return (
                                            <div key={i} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border transition-all" style={{ borderColor: 'var(--border-disabled)', backgroundColor: 'var(--bg-tertiary)' }}>
                                                <div className="flex items-center gap-4 mb-3 sm:mb-0 w-full sm:w-auto">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                                                        <FileText className="w-5 h-5 opacity-60 text-rose-500" />
                                                    </div>
                                                    <div className="min-w-0" style={{ width: 'calc(100% - 60px)' }}>
                                                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.name || 'Untitled Document'}</p>
                                                        <p className="text-[10px] font-medium uppercase tracking-wider text-rose-500 mt-1">Deleted: {trashedDate.toLocaleDateString()} • {daysLeft} days left</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0" style={{ borderColor: 'var(--border-primary)' }}>
                                                    <button onClick={() => handleRestoreItem(i)} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors">
                                                        Restore
                                                    </button>
                                                    <button onClick={() => handlePermanentDelete(i)} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors">
                                                        <XCircle className="w-4 h-4 inline sm:hidden mr-1" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 flex flex-col items-center justify-center opacity-60 border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                                    <Trash2 className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} />
                                    <p className="text-sm font-medium text-center" style={{ color: 'var(--text-muted)' }}>Your trash is empty.</p>
                                </div>
                            )}
                        </div>
                    </SettingsCard>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPasswordModal(false)}>
                    <div className="w-full max-w-md rounded-2xl border p-6 md:p-8 shadow-2xl"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                        onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-black mb-6" style={{ color: 'var(--text-primary)' }}>
                            <KeyRound className="inline w-5 h-5 text-green-500 mr-2 -mt-0.5" />
                            Change Password
                        </h3>

                        <div className="space-y-4">
                            {[
                                { name: 'currentPassword', label: 'Current Password', key: 'current' },
                                { name: 'newPassword', label: 'New Password', key: 'new' },
                                { name: 'confirmPassword', label: 'Confirm New Password', key: 'confirm' },
                            ].map((field) => (
                                <div key={field.name}>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                        {field.label}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords[field.key] ? 'text' : 'password'}
                                            value={passwordData[field.name]}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                            className="w-full px-4 py-2.5 pr-10 rounded-xl border text-sm"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => ({ ...p, [field.key]: !p[field.key] }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {showPasswords[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="px-5 py-2.5 rounded-xl border text-sm font-bold"
                                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                disabled={changingPassword}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {changingPassword ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentSettings;
