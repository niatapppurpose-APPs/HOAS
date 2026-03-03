import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth, corsOptions } from './config.js';
import * as logger from 'firebase-functions/logger';
import { verifyAdmin, verifyManagementAccess } from './helpers.js';
import { sendManagementWelcomeEmail, sendWardenWelcomeEmail } from './email/emailService.js';
import crypto from 'crypto';

/**
 * Approve a user (Management approves Warden/Student, Owner approves Management)
 */
export const approveUser = onCall(async (request) => {
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
export const denyUser = onCall(async (request) => {
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
export const getCollegeUsers = onCall(async (request) => {
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
export const getAllManagementUsers = onCall(async (request) => {
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

    // Throwaway password — never stored, never transmitted
    const throwawayPassword = crypto.randomUUID();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: throwawayPassword,
      displayName: principalName,
      emailVerified: false,
    });

    logger.info('✅ Firebase Auth user created:', userRecord.uid);

    // Generate secure password reset link
    let resetLink = null;
    try {
      resetLink = await auth.generatePasswordResetLink(email);
      logger.info('✅ Password reset link generated for:', email);
    } catch (linkError) {
      logger.warn('⚠️ Could not generate password reset link:', linkError.message);
    }

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

    // Send welcome email with password reset link
    let emailSent = false;
    if (resetLink) {
      emailSent = await sendManagementWelcomeEmail({
        name: principalName,
        email,
        collegeName,
        resetLink,
      });
    }

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
 * Uses throwaway password + password reset link (no plaintext passwords stored or emailed).
 */
export const createWarden = onCall(corsOptions, async (request) => {
  try {
    logger.info('🔍 createWarden called with data:', request.data);

    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { fullName, email, phone, hostelBlock, collegeName, managementId } = request.data;

    // Validate required fields
    if (!fullName || !email) {
      throw new HttpsError('invalid-argument', 'fullName and email are required');
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

    // Throwaway password — never stored, never transmitted
    const throwawayPassword = crypto.randomUUID();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: throwawayPassword,
      displayName: fullName,
      emailVerified: false,
    });

    logger.info('✅ Firebase Auth warden created:', userRecord.uid);

    // Generate secure password reset link
    let resetLink = null;
    try {
      resetLink = await auth.generatePasswordResetLink(email);
      logger.info('✅ Password reset link generated for warden:', email);
    } catch (linkError) {
      logger.warn('⚠️ Could not generate password reset link for warden:', linkError.message);
    }

    // Create Firestore document — NO password stored
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: fullName,
      fullName: fullName,
      phone: phone || '',
      role: 'warden',
      status: 'approved',
      hostelBlock: hostelBlock || '',
      collegeName: collegeName || '',
      managementId: managementId || request.auth.uid,
      isOnline: false,
      createdBy: request.auth.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info('✅ Warden Firestore document created:', userRecord.uid);

    // Send welcome email
    let emailSent = false;
    if (resetLink) {
      emailSent = await sendWardenWelcomeEmail({
        name: fullName,
        email,
        institution: collegeName || '',
        hostelBlock: hostelBlock || '',
        resetLink,
      });
    }

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

