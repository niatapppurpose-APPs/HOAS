/**
 * Firebase Cloud Functions Service
 * Wrapper for calling HOAS backend functions
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

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
    throw error;
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
    throw error;
  }
};

/**
 * Get all users for a college
 */
export const getCollegeUsers = async (collegeId, role = null, status = null) => {
  const callable = httpsCallable(functions, 'getCollegeUsers');
  try {
    const result = await callable({ collegeId, role, status });
    return result.data;
  } catch (error) {
    console.error('Error fetching college users:', error);
    throw error;
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

/**
 * Get college statistics
 */
export const getCollegeStats = async (collegeId) => {
  const callable = httpsCallable(functions, 'getCollegeStats');
  try {
    const result = await callable({ collegeId });
    return result.data;
  } catch (error) {
    console.error('Error fetching college stats:', error);
    throw error;
  }
};

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

/**
 * Set admin custom claim
 */
export const setAdminClaim = async (email, isAdmin = true) => {
  const callable = httpsCallable(functions, 'setAdminClaim');
  try {
    const result = await callable({ email, isAdmin });
    return result.data;
  } catch (error) {
    console.error('Error setting admin claim:', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId = null) => {
  const callable = httpsCallable(functions, 'getUserProfile');
  try {
    const result = await callable({ userId });
    return result.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData, userId = null) => {
  const callable = httpsCallable(functions, 'updateUserProfile');
  try {
    const result = await callable({ userId, profileData });
    return result.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Health check
 */
export const healthCheck = async () => {
  const callable = httpsCallable(functions, 'healthCheck');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};

export default {
  approveUser,
  denyUser,
  getCollegeUsers,
  getAllManagementUsers,
  deleteCollege,
  getCollegeStats,
  setAdminClaim,
  getUserProfile,
  updateUserProfile,
  healthCheck
};
