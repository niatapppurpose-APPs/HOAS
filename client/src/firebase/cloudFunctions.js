/**
 * Firebase Cloud Functions Service
 * Wrapper for calling HOAS backend functions
 */

import { httpsCallable } from 'firebase/functions';
import { functions, isEmulatorConnected } from './firebaseConfig';

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

export const getApiBaseUrl = () => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hoas-65dee';
  if (isEmulatorConnected) {
    return `http://127.0.0.1:5001/${projectId}/asia-south1`;
  } else {
    return `https://asia-south1-${projectId}.cloudfunctions.net`;
  }
};

// =============================================================================
// USER MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Approve a user
 */
export const approveUser = async (userId, approverRole = 'admin') => {
  const callable = httpsCallable(functions, 'approveUser');
  try {
    const result = await callable({ userId, approverRole });
    return result.data;
  } catch (error) {
    console.error('Error approving user:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

/**
 * Deny a user
 */
export const denyUser = async (userId, reason = '') => {
  const callable = httpsCallable(functions, 'denyUser');
  try {
    const result = await callable({ userId, reason });
    return result.data;
  } catch (error) {
    console.error('Error denying user:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

/**
 * Delete a user from Firebase Authentication and Firestore (Owner / Management only)
 */
export const deleteUserAccount = async (userId) => {
  const callable = httpsCallable(functions, 'deleteUserAccount');
  try {
    const result = await callable({ userId });
    return result.data;
  } catch (error) {
    console.error('Error deleting user account:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

/**
 * Get all management users (Owner only)
 */
export const getAllManagementUsers = async () => {
  const callable = httpsCallable(functions, 'getAllManagementUsers');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error fetching management users:', error);
    throw error;
  }
};

/**
 * Create a new management user (Owner only)
 */
export const createManagement = async (managementData) => {
  const callable = httpsCallable(functions, 'createManagement');
  try {
    const result = await callable(managementData);
    return result.data;
  } catch (error) {
    console.error('Error creating management:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

// =============================================================================
// COLLEGE MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Delete a college and all associated users
 */
export const deleteCollege = async (collegeId) => {
  const callable = httpsCallable(functions, 'deleteCollege');
  try {
    const result = await callable({ collegeId });
    return result.data;
  } catch (error) {
    console.error('Error deleting college:', error);
    throw error;
  }
};

// =============================================================================
// SYSTEM SETTINGS FUNCTIONS
// =============================================================================

/**
 * Get global system settings
 */
export const getSystemSettings = async () => {
  const callable = httpsCallable(functions, 'getSystemSettings');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

/**
 * Update global system settings (Owner only)
 */
export const updateSystemSettings = async (settings) => {
  const callable = httpsCallable(functions, 'updateSystemSettings');
  try {
    const result = await callable({ settings });
    return result.data;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

/**
 * Check college capacity for new users
 */
export const checkCollegeCapacity = async (collegeId, role) => {
  const callable = httpsCallable(functions, 'checkCollegeCapacity');
  try {
    const result = await callable({ collegeId, role });
    return result.data;
  } catch (error) {
    console.error('Error checking college capacity:', error);
    throw error;
  }
};


// =============================================================================
// BULK UPLOAD FUNCTIONS
// =============================================================================

/**
 * Bulk create students from Excel data
 */
export const bulkCreateStudents = async (studentsData) => {
  const callable = httpsCallable(functions, 'bulkCreateStudents', { timeout: 300000 });
  try {
    const result = await callable(studentsData);
    return result.data;
  } catch (error) {
    console.error('Error bulk creating students:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

/**
 * Create a new warden (Management)
 */
export const createWarden = async (wardenData) => {
  const callable = httpsCallable(functions, 'createWarden');
  try {
    const result = await callable(wardenData);
    return result.data;
  } catch (error) {
    console.error('Error creating warden:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

/**
 * Create a new student manually (Management)
 */
export const createStudent = async (studentData) => {
  const callable = httpsCallable(functions, 'createStudent');
  try {
    const result = await callable(studentData);
    return result.data;
  } catch (error) {
    console.error('Error creating student:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

// =============================================================================
// OUTING PERMISSION & LATE ENTRY TRACKING
// =============================================================================

/**
 * Student requests an outing
 */
export const requestOuting = async (destination, reason, outTime) => {
  const callable = httpsCallable(functions, 'requestOuting');
  try {
    const result = await callable({ destination, reason, outTime });
    return result.data;
  } catch (error) {
    console.error('Error requesting outing:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

/**
 * Warden approves outing request
 */
export const approveOuting = async (outingId, expectedReturnTime) => {
  const callable = httpsCallable(functions, 'approveOuting');
  try {
    const result = await callable({ outingId, expectedReturnTime });
    return result.data;
  } catch (error) {
    console.error('Error approving outing:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

/**
 * Warden rejects outing request
 */
export const rejectOuting = async (outingId, rejectionReason) => {
  const callable = httpsCallable(functions, 'rejectOuting');
  try {
    const result = await callable({ outingId, rejectionReason });
    return result.data;
  } catch (error) {
    console.error('Error rejecting outing:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

/**
 * Student marks their return
 */
export const markStudentReturn = async (outingId, actualReturnTime) => {
  const callable = httpsCallable(functions, 'markStudentReturn');
  try {
    const result = await callable({ outingId, actualReturnTime });
    return result.data;
  } catch (error) {
    console.error('Error marking return:', error);
    const message = error.message || error.code || 'Unknown error';
    throw new Error(message);
  }
};

/**
 * Get student's outing history
 */
export const getStudentOutings = async () => {
  const callable = httpsCallable(functions, 'getStudentOutings');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error fetching student outings:', error);
    throw error;
  }
};

/**
 * Get warden's managed outing requests
 */
export const getWardenOutings = async () => {
  const callable = httpsCallable(functions, 'getWardenOutings');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error fetching warden outings:', error);
    throw error;
  }
};

/**
 * Get outing history and analytics
 */
export const getOutingHistory = async () => {
  const callable = httpsCallable(functions, 'getOutingHistory');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error fetching outing history:', error);
    throw error;
  }
};

export default {
  approveUser,
  denyUser,
  deleteUserAccount,
  getAllManagementUsers,
  createManagement,
  deleteCollege,
  getSystemSettings,
  updateSystemSettings,
  checkCollegeCapacity,
  bulkCreateStudents,
  createWarden,
  createStudent,
  requestOuting,
  approveOuting,
  rejectOuting,
  markStudentReturn,
  getStudentOutings,
  getWardenOutings,
  getOutingHistory,
};
