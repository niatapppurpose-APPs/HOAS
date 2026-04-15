/**
 * Outing Query & Service Endpoints
 * Read-only and service functions for outing data retrieval
 */

import { onCall } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { corsOptions } from './config.js';
import { getUserData } from './outingHelpers.js';

const db = getFirestore();

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
