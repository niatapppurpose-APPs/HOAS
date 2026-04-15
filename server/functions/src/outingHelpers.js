/**
 * Outing Helpers & Utilities
 * Shared utility functions for outing management
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions/v2';

const db = getFirestore();
const messaging = getMessaging();

/**
 * Calculate timing status based on return time vs expected time
 */
export function calculateTimingStatus(expectedReturnTime, actualReturnTime) {
  if (!actualReturnTime) return null;

  const expected = new Date(expectedReturnTime).getTime();
  const actual = new Date(actualReturnTime).getTime();

  if (actual <= expected) {
    return 'on-time';
  }

  const lateMs = actual - expected;
  const twoHoursMs = 2 * 60 * 60 * 1000;

  if (lateMs <= twoHoursMs) {
    return 'late';
  }

  return 'very-late';
}

/**
 * Get system settings
 */
export async function getSystemSettings() {
  try {
    const doc = await db.collection('systemSettings').doc('global').get();
    return doc.exists ? doc.data() : {};
  } catch (error) {
    logger.warn('Could not read system settings:', error);
    return {};
  }
}

/**
 * Check if outing feature is enabled
 */
export async function areOutingsEnabled() {
  const settings = await getSystemSettings();
  if (settings.features?.outings?.enabled === false) {
    logger.info('Outings feature is DISABLED globally.');
    return false;
  }
  return true;
}

/**
 * Get student data for authorization
 */
export async function getStudentData(studentId) {
  try {
    const doc = await db.collection('users').doc(studentId).get();
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Student not found');
    }
    return doc.data();
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to fetch student data: ${error.message}`);
  }
}

/**
 * Get warden/management user data
 */
export async function getUserData(userId) {
  try {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    return doc.data();
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to fetch user data: ${error.message}`);
  }
}

/**
 * Send notification to user
 */
export async function sendNotification(userId, title, body, data = {}) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      logger.warn(`User ${userId} not found for notification`);
      return;
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    // Send push notification if token exists
    if (fcmToken) {
      try {
        await messaging.send({
          token: fcmToken,
          notification: { title, body },
          data,
          android: {
            priority: 'high',
            notification: {
              color: '#1f2937',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        });
        logger.info(`Push notification sent to ${userId}`);
      } catch (error) {
        logger.warn(`Failed to send push notification to ${userId}:`, error.message);
      }
    }

    // Always store in-app notification
    await db.collection('notifications').add({
      userId,
      title,
      body,
      data,
      type: 'outing',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    logger.info(`Notification stored for ${userId}`);
  } catch (error) {
    logger.error(`Error sending notification: ${error.message}`);
  }
}

/**
 * Validate outing request data
 */
export function validateOutingRequest(data) {
  const errors = [];

  if (!data.destination || typeof data.destination !== 'string' || data.destination.trim().length === 0) {
    errors.push('Destination is required');
  }

  if (!data.reason || typeof data.reason !== 'string' || data.reason.trim().length === 0) {
    errors.push('Reason is required');
  }

  if (!data.outTime) {
    errors.push('Out time is required');
  } else {
    const outTime = new Date(data.outTime);
    if (isNaN(outTime.getTime())) {
      errors.push('Invalid out time format');
    } else if (outTime < new Date()) {
      errors.push('Out time cannot be in the past');
    }
  }

  if (errors.length > 0) {
    throw new HttpsError('invalid-argument', errors.join('; '));
  }
}

/**
 * Validate approval data
 */
export function validateApprovalData(data) {
  const errors = [];

  if (!data.outingId || typeof data.outingId !== 'string') {
    errors.push('Outing ID is required');
  }

  if (!data.expectedReturnTime) {
    errors.push('Expected return time is required');
  } else {
    const returnTime = new Date(data.expectedReturnTime);
    if (isNaN(returnTime.getTime())) {
      errors.push('Invalid return time format');
    }
  }

  if (errors.length > 0) {
    throw new HttpsError('invalid-argument', errors.join('; '));
  }
}
