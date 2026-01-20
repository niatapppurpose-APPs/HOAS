import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './config.js';
import * as logger from 'firebase-functions/logger';
import { verifyAdmin, verifyManagementAccess } from './helpers.js';

/**
 * Approve a user (Management approves Warden/Student, Owner approves Management)
 */
export const approveUser = onCall({ cors: true }, async (request) => {
  try {
    logger.info('🔍 approveUser called with data:', request.data);
    
    // Check authentication first
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, approverRole } = request.data;
    if (!userId) {
      throw new HttpsError('invalid-argument', 'userId is required');
    }

    // Get user to approve
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    logger.info('User to approve:', { userId, role: userData.role, managementId: userData.managementId, approver: request.auth.uid });

    // Verify permissions
    try {
      if (userData.role === 'management') {
        // Only admin can approve management
        await verifyAdmin(request);
      } else if (userData.role === 'warden' || userData.role === 'student') {
        // Admin or the management of their college can approve
        await verifyManagementAccess(request, userData.managementId);
      } else {
        // For other roles or unknown, require admin by default
        await verifyAdmin(request);
      }
    } catch (permError) {
      logger.error('Permission verification failed:', permError.message);
      throw permError;
    }

    // Update user status
    await db.collection('users').doc(userId).update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: request.auth.uid,
      approverRole: approverRole || 'admin',
      updatedAt: new Date().toISOString()
    });

    logger.info('✅ User approved successfully:', userId);
    return { success: true, message: 'User approved successfully' };
    
  } catch (error) {
    logger.error('❌ Error in approveUser:', error);
    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }
    // Wrap other errors
    throw new HttpsError('internal', `Failed to approve user: ${error.message}`);
  }
});

/**
 * Deny a user
 */
export const denyUser = onCall({ cors: true }, async (request) => {
  try {
    logger.info('🔍 denyUser called with data:', request.data);
    
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, reason } = request.data;
    if (!userId) {
      throw new HttpsError('invalid-argument', 'userId is required');
    }

    // Get user to deny
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    logger.info('User to deny:', { userId, role: userData.role });

    // Verify permissions
    try {
      if (userData.role === 'management') {
        await verifyAdmin(request);
      } else if (userData.role === 'warden' || userData.role === 'student') {
        await verifyManagementAccess(request, userData.managementId);
      } else {
        await verifyAdmin(request);
      }
    } catch (permError) {
      logger.error('Permission verification failed:', permError.message);
      throw permError;
    }

    // Update user status
    await db.collection('users').doc(userId).update({
      status: 'denied',
      deniedAt: new Date().toISOString(),
      deniedBy: request.auth.uid,
      denialReason: reason || '',
      updatedAt: new Date().toISOString()
    });

    logger.info('✅ User denied successfully:', userId);
    return { success: true, message: 'User denied successfully' };
    
  } catch (error) {
    logger.error('❌ Error in denyUser:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to deny user: ${error.message}`);
  }
});

/**
 * Get all users for a management user (Wardens and Students)
 */
export const getCollegeUsers = onCall({ cors: true }, async (request) => {
  const { collegeId, role, status } = request.data;

  if (!collegeId) {
    throw new HttpsError('invalid-argument', 'collegeId is required');
  }

  // Verify access
  await verifyManagementAccess(request, collegeId);

  // Build query
  let query = db.collection('users').where('managementId', '==', collegeId);

  if (role) {
    query = query.where('role', '==', role);
  }

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  const users = [];

  snapshot.forEach(doc => {
    users.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return { success: true, users };
});

/**
 * Get all management users (Owner only)
 */
export const getAllManagementUsers = onCall({ cors: true }, async (request) => {
  // Verify admin
  await verifyAdmin(request);

  const snapshot = await db.collection('users')
    .where('role', '==', 'management')
    .get();

  const users = [];
  snapshot.forEach(doc => {
    users.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return { success: true, users };
});
