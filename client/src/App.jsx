// Safe Firestore Timestamp to JS Date conversion
const toDate = (v) => v?.toDate?.() ?? new Date(v);
import { useAuth } from "./context/AuthContext";
import Routes_path from "./components/Routes/index";
import GlobalDeleteModal from "./components/OwnerServices/GlobalDeleteModal";
import { useServerStatus } from "./hooks/useServerStatus";
import { MaintenanceGate, useSystemSettings } from "./hooks/useSystemSettings.jsx";
import NotFound from "./Pages/NotFound"; // 404 page
import WakeUpScreen from "./components/WakeUpScreen";
import ForcePasswordReset from "./Pages/ForcePasswordReset/ForcePasswordReset";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "./context/ThemeContext";
import CookieConsent from "./Pages/HOME/components/CookieConsent";
import useSocket from "./hooks/useSocket";
import InstallPrompt from "./components/InstallPrompt.jsx";
const App = () => {
  const { isServerOnline } = useServerStatus();
  const { isAdmin, adminChecked, user, userData } = useAuth();
  const { settings } = useSystemSettings();
  const { isDark } = useTheme();
  const location = useLocation();
  const { connected } = useSocket();

  // Track online/offline status to force re-render on network change


  // Track online/offline status to force re-render on network change
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Request browser notification permission for emergency alerts
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch((err) => {
        console.warn('Notification permission request failed:', err);
      });
    }
  }, []);

  // Track app launches across tabs using localStorage (counts once per browser tab session)
  useEffect(() => {
    const COUNT_KEY = 'HOAS_HOME_VISIT_COUNT';
    const SESSION_KEY = 'HOAS_HOME_VISITED';

    try {
      if (!window.sessionStorage.getItem(SESSION_KEY)) {
        const current = parseInt(window.localStorage.getItem(COUNT_KEY) || '0', 10);
        window.localStorage.setItem(COUNT_KEY, String(current + 1));
        window.sessionStorage.setItem(SESSION_KEY, '1');
      }
    } catch {
      // Ignore (e.g., private mode restrictions)
    }
  }, []);

  // Show wake-up screen if browser is offline (network disconnected)
  if (!isOnline) {
    return <WakeUpScreen offline />;
  }

  // Show premium wake-up loader while the server cold-starts (Render free tier
  // sleeps after inactivity). NotFound is only for genuine route misses.
  if (!isServerOnline) {
    return <WakeUpScreen />;
  }

  const PUBLIC_ROUTES = ['/', '/login', '/admin-login'];

const content = (
    <>
      <Routes_path />
      <GlobalDeleteModal />
      <CookieConsent isDark={isDark} />
      <InstallPrompt />
    </>
  );

  // Skip maintenance gate for:
  // 1. Public routes (home, login) — so users can still reach the login page
  // 2. Admin/Owner users — so they can toggle maintenance off
  // 3. While admin check is still loading — prevent flash of maintenance screen
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  const isAdminUser = adminChecked && isAdmin;
  const isAuthLoading = !adminChecked;

  if (isPublicRoute || isAdminUser || isAuthLoading || !user) {
    return content;
  }

  // Force Password Reset — when enabled, non-admin users must reset before continuing.
  // Skip if the user has already acknowledged the reset after it was enabled.
  const forceResetEnabled = settings.forcePasswordReset && user && !isAdminUser;
  const userAlreadyReset = !!userData?.lastPasswordResetAt && !!settings.forcePasswordResetEnabledAt
    && toDate(userData.lastPasswordResetAt) >= toDate(settings.forcePasswordResetEnabledAt);
  if (forceResetEnabled && !userAlreadyReset) {
    return <ForcePasswordReset />;
  }

  return <MaintenanceGate>{content}</MaintenanceGate>;
};

export default App;
