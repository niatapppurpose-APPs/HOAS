import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import { useTheme } from '../../../../context/ThemeContext';
import WardenHeader from '../layout/WardenHeader';
import { auth } from '../../../../firebase/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { updateProfile } from '../../../../firebase/cloudFunctions';
import PWAUpdateSettings from '../../../../components/PWAUpdateSettings';
import {
    Settings, Moon, Sun, Bell, Shield, Lock,
    Eye, EyeOff, Loader2, Check, User,
    Palette, BellRing, KeyRound, ChevronRight,
    Building2, Phone, Layout, RefreshCw
} from 'lucide-react';

const WardenSettings = () => {
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

    // Notification prefs (persisted under users/{uid})
    const [notifPrefs, setNotifPrefs] = useState({
        newComplaints: true,
        complaintUpdates: true,
        leaveRequests: true,
        systemAlerts: true,
        newStudents: true,
        soundAlerts: true,
    });
    const [prefsLoaded, setPrefsLoaded] = useState(false);

    // persist notification preferences
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

    const SettingsCard = ({ icon: Icon, title, description, children, iconColor = 'text-orange-500' }) => (
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
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${checked ? 'bg-orange-500' : ''}`}
                style={!checked ? { backgroundColor: 'var(--bg-tertiary)' } : undefined}
            >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );

    return (
        <>
            <WardenHeader
                title="Settings · Warden Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                <div className="mb-6">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                        <Settings className="inline w-6 h-6 text-gray-500 mr-2 -mt-1" />
                        Warden Settings
                    </h2>
                    <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
                        Manage your account, appearance, and notification preferences
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
                                    onClick={() => navigate('/dashboard/warden', { state: { startTour: true } })}
                                    className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
                                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <Layout className="w-4 h-4 text-purple-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Restart Dashboard Tour</p>
                                            <p className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>Explore portal features again</p>
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
                                checked={notifPrefs.newComplaints}
                                onChange={() => updatePref('newComplaints')}
                                label="New Complaints"
                            />
                            <Toggle
                                checked={notifPrefs.complaintUpdates}
                                onChange={() => updatePref('complaintUpdates')}
                                label="Complaint Status Changes"
                            />
                            <Toggle
                                checked={notifPrefs.leaveRequests}
                                onChange={() => updatePref('leaveRequests')}
                                label="Leave Requests"
                            />
                            <Toggle
                                checked={notifPrefs.newStudents}
                                onChange={() => updatePref('newStudents')}
                                label="New Student Registrations"
                            />
                            <Toggle
                                checked={notifPrefs.soundAlerts}
                                onChange={() => updatePref('soundAlerts')}
                                label="Sound Alerts"
                            />
                            <Toggle
                                checked={notifPrefs.systemAlerts}
                                onChange={() => updatePref('systemAlerts')}
                                label="System Alerts"
                            />
                        </div>
                    </SettingsCard>

                    {/* PWA App Updates */}
                    <SettingsCard icon={RefreshCw} title="App Updates" description="Control how the app updates" iconColor="text-violet-500">
                        <PWAUpdateSettings />
                    </SettingsCard>

                    {/* Account Info */}
                    <SettingsCard icon={User} title="Account Information" description="Your warden account details" iconColor="text-orange-500">
                        <div className="space-y-3">
                            {[
                                { label: 'Name', value: userData?.fullName || '—' },
                                { label: 'Role', value: 'Warden' },
                                { label: 'College', value: userData?.collegeName || '—' },
                                { label: 'Phone', value: userData?.phone || '—' },
                                { label: 'Department', value: userData?.department || '—' },
                                { label: 'Status', value: userData?.status || 'active', isStatus: true },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-1.5">
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                                    {item.isStatus ? (
                                        <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase ${item.value === 'approved' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                            }`}>{item.value}</span>
                                    ) : (
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                                    )}
                                </div>
                            ))}
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

export default WardenSettings;
