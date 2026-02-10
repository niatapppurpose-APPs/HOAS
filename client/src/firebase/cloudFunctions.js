/**
 * Firebase Cloud Functions Service
 * Wrapper for calling HOAS backend functions
 */

import { httpsCallable } from 'firebase/functions';
import { functions, isEmulatorConnected } from './firebaseConfig';

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

/**
 * Check if we should use the emulator or production endpoints
 * This uses the isEmulatorConnected flag set during Firebase initialization
 */
export const getApiBaseUrl = () => {
  if (isEmulatorConnected) {
    console.log('🔧 Using Firebase Emulator for Cloud Functions');
    return 'http://127.0.0.1:5001/hoas-65dee/us-central1';
  } else {
    console.log('🌐 Using Production Firebase Cloud Functions');
    return 'https://us-central1-hoas-65dee.cloudfunctions.net';
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
    // Extract more helpful error message
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
 * Get all role permission templates
 */
export const getRolePermissionTemplates = async () => {
  const callable = httpsCallable(functions, 'getRolePermissionTemplates');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error fetching role permission templates:', error);
    throw error;
  }
};

/**
 * Save a role permission template
 */
export const saveRolePermissionTemplate = async (template, templateId = null) => {
  const callable = httpsCallable(functions, 'saveRolePermissionTemplate');
  try {
    const result = await callable({ templateId, template });
    return result.data;
  } catch (error) {
    console.error('Error saving role permission template:', error);
    throw error;
  }
};

/**
 * Delete a role permission template
 */
export const deleteRolePermissionTemplate = async (templateId) => {
  const callable = httpsCallable(functions, 'deleteRolePermissionTemplate');
  try {
    const result = await callable({ templateId });
    return result.data;
  } catch (error) {
    console.error('Error deleting role permission template:', error);
    throw error;
  }
};

/**
 * Get all approval workflows
 */
export const getApprovalWorkflows = async () => {
  const callable = httpsCallable(functions, 'getApprovalWorkflows');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error fetching approval workflows:', error);
    throw error;
  }
};

/**
 * Save an approval workflow
 */
export const saveApprovalWorkflow = async (workflow, workflowId = null) => {
  const callable = httpsCallable(functions, 'saveApprovalWorkflow');
  try {
    const result = await callable({ workflowId, workflow });
    return result.data;
  } catch (error) {
    console.error('Error saving approval workflow:', error);
    throw error;
  }
};

/**
 * Delete an approval workflow
 */
export const deleteApprovalWorkflow = async (workflowId) => {
  const callable = httpsCallable(functions, 'deleteApprovalWorkflow');
  try {
    const result = await callable({ workflowId });
    return result.data;
  } catch (error) {
    console.error('Error deleting approval workflow:', error);
    throw error;
  }
};

/**
 * Get user limits for all colleges
 */
export const getCollegeLimits = async () => {
  const callable = httpsCallable(functions, 'getCollegeLimits');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error fetching college limits:', error);
    throw error;
  }
};

/**
 * Set user limits for a specific college
 */
export const setCollegeLimits = async (collegeId, limits) => {
  const callable = httpsCallable(functions, 'setCollegeLimits');
  try {
    const result = await callable({ collegeId, limits });
    return result.data;
  } catch (error) {
    console.error('Error setting college limits:', error);
    throw error;
  }
};

/**
 * Check if registration is allowed
 */
export const checkRegistrationAllowed = async () => {
  const callable = httpsCallable(functions, 'checkRegistrationAllowed');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error checking registration:', error);
    // Default to allowed if we can't check
    return { allowed: true };
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

/**
 * Get system status (maintenance mode, features, etc.)
 */
export const getSystemStatus = async () => {
  const callable = httpsCallable(functions, 'getSystemStatus');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error getting system status:', error);
    // Default response if we can't check
    return {
      maintenanceMode: false,
      registrationEnabled: true,
      approvalsEnabled: true,
    };
  }
};

/**
 * Initialize system settings with defaults
 */
export const initializeSystemSettings = async () => {
  const callable = httpsCallable(functions, 'initializeSystemSettings');
  try {
    const result = await callable();
    return result.data;
  } catch (error) {
    console.error('Error initializing system settings:', error);
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
  healthCheck,
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  getRolePermissionTemplates,
  saveRolePermissionTemplate,
  deleteRolePermissionTemplate,
  getApprovalWorkflows,
  saveApprovalWorkflow,
  deleteApprovalWorkflow,
  getCollegeLimits,
  setCollegeLimits,
  checkRegistrationAllowed,
  checkCollegeCapacity,
  getSystemStatus,
  initializeSystemSettings,
  // Bulk Upload
  bulkCreateStudents,
  createWarden,
};
