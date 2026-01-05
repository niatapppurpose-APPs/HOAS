import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './config.js';
import { verifyAdmin, verifyManagementAccess } from './helpers.js';

/**
 * Approve a user (Management approves Warden/Student, Owner approves Management)
 */
export const approveUser = onCall({ cors: true }, async (request) => {
  try {
    console.log('🔍 approveUser called with data:', request.data);
    console.log('Auth context:', request.auth);
    
    const { userId, approverRole } = request.data;

    if (!userId) {
      throw new HttpsError('invalid-argument', 'userId is required');
    }

    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Get user to approve
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    console.log('User to approve:', { userId, role: userData.role, managementId: userData.managementId });

    // Verify permissions
    try {
      if (userData.role === 'management') {
        // Only admin can approve management
        await verifyAdmin(request);
      } else if (userData.role === 'warden' || userData.role === 'student') {
        // Admin or the management of their college can approve
        await verifyManagementAccess(request, userData.managementId);
      }
    } catch (permError) {
      console.error('Permission verification failed:', permError.message);
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

    console.log('✅ User approved successfully:', userId);
    return { success: true, message: 'User approved successfully' };
    
  } catch (error) {
    console.error('❌ Error in approveUser:', error);
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
    console.log('🔍 denyUser called with data:', request.data);
    
    const { userId, reason } = request.data;

    if (!userId) {
      throw new HttpsError('invalid-argument', 'userId is required');
    }

    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Get user to deny
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    console.log('User to deny:', { userId, role: userData.role });

    // Verify permissions
    try {
      if (userData.role === 'management') {
        await verifyAdmin(request);
      } else {
        await verifyManagementAccess(request, userData.managementId);
      }
    } catch (permError) {
      console.error('Permission verification failed:', permError.message);
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

    console.log('✅ User denied successfully:', userId);
    return { success: true, message: 'User denied successfully' };
    
  } catch (error) {
    console.error('❌ Error in denyUser:', error);
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
