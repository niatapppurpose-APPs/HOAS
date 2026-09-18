import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSystemSettings } from './useSystemSettings';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

/**
 * Enforces the "Auto Logout Timer" system setting.
 * When settings.autoLogoutMinutes > 0, the user is signed out after that many
 * minutes of inactivity (no mouse/touch/keyboard interaction).
 */
export const useAutoLogout = () => {
  const { user, logout } = useAuth();
  const { settings } = useSystemSettings();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const enabled = !!user && Number(settings.autoLogoutMinutes) > 0;
    if (!enabled) return;

    let timer = null;
    const autoLogoutSeconds = Number(settings.autoLogoutMinutes) * 60;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        toast.warning(`Logged out after ${settings.autoLogoutMinutes} min of inactivity`);
        try {
          await logout();
          navigate('/', { replace: true });
        } catch {
          toast.error('Auto-logout failed');
        }
      }, autoLogoutSeconds * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    events.forEach((name) => window.addEventListener(name, schedule, { passive: true }));
    schedule();

    return () => {
      events.forEach((name) => window.removeEventListener(name, schedule));
      if (timer) clearTimeout(timer);
    };
  }, [user, logout, settings.autoLogoutMinutes, toast, navigate]);
};

export default useAutoLogout;