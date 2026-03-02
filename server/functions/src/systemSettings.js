import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './config.js';
import * as logger from 'firebase-functions/logger';
import { verifyAdmin } from './helpers.js';

// =============================================================================
// DEFAULT SETTINGS
// =============================================================================
const DEFAULT_SYSTEM_SETTINGS = {
  registrationEnabled: true,
  approvalsEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please try again later.',
  defaultStudentLimit: 500,
  defaultWardenLimit: 10,
  defaultHostelLimit: 20,
  features: {
    notifications: true,
    reports: true,
    analytics: true,
    bulkOperations: true,
  },
  version: 1,
};

// =============================================================================
// SYSTEM SETTINGS FUNCTIONS
// =============================================================================

/**
 * Get global system settings
 */
export const getSystemSettings = onCall(async (request) => {
  try {
    logger.info('📋 getSystemSettings called');

    const isAuthenticated = !!request.auth;
    const settingsDoc = await db.collection('systemSettings').doc('global').get();

    if (!settingsDoc.exists) {
      return {
        success: true,
        settings: DEFAULT_SYSTEM_SETTINGS,
        isDefault: true
      };
    }

    const settings = settingsDoc.data();

    // If not authenticated, return only public settings
    if (!isAuthenticated) {
      return {
        success: true,
        settings: {
          registrationEnabled: settings.registrationEnabled,
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage,
        },
        isPublic: true
      };
    }

    return {
      success: true,
      settings: {
        ...DEFAULT_SYSTEM_SETTINGS,
        ...settings
      }
    };

  } catch (error) {
    logger.error('❌ Error in getSystemSettings:', error);
    throw new HttpsError('internal', `Failed to get settings: ${error.message}`);
  }
});

/**
 * Update global system settings (Owner only)
 */
export const updateSystemSettings = onCall(async (request) => {
  try {
    logger.info('⚙️ updateSystemSettings called with:', request.data);

    await verifyAdmin(request);

    const { settings } = request.data;

    if (!settings || typeof settings !== 'object') {
      throw new HttpsError('invalid-argument', 'Settings object is required');
    }

    const allowedFields = [
      'registrationEnabled',
      'approvalsEnabled',
      'maintenanceMode',
      'maintenanceMessage',
      'defaultStudentLimit',
      'defaultWardenLimit',
      'defaultHostelLimit',
      'features',
      'complaintSlaHours',
      'autoEscalation',
      'escalateToOwner',
      'overdueThresholdHours',
      'smsEscalationAlerts',
      'emailEscalationAlerts',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (settings[field] !== undefined) {
        updateData[field] = settings[field];
      }
    }

    // Validate numeric limits
    if (updateData.defaultStudentLimit !== undefined &&
      (typeof updateData.defaultStudentLimit !== 'number' || updateData.defaultStudentLimit < 0)) {
      throw new HttpsError('invalid-argument', 'defaultStudentLimit must be a positive number');
    }
    if (updateData.defaultWardenLimit !== undefined &&
      (typeof updateData.defaultWardenLimit !== 'number' || updateData.defaultWardenLimit < 0)) {
      throw new HttpsError('invalid-argument', 'defaultWardenLimit must be a positive number');
    }
    if (updateData.defaultHostelLimit !== undefined &&
      (typeof updateData.defaultHostelLimit !== 'number' || updateData.defaultHostelLimit < 0)) {
      throw new HttpsError('invalid-argument', 'defaultHostelLimit must be a positive number');
    }

    updateData.updatedAt = new Date().toISOString();
    updateData.updatedBy = request.auth.uid;

    const currentDoc = await db.collection('systemSettings').doc('global').get();
    updateData.version = (currentDoc.exists ? currentDoc.data().version || 0 : 0) + 1;

    await db.collection('systemSettings').doc('global').set(updateData, { merge: true });

    // Audit log
    await db.collection('systemSettingsAudit').add({
      action: 'UPDATE_SETTINGS',
      changes: updateData,
      performedBy: request.auth.uid,
      performedAt: new Date().toISOString(),
      previousVersion: updateData.version - 1,
      newVersion: updateData.version,
    });

    logger.info('✅ System settings updated successfully');
    return {
      success: true,
      message: 'System settings updated successfully',
      version: updateData.version
    };

  } catch (error) {
    logger.error('❌ Error in updateSystemSettings:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to update settings: ${error.message}`);
  }
});

/**
 * Check if a college has capacity for new users
 */
export const checkCollegeCapacity = onCall(async (request) => {
  try {
    const { collegeId, role } = request.data;

    if (!collegeId || !role) {
      throw new HttpsError('invalid-argument', 'collegeId and role are required');
    }

    const limitsDoc = await db.collection('collegeLimits').doc(collegeId).get();
    const settingsDoc = await db.collection('systemSettings').doc('global').get();
    const globalSettings = settingsDoc.exists ? settingsDoc.data() : DEFAULT_SYSTEM_SETTINGS;

    let maxLimit, currentCount;

    if (!limitsDoc.exists) {
      if (role === 'student') {
        maxLimit = globalSettings.defaultStudentLimit;
      } else if (role === 'warden') {
        maxLimit = globalSettings.defaultWardenLimit;
      } else {
        return { allowed: true };
      }

      const usersSnapshot = await db.collection('users')
        .where('managementId', '==', collegeId)
        .where('role', '==', role)
        .where('status', '==', 'approved')
        .get();
      currentCount = usersSnapshot.size;
    } else {
      const limits = limitsDoc.data();
      if (role === 'student') {
        maxLimit = limits.maxStudents || globalSettings.defaultStudentLimit;
        currentCount = limits.currentStudents || 0;
      } else if (role === 'warden') {
        maxLimit = limits.maxWardens || globalSettings.defaultWardenLimit;
        currentCount = limits.currentWardens || 0;
      } else {
        return { allowed: true };
      }
    }

    const allowed = currentCount < maxLimit;

    return {
      allowed,
      currentCount,
      maxLimit,
      remaining: Math.max(0, maxLimit - currentCount),
      message: allowed ? null : `${role} limit reached (${currentCount}/${maxLimit})`
    };

  } catch (error) {
    logger.error('Error checking college capacity:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to check capacity: ${error.message}`);
  }
});
