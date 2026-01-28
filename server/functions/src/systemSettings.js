import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth } from './config.js';
import * as logger from 'firebase-functions/logger';
import { verifyAdmin } from './helpers.js';

// =============================================================================
// DATABASE SCHEMA (Firestore Collections)
// =============================================================================
/**
 * Collection: systemSettings
 * Document: global
 * Schema:
 * {
 *   // Global Toggles
 *   registrationEnabled: boolean,        // Allow new user registrations
 *   approvalsEnabled: boolean,           // Enable/disable approval workflows
 *   maintenanceMode: boolean,            // Put system in maintenance mode
 *   maintenanceMessage: string,          // Message shown during maintenance
 *   
 *   // User Limits
 *   defaultStudentLimit: number,         // Default student limit per hostel
 *   defaultWardenLimit: number,          // Default warden limit per hostel
 *   defaultHostelLimit: number,          // Default hostel limit per college
 *   
 *   // Feature Flags
 *   features: {
 *     notifications: boolean,
 *     reports: boolean,
 *     analytics: boolean,
 *     bulkOperations: boolean,
 *   },
 *   
 *   // Metadata
 *   updatedAt: timestamp,
 *   updatedBy: string (uid),
 *   version: number,
 * }
 * 
 * Collection: rolePermissionTemplates
 * Document: {templateId}
 * Schema:
 * {
 *   name: string,
 *   description: string,
 *   role: 'student' | 'warden' | 'management' | 'principal',
 *   permissions: {
 *     canViewReports: boolean,
 *     canManageStudents: boolean,
 *     canManageWardens: boolean,
 *     canApproveUsers: boolean,
 *     canManageHostels: boolean,
 *     canAccessAnalytics: boolean,
 *     canBulkOperations: boolean,
 *     canExportData: boolean,
 *     canViewNotifications: boolean,
 *     canSendNotifications: boolean,
 *   },
 *   isDefault: boolean,
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
 *   createdBy: string (uid),
 * }
 * 
 * Collection: approvalWorkflows
 * Document: {workflowId}
 * Schema:
 * {
 *   name: string,
 *   description: string,
 *   targetRole: 'student' | 'warden' | 'management',
 *   steps: [
 *     {
 *       order: number,
 *       approverRole: string,
 *       required: boolean,
 *       autoApprove: boolean,
 *       autoApproveConditions: object,
 *       timeoutHours: number,
 *       timeoutAction: 'escalate' | 'auto-approve' | 'auto-deny',
 *     }
 *   ],
 *   isActive: boolean,
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
 *   createdBy: string (uid),
 * }
 * 
 * Collection: collegeLimits
 * Document: {collegeId}
 * Schema:
 * {
 *   collegeId: string,
 *   collegeName: string,
 *   maxStudents: number,
 *   maxWardens: number,
 *   maxHostels: number,
 *   currentStudents: number,
 *   currentWardens: number,
 *   currentHostels: number,
 *   customSettings: object,
 *   updatedAt: timestamp,
 *   updatedBy: string (uid),
 * }
 */

// =============================================================================
// DEFAULT SETTINGS
// =============================================================================
const DEFAULT_SYSTEM_SETTINGS = {
  // Global Toggles
  registrationEnabled: true,
  approvalsEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please try again later.',
  
  // User Limits
  defaultStudentLimit: 500,
  defaultWardenLimit: 10,
  defaultHostelLimit: 20,
  
  // Feature Flags
  features: {
    notifications: true,
    reports: true,
    analytics: true,
    bulkOperations: true,
  },
  
  // Metadata
  version: 1,
};

const DEFAULT_ROLE_PERMISSIONS = {
  student: {
    canViewReports: false,
    canManageStudents: false,
    canManageWardens: false,
    canApproveUsers: false,
    canManageHostels: false,
    canAccessAnalytics: false,
    canBulkOperations: false,
    canExportData: false,
    canViewNotifications: true,
    canSendNotifications: false,
  },
  warden: {
    canViewReports: true,
    canManageStudents: true,
    canManageWardens: false,
    canApproveUsers: false,
    canManageHostels: false,
    canAccessAnalytics: true,
    canBulkOperations: false,
    canExportData: true,
    canViewNotifications: true,
    canSendNotifications: true,
  },
  management: {
    canViewReports: true,
    canManageStudents: true,
    canManageWardens: true,
    canApproveUsers: true,
    canManageHostels: true,
    canAccessAnalytics: true,
    canBulkOperations: true,
    canExportData: true,
    canViewNotifications: true,
    canSendNotifications: true,
  },
  principal: {
    canViewReports: true,
    canManageStudents: true,
    canManageWardens: true,
    canApproveUsers: true,
    canManageHostels: true,
    canAccessAnalytics: true,
    canBulkOperations: true,
    canExportData: true,
    canViewNotifications: true,
    canSendNotifications: true,
  },
};

// =============================================================================
// SYSTEM SETTINGS FUNCTIONS
// =============================================================================

// CORS configuration - matches other functions
const corsConfig = { 
  cors: ['http://localhost:5173', 'https://hoas-65dee.web.app', 'https://hoas-65dee.firebaseapp.com']
};

/**
 * Get global system settings
 */
export const getSystemSettings = onCall(corsConfig, async (request) => {
  try {
    logger.info('📋 getSystemSettings called');

    // Settings can be read by any authenticated user (for enforcement)
    // But some fields may be filtered based on role
    const isAuthenticated = !!request.auth;
    
    const settingsDoc = await db.collection('systemSettings').doc('global').get();
    
    if (!settingsDoc.exists) {
      // Return defaults if no settings exist
      return { 
        success: true, 
        settings: DEFAULT_SYSTEM_SETTINGS,
        isDefault: true
      };
    }

    const settings = settingsDoc.data();
    
    // If not admin, return only public settings
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
export const updateSystemSettings = onCall({ cors: true }, async (request) => {
  try {
    logger.info('⚙️ updateSystemSettings called with:', request.data);
    
    // Verify admin/owner access
    await verifyAdmin(request);
    
    const { settings } = request.data;
    
    if (!settings || typeof settings !== 'object') {
      throw new HttpsError('invalid-argument', 'Settings object is required');
    }

    // Validate settings fields
    const allowedFields = [
      'registrationEnabled',
      'approvalsEnabled',
      'maintenanceMode',
      'maintenanceMessage',
      'defaultStudentLimit',
      'defaultWardenLimit',
      'defaultHostelLimit',
      'features',
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

    // Add metadata
    updateData.updatedAt = new Date().toISOString();
    updateData.updatedBy = request.auth.uid;

    // Get current version and increment
    const currentDoc = await db.collection('systemSettings').doc('global').get();
    updateData.version = (currentDoc.exists ? currentDoc.data().version || 0 : 0) + 1;

    // Update or create settings
    await db.collection('systemSettings').doc('global').set(updateData, { merge: true });

    // Log the change for audit
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

// =============================================================================
// ROLE PERMISSION TEMPLATES
// =============================================================================

/**
 * Get all role permission templates
 */
export const getRolePermissionTemplates = onCall({ cors: true }, async (request) => {
  try {
    logger.info('📋 getRolePermissionTemplates called');
    
    await verifyAdmin(request);
    
    const templatesSnapshot = await db.collection('rolePermissionTemplates')
      .orderBy('createdAt', 'desc')
      .get();
    
    const templates = [];
    templatesSnapshot.forEach(doc => {
      templates.push({ id: doc.id, ...doc.data() });
    });

    // If no templates exist, return defaults
    if (templates.length === 0) {
      const defaultTemplates = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([role, permissions]) => ({
        id: `default-${role}`,
        name: `Default ${role.charAt(0).toUpperCase() + role.slice(1)} Permissions`,
        description: `Default permissions for ${role} role`,
        role,
        permissions,
        isDefault: true,
        isSystemGenerated: true,
      }));
      return { success: true, templates: defaultTemplates };
    }

    return { success: true, templates };
    
  } catch (error) {
    logger.error('❌ Error in getRolePermissionTemplates:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to get templates: ${error.message}`);
  }
});

/**
 * Create or update a role permission template
 */
export const saveRolePermissionTemplate = onCall({ cors: true }, async (request) => {
  try {
    logger.info('💾 saveRolePermissionTemplate called with:', request.data);
    
    await verifyAdmin(request);
    
    const { templateId, template } = request.data;
    
    if (!template || !template.name || !template.role || !template.permissions) {
      throw new HttpsError('invalid-argument', 'Template must include name, role, and permissions');
    }

    const validRoles = ['student', 'warden', 'management', 'principal'];
    if (!validRoles.includes(template.role)) {
      throw new HttpsError('invalid-argument', `Role must be one of: ${validRoles.join(', ')}`);
    }

    const templateData = {
      name: template.name,
      description: template.description || '',
      role: template.role,
      permissions: template.permissions,
      isDefault: template.isDefault || false,
      updatedAt: new Date().toISOString(),
      updatedBy: request.auth.uid,
    };

    let docId = templateId;
    
    if (templateId) {
      // Update existing
      await db.collection('rolePermissionTemplates').doc(templateId).update(templateData);
    } else {
      // Create new
      templateData.createdAt = new Date().toISOString();
      templateData.createdBy = request.auth.uid;
      
      // If setting as default, unset other defaults for this role
      if (templateData.isDefault) {
        const existingDefaults = await db.collection('rolePermissionTemplates')
          .where('role', '==', template.role)
          .where('isDefault', '==', true)
          .get();
        
        const batch = db.batch();
        existingDefaults.forEach(doc => {
          batch.update(doc.ref, { isDefault: false });
        });
        await batch.commit();
      }
      
      const docRef = await db.collection('rolePermissionTemplates').add(templateData);
      docId = docRef.id;
    }

    logger.info('✅ Role permission template saved:', docId);
    return { 
      success: true, 
      message: 'Template saved successfully',
      templateId: docId
    };
    
  } catch (error) {
    logger.error('❌ Error in saveRolePermissionTemplate:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to save template: ${error.message}`);
  }
});

/**
 * Delete a role permission template
 */
export const deleteRolePermissionTemplate = onCall({ cors: true }, async (request) => {
  try {
    logger.info('🗑️ deleteRolePermissionTemplate called with:', request.data);
    
    await verifyAdmin(request);
    
    const { templateId } = request.data;
    
    if (!templateId) {
      throw new HttpsError('invalid-argument', 'templateId is required');
    }

    // Check if template exists
    const templateDoc = await db.collection('rolePermissionTemplates').doc(templateId).get();
    if (!templateDoc.exists) {
      throw new HttpsError('not-found', 'Template not found');
    }

    // Prevent deletion of system-generated templates
    if (templateDoc.data().isSystemGenerated) {
      throw new HttpsError('permission-denied', 'Cannot delete system-generated templates');
    }

    await db.collection('rolePermissionTemplates').doc(templateId).delete();

    logger.info('✅ Role permission template deleted:', templateId);
    return { success: true, message: 'Template deleted successfully' };
    
  } catch (error) {
    logger.error('❌ Error in deleteRolePermissionTemplate:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to delete template: ${error.message}`);
  }
});

// =============================================================================
// APPROVAL WORKFLOWS
// =============================================================================

/**
 * Get all approval workflows
 */
export const getApprovalWorkflows = onCall({ cors: true }, async (request) => {
  try {
    logger.info('📋 getApprovalWorkflows called');
    
    await verifyAdmin(request);
    
    const workflowsSnapshot = await db.collection('approvalWorkflows')
      .orderBy('createdAt', 'desc')
      .get();
    
    const workflows = [];
    workflowsSnapshot.forEach(doc => {
      workflows.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, workflows };
    
  } catch (error) {
    logger.error('❌ Error in getApprovalWorkflows:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to get workflows: ${error.message}`);
  }
});

/**
 * Create or update an approval workflow
 */
export const saveApprovalWorkflow = onCall({ cors: true }, async (request) => {
  try {
    logger.info('💾 saveApprovalWorkflow called with:', request.data);
    
    await verifyAdmin(request);
    
    const { workflowId, workflow } = request.data;
    
    if (!workflow || !workflow.name || !workflow.targetRole || !workflow.steps) {
      throw new HttpsError('invalid-argument', 'Workflow must include name, targetRole, and steps');
    }

    const validRoles = ['student', 'warden', 'management'];
    if (!validRoles.includes(workflow.targetRole)) {
      throw new HttpsError('invalid-argument', `Target role must be one of: ${validRoles.join(', ')}`);
    }

    // Validate steps
    if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
      throw new HttpsError('invalid-argument', 'Workflow must have at least one step');
    }

    workflow.steps.forEach((step, index) => {
      if (!step.approverRole) {
        throw new HttpsError('invalid-argument', `Step ${index + 1} must have an approverRole`);
      }
    });

    const workflowData = {
      name: workflow.name,
      description: workflow.description || '',
      targetRole: workflow.targetRole,
      steps: workflow.steps.map((step, index) => ({
        order: index + 1,
        approverRole: step.approverRole,
        required: step.required !== false,
        autoApprove: step.autoApprove || false,
        autoApproveConditions: step.autoApproveConditions || {},
        timeoutHours: step.timeoutHours || 48,
        timeoutAction: step.timeoutAction || 'escalate',
      })),
      isActive: workflow.isActive !== false,
      updatedAt: new Date().toISOString(),
      updatedBy: request.auth.uid,
    };

    let docId = workflowId;
    
    if (workflowId) {
      await db.collection('approvalWorkflows').doc(workflowId).update(workflowData);
    } else {
      workflowData.createdAt = new Date().toISOString();
      workflowData.createdBy = request.auth.uid;
      const docRef = await db.collection('approvalWorkflows').add(workflowData);
      docId = docRef.id;
    }

    logger.info('✅ Approval workflow saved:', docId);
    return { 
      success: true, 
      message: 'Workflow saved successfully',
      workflowId: docId
    };
    
  } catch (error) {
    logger.error('❌ Error in saveApprovalWorkflow:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to save workflow: ${error.message}`);
  }
});

/**
 * Delete an approval workflow
 */
export const deleteApprovalWorkflow = onCall({ cors: true }, async (request) => {
  try {
    logger.info('🗑️ deleteApprovalWorkflow called with:', request.data);
    
    await verifyAdmin(request);
    
    const { workflowId } = request.data;
    
    if (!workflowId) {
      throw new HttpsError('invalid-argument', 'workflowId is required');
    }

    const workflowDoc = await db.collection('approvalWorkflows').doc(workflowId).get();
    if (!workflowDoc.exists) {
      throw new HttpsError('not-found', 'Workflow not found');
    }

    await db.collection('approvalWorkflows').doc(workflowId).delete();

    logger.info('✅ Approval workflow deleted:', workflowId);
    return { success: true, message: 'Workflow deleted successfully' };
    
  } catch (error) {
    logger.error('❌ Error in deleteApprovalWorkflow:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to delete workflow: ${error.message}`);
  }
});

// =============================================================================
// COLLEGE/HOSTEL USER LIMITS
// =============================================================================

/**
 * Get user limits for all colleges
 */
export const getCollegeLimits = onCall({ cors: true }, async (request) => {
  try {
    logger.info('📋 getCollegeLimits called');
    
    await verifyAdmin(request);
    
    const limitsSnapshot = await db.collection('collegeLimits').get();
    
    const limits = [];
    limitsSnapshot.forEach(doc => {
      limits.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, limits };
    
  } catch (error) {
    logger.error('❌ Error in getCollegeLimits:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to get limits: ${error.message}`);
  }
});

/**
 * Set user limits for a specific college
 */
export const setCollegeLimits = onCall({ cors: true }, async (request) => {
  try {
    logger.info('⚙️ setCollegeLimits called with:', request.data);
    
    await verifyAdmin(request);
    
    const { collegeId, limits } = request.data;
    
    if (!collegeId) {
      throw new HttpsError('invalid-argument', 'collegeId is required');
    }

    if (!limits || typeof limits !== 'object') {
      throw new HttpsError('invalid-argument', 'limits object is required');
    }

    // Validate limits
    const allowedLimits = ['maxStudents', 'maxWardens', 'maxHostels', 'customSettings'];
    const updateData = {};
    
    for (const field of allowedLimits) {
      if (limits[field] !== undefined) {
        if (field !== 'customSettings' && (typeof limits[field] !== 'number' || limits[field] < 0)) {
          throw new HttpsError('invalid-argument', `${field} must be a positive number`);
        }
        updateData[field] = limits[field];
      }
    }

    // Get college info if available
    const collegeDoc = await db.collection('users').doc(collegeId).get();
    if (collegeDoc.exists) {
      updateData.collegeName = collegeDoc.data().collegeName || collegeDoc.data().fullName || 'Unknown';
    }

    updateData.collegeId = collegeId;
    updateData.updatedAt = new Date().toISOString();
    updateData.updatedBy = request.auth.uid;

    await db.collection('collegeLimits').doc(collegeId).set(updateData, { merge: true });

    logger.info('✅ College limits updated:', collegeId);
    return { 
      success: true, 
      message: 'College limits updated successfully'
    };
    
  } catch (error) {
    logger.error('❌ Error in setCollegeLimits:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to set limits: ${error.message}`);
  }
});

/**
 * Update current counts for a college (usually called by triggers)
 */
export const updateCollegeCounts = async (collegeId) => {
  try {
    // Count students
    const studentsSnapshot = await db.collection('users')
      .where('managementId', '==', collegeId)
      .where('role', '==', 'student')
      .where('status', '==', 'approved')
      .get();

    // Count wardens
    const wardensSnapshot = await db.collection('users')
      .where('managementId', '==', collegeId)
      .where('role', '==', 'warden')
      .where('status', '==', 'approved')
      .get();

    // Count hostels (assuming hostels collection exists)
    let hostelCount = 0;
    try {
      const hostelsSnapshot = await db.collection('hostels')
        .where('collegeId', '==', collegeId)
        .get();
      hostelCount = hostelsSnapshot.size;
    } catch (e) {
      // Hostels collection might not exist
    }

    await db.collection('collegeLimits').doc(collegeId).set({
      currentStudents: studentsSnapshot.size,
      currentWardens: wardensSnapshot.size,
      currentHostels: hostelCount,
      countsUpdatedAt: new Date().toISOString(),
    }, { merge: true });

    return {
      students: studentsSnapshot.size,
      wardens: wardensSnapshot.size,
      hostels: hostelCount,
    };
  } catch (error) {
    logger.error('Error updating college counts:', error);
    throw error;
  }
};

// =============================================================================
// ENFORCEMENT HELPERS
// =============================================================================

/**
 * Check if registration is allowed
 */
export const checkRegistrationAllowed = onCall({ cors: true }, async () => {
  try {
    const settingsDoc = await db.collection('systemSettings').doc('global').get();
    
    if (!settingsDoc.exists) {
      return { allowed: true };
    }

    const settings = settingsDoc.data();
    
    if (settings.maintenanceMode) {
      return { 
        allowed: false, 
        reason: 'maintenance',
        message: settings.maintenanceMessage || 'System is under maintenance'
      };
    }

    if (!settings.registrationEnabled) {
      return { 
        allowed: false, 
        reason: 'disabled',
        message: 'New registrations are currently disabled'
      };
    }

    return { allowed: true };
    
  } catch (error) {
    logger.error('Error checking registration:', error);
    // Allow registration if we can't check (fail open for registration)
    return { allowed: true };
  }
});

/**
 * Check if a college has capacity for new users
 */
export const checkCollegeCapacity = onCall({ cors: true }, async (request) => {
  try {
    const { collegeId, role } = request.data;
    
    if (!collegeId || !role) {
      throw new HttpsError('invalid-argument', 'collegeId and role are required');
    }

    // Get college limits
    const limitsDoc = await db.collection('collegeLimits').doc(collegeId).get();
    
    // Get global settings for defaults
    const settingsDoc = await db.collection('systemSettings').doc('global').get();
    const globalSettings = settingsDoc.exists ? settingsDoc.data() : DEFAULT_SYSTEM_SETTINGS;

    let maxLimit, currentCount;
    
    if (!limitsDoc.exists) {
      // Use defaults
      if (role === 'student') {
        maxLimit = globalSettings.defaultStudentLimit;
      } else if (role === 'warden') {
        maxLimit = globalSettings.defaultWardenLimit;
      } else {
        return { allowed: true };
      }
      
      // Count current users
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

/**
 * Get system status (for maintenance mode check)
 */
export const getSystemStatus = onCall({ cors: true }, async () => {
  try {
    const settingsDoc = await db.collection('systemSettings').doc('global').get();
    
    if (!settingsDoc.exists) {
      return { 
        maintenanceMode: false,
        registrationEnabled: true,
        approvalsEnabled: true,
      };
    }

    const settings = settingsDoc.data();
    
    return {
      maintenanceMode: settings.maintenanceMode || false,
      maintenanceMessage: settings.maintenanceMessage || '',
      registrationEnabled: settings.registrationEnabled !== false,
      approvalsEnabled: settings.approvalsEnabled !== false,
      features: settings.features || {},
    };
    
  } catch (error) {
    logger.error('Error getting system status:', error);
    return { 
      maintenanceMode: false,
      registrationEnabled: true,
      approvalsEnabled: true,
    };
  }
});

/**
 * Initialize system settings with defaults (run once during setup)
 */
export const initializeSystemSettings = onCall({ cors: true }, async (request) => {
  try {
    logger.info('🚀 initializeSystemSettings called');
    
    await verifyAdmin(request);
    
    const settingsDoc = await db.collection('systemSettings').doc('global').get();
    
    if (settingsDoc.exists) {
      return { 
        success: true, 
        message: 'Settings already initialized',
        alreadyExists: true
      };
    }

    const initialSettings = {
      ...DEFAULT_SYSTEM_SETTINGS,
      createdAt: new Date().toISOString(),
      createdBy: request.auth.uid,
      updatedAt: new Date().toISOString(),
      updatedBy: request.auth.uid,
    };

    await db.collection('systemSettings').doc('global').set(initialSettings);

    // Create default role permission templates
    const batch = db.batch();
    for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const templateRef = db.collection('rolePermissionTemplates').doc(`default-${role}`);
      batch.set(templateRef, {
        name: `Default ${role.charAt(0).toUpperCase() + role.slice(1)} Permissions`,
        description: `Default permissions for ${role} role`,
        role,
        permissions,
        isDefault: true,
        isSystemGenerated: true,
        createdAt: new Date().toISOString(),
        createdBy: request.auth.uid,
      });
    }
    await batch.commit();

    logger.info('✅ System settings initialized successfully');
    return { 
      success: true, 
      message: 'System settings initialized successfully'
    };
    
  } catch (error) {
    logger.error('❌ Error in initializeSystemSettings:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Failed to initialize settings: ${error.message}`);
  }
});
