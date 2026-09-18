// Preload the dashboard chunk for a role while the user is still looking at
// the wake-up / auth loader. React.lazy then hits the browser cache instead
// of downloading ~500KB on first route render (the 3-5s white flash).
// Fire-and-forget: failures must never break auth, so errors are swallowed.
const load = (importer) => {
  try {
    const p = importer();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    // Ignore — the normal lazy route load will retry on navigation.
  }
};

export const preloadDashboard = (role) => {
  if (typeof window === 'undefined') return;
  // Defer past first paint so the loader itself renders instantly.
  const kick = () => {
    if (role === 'student') {
      load(() => import('../DashBoards/Student-DashBoard/components/layout/StudentLayout'));
      load(() => import('../DashBoards/Student-DashBoard/StudentDashboard'));
    } else if (role === 'warden') {
      load(() => import('../DashBoards/Warden-Dashboard/components/layout/WardenLayout'));
      load(() => import('../DashBoards/Warden-Dashboard/WardenDashboard'));
    } else if (role === 'management' || role === 'admin') {
      load(() => import('../DashBoards/Management-Dashboard/ManagementLayout'));
      load(() => import('../DashBoards/Management-Dashboard/ManagementDashboard'));
    } else if (role === 'owner') {
      load(() => import('../Pages/OwnersDashboard/OwnersLayout'));
      load(() => import('../Pages/OwnersDashboard/ownersdashbord'));
    }
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(kick, { timeout: 2000 });
  } else {
    setTimeout(kick, 0);
  }
};

export default preloadDashboard;
