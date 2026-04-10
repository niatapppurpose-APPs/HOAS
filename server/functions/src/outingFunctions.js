/**
 * Outing Permission & Late Entry Tracking System
 *
 * Features:
 * - Student outing requests with destination and reason
 * - Warden approval with expected return time
 * - Automatic late detection and marking
 * - Notifications for approvals, rejections, and late entries
 * - History tracking and analytics
 */

import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions/v2';
import { corsOptions } from './config.js';
import { verifyManagementAccess } from './helpers.js';

const db = getFirestore();
const messaging = getMessaging();

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

/**
 * Calculate timing status based on return time vs expected time
 */
function calculateTimingStatus(expectedReturnTime, actualReturnTime) {
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
async function getSystemSettings() {
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
async function areOutingsEnabled() {
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
async function getStudentData(studentId) {
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
async function getUserData(userId) {
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
async function sendNotification(userId, title, body, data = {}) {
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
function validateOutingRequest(data) {
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
function validateApprovalData(data) {
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

// ─────────────────────────────────────────────────────────────
// HTTP ENDPOINTS
// ─────────────────────────────────────────────────────────────

/**
 * Student creates an outing request
 * POST /requestOuting
 */
export const requestOuting = onCall(corsOptions, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Feature flag check
    if (!(await areOutingsEnabled())) {
      throw new HttpsError('unavailable', 'Outing feature is currently disabled');
    }

    const studentId = request.auth.uid;
    const { destination, reason, outTime } = request.data;

    // Validate input
    validateOutingRequest({ destination, reason, outTime });

    // Get student data
    const studentData = await getStudentData(studentId);
    if (studentData.role !== 'student') {
      throw new HttpsError('permission-denied', 'Only students can request outings');
    }

    if (studentData.status !== 'approved') {
      throw new HttpsError('permission-denied', 'Only approved students can request outings');
    }

    // Check for existing active outing
    const activeSnapshot = await db.collection('outings')
      .where('studentId', '==', studentId)
      .where('status', 'in', ['pending', 'approved'])
      .get();

    if (!activeSnapshot.empty) {
      throw new HttpsError('failed-precondition', 'You have an active outing request. Complete or cancel it first.');
    }

    // Create outing request
    const outingRef = await db.collection('outings').add({
      studentId,
      wardenId: studentData.wardenId || null,
      managementId: studentData.managementId,
      hostelBlock: studentData.hostelBlock,
      destination: destination.trim(),
      reason: reason.trim(),
      outTime: new Date(outTime).toISOString(),
      expectedReturnTime: null,
      actualReturnTime: null,
      status: 'pending',
      timingStatus: null,
      studentName: studentData.name || 'Unknown',
      studentEmail: studentData.email || '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Outing request created: ${outingRef.id} by ${studentId}`);

    // Notify warden
    if (studentData.wardenId) {
      await sendNotification(
        studentData.wardenId,
        'New Outing Request',
        `${studentData.name} requested outing to ${destination}`,
        {
          outingId: outingRef.id,
          type: 'outing_request',
          studentId,
        }
      );
    }

    return {
      success: true,
      outingId: outingRef.id,
      message: 'Outing request submitted. Waiting for approval.',
    };
  } catch (error) {
    logger.error('Error in requestOuting:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Warden approves outing request
 * POST /approveOuting
 */
export const approveOuting = onCall(corsOptions, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const wardenId = request.auth.uid;
    const { outingId, expectedReturnTime } = request.data;

    // Validate input
    validateApprovalData({ outingId, expectedReturnTime });

    // Get outing document
    const outingDoc = await db.collection('outings').doc(outingId).get();
    if (!outingDoc.exists) {
      throw new HttpsError('not-found', 'Outing request not found');
    }

    const outing = outingDoc.data();

    // Authorization check - warden must manage this student
    if (outing.wardenId !== wardenId) {
      throw new HttpsError('permission-denied', 'You are not authorized to approve this request');
    }

    // Status check - must be pending
    if (outing.status !== 'pending') {
      throw new HttpsError('failed-precondition', `Cannot approve outing with status: ${outing.status}`);
    }

    // Validate return time is after out time
    const outTime = new Date(outing.outTime).getTime();
    const returnTime = new Date(expectedReturnTime).getTime();

    if (returnTime <= outTime) {
      throw new HttpsError('invalid-argument', 'Expected return time must be after out time');
    }

    // Check return time is within reasonable bounds (24 hours)
    const maxReturnTime = outTime + 24 * 60 * 60 * 1000;
    if (returnTime > maxReturnTime) {
      throw new HttpsError('invalid-argument', 'Expected return time must be within 24 hours of out time');
    }

    // Update outing
    await db.collection('outings').doc(outingId).update({
      status: 'approved',
      expectedReturnTime: new Date(expectedReturnTime).toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
      approvedBy: wardenId,
      approvedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Outing ${outingId} approved by ${wardenId}`);

    // Notify student
    await sendNotification(
      outing.studentId,
      'Outing Approved ✅',
      `Your outing to ${outing.destination} has been approved. Return by ${new Date(expectedReturnTime).toLocaleString()}`,
      {
        outingId,
        type: 'outing_approved',
        expectedReturnTime,
      }
    );

    return {
      success: true,
      message: 'Outing request approved',
    };
  } catch (error) {
    logger.error('Error in approveOuting:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Warden rejects outing request
 * POST /rejectOuting
 */
export const rejectOuting = onCall(corsOptions, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const wardenId = request.auth.uid;
    const { outingId, rejectionReason } = request.data;

    if (!outingId) {
      throw new HttpsError('invalid-argument', 'Outing ID is required');
    }

    // Get outing document
    const outingDoc = await db.collection('outings').doc(outingId).get();
    if (!outingDoc.exists) {
      throw new HttpsError('not-found', 'Outing request not found');
    }

    const outing = outingDoc.data();

    // Authorization check
    if (outing.wardenId !== wardenId) {
      throw new HttpsError('permission-denied', 'You are not authorized to reject this request');
    }

    // Status check
    if (outing.status !== 'pending') {
      throw new HttpsError('failed-precondition', `Cannot reject outing with status: ${outing.status}`);
    }

    // Update outing
    await db.collection('outings').doc(outingId).update({
      status: 'rejected',
      rejectionReason: rejectionReason || 'No reason provided',
      updatedAt: FieldValue.serverTimestamp(),
      rejectedBy: wardenId,
      rejectedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Outing ${outingId} rejected by ${wardenId}`);

    // Notify student
    await sendNotification(
      outing.studentId,
      'Outing Request Rejected ❌',
      `Your outing request to ${outing.destination} has been rejected. Reason: ${rejectionReason || 'No reason provided'}`,
      {
        outingId,
        type: 'outing_rejected',
        rejectionReason,
      }
    );

    return {
      success: true,
      message: 'Outing request rejected',
    };
  } catch (error) {
    logger.error('Error in rejectOuting:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Student marks their return
 * POST /markStudentReturn
 */
export const markStudentReturn = onCall(corsOptions, async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const studentId = request.auth.uid;
    const { outingId, actualReturnTime } = request.data;

    if (!outingId) {
      throw new HttpsError('invalid-argument', 'Outing ID is required');
    }

    if (!actualReturnTime) {
      throw new HttpsError('invalid-argument', 'Return time is required');
    }

    // Get outing document
    const outingDoc = await db.collection('outings').doc(outingId).get();
    if (!outingDoc.exists) {
      throw new HttpsError('not-found', 'Outing request not found');
    }

    const outing = outingDoc.data();

    // Authorization check
    if (outing.studentId !== studentId) {
      throw new HttpsError('permission-denied', 'You can only mark your own returns');
    }

    // Status check
    if (outing.status !== 'approved') {
      throw new HttpsError('failed-precondition', 'Only approved outings can have a return time marked');
    }

    // Validate return time is after out time
    const outTime = new Date(outing.outTime).getTime();
    const returnTime = new Date(actualReturnTime).getTime();

    if (returnTime < outTime) {
      throw new HttpsError('invalid-argument', 'Return time cannot be before out time');
    }

    // Calculate timing status
    const timingStatus = calculateTimingStatus(outing.expectedReturnTime, actualReturnTime);

    // Update outing
    await db.collection('outings').doc(outingId).update({
      actualReturnTime: new Date(actualReturnTime).toISOString(),
      timingStatus,
      status: 'completed',
      updatedAt: FieldValue.serverTimestamp(),
      markedReturnAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Outing ${outingId} marked return with timing ${timingStatus}`);

    // Notify warden of return
    const notifTitle = timingStatus === 'on-time'
      ? '✅ Student Returned On Time'
      : '⚠️ Student Returned Late';

    await sendNotification(
      outing.wardenId,
      notifTitle,
      `${outing.studentName} returned from ${outing.destination} (${timingStatus})`,
      {
        outingId,
        type: `outing_${timingStatus}`,
        timingStatus,
      }
    );

    // If very late, notify management
    if (timingStatus === 'very-late') {
      const managementUsers = await db.collection('users')
        .where('managementId', '==', outing.managementId)
        .where('role', 'in', ['management', 'admin'])
        .get();

      for (const doc of managementUsers.docs) {
        await sendNotification(
          doc.id,
          '🚨 Student Extremely Late - Escalation',
          `${outing.studentName} returned extremely late (${timingStatus}) from ${outing.destination}`,
          {
            outingId,
            type: 'outing_escalation',
            studentId,
          }
        );
      }
    }

    return {
      success: true,
      timingStatus,
      message: `Return marked as ${timingStatus}`,
    };
  } catch (error) {
    logger.error('Error in markStudentReturn:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get outings for a student
 * GET /getStudentOutings
 */
export const getStudentOutings = onCall(corsOptions, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const studentId = request.auth.uid;

    const snapshot = await db.collection('outings')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .get();

    const outings = [];
    snapshot.forEach(doc => {
      outings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      outings,
      total: outings.length,
    };
  } catch (error) {
    logger.error('Error in getStudentOutings:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get outings for a warden
 * GET /getWardenOutings
 */
export const getWardenOutings = onCall(corsOptions, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const wardenId = request.auth.uid;

    const snapshot = await db.collection('outings')
      .where('wardenId', '==', wardenId)
      .orderBy('createdAt', 'desc')
      .get();

    const outings = [];
    snapshot.forEach(doc => {
      outings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Separate by status for easier UI handling
    const pending = outings.filter(o => o.status === 'pending');
    const approved = outings.filter(o => o.status === 'approved');
    const completed = outings.filter(o => o.status === 'completed');
    const rejected = outings.filter(o => o.status === 'rejected');

    return {
      success: true,
      outings,
      pending,
      approved,
      completed,
      rejected,
      total: outings.length,
    };
  } catch (error) {
    logger.error('Error in getWardenOutings:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get outing history/analytics
 * GET /getOutingHistory
 */
export const getOutingHistory = onCall(corsOptions, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const userData = await getUserData(userId);

    let query = db.collection('outings');

    // Filter based on role
    if (userData.role === 'student') {
      query = query.where('studentId', '==', userId);
    } else if (userData.role === 'warden') {
      query = query.where('wardenId', '==', userId);
    } else if (userData.role === 'management' || userData.role === 'admin') {
      query = query.where('managementId', '==', userData.managementId || '');
    } else {
      throw new HttpsError('permission-denied', 'User role not authorized for history');
    }

    const snapshot = await query
      .where('status', 'in', ['completed', 'rejected'])
      .orderBy('status')
      .orderBy('updatedAt', 'desc')
      .get();

    const history = [];
    let onTimeCount = 0;
    let lateCount = 0;
    let veryLateCount = 0;
    let rejectedCount = 0;

    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      history.push(data);

      if (data.status === 'completed') {
        if (data.timingStatus === 'on-time') onTimeCount++;
        else if (data.timingStatus === 'late') lateCount++;
        else if (data.timingStatus === 'very-late') veryLateCount++;
      } else if (data.status === 'rejected') {
        rejectedCount++;
      }
    });

    const totalCompleted = onTimeCount + lateCount + veryLateCount;
    const onTimePercentage = totalCompleted > 0 ? ((onTimeCount / totalCompleted) * 100).toFixed(2) : 0;
    const latePercentage = totalCompleted > 0 ? ((lateCount / totalCompleted) * 100).toFixed(2) : 0;

    return {
      success: true,
      history,
      analytics: {
        totalCompleted,
        onTimeCount,
        lateCount,
        veryLateCount,
        rejectedCount,
        onTimePercentage: parseFloat(onTimePercentage),
        latePercentage: parseFloat(latePercentage),
      },
    };
  } catch (error) {
    logger.error('Error in getOutingHistory:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message);
  }
});

// ─────────────────────────────────────────────────────────────
// SCHEDULED FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Auto-detect and mark late returns
 * Runs every 10 minutes to check for late entries
 */
export const autoMarkLateOutings = onSchedule(
  {
    schedule: 'every 10 minutes',
    region: 'asia-south1',
  },
  async (event) => {
    try {
      logger.info('Starting auto-mark late outings job');

      const now = new Date();

      // Query approved outings with no return marked and expected time passed
      const snapshot = await db.collection('outings')
        .where('status', '==', 'approved')
        .where('actualReturnTime', '==', null)
        .get();

      let processedCount = 0;
      const batch = db.batch();

      snapshot.forEach(doc => {
        const outing = doc.data();
        const expectedReturnTime = new Date(outing.expectedReturnTime).getTime();

        // If expected time has passed, mark as late
        if (expectedReturnTime < now.getTime()) {
          const timingStatus = calculateTimingStatus(
            outing.expectedReturnTime,
            now.toISOString()
          );

          if (timingStatus) {
            batch.update(doc.ref, {
              timingStatus,
              status: 'completed',
              actualReturnTime: now.toISOString(),
              updatedAt: FieldValue.serverTimestamp(),
              autoMarkedLate: true,
            });
            processedCount++;

            // Queue notification (done separately to avoid batch size limits)
            logger.info(`Marked outing ${doc.id} as ${timingStatus} automatically`);
          }
        }
      });

      if (processedCount > 0) {
        await batch.commit();
        logger.info(`Auto-marked ${processedCount} outings as late`);
      }

      // Send notifications for auto-marked late entries
      const lateSnapshot = await db.collection('outings')
        .where('autoMarkedLate', '==', true)
        .where('notificationSent', '!=', true)
        .get();

      for (const doc of lateSnapshot.docs) {
        const outing = doc.data();

        // Notify warden
        await sendNotification(
          outing.wardenId,
          '⚠️ Student Auto-Marked as Late',
          `${outing.studentName} has not returned from ${outing.destination} and is marked as ${outing.timingStatus}`,
          {
            outingId: doc.id,
            type: 'outing_auto_late',
            timingStatus: outing.timingStatus,
          }
        );

        // Mark notification as sent
        await doc.ref.update({
          notificationSent: true,
        });
      }

      logger.info('Auto-mark late outings job completed');
    } catch (error) {
      logger.error('Error in autoMarkLateOutings:', error);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// FIRESTORE TRIGGERS
// ─────────────────────────────────────────────────────────────

/**
 * Trigger when outing timing status changes
 */
export const outingStatusChange = onDocumentUpdated(
  'outings/{outingId}',
  async (event) => {
    try {
      const before = event.data.before.data();
      const after = event.data.after.data();

      // Check if timing status changed to very-late
      if (before.timingStatus !== 'very-late' && after.timingStatus === 'very-late') {
        // Get management users
        const managementUsers = await db.collection('users')
          .where('managementId', '==', after.managementId)
          .where('role', 'in', ['management', 'admin'])
          .get();

        // Send escalation notifications
        for (const doc of managementUsers.docs) {
          await sendNotification(
            doc.id,
            '🚨 CRITICAL: Student Extremely Late',
            `${after.studentName} is EXTREMELY LATE returning from ${after.destination}!`,
            {
              outingId: event.params.outingId,
              type: 'outing_critical',
              studentId: after.studentId,
            }
          );
        }

        logger.info(`Critical late escalation sent for outing ${event.params.outingId}`);
      }

      // Check if status changed from pending to approved or rejected
      if (before.status === 'pending' && (after.status === 'approved' || after.status === 'rejected')) {
        logger.info(`Outing ${event.params.outingId} status changed to ${after.status}`);
      }
    } catch (error) {
      logger.error('Error in outingStatusChange trigger:', error);
    }
  }
);
