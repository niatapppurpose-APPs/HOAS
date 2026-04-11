// firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging background notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Note: Service workers cannot access environment variables, so config is hardcoded
firebase.initializeApp({
  apiKey: "AIzaSyAI_ShJZHclMdhq_ESF1PHneb8D6RR-VH8",
  authDomain: "hoas-65dee.firebaseapp.com",
  projectId: "hoas-65dee",
  storageBucket: "hoas-65dee.firebasestorage.app",
  messagingSenderId: "934000888542",
  appId: "1:934000888542:web:2a4ef0198ecf171bded04f"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'HOAS Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/Applogo.png',
    badge: '/Applogo.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const data = event.notification.data || {};
    const role = String(data.role || data.userRole || data.recipientRole || '').toLowerCase();
    const type = String(data.type || data.notificationType || '').toLowerCase();

    const resolveDefaultUrl = () => {
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
      if (type.includes('complaint')) return '/dashboard';
      if (type.includes('announcement')) return '/dashboard';
      if (type.includes('leave')) return '/dashboard';

      return '/dashboard';
    };

    const pathToOpen = resolveDefaultUrl();
    const absoluteUrlToOpen = new URL(pathToOpen, self.location.origin).href;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(pathToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(absoluteUrlToOpen);
          }
        })
    );
  }
});
