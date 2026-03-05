import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, corsOptions } from './config.js';
import { verifyAdmin, verifyManagementAccess } from './helpers.js';

/**
 * Delete a college and all associated users (cascade delete)
 */
export const deleteCollege = onCall(corsOptions, async (request) => {
  const { collegeId } = request.data;
  if (!collegeId) {
    throw new HttpsError('invalid-argument', 'collegeId is required');
  }
  await verifyAdmin(request);
  const collegeDoc = await db.collection('users').doc(collegeId).get();
  if (!collegeDoc.exists) {
    throw new HttpsError('not-found', 'College not found');
  }
  if (collegeDoc.data().role !== 'management') {
    throw new HttpsError('invalid-argument', 'Specified user is not a management user');
  }

  // --- Get all wardens and students ---
  const [wardensSnapshot, studentsSnapshot] = await Promise.all([
    db.collection('users').where('role', '==', 'warden').where('managementId', '==', collegeId).get(),
    db.collection('users').where('role', '==', 'student').where('managementId', '==', collegeId).get(),
  ]);

  // --- Collect all UIDs for Auth deletion ---
  const wardenUids = wardensSnapshot.docs.map(doc => doc.id);
  const studentUids = studentsSnapshot.docs.map(doc => doc.id);
  const allUids = [...wardenUids, ...studentUids];

  // --- Delete Auth users in parallel, chunked for safety ---
  const auth = (await import('./config.js')).auth;
  async function deleteAuthUsers(uids) {
    const chunkSize = 100; // Firebase Admin SDK limit for deleteUsers is 100
    let deleted = 0;
    for (let i = 0; i < uids.length; i += chunkSize) {
      const chunk = uids.slice(i, i + chunkSize);
      try {
        const res = await auth.deleteUsers(chunk);
        deleted += res.successCount;
      } catch (err) {
        // Fallback: try deleting individually if batch fails
        for (const uid of chunk) {
          try { await auth.deleteUser(uid); deleted++; } catch (e) {/* log or ignore */}
        }
      }
    }
    return deleted;
  }
  let authUsersDeleted = 0;
  if (allUids.length > 0) {
    authUsersDeleted = await deleteAuthUsers(allUids);
  }

  // --- Delete Firestore docs in batches of 400 (well below 500 limit) ---
  async function deleteDocsInChunks(docs) {
    const chunkSize = 400;
    let deleted = 0;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = db.batch();
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      deleted += chunk.length;
    }
    return deleted;
  }
  const wardensDeleted = await deleteDocsInChunks(wardensSnapshot.docs);
  const studentsDeleted = await deleteDocsInChunks(studentsSnapshot.docs);

  // --- Delete the college doc itself ---
  await db.collection('users').doc(collegeId).delete();

  return {
    success: true,
    message: 'College deleted successfully',
    stats: {
      wardensDeleted,
      studentsDeleted,
      authUsersDeleted
    }
  };
});

/**
 * Get college statistics
 */
export const getCollegeStats = onCall(corsOptions, async (request) => {
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
