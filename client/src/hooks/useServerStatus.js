import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/?$/, '') + '/api' 
  : '/api';

export const useServerStatus = (checkInterval = 5000) => {
  const sessionReady = typeof window !== 'undefined'
    && window.sessionStorage.getItem('hoas-server-ready') === 'true';
  const [isServerOnline, setIsServerOnline] = useState(sessionReady);
  const [initialCheckComplete, setInitialCheckComplete] = useState(sessionReady);
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    const checkServer = async () => {
      try {
        const controller = new AbortController();
        // Render free-tier cold starts can take ~50s; allow a generous window
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${API_BASE}/health`, {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          setIsServerOnline(true);
          window.sessionStorage.setItem('hoas-server-ready', 'true');
        } else if (!initialCheckComplete) {
          setIsServerOnline(false);
          return;
        }
        setInitialCheckComplete(true);
        setLastChecked(new Date());
      } catch (error) {
        // Only block the initial app load. Once the app has connected, keep
        // the UI running while the health check retries in the background.
        if (!initialCheckComplete) {
          setIsServerOnline(false);
        }
        setLastChecked(new Date());
      }
    };

    // Check immediately on mount
    checkServer();

    // Then check periodically
    const interval = setInterval(checkServer, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval, initialCheckComplete]);

  return { isServerOnline, initialCheckComplete, lastChecked };
};