// Reusable Dashboard Tour Hook
// Auto-starts a driver.js tour on first visit for each user + role combo.
// Also supports manual trigger via  location.state?.startTour  or  restartTour().
import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tourStyles.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/**
 * @param {string}   role       – unique key  e.g. 'owner' | 'management' | 'warden' | 'student'
 * @param {Function} getSteps   – (isDark) => step[]   driver.js step array
 * @param {object}   options
 * @param {number}   [options.delay=1200]   – ms before auto-starting
 * @param {boolean}  [options.autoStart=true]  – auto-start on first visit
 * @param {boolean}  [options.ready=true]   – set to false while data is still loading
 */
const useDashboardTour = (role, getSteps, options = {}) => {
  const { delay = 1200, autoStart = true, ready = true } = options;
  const { isDark } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const driverRef = useRef(null);
  const hasTriggeredRef = useRef(false); // prevent double-fire

  // Build a unique localStorage key per user + role
  const storageKey = user?.uid ? `hoas_tour_seen_${role}_${user.uid}` : null;

  const hasSeenTour = useCallback(() => {
    if (!storageKey) return true; // no user → skip
    return localStorage.getItem(storageKey) === 'true';
  }, [storageKey]);

  const markTourSeen = useCallback(() => {
    if (storageKey) localStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  // Core drive function
  const startTour = useCallback(() => {
    if (!getSteps) return;
    const steps = getSteps(isDark);
    if (!steps || steps.length === 0) return;

    // Destroy any existing instance
    if (driverRef.current) {
      try { driverRef.current.destroy(); } catch (_) { /* noop */ }
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)',
      steps,
      popoverClass: isDark ? 'driverjs-theme-dark' : 'driverjs-theme-light',
      onDestroyed: () => {
        markTourSeen();
      },
    });

    driverRef.current = driverObj;

    setTimeout(() => {
      driverObj.drive();
    }, delay);
  }, [getSteps, isDark, delay, markTourSeen]);

  // Public restart (for Help pages / settings buttons)
  const restartTour = useCallback(() => {
    hasTriggeredRef.current = false;
    startTour();
  }, [startTour]);

  // Reset tour (allow re-showing)
  const resetTour = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    hasTriggeredRef.current = false;
  }, [storageKey]);

  // ── Auto-start on first visit ──
  // Waits until:  user is loaded  AND  ready === true (data finished loading)
  useEffect(() => {
    if (!autoStart || !user?.uid || !ready) return;
    if (hasTriggeredRef.current) return; // already triggered this mount

    // If explicitly triggered via navigation state
    if (location.state?.startTour) {
      window.history.replaceState({}, document.title);
      hasTriggeredRef.current = true;
      startTour();
      return;
    }

    // First-time auto tour
    if (!hasSeenTour()) {
      hasTriggeredRef.current = true;
      startTour();
    }
  }, [autoStart, user?.uid, ready, location.state, hasSeenTour, startTour]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        try { driverRef.current.destroy(); } catch (_) { /* noop */ }
      }
    };
  }, []);

  return { restartTour, resetTour, hasSeenTour };
};

export default useDashboardTour;
