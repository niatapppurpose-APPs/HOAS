import { useState, useEffect } from 'react';

export const useServerStatus = (checkInterval = 5000) => {
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    const checkServer = async () => {
      try {
        // Try to fetch a resource from the dev server
        const response = await fetch(window.location.origin, {
          method: 'HEAD',
          cache: 'no-cache',
        });
        
        if (response.ok || response.status === 304) {
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
