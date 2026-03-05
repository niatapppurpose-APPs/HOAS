import { db } from './config.js';
import { verifyAuthToken } from './helpers.js';

/**
 * Generate a random alphanumeric code for filenames / report IDs.
 * @param {number} length - Length of the code (default 8)
 * @returns {Promise<string>}
 */
export async function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const crypto = await import('crypto');
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

/**
 * Authenticate the request and return { userId, userData }.
 * Sends an error response and returns null when auth fails.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {'json'|'text'} errorMode - 'json' sends res.json, 'text' sends res.send
 * @returns {Promise<{userId: string, userData: object}|null>}
 */
export async function authenticateRequest(req, res, errorMode = 'json') {
  const reply = errorMode === 'json'
    ? (code, msg) => res.status(code).json({ error: msg })
    : (code, msg) => res.status(code).send(msg);

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('No Bearer token found');
    reply(401, 'Unauthorized - No token provided');
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  console.log('Token received (first 20 chars):', token.substring(0, 20));

  let decodedToken;
  try {
    decodedToken = await verifyAuthToken(token);
    console.log('✅ Token verified for user:', decodedToken.uid || decodedToken.user_id);
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    reply(401, `Unauthorized - Invalid token: ${error.message}`);
    return null;
  }

  const userId = decodedToken.uid || decodedToken.user_id;
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    reply(404, 'User profile not found');
    return null;
  }

  return { userId, userData: userDoc.data() };
}

/**
 * Fetch report data for the given role and userId.
 * Returns { reportTitle, reportData } or null if the role is not allowed.
 * @param {object} userData
 * @param {string} userId
 * @returns {Promise<{reportTitle: string, reportData: object}|null>}
 */
export async function fetchReportData(userData, userId) {
  if (userData.role === 'admin') {
    const [studentsSnap, wardensSnap, collegesSnap] = await Promise.all([
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('users').where('role', '==', 'warden').get(),
      db.collection('users').where('role', '==', 'management').get(),
    ]);

    return {
      reportTitle: 'Admin Overview Report',
      reportData: {
        reportType: 'Admin Overview',
        generatedAt: new Date().toISOString(),
        generatedBy: userData.name || userData.email,
        totalColleges: collegesSnap.size,
        totalStudents: studentsSnap.size,
        totalWardens: wardensSnap.size,
        colleges: collegesSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().collegeName || doc.data().email,
          collegeId: doc.data().uid || doc.id,
          email: doc.data().email,
          status: doc.data().status,
        })),
        students: studentsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          collegeId: doc.data().managementId,
        })),
        wardens: wardensSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          collegeId: doc.data().managementId,
        })),
      },
    };
  }

  if (userData.role === 'management') {
    const [studentsSnap, wardensSnap] = await Promise.all([
      db.collection('users').where('role', '==', 'student').where('managementId', '==', userId).get(),
      db.collection('users').where('role', '==', 'warden').where('managementId', '==', userId).get(),
    ]);

    return {
      reportTitle: 'College Report',
      reportData: {
        reportType: 'College Report',
        generatedAt: new Date().toISOString(),
        generatedBy: userData.name || userData.email,
        collegeId: userId,
        collegeName: userData.collegeName || userData.name || userData.email,
        email: userData.email,
        location: userData.location,
        students: studentsSnap.size,
        wardens: wardensSnap.size,
        studentsList: studentsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          phoneNumber: doc.data().phoneNumber,
          roomNumber: doc.data().roomNumber,
        })),
        wardensList: wardensSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          phoneNumber: doc.data().phoneNumber,
        })),
      },
    };
  }

  // Role not supported
  return null;
}
