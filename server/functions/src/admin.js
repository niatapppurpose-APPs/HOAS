import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth } from './config.js';
import { verifyAdmin } from './helpers.js';

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
