import { useAuth } from "./context/AuthContext";
import Routes_path from "./components/Routes/index";
import GlobalDeleteModal from "./components/OwnerServices/GlobalDeleteModal";
import { useServerStatus } from "./hooks/useServerStatus";
import ServerOffline from "./components/ServerOffline/ServerOffline";
import FirebaseModeIndicator from "./components/FirebaseModeIndicator";
import { MaintenanceGate, useSystemSettings } from "./hooks/useSystemSettings.jsx";
import { useAutoLogout } from "./hooks/useAutoLogout";
import ForcePasswordReset from "./Pages/ForcePasswordReset/ForcePasswordReset";
import { useLocation } from "react-router-dom";

// Public routes that should never be blocked by maintenance mode
const PUBLIC_ROUTES = ['/', '/login', '/admin-login'];

const App = () => {
  const { isServerOnline, lastChecked } = useServerStatus();
  const { isAdmin, adminChecked, user, userData } = useAuth();
  const { settings } = useSystemSettings();
  const location = useLocation();

  // Auto logout on inactivity (reads autoLogoutMinutes from system settings)
  useAutoLogout();

  // Show server offline screen if server is down
  if (!isServerOnline) {
    return <ServerOffline lastChecked={lastChecked} />;
  }

  const content = (
    <>
      <Routes_path />
      <GlobalDeleteModal />
      {import.meta.env.DEV && <FirebaseModeIndicator />}
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
    && new Date(userData.lastPasswordResetAt) >= new Date(settings.forcePasswordResetEnabledAt);
  if (forceResetEnabled && !userAlreadyReset) {
    return <ForcePasswordReset />;
  }

  return <MaintenanceGate>{content}</MaintenanceGate>;
};

export default App;
