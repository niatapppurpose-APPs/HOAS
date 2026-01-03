/**
 * HOAS Cloud Functions
 * Backend API for Hostel Operations Accountability System
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

// Initialize Firebase Admin
initializeApp();

// Set global options
setGlobalOptions({ region: 'us-central1' });

const db = getFirestore();
const auth = getAuth();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Verify if user is an admin
 */
async function verifyAdmin(context) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userRecord = await auth.getUser(context.auth.uid);
  const isAdmin = userRecord.customClaims?.role === 'admin';

  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'User must be an admin');
  }

  return userRecord;
}

/**
 * Verify if user has permission to manage users in a college
 */
async function verifyManagementAccess(context, collegeId) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User profile not found');
  }

  const userData = userDoc.data();
  
  // Check if user is admin
  const userRecord = await auth.getUser(context.auth.uid);
  const isAdmin = userRecord.customClaims?.role === 'admin';
  
  // Check if user is management for this college
  const isManagement = userData.role === 'management' && userData.uid === collegeId;

  if (!isAdmin && !isManagement) {
    throw new HttpsError('permission-denied', 'Insufficient permissions');
  }

  return { userData, isAdmin };
}

// =============================================================================
// USER MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Approve a user (Management approves Warden/Student, Owner approves Management)
 */
export const approveUser = onCall({ cors: true }, async (request) => {
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

  // Verify permissions
  if (userData.role === 'management') {
    // Only admin can approve management
    await verifyAdmin(request);
  } else if (userData.role === 'warden' || userData.role === 'student') {
    // Admin or the management of their college can approve
    await verifyManagementAccess(request, userData.managementId);
  }

  // Update user status
  await db.collection('users').doc(userId).update({
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: request.auth.uid,
    approverRole: approverRole || 'admin',
    updatedAt: new Date().toISOString()
  });

  return { success: true, message: 'User approved successfully' };
});

/**
 * Deny a user
 */
export const denyUser = onCall({ cors: true }, async (request) => {
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

  // Verify permissions
  if (userData.role === 'management') {
    await verifyAdmin(request);
  } else {
    await verifyManagementAccess(request, userData.managementId);
  }

  // Update user status
  await db.collection('users').doc(userId).update({
    status: 'denied',
    deniedAt: new Date().toISOString(),
    deniedBy: request.auth.uid,
    denialReason: reason || '',
    updatedAt: new Date().toISOString()
  });

  return { success: true, message: 'User denied successfully' };
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

// =============================================================================
// COLLEGE MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Delete a college and all associated users (cascade delete)
 */
export const deleteCollege = onCall({ cors: true }, async (request) => {
  const { collegeId } = request.data;

  if (!collegeId) {
    throw new HttpsError('invalid-argument', 'collegeId is required');
  }

  // Verify admin
  await verifyAdmin(request);

  // Get college document
  const collegeDoc = await db.collection('users').doc(collegeId).get();
  if (!collegeDoc.exists) {
    throw new HttpsError('not-found', 'College not found');
  }

  if (collegeDoc.data().role !== 'management') {
    throw new HttpsError('invalid-argument', 'Specified user is not a management user');
  }

  const batch = db.batch();

  // Get and delete all wardens
  const wardensSnapshot = await db.collection('users')
    .where('role', '==', 'warden')
    .where('managementId', '==', collegeId)
    .get();

  wardensSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Get and delete all students
  const studentsSnapshot = await db.collection('users')
    .where('role', '==', 'student')
    .where('managementId', '==', collegeId)
    .get();

  studentsSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Delete the college itself
  batch.delete(collegeDoc.ref);

  // Commit batch
  await batch.commit();

  return {
    success: true,
    message: 'College deleted successfully',
    stats: {
      wardensDeleted: wardensSnapshot.size,
      studentsDeleted: studentsSnapshot.size
    }
  };
});

/**
 * Get college statistics
 */
export const getCollegeStats = onCall({ cors: true }, async (request) => {
  const { collegeId } = request.data;

  if (!collegeId) {
    throw new HttpsError('invalid-argument', 'collegeId is required');
  }

  // Verify access
  await verifyManagementAccess(request, collegeId);

  // Count wardens
  const wardensSnapshot = await db.collection('users')
    .where('role', '==', 'warden')
    .where('managementId', '==', collegeId)
    .get();

  // Count students
  const studentsSnapshot = await db.collection('users')
    .where('role', '==', 'student')
    .where('managementId', '==', collegeId)
    .get();

  // Count by status
  const stats = {
    wardens: {
      total: wardensSnapshot.size,
      pending: 0,
      approved: 0,
      denied: 0
    },
    students: {
      total: studentsSnapshot.size,
      pending: 0,
      approved: 0,
      denied: 0
    }
  };

  wardensSnapshot.forEach(doc => {
    const status = doc.data().status || 'pending';
    stats.wardens[status] = (stats.wardens[status] || 0) + 1;
  });

  studentsSnapshot.forEach(doc => {
    const status = doc.data().status || 'pending';
    stats.students[status] = (stats.students[status] || 0) + 1;
  });

  return { success: true, stats };
});

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

/**
 * Set admin custom claim for a user
 */
export const setRole = onCall({ cors: true }, async (request) => {
  const { email, role } = request.data;

  if (!email) {
    throw new HttpsError('invalid-argument', 'email is required');
  }

  // Verify current user is admin
  await verifyAdmin(request);

  // Get user by email
  const userRecord = await auth.getUserByEmail(email);

  // Set custom claim
  await auth.setCustomUserClaims(userRecord.uid, {
    role: role
  });

  return {
    success: true,
    message: `Role ${role} granted for ${email}`
  };
});

/**
 * Get user profile with admin check
 */
export const getUserProfile = onCall({ cors: true }, async (request) => {
  const { userId } = request.data;

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const targetUserId = userId || request.auth.uid;

  // Check if requesting own profile or has admin access
  if (targetUserId !== request.auth.uid) {
    await verifyAdmin(request);
  }

  const userDoc = await db.collection('users').doc(targetUserId).get();
  
  if (!userDoc.exists) {
    return { success: true, profile: null };
  }

  return {
    success: true,
    profile: {
      id: userDoc.id,
      ...userDoc.data()
    }
  };
});

/**
 * Update user profile
 */
export const updateUserProfile = onCall({ cors: true }, async (request) => {
  const { userId, profileData } = request.data;

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const targetUserId = userId || request.auth.uid;

  // Verify permissions (own profile or admin)
  if (targetUserId !== request.auth.uid) {
    await verifyAdmin(request);
  }

  // Prevent changing critical fields
  const allowedFields = [
    'fullName', 'phone', 'designation', 'address',
    'rollNumber', 'roomNumber', 'collegeName'
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (profileData[field] !== undefined) {
      updateData[field] = profileData[field];
    }
  }

  updateData.updatedAt = new Date().toISOString();

  await db.collection('users').doc(targetUserId).update(updateData);

  return { success: true, message: 'Profile updated successfully' };
});

// =============================================================================
// FIRESTORE TRIGGERS
// =============================================================================

/**
 * Trigger when a new user document is created
 * Send notification to appropriate admin/management
 */
export const onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data.data();
  const userId = event.params.userId;

  console.log(`New user created: ${userId}, Role: ${userData.role}`);

  // TODO: Send email notification to admin/management
  // TODO: Create audit log entry

  return null;
});

/**
 * Trigger when user status is updated
 * Send notification to user about approval/denial
 */
export const onUserStatusChanged = onDocumentUpdated('users/{userId}', async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const userId = event.params.userId;

  // Check if status changed
  if (beforeData.status !== afterData.status) {
    console.log(`User ${userId} status changed: ${beforeData.status} -> ${afterData.status}`);

    // TODO: Send email notification to user
    // TODO: Send push notification
    // TODO: Create audit log entry
  }

  return null;
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Health check endpoint
 */
export const healthCheck = onCall({ cors: true }, async () => {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    service: 'HOAS Cloud Functions',
    version: '1.0.0'
  };
});
