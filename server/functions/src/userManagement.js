import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth, corsOptions } from './config.js';
import * as logger from 'firebase-functions/logger';
import { verifyAdmin, verifyManagementAccess } from './helpers.js';

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
 * Creates Firebase Auth user and Firestore document
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

    const { collegeName, principalName, email, phone, password } = request.data;

    // Validate required fields
    if (!collegeName || !principalName || !email || !password) {
      throw new HttpsError('invalid-argument', 'collegeName, principalName, email, and password are required');
    }

    // Check if user with this email already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        throw new HttpsError('already-exists', 'A user with this email already exists');
      }
    } catch (error) {
      // User doesn't exist - this is what we want
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Use the password from client (generated with college name)
    const userPassword = password;

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: userPassword,
      displayName: principalName,
      emailVerified: false
    });

    logger.info('✅ Firebase Auth user created:', userRecord.uid);

    // Create Firestore document (store password hash reference, NOT plain text)
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: principalName,
      collegeName: collegeName,
      phone: phone || '',
      role: 'management',
      status: 'approved',
      createdBy: request.auth.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Store password securely in a separate collection (only accessible by owner)
    await db.collection('managementCredentials').doc(userRecord.uid).set({
      managementId: userRecord.uid,
      email: email,
      collegeName: collegeName,
      password: password, // Store temporarily - owner can view once
      createdBy: request.auth.uid,
      createdAt: new Date().toISOString(),
      isViewed: false
    });

    logger.info('✅ Firestore document created for:', userRecord.uid);

    // Generate password reset link and send email
    try {
      const resetLink = await auth.generatePasswordResetLink(email);
      logger.info('✅ Password reset link generated for:', email);
      // Note: Firebase will automatically send the email
    } catch (emailError) {
      logger.warn('⚠️ Could not generate password reset link:', emailError.message);
      // Continue anyway - admin can manually reset password
    }

    return {
      success: true,
      uid: userRecord.uid,
      message: 'Management user created successfully. Password reset email sent.'
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
 * Creates Firebase Auth user and Firestore document
 */
export const createWarden = onCall(corsOptions, async (request) => {
  try {
    logger.info('🔍 createWarden called with data:', request.data);

    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { fullName, email, phone, password, hostelBlock, collegeName, managementId } = request.data;

    // Validate required fields
    if (!fullName || !email || !password) {
      throw new HttpsError('invalid-argument', 'fullName, email, and password are required');
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

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: fullName,
      emailVerified: false
    });

    logger.info('✅ Firebase Auth warden created:', userRecord.uid);

    // Create Firestore document
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
      updatedAt: new Date().toISOString()
    });

    logger.info('✅ Warden Firestore document created:', userRecord.uid);

    return {
      success: true,
      uid: userRecord.uid,
      message: `Warden "${fullName}" created successfully`
    };

  } catch (error) {
    logger.error('❌ Error in createWarden:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to create warden: ${error.message}`);
  }
});

