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
 */
export async function verifyAdmin(context) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const userRecord = await auth.getUser(context.auth.uid);
    const isAdmin = userRecord.customClaims?.role === 'admin';

    if (!isAdmin) {
      throw new HttpsError('permission-denied', 'User must be an admin');
    }

    return userRecord;
  } catch (error) {
    console.error('Error verifying admin status:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // Wrap auth errors
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
