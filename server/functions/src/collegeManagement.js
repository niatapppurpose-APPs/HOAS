import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './config.js';
import { verifyAdmin, verifyManagementAccess } from './helpers.js';

/**
 * Delete a college and all associated users (cascade delete)
 */
export const deleteCollege = onCall(async (request) => {
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
export const getCollegeStats = onCall(async (request) => {
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
