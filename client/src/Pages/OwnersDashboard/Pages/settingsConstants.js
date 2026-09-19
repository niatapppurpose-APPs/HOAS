/* ══════════════════════════════════════════════════════════════════════════════
   Global System Settings – Constants & Utilities
   Canonical UI shape: flat fields for the Settings screen + nested objects
   for the backend. Always load/save through normalize/denormalize helpers
   in hooks/useSystemSettings.jsx so every toggle (incl. SMS) persists.
   ══════════════════════════════════════════════════════════════════════════════ */

export const DEFAULT_SETTINGS = {
  registrationEnabled: true,
  approvalsEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please try again later.',
  defaultStudentLimit: 500,
  defaultWardenLimit: 10,
  defaultHostelLimit: 20,
  limits: {
    maxStudentsPerCollege: 500,
    maxWardensPerCollege: 10,
    maxHostelsPerCollege: 20,
  },
  features: {
    notifications: true,
    reports: true,
    analytics: true,
    bulkOperations: true,
    outings: true,
    announcements: true,
    feesAutoVerify: true,
    visitors: true,
    messMenu: true,
  },
  notifications: {
    email: true,
    sms: false,
    criticalAlerts: true,
    activity: true,
  },
  complaintSlaHours: 48,
  autoEscalation: true,
  escalateToOwner: false,
  overdueThresholdHours: 72,
  smsEscalationAlerts: false,
  emailEscalationAlerts: true,
  emailNotifications: true,
  smsNotifications: false,
  criticalAlerts: true,
  activityNotifications: true,
  twoFactorEnabled: false,
  forcePasswordReset: false,
  autoLogoutMinutes: 0,
};

export const roleColor = (r) =>
  ({ management: '#8b5cf6', principal: '#f59e0b', warden: '#22c55e', student: '#3b82f6' }[r] || '#6b7280');
