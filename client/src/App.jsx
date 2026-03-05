// Safe Firestore Timestamp to JS Date conversion
const toDate = (v) => v?.toDate?.() ?? new Date(v);
import { useAuth } from "./context/AuthContext";
import Routes_path from "./components/Routes/index";
import GlobalDeleteModal from "./components/OwnerServices/GlobalDeleteModal";
import { useServerStatus } from "./hooks/useServerStatus";
import ServerOffline from "./components/ServerOffline/ServerOffline";
import { MaintenanceGate, useSystemSettings } from "./hooks/useSystemSettings.jsx";
import ForcePasswordReset from "./Pages/ForcePasswordReset/ForcePasswordReset";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// Public routes that should never be blocked by maintenance mode
const PUBLIC_ROUTES = ['/', '/login', '/admin-login', '/firebase-mode'];

const App = () => {
  const { isServerOnline, lastChecked } = useServerStatus();
  const { isAdmin, adminChecked, user, userData } = useAuth();
  const { settings } = useSystemSettings();
  const location = useLocation();


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

  // Show 404 (Yeti) if browser is offline (network disconnected)
  if (!isOnline) {
    const NotFound = require('./Pages/NotFound').default;
    return <NotFound />;
  }

  // Show server offline screen if server is down (but browser is online)
  if (!isServerOnline) {
    return <ServerOffline lastChecked={lastChecked} />;
  }

  const content = (
    <>
      <Routes_path />
      <GlobalDeleteModal />
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
  const userAlreadyReset = userData?.lastPasswordResetAt && settings.forcePasswordResetEnabledAt
    && toDate(userData.lastPasswordResetAt) >= toDate(settings.forcePasswordResetEnabledAt);
  if (forceResetEnabled && !userAlreadyReset) {
    return <ForcePasswordReset />;
  }

  return <MaintenanceGate>{content}</MaintenanceGate>;
};

export default App;
