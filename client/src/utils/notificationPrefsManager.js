/**
 * Notification Preferences Manager
 * Handles initialization and management of user notification preferences
 */

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Default notification preferences for new users
export const DEFAULT_NOTIF_PREFS = {
  soundAlerts: true,              // Play sound on notifications
  systemAlerts: true,             // Show system notifications
  announcements: true,            // Show announcements
  complaints: true,               // Show complaint updates
  leaveUpdates: true,             // Show leave request updates
  leaveRequests: true,            // Show new leave requests (wardens)
  newComplaints: true,            // Show new complaints (wardens)
  complaintUpdates: true,         // Show complaint updates (wardens)
  newStudents: true,              // Show new student registrations (wardens)
  emailNotifications: false,       // Email notifications (future)
};

/**
 * Initialize notification preferences for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const initializeNotificationPrefs = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`User ${userId} does not exist`);
      return;
    }

    const userData = userSnap.data();

    // If notifPrefs doesn't exist or is incomplete, initialize/merge with defaults
    if (!userData.notifPrefs || Object.keys(userData.notifPrefs).length === 0) {
      await updateDoc(userRef, {
        notifPrefs: DEFAULT_NOTIF_PREFS,
      });
      console.log(`✅ Initialized notification preferences for user ${userId}`);
    } else {
      // Merge with defaults to add any missing keys
      const mergedPrefs = {
        ...DEFAULT_NOTIF_PREFS,
        ...userData.notifPrefs, // Keep user's existing preferences
      };

      // Only update if there are missing keys
      const hasAllKeys = Object.keys(DEFAULT_NOTIF_PREFS).every(
        (key) => key in userData.notifPrefs
      );

      if (!hasAllKeys) {
        await updateDoc(userRef, {
          notifPrefs: mergedPrefs,
        });
        console.log(`✅ Updated notification preferences for user ${userId}`);
      }
    }
  } catch (error) {
    console.error(`Error initializing notification preferences for ${userId}:`, error);
  }
};

/**
 * Enable a specific notification type
 * @param {string} userId - User ID
 * @param {string} prefKey - Preference key (e.g., 'soundAlerts', 'announcements')
 * @returns {Promise<void>}
 */
export const enableNotifPref = async (userId, prefKey) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`notifPrefs.${prefKey}`]: true,
    });
    console.log(`✅ Enabled ${prefKey} for user ${userId}`);
  } catch (error) {
    console.error(`Error enabling ${prefKey}:`, error);
  }
};

/**
 * Disable a specific notification type
 * @param {string} userId - User ID
 * @param {string} prefKey - Preference key
 * @returns {Promise<void>}
 */
export const disableNotifPref = async (userId, prefKey) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`notifPrefs.${prefKey}`]: false,
    });
    console.log(`✅ Disabled ${prefKey} for user ${userId}`);
  } catch (error) {
    console.error(`Error disabling ${prefKey}:`, error);
  }
};

/**
 * Get notification preferences for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User's notification preferences
 */
export const getNotificationPrefs = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`User ${userId} does not exist`);
      return DEFAULT_NOTIF_PREFS;
    }

    const userData = userSnap.data();
    return userData.notifPrefs || DEFAULT_NOTIF_PREFS;
  } catch (error) {
    console.error(`Error getting notification preferences:`, error);
    return DEFAULT_NOTIF_PREFS;
  }
};

/**
 * Reset notification preferences to defaults
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const resetNotificationPrefs = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      notifPrefs: DEFAULT_NOTIF_PREFS,
    });
    console.log(`✅ Reset notification preferences for user ${userId}`);
  } catch (error) {
    console.error(`Error resetting notification preferences:`, error);
  }
};

/**
 * Check if notifications are enabled (globally)
 * @param {Object} notifPrefs - User's notification preferences
 * @returns {boolean}
 */
export const areNotificationsEnabled = (notifPrefs = {}) => {
  const merged = { ...DEFAULT_NOTIF_PREFS, ...notifPrefs };
  return merged.systemAlerts === true && merged.announcements === true;
};

/**
 * Get all notification stats (for diagnostics)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Notification stats
 */
export const getNotificationStats = async (userId) => {
  try {
    const prefs = await getNotificationPrefs(userId);
    const enabledCount = Object.values(prefs).filter((v) => v === true).length;
    const disabledCount = Object.values(prefs).filter((v) => v === false).length;

    return {
      userId,
      preferences: prefs,
      enabledCount,
      disabledCount,
      totalPreferences: Object.keys(prefs).length,
      notificationsEnabled: areNotificationsEnabled(prefs),
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return null;
  }
};
