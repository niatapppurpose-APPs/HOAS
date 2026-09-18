/**
 * useSystemSettings Hook
 * 
 * Custom hook for checking and enforcing global system settings.
 * Used to enforce maintenance mode, registration status, feature flags, etc.
 */

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import * as cloudFunctions from '../firebase/cloudFunctions';

// Default settings to use when not yet loaded
// Canonical UI shape: flat notification/limit fields + nested features/notifications
// for backend compatibility. normalizeSettings() merges both shapes on load.
export const DEFAULT_SETTINGS = {
  registrationEnabled: true,
  approvalsEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please try again later.',
  defaultStudentLimit: 500,
  defaultWardenLimit: 10,
  defaultHostelLimit: 20,
  limits: {
    maxStudentsPerCollege: 500,
    maxWardensPerCollege: 10,
    maxHostelsPerCollege: 20,
  },
  features: {
    notifications: true,
    reports: true,
    analytics: true,
    bulkOperations: true,
    outings: true,
    announcements: true,
    feesAutoVerify: true,
  },
  notifications: {
    email: true,
    sms: false,
    criticalAlerts: true,
    activity: true,
  },
  // Complaint & escalation defaults
  complaintSlaHours: 48,
  autoEscalation: true,
  escalateToOwner: false,
  overdueThresholdHours: 72,
  smsEscalationAlerts: false,
  emailEscalationAlerts: true,
  // Notification defaults (flat aliases used by Owner Settings UI)
  emailNotifications: true,
  smsNotifications: false,
  criticalAlerts: true,
  activityNotifications: true,
  // Security defaults
  twoFactorEnabled: false,
  forcePasswordReset: false,
  autoLogoutMinutes: 0,
};

/**
 * Merge server payload (nested canonical + optional flat aliases)
 * into the flat UI shape every screen reads.
 */
export const normalizeSettings = (serverSettings) => {
  if (!serverSettings) return { ...DEFAULT_SETTINGS };
  const s = serverSettings;
  const notifications = {
    email: s.notifications?.email ?? s.emailNotifications ?? DEFAULT_SETTINGS.notifications.email,
    sms: s.notifications?.sms ?? s.smsNotifications ?? DEFAULT_SETTINGS.notifications.sms,
    criticalAlerts:
      s.notifications?.criticalAlerts ?? s.criticalAlerts ?? DEFAULT_SETTINGS.notifications.criticalAlerts,
    activity: s.notifications?.activity ?? s.activityNotifications ?? DEFAULT_SETTINGS.notifications.activity,
  };
  const limits = {
    maxStudentsPerCollege:
      s.limits?.maxStudentsPerCollege ?? s.defaultStudentLimit ?? DEFAULT_SETTINGS.limits.maxStudentsPerCollege,
    maxWardensPerCollege:
      s.limits?.maxWardensPerCollege ?? s.defaultWardenLimit ?? DEFAULT_SETTINGS.limits.maxWardensPerCollege,
    maxHostelsPerCollege:
      s.limits?.maxHostelsPerCollege ?? s.defaultHostelLimit ?? DEFAULT_SETTINGS.limits.maxHostelsPerCollege,
  };
  const features = {
    ...DEFAULT_SETTINGS.features,
    ...(s.features || {}),
  };
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    notifications,
    limits,
    features,
    emailNotifications: notifications.email,
    smsNotifications: notifications.sms,
    criticalAlerts: notifications.criticalAlerts,
    activityNotifications: notifications.activity,
    defaultStudentLimit: limits.maxStudentsPerCollege,
    defaultWardenLimit: limits.maxWardensPerCollege,
    defaultHostelLimit: limits.maxHostelsPerCollege,
  };
};

/**
 * Build the save payload from UI state: send BOTH nested canonical
 * and flat aliases so any backend version persists every toggle —
 * especially the SMS (SIM) notification switch.
 */
export const denormalizeSettingsForSave = (ui) => {
  const features = { ...(ui.features || {}) };
  const notifications = {
    email: ui.emailNotifications ?? ui.notifications?.email ?? true,
    sms: ui.smsNotifications ?? ui.notifications?.sms ?? false,
    criticalAlerts: ui.criticalAlerts ?? ui.notifications?.criticalAlerts ?? true,
    activity: ui.activityNotifications ?? ui.notifications?.activity ?? true,
  };
  const limits = {
    maxStudentsPerCollege: Number(ui.defaultStudentLimit ?? ui.limits?.maxStudentsPerCollege ?? 500),
    maxWardensPerCollege: Number(ui.defaultWardenLimit ?? ui.limits?.maxWardensPerCollege ?? 10),
    maxHostelsPerCollege: Number(ui.defaultHostelLimit ?? ui.limits?.maxHostelsPerCollege ?? 20),
  };
  return {
    ...ui,
    notifications,
    features,
    limits,
    emailNotifications: notifications.email,
    smsNotifications: notifications.sms,
    criticalAlerts: notifications.criticalAlerts,
    activityNotifications: notifications.activity,
    defaultStudentLimit: limits.maxStudentsPerCollege,
    defaultWardenLimit: limits.maxWardensPerCollege,
    defaultHostelLimit: limits.maxHostelsPerCollege,
  };
};

// Context for sharing system settings across the app
const SystemSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  error: null,
  refresh: () => { },
  isFeatureEnabled: () => true,
  isMaintenanceMode: () => false,
  isRegistrationEnabled: () => true,
  isApprovalsEnabled: () => true,
  isEmailEnabled: () => true,
  isSmsEnabled: () => false,
  isCriticalAlertsEnabled: () => true,
  isActivityEnabled: () => true,
});

/**
 * System Settings Provider Component
 * Wrap your app with this to enable system settings access throughout
 */
export const SystemSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Load settings via cloud function (more reliable than direct Firestore)
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent hanging (longer timeout for cold starts)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 25000)
      );

      const result = await Promise.race([
        cloudFunctions.getSystemSettings(),
        timeoutPromise
      ]);

      if (mountedRef.current) {
        if (result?.settings) {
          setSettings(normalizeSettings(result.settings));
        } else {
          setSettings({ ...DEFAULT_SETTINGS });
        }
        setLoading(false);
        setError(null);
        retryCountRef.current = 0;
      }
    } catch (err) {

      if (mountedRef.current) {
        // Use defaults on error so the app still works
        setSettings(DEFAULT_SETTINGS);
        setError(err.message);
        setLoading(false);

        // Auto-retry with backoff (max 3 times)
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const backoffMs = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
          setTimeout(() => {
            if (mountedRef.current) {
              loadSettings();
            }
          }, backoffMs);
        }
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadSettings();

    return () => {
      mountedRef.current = false;
    };
  }, [loadSettings]);

  // Manual refresh function (reuses loadSettings)
  const refresh = useCallback(() => {
    retryCountRef.current = 0;
    return loadSettings();
  }, [loadSettings]);

  // Helper functions
  const isFeatureEnabled = useCallback((featureName) => {
    return settings.features?.[featureName] !== false;
  }, [settings]);

  const isMaintenanceMode = useCallback(() => {
    return settings.maintenanceMode === true;
  }, [settings]);

  const isRegistrationEnabled = useCallback(() => {
    return settings.registrationEnabled !== false;
  }, [settings]);

  const isApprovalsEnabled = useCallback(() => {
    return settings.approvalsEnabled !== false;
  }, [settings]);

  // Notification channel helpers — every toggle on the Owner Settings
  // Notifications card maps to one of these. SMS == "SIM" switch.
  const isEmailEnabled = useCallback(() => {
    return (settings.emailNotifications ?? settings.notifications?.email) !== false;
  }, [settings]);

  const isSmsEnabled = useCallback(() => {
    return (settings.smsNotifications ?? settings.notifications?.sms) === true;
  }, [settings]);

  const isCriticalAlertsEnabled = useCallback(() => {
    return (settings.criticalAlerts ?? settings.notifications?.criticalAlerts) !== false;
  }, [settings]);

  const isActivityEnabled = useCallback(() => {
    return (settings.activityNotifications ?? settings.notifications?.activity) !== false;
  }, [settings]);

  const value = {
    settings,
    loading,
    error,
    refresh,
    isFeatureEnabled,
    isMaintenanceMode,
    isRegistrationEnabled,
    isApprovalsEnabled,
    isEmailEnabled,
    isSmsEnabled,
    isCriticalAlertsEnabled,
    isActivityEnabled,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

/**
 * Hook to access system settings
 */
export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      loading: false,
      error: null,
      refresh: () => { },
      isFeatureEnabled: () => true,
      isMaintenanceMode: () => false,
      isRegistrationEnabled: () => true,
      isApprovalsEnabled: () => true,
      isEmailEnabled: () => true,
      isSmsEnabled: () => false,
      isCriticalAlertsEnabled: () => true,
      isActivityEnabled: () => true,
    };
  }
  return context;
};

/**
 * Hook to check college capacity before allowing user registration
 */
export const useCollegeCapacity = (collegeId, role) => {
  const [capacity, setCapacity] = useState({
    loading: true,
    allowed: true,
    currentCount: 0,
    maxLimit: 0,
    remaining: 0,
    error: null,
  });

  useEffect(() => {
    if (!collegeId || !role) {
      setCapacity(prev => ({ ...prev, loading: false }));
      return;
    }

    const checkCapacity = async () => {
      try {
        const result = await cloudFunctions.checkCollegeCapacity(collegeId, role);
        // Backend returns both {count,max} and {currentCount,maxLimit} aliases
        setCapacity({
          loading: false,
          allowed: result.allowed,
          currentCount: result.currentCount ?? result.count ?? 0,
          maxLimit: result.maxLimit ?? result.max ?? 0,
          remaining: result.remaining ?? 0,
          message: result.message,
          error: null,
        });
      } catch (err) {
        setCapacity(prev => ({
          ...prev,
          loading: false,
          error: err.message,
        }));
      }
    };

    checkCapacity();
  }, [collegeId, role]);

  return capacity;
};

/**
 * Hook to check if registration is allowed
 * Checks both global registration toggle and maintenance mode
 */
export const useRegistrationCheck = () => {
  const { settings, loading } = useSystemSettings();
  const [registrationStatus, setRegistrationStatus] = useState({
    allowed: true,
    message: null,
  });

  useEffect(() => {
    if (loading) return;

    if (settings.maintenanceMode) {
      setRegistrationStatus({
        allowed: false,
        message: settings.maintenanceMessage || 'System is under maintenance',
      });
    } else if (!settings.registrationEnabled) {
      setRegistrationStatus({
        allowed: false,
        message: 'New registrations are currently disabled',
      });
    } else {
      setRegistrationStatus({
        allowed: true,
        message: null,
      });
    }
  }, [settings, loading]);

  return { ...registrationStatus, loading };
};

/**
 * Feature Gate Component
 * Conditionally renders children based on feature flag
 */
export const FeatureGate = ({ feature, children, fallback = null }) => {
  const { isFeatureEnabled, loading } = useSystemSettings();

  if (loading) {
    return fallback;
  }

  if (!isFeatureEnabled(feature)) {
    return fallback;
  }

  return children;
};

/**
 * Maintenance Mode Gate Component
 * Shows maintenance message when system is in maintenance mode
 */
export const MaintenanceGate = ({ children, maintenanceComponent = null }) => {
  const { settings, isMaintenanceMode, loading } = useSystemSettings();

  if (loading) {
    return null;
  }

  if (isMaintenanceMode()) {
    if (maintenanceComponent) {
      return maintenanceComponent;
    }

    // Default maintenance message
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            System Maintenance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {settings.maintenanceMessage || 'System is under maintenance. Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

/**
 * Registration Gate Component  
 * Prevents registration when disabled or in maintenance mode
 */
export const RegistrationGate = ({ children, disabledComponent = null }) => {
  const { allowed, reason, message, loading } = useRegistrationCheck();

  if (loading) {
    return null;
  }

  if (!allowed) {
    if (disabledComponent) {
      return disabledComponent;
    }

    // Default disabled message
    return (
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Registration Unavailable
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default useSystemSettings;
