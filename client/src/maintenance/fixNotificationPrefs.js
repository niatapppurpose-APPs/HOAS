/**
 * Emergency Fix Script: Initialize Notification Preferences for All Existing Users
 *
 * Usage:
 * 1. Run this in Firebase Cloud Console (Functions tab)
 * 2. Or import and run as a Cloud Function
 * 3. This is a one-time operation to fix existing users
 *
 * What it does:
 * - Scans all users in Firestore
 * - Checks if they have notifPrefs
 * - If missing, adds default preferences
 * - Logs results for verification
 */

import { getFirestore, collection, query, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { DEFAULT_NOTIF_PREFS } from './notificationPrefsManager';
 
const DEFAULT_PREFS = {
  soundAlerts: true,
  systemAlerts: true,
  announcements: true,
  complaints: true,
  leaveUpdates: true,
  leaveRequests: true,
  newComplaints: true,
  complaintUpdates: true,
  newStudents: true,
  emailNotifications: false,
};

/**
 * Fix all users without notification preferences
 * Warning: This updates all user documents - use with caution!
 */
export async function fixAllUsersNotificationPrefs() {
  const db = getFirestore();
  const usersRef = collection(db, 'users');
  const q = query(usersRef);

  try {
    console.log('🔍 Scanning all users for missing notifPrefs...');
    const snapshot = await getDocs(q);
    const usersNeedingFix = [];
    const alreadyFixed = [];

    // Check each user
    snapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (!userData.notifPrefs || Object.keys(userData.notifPrefs).length === 0) {
        usersNeedingFix.push(userDoc.id);
      } else {
        alreadyFixed.push(userDoc.id);
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total Users: ${snapshot.size}`);
    console.log(`   Need Fix: ${usersNeedingFix.length}`);
    console.log(`   Already Fixed: ${alreadyFixed.length}`);

    if (usersNeedingFix.length === 0) {
      console.log('\n✅ All users already have notification preferences!');
      return { success: true, fixed: 0, alreadyFixed: alreadyFixed.length };
    }

    console.log('\n🔧 Applying fixes in batches...');

    // Batch update (Firebase has 500 doc limit per batch)
    const batchSize = 100;
    let totalFixed = 0;

    for (let i = 0; i < usersNeedingFix.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUsers = usersNeedingFix.slice(i, i + batchSize);

      batchUsers.forEach((userId) => {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          notifPrefs: DEFAULT_PREFS,
        });
      });

      try {
        await batch.commit();
        totalFixed += batchUsers.length;
        console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: Fixed ${batchUsers.length} users`);
      } catch (error) {
        console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   Fixed: ${totalFixed} users`);
    console.log(`   Already had preferences: ${alreadyFixed.length} users`);

    return { success: true, fixed: totalFixed, alreadyFixed: alreadyFixed.length };
  } catch (error) {
    console.error('❌ Error fixing user preferences:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fix a single user's notification preferences
 */
export async function fixSingleUserNotificationPrefs(userId) {
  const db = getFirestore();
  const userRef = doc(db, 'users', userId);

  try {
    await updateDoc(userRef, {
      notifPrefs: DEFAULT_PREFS,
    });
    console.log(`✅ Fixed notification preferences for user ${userId}`);
    return { success: true, userId };
  } catch (error) {
    console.error(`❌ Error fixing user ${userId}:`, error);
    return { success: false, userId, error: error.message };
  }
}

/**
 * Get statistics on notification preferences
 */
export async function getNotificationPrefStats() {
  const db = getFirestore();
  const usersRef = collection(db, 'users');
  const q = query(usersRef);

  try {
    const snapshot = await getDocs(q);
    const stats = {
      totalUsers: snapshot.size,
      withPrefs: 0,
      withoutPrefs: 0,
      soundEnabled: 0,
      soundDisabled: 0,
      announcementsEnabled: 0,
      announcementsDisabled: 0,
    };

    snapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const prefs = userData.notifPrefs || {};

      if (Object.keys(prefs).length > 0) {
        stats.withPrefs++;
        if (prefs.soundAlerts !== false) stats.soundEnabled++;
        else stats.soundDisabled++;
        if (prefs.announcements !== false) stats.announcementsEnabled++;
        else stats.announcementsDisabled++;
      } else {
        stats.withoutPrefs++;
      }
    });

    console.log('📊 Notification Preferences Statistics:');
    console.log(`   Total Users: ${stats.totalUsers}`);
    console.log(`   With Preferences: ${stats.withPrefs}`);
    console.log(`   Without Preferences: ${stats.withoutPrefs}`);
    console.log(`   Sound Enabled: ${stats.soundEnabled}`);
    console.log(`   Sound Disabled: ${stats.soundDisabled}`);
    console.log(`   Announcements Enabled: ${stats.announcementsEnabled}`);
    console.log(`   Announcements Disabled: ${stats.announcementsDisabled}`);

    return stats;
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    return null;
  }
}

// ============================================================================
// USAGE IN BROWSER CONSOLE
// ============================================================================
//
// 1. Import this file and run all fixes:
//    const { fixAllUsersNotificationPrefs } = await import('./src/maintenance/fixNotificationPrefs.js');
//    await fixAllUsersNotificationPrefs();
//
// 2. Fix a single user:
//    const { fixSingleUserNotificationPrefs } = await import('./src/maintenance/fixNotificationPrefs.js');
//    await fixSingleUserNotificationPrefs('user-id-here');
//
// 3. Get statistics:
//    const { getNotificationPrefStats } = await import('./src/maintenance/fixNotificationPrefs.js');
//    await getNotificationPrefStats();
//
// ============================================================================
