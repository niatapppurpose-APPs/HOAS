// Service Worker Registration for PWA (Manual implementation for Vite 7+)

export function registerServiceWorker() {
  const isLocalDevelopment =
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]';

  // Never use the production PWA cache on the Vite development server.
  // Remove workers installed by an earlier production/preview run.
  if (isLocalDevelopment && 'serviceWorker' in navigator) {
    Promise.all([
      navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      ),
      window.caches
        ? window.caches.keys().then((cacheNames) =>
            Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)))
          )
        : Promise.resolve(),
    ]).then(() => {
      if (navigator.serviceWorker.controller) {
        window.location.reload();
      }
    }).catch((error) => {
      console.warn('SW development cleanup failed:', error);
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
        await registration.update();
         
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Activate new versions immediately instead of leaving a stale
                // worker in the waiting state.
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    });
  }
}

export default registerServiceWorker;
