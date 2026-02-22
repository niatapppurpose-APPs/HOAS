import { HttpsError } from 'firebase-functions/v2/https';
import { auth, db, isEmulator } from './config.js';

/**
 * Verify auth token (works in both emulator and production)
 */
export async function verifyAuthToken(token) {
  try {
    // In emulator mode, token verification might fail, so we decode without verification
    if (isEmulator) {
      console.log('⚠️  Emulator mode: Decoding token without full verification');
      // Try to verify anyway, but catch errors gracefully
      try {
        return await auth.verifyIdToken(token, false);
      } catch (e) {
        console.log('Emulator token verification failed, attempting decode:', e.message);
        // In emulator, just decode the token payload
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('Decoded token payload:', payload);
        return payload;
      }
    }
    // In production, always verify properly
    return await auth.verifyIdToken(token);
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
}

/**
 * Verify if user is an admin
 * Handles potential Identity Toolkit API errors gracefully
 */
export async function verifyAdmin(context) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // OPTIMIZATION: Check custom claims directly from the token first
  // This avoids a network call to the Identity Toolkit API, which is often disabled/restricted
  // and is the most common cause of "internal" errors when verifying admin status.
  const token = context.auth.token;
  const isAdminFromToken = token.role === 'admin' || token.admin === true;

  if (isAdminFromToken) {
    console.log('✅ Admin verified via token claims for:', context.auth.uid);
    return { uid: context.auth.uid, customClaims: token };
  }

  try {
    // FALLBACK: If token claims don't show admin, fetch the full user record
    // (useful if claims were recently updated but not yet refreshed in the client's token)
    const userRecord = await auth.getUser(context.auth.uid);
    const isAdmin = userRecord.customClaims?.role === 'admin' || userRecord.customClaims?.admin === true;

    if (!isAdmin) {
      throw new HttpsError('permission-denied', 'User must be an admin');
    }

    console.log('✅ Admin verified via getUser for:', context.auth.uid);
    return userRecord;
  } catch (error) {
    console.error('Error verifying admin status:', error);

    // Check for specific Firebase Auth/Identity Toolkit errors
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'User account not found');
    }

    // Check for Identity Toolkit API errors (common on mobile)
    if (error.message?.includes('PERMISSION_DENIED') ||
      error.message?.includes('identitytoolkit') ||
      error.message?.includes('SERVICE_DISABLED') ||
      error.code === 'permission-denied') {
      console.error('⚠️ Identity Toolkit API error - ensure API is enabled in GCP Console:', error.message);
      throw new HttpsError(
        'unavailable',
        'Authentication service temporarily unavailable. Please ensure Identity Toolkit API is enabled.'
      );
    }

    // Check for service account permission errors
    if (error.message?.includes('insufficient permissions') ||
      error.message?.includes('INSUFFICIENT_PERMISSIONS')) {
      console.error('⚠️ Service account permission error - check IAM roles');
      throw new HttpsError(
        'permission-denied',
        'Server configuration error. Please contact support.'
      );
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap auth errors with more context
    throw new HttpsError('internal', `Failed to verify admin status: ${error.message}`);
  }
}

/**
 * Verify if user has permission to manage users in a college
 */
export async function verifyManagementAccess(context, collegeId) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  console.log('Verifying management access for:', context.auth.uid, 'on college:', collegeId);

  try {
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User profile not found');
    }

    const userData = userDoc.data();
    console.log('Current user data:', { role: userData.role, uid: userData.uid });

    // Check if user is admin
    let isAdmin = false;
    try {
      const userRecord = await auth.getUser(context.auth.uid);
      isAdmin = userRecord.customClaims?.role === 'admin';
      console.log('Is admin?', isAdmin);
    } catch (error) {
      console.warn('Could not fetch user record for admin check:', error.message);
      // Don't throw here, just assume not admin if we can't check
    }

    // Check if user is management for this college
    const isManagement = userData.role === 'management' && userData.uid === collegeId;
    console.log('Is management for this college?', isManagement);

    if (!isAdmin && !isManagement) {
      throw new HttpsError('permission-denied', 'Insufficient permissions to manage this college');
    }

    return { userData, isAdmin };
  } catch (error) {
    console.error('Error in verifyManagementAccess:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Authorization check failed: ${error.message}`);
  }
}
