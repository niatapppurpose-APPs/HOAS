import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../components/Toast';
import Header from '../../../components/OwnerServices/header';
import * as cloudFunctions from '../../../firebase/cloudFunctions';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import {
  Settings,
  Shield,
  Users,
  AlertTriangle,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle,
  Info,
  Bell,
  FileText,
  BarChart3,
  Layers,
  Clock,
  ArrowRight,
  GraduationCap,
  UserCheck,
  Home,
  Sun,
  Moon,
  Monitor,
  Palette,
  User,
  Mail,
  UserMinus,
  Activity,
  ScrollText,
  Siren,
  Timer,
  MessageSquare,
  BellRing,
  ShieldCheck,
  Fingerprint,
  Key,
  LogOut,
} from 'lucide-react';

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
  const cfg = {
    active: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: 'Active' },
    secured: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', label: 'Secured' },
    warning: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Warning' },
    enabled: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: 'Enabled' },
    disabled: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: 'Disabled' },
    inactive: { bg: 'rgba(107,114,128,0.12)', text: '#6b7280', label: 'Inactive' },
  };
  const c = cfg[status] || cfg.active;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest select-none"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.text}22` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: c.text }} />
      {c.label}
    </span>
  );
};

/* ── Toggle Switch ── */
const ToggleSwitch = ({ enabled, onChange, disabled = false, size = 'md' }) => {
  const s = size === 'sm'
    ? { track: 'w-9 h-5', on: 'translate-x-4', off: 'translate-x-0.5', dot: 'w-3.5 h-3.5' }
    : { track: 'w-11 h-6', on: 'translate-x-5', off: 'translate-x-0.5', dot: 'w-4 h-4' };
  return (
    <button type="button" role="switch" aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)} disabled={disabled}
      className={`${s.track} relative inline-flex items-center rounded-full transition-all duration-300 focus:outline-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ backgroundColor: enabled ? '#6366f1' : 'var(--border-secondary)' }}>
      <span className={`${s.dot} inline-block rounded-full bg-white shadow-md transform transition-transform duration-300 ${enabled ? s.on : s.off}`} />
    </button>
  );
};

/* ── Section Card (static – no dropdown) ── */
const SectionCard = ({ title, icon: Icon, accent = '#6366f1', status, children }) => (
  <div className="rounded-2xl border overflow-hidden transition-shadow duration-300 hover:shadow-lg"
    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    {/* Header bar */}
    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-primary)', background: `${accent}06` }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Icon className="w-[18px] h-[18px]" style={{ color: accent }} />
        </div>
        <h3 className="font-semibold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      {status && <StatusBadge status={status} />}
    </div>
    {/* Body */}
    <div className="p-5">{children}</div>
  </div>
);

/* ── Setting Row ── */
const SettingRow = ({ icon: Icon, title, description, children, warning = false }) => (
  <div className="flex items-center justify-between py-3 px-4 rounded-xl gap-4"
    style={{
      backgroundColor: warning ? 'rgba(245,158,11,0.05)' : 'var(--bg-tertiary)',
      border: warning ? '1px solid rgba(245,158,11,0.18)' : '1px solid transparent',
    }}>
    <div className="flex items-center gap-3 min-w-0"> 
      {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0" style={{ color: warning ? '#f59e0b' : 'var(--text-muted)' }} />}
      <div className="min-w-0">
        <p className="font-medium text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{title}</p>
        {description && <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   DEFAULT SETTINGS
   ══════════════════════════════════════════════════════════════════════════════ */
const DEFAULT_SETTINGS = {
  registrationEnabled: true,
  approvalsEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please try again later.',
  defaultStudentLimit: 500,
  defaultWardenLimit: 10,
  defaultHostelLimit: 20,
  features: { notifications: true, reports: true, analytics: true, bulkOperations: true },
  complaintSlaHours: 48,
  autoEscalation: true,
  escalateToOwner: false,
  overdueThresholdHours: 72,
  smsEscalationAlerts: false,
  emailEscalationAlerts: true,
  emailNotifications: true,
  smsNotifications: false,
  criticalAlerts: true,
  activityNotifications: true,
  twoFactorEnabled: false,
  forcePasswordReset: false,
  autoLogoutMinutes: 30,
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
   ══════════════════════════════════════════════════════════════════════════════ */
const GlobalSystemSettings = () => {
  const { isCollapsed } = useOutletContext();
  const { user, logout, userData } = useAuth();
  const { theme, mode, setLightMode, setDarkMode, setSystemMode, isDark, isSystemMode } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [dataSource, setDataSource] = useState('local');

  /* ── Role & Access ── */
  const [mgmtUsers, setMgmtUsers] = useState([]);
  const [mgmtLoading, setMgmtLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setLoadError(null);
      const timeout = (p, ms = 25000) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), ms))]);
      const [res] = await Promise.allSettled([timeout(cloudFunctions.getSystemSettings())]);
      if (res.status === 'fulfilled') {
        setSettings(prev => ({ ...prev, ...(res.value?.settings || {}) }));
        setDataSource('server');
      } else {
        setDataSource('local');
        if (!initialLoad) toast.error('Could not reach server — using local defaults.');
        setLoadError(res.reason?.message || 'Connection failed');
      }
      setInitialLoad(false);
    } catch { setDataSource('local'); setInitialLoad(false); }
    finally { setLoading(false); }
  }, [toast, initialLoad]);

  const loadUsers = useCallback(async () => {
    setMgmtLoading(true);
    try { const r = await cloudFunctions.getAllManagementUsers(); setMgmtUsers(r?.users || []); }
    catch { setMgmtUsers([]); }
    finally { setMgmtLoading(false); }
  }, []);

  useEffect(() => { loadData(false); loadUsers(); }, []);

  const update = (u) => { setSettings(p => ({ ...p, ...u })); setHasChanges(true); };

  const save = async () => {
    setSaving(true);
    try { await cloudFunctions.updateSystemSettings(settings); toast.success('Settings saved'); setHasChanges(false); setDataSource('server'); }
    catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const toggleUser = async (uid, status) => {
    setBusy(uid);
    try {
      const next = status === 'approved' ? 'suspended' : 'approved';
      await setDoc(doc(db, 'users', uid), { status: next, updatedAt: new Date().toISOString() }, { merge: true });
      toast.success(`Account ${next === 'approved' ? 'activated' : 'deactivated'}`);
      loadUsers();
    } catch { toast.error('Action failed'); }
    finally { setBusy(null); }
  };

  const handleLogout = async () => {
    try { await logout(); toast.success('Logged out'); navigate('/', { replace: true }); }
    catch { toast.error('Logout failed'); }
  };

  const roleColor = r => ({ management: '#8b5cf6', principal: '#f59e0b', warden: '#22c55e', student: '#3b82f6' }[r] || '#6b7280');
  const secStatus = settings.twoFactorEnabled ? 'secured' : (settings.autoLogoutMinutes > 0 ? 'active' : 'warning');

  const themeModes = [
    { id: 'light', label: 'Light', sub: 'Bright & Clean', icon: Sun, set: setLightMode },
    { id: 'dark', label: 'Dark', sub: 'Easy on eyes', icon: Moon, set: setDarkMode },
    { id: 'system', label: 'System', sub: 'Auto switch', icon: Monitor, set: setSystemMode },
  ];

  return (
    <>
      <Header title="Settings" handleLogout={handleLogout} isCollapsed={isCollapsed} />
      <div className="flex pt-24 p-4 min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
         

            <div >
        {/* ── Alerts ── */}
        {dataSource === 'local' && !loading && loadError && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-3 border border-amber-500/25" style={{ backgroundColor: 'rgba(245,158,11,0.05)' }}>
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-500">Unable to reach server</p>
              <p className="text-[11px] text-amber-500/70 truncate">{loadError}</p>
            </div>
            <button onClick={() => loadData(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 cursor-pointer">Retry</button>
          </div>
        )}
        {settings.maintenanceMode && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-3 border border-amber-500/25" style={{ backgroundColor: 'rgba(245,158,11,0.05)' }}>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">Maintenance Mode is ACTIVE</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
           GRID LAYOUT — 2-column on desktop, 1-column on mobile
           ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl">

          {/* ── 1. Role & Access Management ── */}
          <SectionCard title="Role & Access" icon={Shield} accent="#f59e0b" status="active">
            <div className="space-y-5">
              <div className="flex items-center justify-start">
                <p className="relative left-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>Manage accounts & permissions</p>
                
              </div>

              {mgmtLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
              ) : mgmtUsers.length === 0 ? (
                <div className="text-center py-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <Users className="w-8 h-8 mx-auto mb-1.5" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>No users found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {mgmtUsers.map(u => {
                    const id = u.uid || u.id;
                    return (
                      <div key={id} className="flex items-center justify-between p-3 rounded-xl border"
                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
                            {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}><User className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /></div>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.displayName || u.email || 'Unknown'}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{u.email}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ backgroundColor: roleColor(u.role) + '20', color: roleColor(u.role) }}>{u.role || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={u.status === 'approved' ? 'active' : 'warning'} />
                          <button onClick={() => toggleUser(id, u.status)} disabled={busy === id}
                            className="p-1.5 rounded-lg transition cursor-pointer hover:bg-gray-500/20"
                            title={u.status === 'approved' ? 'Deactivate' : 'Activate'}>
                            {busy === id ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> :
                              u.status === 'approved' ? <UserMinus className="w-4 h-4 text-red-400" /> : <UserCheck className="w-4 h-4 text-emerald-400" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── 2. Complaint & Escalation ── */}
          <SectionCard title="Complaint & Escalation" icon={Siren} accent="#ef4444" status={settings.autoEscalation ? 'enabled' : 'disabled'}>
            <div className="space-y-2">
              <SettingRow icon={Timer} title="Complaint SLA" description="Default resolution time">
                <div className="flex items-center gap-2">
                  <input type="number" value={settings.complaintSlaHours || 48} onChange={e => update({ complaintSlaHours: parseInt(e.target.value) || 48 })} min={1} max={720} disabled={saving}
                    className="w-20 py-1.5 px-2 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>hrs</span>
                </div>
              </SettingRow>
              <SettingRow icon={Siren} title="Auto Escalation" description="Escalate unresolved complaints automatically">
                <ToggleSwitch enabled={settings.autoEscalation ?? true} onChange={v => update({ autoEscalation: v })} disabled={saving} />
              </SettingRow>
              <SettingRow icon={ArrowRight} title="Escalate to Owner" description="Final escalation reaches Owner" warning={settings.escalateToOwner}>
                <ToggleSwitch enabled={settings.escalateToOwner ?? false} onChange={v => update({ escalateToOwner: v })} disabled={saving} />
              </SettingRow>
              <SettingRow icon={Clock} title="Overdue Threshold" description="Mark overdue after this time">
                <div className="flex items-center gap-2">
                  <input type="number" value={settings.overdueThresholdHours || 72} onChange={e => update({ overdueThresholdHours: parseInt(e.target.value) || 72 })} min={1} max={720} disabled={saving}
                    className="w-20 py-1.5 px-2 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>hrs</span>
                </div>
              </SettingRow>
              <SettingRow icon={MessageSquare} title="SMS Escalation Alerts" description="SMS on complaint escalation">
                <ToggleSwitch enabled={settings.smsEscalationAlerts ?? false} onChange={v => update({ smsEscalationAlerts: v })} disabled={saving} />
              </SettingRow>
              <SettingRow icon={Mail} title="Email Escalation Alerts" description="Email on complaint escalation">
                <ToggleSwitch enabled={settings.emailEscalationAlerts ?? true} onChange={v => update({ emailEscalationAlerts: v })} disabled={saving} />
              </SettingRow>
            </div>
          </SectionCard>

          {/* ── 3. Notification Controls ── */}
          <SectionCard title="Notifications" icon={Bell} accent="#22c55e" status={settings.emailNotifications ? 'active' : 'inactive'}>
            <div className="space-y-2">
              <SettingRow icon={Mail} title="Email Notifications" description="Important updates via email">
                <ToggleSwitch enabled={settings.emailNotifications ?? true} onChange={v => update({ emailNotifications: v })} disabled={saving} />
              </SettingRow>
              <SettingRow icon={MessageSquare} title="SMS Notifications" description="SMS alerts for critical events">
                <ToggleSwitch enabled={settings.smsNotifications ?? false} onChange={v => update({ smsNotifications: v })} disabled={saving} />
              </SettingRow>
              <SettingRow icon={BellRing} title="Critical Alerts" description="High-priority system warnings" warning={!(settings.criticalAlerts ?? true)}>
                <ToggleSwitch enabled={settings.criticalAlerts ?? true} onChange={v => update({ criticalAlerts: v })} disabled={saving} />
              </SettingRow>
              <SettingRow icon={Activity} title="Activity Notifications" description="Logins, registrations & events">
                <ToggleSwitch enabled={settings.activityNotifications ?? true} onChange={v => update({ activityNotifications: v })} disabled={saving} />
              </SettingRow>
            </div>
          </SectionCard>

          {/* ── 4. Security & Platform ── */}
          <SectionCard title="Security & Platform" icon={ShieldCheck} accent="#3b82f6" status={secStatus}>
            <div className="space-y-3">
              <div className="space-y-2">
                <SettingRow icon={Fingerprint} title="Two-Factor Auth" description="Extra security layer for logins">
                  <ToggleSwitch enabled={settings.twoFactorEnabled ?? false} onChange={v => update({ twoFactorEnabled: v })} disabled={saving} />
                </SettingRow>
                <SettingRow icon={Key} title="Force Password Reset" description="All users must reset password" warning={settings.forcePasswordReset}>
                  <ToggleSwitch enabled={settings.forcePasswordReset ?? false} onChange={v => update({ forcePasswordReset: v })} disabled={saving} />
                </SettingRow>
                <SettingRow icon={LogOut} title="Auto Logout Timer" description="Logout after inactivity">
                  <div className="flex items-center gap-2">
                    <input type="number" value={settings.autoLogoutMinutes || 30} onChange={e => update({ autoLogoutMinutes: parseInt(e.target.value) || 30 })} min={5} max={480} disabled={saving}
                      className="w-20 py-1.5 px-2 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>min</span>
                  </div>
                </SettingRow>
                <SettingRow icon={ScrollText} title="Access Logs" description="Recent login & access activity">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                    View Logs
                  </button>
                </SettingRow>
              </div>

              {/* Security overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '2FA', on: settings.twoFactorEnabled ?? false, icon: Fingerprint },
                  { label: 'Force Reset', on: settings.forcePasswordReset ?? false, icon: Key },
                  { label: 'Auto Logout', on: (settings.autoLogoutMinutes || 0) > 0, icon: LogOut },
                  { label: 'Logs', on: true, icon: ScrollText },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <item.icon className="w-3.5 h-3.5" style={{ color: item.on ? '#22c55e' : '#ef4444' }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: item.on ? '#22c55e' : '#ef4444' }} />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* ── 5. Appearance (full width) ── */}
          <SectionCard title="Appearance" icon={Palette} accent="#ec4899">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                {themeModes.map(({ id, label, sub, icon: Icon, set }) => (
                  <button key={id} onClick={() => set()}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 flex-1 min-w-[100px] cursor-pointer ${mode === id ? 'shadow-lg shadow-indigo-500/20' : 'hover:border-slate-500'}`}
                    style={{ backgroundColor: mode === id ? '#6366f1' : 'var(--bg-tertiary)', borderColor: mode === id ? '#6366f1' : 'var(--border-secondary)' }}>
                    <Icon className="w-6 h-6 mb-1.5" style={{ color: mode === id ? '#fff' : 'var(--text-secondary)' }} />
                    <span className="font-semibold text-sm" style={{ color: mode === id ? '#fff' : 'var(--text-primary)' }}>{label}</span>
                    <span className="text-[10px] mt-0.5" style={{ color: mode === id ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{sub}</span>
                  </button>
                ))}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span>Using <strong style={{ color: 'var(--text-primary)' }}>{theme}</strong>{isSystemMode && ' (System)'}</span>
              </div>
            </div>
          </SectionCard>

          {/* ── 6. System Controls & Limits ── */}
          <SectionCard title="System Controls" icon={Settings} accent="#14b8a6" status={settings.maintenanceMode ? 'warning' : 'active'}>
            <div className="space-y-4">
              {/* Toggles */}
              <div className="space-y-2">
                {[
                  { key: 'registrationEnabled', t: 'User Registration', d: 'Allow new users to register', icon: UserCheck, offWarn: true },
                  { key: 'approvalsEnabled', t: 'Approval Workflows', d: 'Enable approval process', icon: CheckCircle },
                  { key: 'maintenanceMode', t: 'Maintenance Mode', d: 'System goes into maintenance', icon: AlertTriangle, onWarn: true },
                ].map(tg => {
                  const on = settings[tg.key];
                  const warn = (tg.onWarn && on) || (tg.offWarn && !on);
                  return (
                    <SettingRow key={tg.key} icon={tg.icon} title={tg.t} description={tg.d} warning={warn}>
                      <ToggleSwitch enabled={on} onChange={v => update({ [tg.key]: v })} disabled={saving} />
                    </SettingRow>
                  );
                })}
              </div>

              {settings.maintenanceMode && (
                <div className="p-3 rounded-xl border border-amber-500/25" style={{ backgroundColor: 'rgba(245,158,11,0.05)' }}>
                  <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Maintenance Message</label>
                  <textarea value={settings.maintenanceMessage || ''} onChange={e => update({ maintenanceMessage: e.target.value })}
                    className="w-full p-3 rounded-xl border resize-none text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    rows={2} placeholder="Message shown during maintenance..." />
                </div>
              )}

              {/* Feature Flags */}
              <div>
                <h4 className="text-[10px] font-bold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Feature Flags</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'notifications', t: 'Notifications', icon: Bell },
                    { key: 'reports', t: 'Reports', icon: FileText },
                    { key: 'analytics', t: 'Analytics', icon: BarChart3 },
                    { key: 'bulkOperations', t: 'Bulk Ops', icon: Layers },
                  ].map(f => {
                    const FIcon = f.icon;
                    const on = settings.features?.[f.key] !== false;
                    return (
                      <div key={f.key} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
                        <div className="flex items-center gap-2"><FIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /><span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{f.t}</span></div>
                        <ToggleSwitch enabled={on} onChange={v => update({ features: { ...settings.features, [f.key]: v } })} disabled={saving} size="sm" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Limits */}
              <div>
                <h4 className="text-[10px] font-bold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Default Limits</h4>
                <div className="space-y-2">
                  {[
                    { key: 'defaultStudentLimit', t: 'Student Limit', d: 'Max per hostel', icon: GraduationCap, max: 10000 },
                    { key: 'defaultWardenLimit', t: 'Warden Limit', d: 'Max per hostel', icon: Shield, max: 100 },
                    { key: 'defaultHostelLimit', t: 'Hostel Limit', d: 'Max per college', icon: Home, max: 500 },
                  ].map(l => (
                    <SettingRow key={l.key} icon={l.icon} title={l.t} description={l.d}>
                      <input type="number" value={settings[l.key] || 0} onChange={e => update({ [l.key]: parseInt(e.target.value) || 0 })} min={0} max={l.max} disabled={saving}
                        className="w-20 py-1.5 px-2 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                    </SettingRow>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Footer ── */}
        <div className="max-w-6xl mt-6 p-4 rounded-xl border flex items-start gap-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-400" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Owner-Level Settings</p>
            <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              These settings are restricted to the Owner role. System controls, permissions, and security apply platform-wide.
              Appearance preferences are stored locally. All other changes sync to the server upon saving.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-1 flex-col sm:flex-row items-start justify-end gap-4">

          <div className="flex flex-col items-center gap-3 flex-wrap">
            <div className="flex items-center gap-5" >
              <div>
                {loading ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Loader2 className="w-3 h-3 animate-spin" />Syncing</span>
                ) : dataSource === 'server' ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3 h-3" />Synced</span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><AlertTriangle className="w-3 h-3" />Local</span>
                )}
              </div>
              <button onClick={() => loadData(true)} disabled={loading}
                className="p-2.5 rounded-xl border transition hover:scale-105 cursor-pointer"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {hasChanges && (
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] disabled:opacity-50 cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
              </button>
            )}
          </div>

        </div>
      </div>
  

      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:4px}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:var(--border-secondary);border-radius:4px}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:var(--text-muted)}
      `}</style>
    </>
  );
};

export default GlobalSystemSettings;
