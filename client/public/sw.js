// PWA Service Worker for HOAS
const CACHE_NAME = 'hoas-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/Applogo.png',
  '/manifest.json',
  '/yeti-404/index.html',
  '/yeti-404/script.js',
  '/yeti-404/style.css'
];

const NEVER_CACHE_PATHS = [
  '/index.html',
  '/sw.js',
  '/firebase-messaging-sw.js'
];

const isNavigationRequest = (request) => request.mode === 'navigate';
const isAssetRequest = (pathname) => pathname.startsWith('/assets/');
const shouldSkipCache = (pathname) =>
  NEVER_CACHE_PATHS.includes(pathname) ||
  pathname.endsWith('.js') ||
  pathname.endsWith('.css') ||
  pathname.endsWith('.map');

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  const requestUrl = new URL(event.request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;

  // Never intercept cross-origin requests (API, FCM, fonts, etc.) — let the
  // browser handle them directly. Intercepting API calls caused
  // "Failed to convert value to 'Response'" when a cross-origin fetch failed.
  if (!sameOrigin) return;

  // Always prefer network for page navigations so new deploys are picked up quickly.
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && sameOrigin) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // Return cached response or yeti 404 page, always return a valid Response
          return caches.match('/yeti-404/index.html') || new Response('<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Offline</h1><p>You are offline.</p></body></html>', { headers: { 'Content-Type': 'text/html' } });
        })
    );
    return;
  }

  // Avoid caching mutable shell/chunk files that can cause version mismatch after deployment.
  if (sameOrigin && (isAssetRequest(requestUrl.pathname) || shouldSkipCache(requestUrl.pathname))) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/yeti-404/index.html');
        }
        // Try to return cached yeti assets if they're requested offline
        if (requestUrl.pathname.startsWith('/yeti-404/')) {
          return caches.match(event.request);
        }
      });
    })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Show notification when service worker is waiting to activate
self.addEventListener('install', (event) => {
  event.waitUntil(
    self.skipWaiting().then(() => {
      // Notify all clients that a new version is available
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_NAME
          });
        });
      });
    })
  );
});

// Push notification support for updates
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification?.data || {};
  const role = String(data.role || data.userRole || data.recipientRole || '').toLowerCase();
  const type = String(data.type || data.notificationType || '').toLowerCase();

  const resolveUrl = () => {
    if (data.url) return data.url;

    if (role === 'student') {
      if (type.includes('announcement')) return '/dashboard/student/announcements';
      if (type.includes('leave')) return '/dashboard/student/leave';
      if (type.includes('support')) return '/dashboard/student/help';
      if (type.includes('complaint') || type.includes('ticket')) return '/dashboard/student/complaints';
      return '/dashboard/student';
    }

    if (role === 'warden') {
      if (type.includes('announcement')) return '/dashboard/warden/announcements';
      if (type.includes('leave')) return '/dashboard/warden/leave-requests';
      if (type.includes('support')) return '/dashboard/warden/help';
      if (type.includes('complaint') || type.includes('ticket')) return '/dashboard/warden/complaints';
      return '/dashboard/warden';
    }

    if (role === 'management') {
      if (type.includes('complaint') || type.includes('ticket')) return '/dashboard/management/complaints';
      return '/dashboard/management';
    }

    if (role === 'owner' || role === 'admin') {
      if (type.includes('support')) return '/OwnersDashboard/support-tickets';
      return '/OwnersDashboard';
    }

    if (type.includes('support')) return '/OwnersDashboard/support-tickets';
    if (type.includes('approval')) return '/OwnersDashboard';
    return '/dashboard';
  };

  const pathToOpen = resolveUrl();
  const absoluteUrlToOpen = new URL(pathToOpen, self.location.origin).href;
  
  if (event.action === 'update') {
    // Activate the new service worker immediately
    self.skipWaiting();
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'RELOAD_PAGE' });
        });
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Click on notification body - open/focus the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if ((client.url.includes(pathToOpen) || client.url === self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open the app
        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteUrlToOpen);
        }
      })
    );
  }
});
