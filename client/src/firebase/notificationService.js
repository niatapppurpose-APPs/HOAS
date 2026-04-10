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
    console.error('Error getting FCM token:', error);
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
    const { doc, updateDoc } = await import('firebase/firestore');

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmToken: token, // Save single token for current device
      lastTokenUpdate: new Date(),
      'notifPrefs.soundAlerts': true, // Ensure sound is enabled by default
      'notifPrefs.systemAlerts': true, // Ensure system alerts are enabled
      'notifPrefs.announcements': true, // Ensure announcements are enabled
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
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const playTone = (frequency, startTime, duration, volume = 0.2) => {
      const osc = ctx.createOscillator();
      const envGain = ctx.createGain();

      osc.frequency.value = frequency;
      osc.type = 'sine';

      envGain.gain.setValueAtTime(0, startTime);
      envGain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
      envGain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(envGain);
      envGain.connect(gain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;

    // Different sound patterns based on notification type
    if (type === 'urgent') {
      // Double beep pattern for urgent
      playTone(1046, now, 0.2, 0.3);      // C6
      playTone(1046, now + 0.25, 0.2, 0.3); // C6
      playTone(1568, now + 0.5, 0.3, 0.25); // G6
    } else if (type === 'announcement') {
      // Triple ascending tones for announcements
      playTone(800, now, 0.15, 0.2);      // G5
      playTone(1000, now + 0.18, 0.15, 0.2); // B5
      playTone(1200, now + 0.36, 0.2, 0.25); // D6
    } else if (type === 'success') {
      // Happy two-note for success
      playTone(1000, now, 0.15, 0.2);     // B5
      playTone(1400, now + 0.18, 0.25, 0.2); // F#6
    } else {
      // Default calm notification sound
      playTone(900, now, 0.15, 0.15);     // A5
      playTone(700, now + 0.18, 0.18, 0.15); // F5
    }

    setTimeout(() => {
      try {
        ctx.close();
      } catch (e) {
        // Context already closed
      }
    }, 2000);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
};
