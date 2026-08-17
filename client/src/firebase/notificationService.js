import { messaging } from './firebaseConfig';
import { getToken, onMessage } from 'firebase/messaging';

// VAPID key for Firebase Cloud Messaging
// Read from environment variable
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} true if permission granted, false otherwise
 */
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    // If permission is already granted or denied, return the current state
    if (Notification.permission !== 'default') {
      console.log(`ℹ️ Notification permission is already: ${Notification.permission}`);
      return Notification.permission === 'granted';
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.log('❌ Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token for this device
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const getFCMToken = async () => {
  try {
    if (!messaging) {
      console.warn('Firebase Messaging not supported');
      return null;
    }

    const permission = await requestNotificationPermission();
    if (!permission) {
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
     
      return token;
    } else {
      console.log('❌ No registration token available');
      return null;
    }
  } catch (error) {
    if (error?.name === 'VersionError' || /requested version/i.test(error?.message || '')) {
      try {
        await new Promise((resolve) => {
          const req = indexedDB.deleteDatabase('firebase-messaging-database');
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
          req.onblocked = () => resolve();
        });
        const retryToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (retryToken) return retryToken;
      } catch (retryError) {
        console.warn('FCM token retry failed:', retryError);
      }
    }
    console.warn('FCM token unavailable, continuing with polling:', error?.message || error);
    return null;
  }
};

/**
 * Listen for foreground messages (when app is open)
 * @param {Function} callback - Callback function to handle messages
 * @returns {Function} Unsubscribe function
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    console.warn('Firebase Messaging not supported');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('📩 Foreground message received:', payload);

    // Show browser notification even when app is open
    if (Notification.permission === 'granted') {
      const notificationTitle = payload.notification?.title || 'HOAS Notification';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/Applogo.png',
        badge: '/Applogo.png',
        tag: payload.data?.type || 'default',
        data: payload.data,
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => reg.showNotification(notificationTitle, notificationOptions));
      } else {
        new Notification(notificationTitle, notificationOptions);
      }
    }

    // Call the callback with the payload
    if (callback && typeof callback === 'function') {
      callback(payload);
    }
  });
};

/**
 * Show a browser notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export const showNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const optionsWithIcon = {
      icon: '/Applogo.png',
      badge: '/Applogo.png',
      ...options
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => reg.showNotification(title, optionsWithIcon));
      return { close: () => {} }; // Mock object since we don't have direct access to close it this way easily
    } else {
      const notification = new Notification(title, optionsWithIcon);
      setTimeout(() => notification.close(), 10000);
      return notification;
    }
  }
};

/**
 * Save FCM token to user's Firestore document
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} token - FCM token
 */
export const saveFCMToken = async (db, userId, token) => {
  try {
    const { updateProfile } = await import('./cloudFunctions');
    await updateProfile({
      fcmToken: token,
      notificationPrefs: { soundAlerts: true, systemAlerts: true, announcements: true },
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

/**
 * Play an awesome notification sound (enhanced version)
 * @param {string} type - Type of notification ('announcement', 'urgent', 'normal', 'success')
 */
export const playNotificationSound = (type = 'normal') => {
  return;
};
