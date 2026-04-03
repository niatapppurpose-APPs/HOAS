import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth, corsOptions } from './config.js';
import * as logger from 'firebase-functions/logger';
import { verifyAdmin, verifyManagementAccess } from './helpers.js';
import { sendManagementWelcomeEmail, sendWardenWelcomeEmail } from './email/emailService.js';
import crypto from 'crypto';

/**
 * Approve a user (Management approves Warden/Student, Owner approves Management)
 */
export const approveUser = onCall(corsOptions, async (request) => {
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
export const denyUser = onCall(corsOptions, async (request) => {
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
export const getCollegeUsers = onCall(corsOptions, async (request) => {
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
export const getAllManagementUsers = onCall(corsOptions, async (request) => {
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

/**
 * Create a new management user (Owner only)
 * Creates Firebase Auth user and Firestore document.
 * Uses throwaway password + password reset link (no plaintext passwords stored or emailed).
 */
export const createManagement = onCall(corsOptions, async (request) => {
  try {
    logger.info('🔍 createManagement called with data:', request.data);

    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify admin
    await verifyAdmin(request);

    const { collegeName, principalName, email, phone, collegeLogo } = request.data;

    // Validate required fields
    if (!collegeName || !principalName || !email) {
      throw new HttpsError('invalid-argument', 'collegeName, principalName, and email are required');
    }

    // Check if user with this email already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        throw new HttpsError('already-exists', 'A user with this email already exists');
      }
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Use admin-provided password if supplied, otherwise generate a short readable one
    const { password: providedPassword } = request.data;
    const accountPassword = providedPassword || crypto.randomBytes(6).toString('hex');

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: accountPassword,
      displayName: principalName,
      emailVerified: false,
    });

    logger.info('✅ Firebase Auth user created:', userRecord.uid);

    // Create Firestore document — NO password stored
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: principalName,
      collegeName: collegeName,
      phone: phone || '',
      collegeLogo: collegeLogo || null,
      role: 'management',
      status: 'approved',
      createdBy: request.auth.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info('✅ Firestore document created for:', userRecord.uid);

    // Send welcome email with account credentials
    let emailSent = false;
    emailSent = await sendManagementWelcomeEmail({
      name: principalName,
      email,
      collegeName,
      password: accountPassword,
    });

    return {
      success: true,
      uid: userRecord.uid,
      emailSent,
      message: emailSent
        ? 'Management user created successfully. Welcome email sent.'
        : 'Management user created successfully. Welcome email could not be sent.',
    };

  } catch (error) {
    logger.error('❌ Error in createManagement:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to create management user: ${error.message}`);
  }
});

/**
 * Create a new warden (Management only)
 * Creates Firebase Auth user and Firestore document.
 * Uses management-provided password (or generated fallback) and emails credentials.
 */
export const createWarden = onCall(corsOptions, async (request) => {
  try {
    logger.info('🔍 createWarden called with data:', request.data);

    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { fullName, email, phone, hostelBlock, hostelName, collegeName, managementId, password: providedPassword } = request.data;
    const normalizedHostelBlock = (hostelBlock || '').trim();
    const normalizedHostelName = (hostelName || '').trim();
    const effectiveManagementId = managementId || request.auth.uid;

    // Validate required fields
    if (!fullName || !email) {
      throw new HttpsError('invalid-argument', 'fullName and email are required');
    }

    if (providedPassword && providedPassword.length < 6) {
      throw new HttpsError('invalid-argument', 'Password must be at least 6 characters');
    }

    // Check if user with this email already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        throw new HttpsError('already-exists', 'A user with this email already exists');
      }
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Use admin-provided password if supplied, otherwise generate a short readable one
    const accountPassword = providedPassword || crypto.randomBytes(6).toString('hex');

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: accountPassword,
      displayName: fullName,
      emailVerified: false,
    });

    logger.info('✅ Firebase Auth warden created:', userRecord.uid);

    // Create Firestore document — NO password stored
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: fullName,
      fullName: fullName,
      phone: phone || '',
      role: 'warden',
      status: 'approved',
      hostelBlock: normalizedHostelBlock,
      hostelName: normalizedHostelName,
      collegeName: collegeName || '',
      managementId: effectiveManagementId,
      isOnline: false,
      createdBy: request.auth.uid,
      createdAt: new Date().toISOString(),
      
      updatedAt: new Date().toISOString(),
    });

    // if a new hostelBlock was provided, add it to hostels collection if missing
    if (normalizedHostelBlock && collegeName) {
      try {
        const existingHostels = await db.collection('hostels')
          .where('collegeName', '==', collegeName)
          .get();

        const normalizedKeysToMatch = [normalizedHostelBlock, normalizedHostelName]
          .filter(Boolean)
          .map((value) => value.toLowerCase());

        const alreadyExists = existingHostels.docs.some((hostelDoc) => {
          const hostelData = hostelDoc.data() || {};

          if (hostelData.managementId && hostelData.managementId !== effectiveManagementId) {
            return false;
          }

          const hostelKeys = [hostelData.block, hostelData.name]
            .filter(Boolean)
            .map((value) => String(value).trim().toLowerCase());

          return normalizedKeysToMatch.some((key) => hostelKeys.includes(key));
        });

        if (!alreadyExists) {
          await db.collection('hostels').add({
            name: normalizedHostelName || normalizedHostelBlock,
            block: normalizedHostelBlock,
            collegeName,
            managementId: effectiveManagementId,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (hErr) {
        logger.warn('⚠️ failed to add hostel block record for warden:', hErr.message);
      }
    }

    logger.info('✅ Warden Firestore document created:', userRecord.uid);

    // Send welcome email
    let emailSent = false;
    emailSent = await sendWardenWelcomeEmail({
      name: fullName,
      email,
      institution: collegeName || '',
      hostelBlock: hostelBlock || '',
      password: accountPassword,
    });

    return {
      success: true,
      uid: userRecord.uid,
      emailSent,
      message: emailSent
        ? `Warden "${fullName}" created successfully. Welcome email sent.`
        : `Warden "${fullName}" created successfully. Welcome email could not be sent.`,
    };

  } catch (error) {
    logger.error('❌ Error in createWarden:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to create warden: ${error.message}`);
  }
});

/**
 * Delete a user from both Firebase Authentication and Firestore.
 * Only admin (owner) or management can call this function.
 */
export const deleteUserAccount = onCall(corsOptions, async (request) => {
  try {
    logger.info('🗑️ deleteUserAccount called', { caller: request.auth?.uid });

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId } = request.data;
    if (!userId) {
      throw new HttpsError('invalid-argument', 'userId is required');
    }

    // Fetch the target user document so we can check their role/managementId
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const targetUser = userDoc.data();

    // Verify caller has permission (admin or the management that owns this user)
    try {
      if (targetUser.role === 'management') {
        // Only admin (owner) can delete a management user
        await verifyAdmin(request);
      } else {
        // Admin or management of that college can delete warden/student
        await verifyManagementAccess(request, targetUser.managementId);
      }
    } catch (permError) {
      logger.error('Permission check failed for deleteUserAccount:', permError.message);
      throw permError;
    }


    // If deleting a management user, also delete all wardens and students belonging to that managementId
    if (targetUser.role === 'management') {
      logger.info('Deleting all wardens and students for managementId:', userId);
      const usersToDelete = [];
      const usersSnapshot = await db.collection('users')
        .where('managementId', '==', userId)
        .where('role', 'in', ['warden', 'student'])
        .get();
      usersSnapshot.forEach(doc => {
        usersToDelete.push({ id: doc.id, ...doc.data() });
      });
      for (const u of usersToDelete) {
        try {
          await auth.deleteUser(u.id);
          logger.info('✅ Firebase Auth user deleted (cascade):', u.id);
        } catch (authError) {
          if (authError.code === 'auth/user-not-found') {
            logger.warn('⚠️ Auth user not found (already deleted?):', u.id);
          } else {
            logger.error('❌ Failed to delete auth user (cascade):', u.id, authError.message);
          }
        }
        await db.collection('users').doc(u.id).delete();
        logger.info('✅ Firestore user document deleted (cascade):', u.id);
      }

      // Cascade delete hostels tied to this management (and fallback on collegeName for legacy records)
      const hostelIdsToDelete = new Set();
      if (userId) {
        const hostelsByManagement = await db.collection('hostels')
          .where('managementId', '==', userId)
          .get();
        hostelsByManagement.forEach(doc => hostelIdsToDelete.add(doc.id));
      }
      if (targetUser.collegeName) {
        const hostelsByCollege = await db.collection('hostels')
          .where('collegeName', '==', targetUser.collegeName)
          .get();
        hostelsByCollege.forEach(doc => hostelIdsToDelete.add(doc.id));
      }

      for (const hostelId of hostelIdsToDelete) {
        try {
          await db.collection('hostels').doc(hostelId).delete();
          logger.info('✅ Hostels document deleted (cascade):', hostelId);
        } catch (hErr) {
          logger.error('❌ Failed to delete hostel document (cascade):', hostelId, hErr.message);
        }
      }
    }

    // Delete from Firebase Authentication (main user)
    try {
      await auth.deleteUser(userId);
      logger.info('✅ Firebase Auth user deleted:', userId);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        logger.warn('⚠️ Auth user not found (already deleted?):', userId);
      } else {
        throw new HttpsError('internal', `Failed to delete auth user: ${authError.message}`);
      }
    }

    // Delete Firestore document (main user)
    await db.collection('users').doc(userId).delete();
    logger.info('✅ Firestore user document deleted:', userId);

    return {
      success: true,
      uid: userId,
      message: targetUser.role === 'management'
        ? 'Management user and all associated wardens and students deleted from Authentication and Firestore.'
        : 'User deleted from Authentication and Firestore.',
    };

  } catch (error) {
    logger.error('❌ Error in deleteUserAccount:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to delete user: ${error.message}`);
  }
});

