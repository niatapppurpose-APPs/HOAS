import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/?$/, '') + '/api' 
  : '/api';

export const useServerStatus = (checkInterval = 5000) => {
  const [isServerOnline, setIsServerOnline] = useState(true);
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
        } else {
          setIsServerOnline(false);
        }
        setLastChecked(new Date());
      } catch (error) {
        // Network error means server is down
        setIsServerOnline(false);
        setLastChecked(new Date());
      }
    };

    // Check immediately on mount
    checkServer();

    // Then check periodically
    const interval = setInterval(checkServer, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  return { isServerOnline, lastChecked };
};