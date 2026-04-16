// Service Worker Registration for PWA (Manual implementation for Vite 7+)

export function registerServiceWorker() {
  // Unregister Service Worker completely during development to prevent caching issues
  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister().then(unregistered => {
          if (unregistered) console.log('SW unregistered in DEV mode to prevent caching.');
        });
      }
    });
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('SW registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                const savedMode = localStorage.getItem('hoas-update-mode') || 'manual';
                const savedNotifPref = localStorage.getItem('hoas-update-notifications') !== 'false'; // Default to true

                if (savedNotifPref && 'Notification' in window && Notification.permission === 'granted') {
                  registration.showNotification('HOAS Update Available', {
                    body: 'A new version of HOAS is ready to install.',
                    icon: '/Applogo.png',
                    badge: '/Applogo.png',
                    tag: 'app-update',
                    requireInteraction: true,
                    data: { url: window.location.origin }
                  });
                }

                if (savedMode === 'auto') {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                } else if (savedMode === 'manual') {
                  // The PWAUpdateSettings component will handle the UI for manual updates
                  console.log('Update available. Manual update mode is active.');
                }
              }
            });
          }
        });
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    });
  }
}

export default registerServiceWorker;
