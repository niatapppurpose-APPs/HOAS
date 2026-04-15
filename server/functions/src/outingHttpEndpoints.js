/**
 * Outing HTTP Endpoints
 * Main API endpoints for outing management
 */

import { onCall } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { corsOptions } from './config.js';
import {
  calculateTimingStatus,
  areOutingsEnabled,
  getStudentData,
  getUserData,
  sendNotification,
  validateOutingRequest,
  validateApprovalData,
} from './outingHelpers.js';

const db = getFirestore();

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
