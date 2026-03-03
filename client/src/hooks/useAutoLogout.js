import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSystemSettings } from './useSystemSettings';

/**
 * useAutoLogout Hook
 * 
 * Monitors user activity (mouse, keyboard, touch, scroll) and automatically
 * logs the user out after the configured `autoLogoutMinutes` of inactivity.
 * 
 * Reads the `autoLogoutMinutes` setting from systemSettings/global.
 * Only active when a user is logged in and the setting is > 0.
 * 
 * Uses refs for logout/settings to avoid dependency-chain re-renders
 * that would continuously reset the inactivity timer.
 */
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
// NOTE: 'mousemove' removed — it fires too often and can mask genuine idle periods.
// 'mousedown' + 'click' are sufficient to detect real mouse interaction.

export const useAutoLogout = () => {
  const { user, logout } = useAuth();
  const { settings } = useSystemSettings();

  // Store mutable values in refs so the effect doesn't depend on them
  const logoutRef = useRef(logout);
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const autoLogoutMinutes = settings?.autoLogoutMinutes ?? 0;

  // Keep logout ref current without re-running the effect
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  useEffect(() => {
    // Don't set up if no user or no timeout configured
    if (!user || autoLogoutMinutes <= 0) {
      // Clear any lingering timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const timeoutMs = autoLogoutMinutes * 60 * 1000;

    const doLogout = async () => {
      try {
        console.log(`[AutoLogout] Logging out after ${autoLogoutMinutes} min of inactivity.`);
        await logoutRef.current();
      } catch (err) {
        console.error('[AutoLogout] Logout failed:', err);
      }
    };

    const startTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(doLogout, timeoutMs);
    };

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      startTimer();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeoutMs) {
          doLogout();
        } else {
          startTimer();
        }
      }
    };

    // Kick off the first timer
    lastActivityRef.current = Date.now();
    startTimer();
    console.log(`[AutoLogout] Timer started — ${autoLogoutMinutes} min timeout.`);

    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // Only re-run when the user identity or the timeout value actually changes
  }, [user, autoLogoutMinutes]);
};

export default useAutoLogout;
