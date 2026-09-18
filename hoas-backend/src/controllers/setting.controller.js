import SystemSetting from '../models/SystemSetting.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { getSettingsOrDefaults, checkCollegeCapacity } from '../services/capacity.service.js';
import { recordAudit } from '../services/audit.service.js';

const ALLOWED_FIELDS = [
  'registrationEnabled',
  'maintenanceMode',
  'maintenanceMessage',
  'approvalsEnabled',
  'forcePasswordReset',
  'twoFactorEnabled',
  'autoLogoutMinutes',
  'complaintSlaHours',
  'overdueThresholdHours',
  'autoEscalation',
  'escalateToOwner',
  'emailEscalationAlerts',
  'smsEscalationAlerts',
  'notifications',
  'features',
  'limits',
  // Flat legacy / UI aliases (Owner Settings page uses these).
  // They are normalized into the nested canonical shape below.
  'emailNotifications',
  'smsNotifications',
  'criticalAlerts',
  'activityNotifications',
  'defaultStudentLimit',
  'defaultWardenLimit',
  'defaultHostelLimit',
];

function toPlain(doc) {
  return typeof doc?.toJSON === 'function' ? doc.toJSON() : { ...(doc || {}) };
}

/**
 * Build a dual-shape response: nested canonical (backend) + flat aliases (UI).
 * This keeps old + new clients working while the Owner UI edits flat fields.
 */
export function normalizeSettingsForResponse(settingsDoc) {
  const s = toPlain(settingsDoc);
  const notifications = {
    email: s.notifications?.email ?? s.emailNotifications ?? true,
    sms: s.notifications?.sms ?? s.smsNotifications ?? false,
    criticalAlerts: s.notifications?.criticalAlerts ?? s.criticalAlerts ?? true,
    activity: s.notifications?.activity ?? s.activityNotifications ?? true,
  };
  const limits = {
    maxStudentsPerCollege:
      s.limits?.maxStudentsPerCollege ?? s.defaultStudentLimit ?? 500,
    maxWardensPerCollege:
      s.limits?.maxWardensPerCollege ?? s.defaultWardenLimit ?? 10,
    maxHostelsPerCollege:
      s.limits?.maxHostelsPerCollege ?? s.defaultHostelLimit ?? 20,
  };
  const features = {
    notifications: s.features?.notifications ?? true,
    reports: s.features?.reports ?? true,
    analytics: s.features?.analytics ?? true,
    bulkOperations: s.features?.bulkOperations ?? true,
    outings: s.features?.outings ?? true,
    announcements: s.features?.announcements ?? true,
    feesAutoVerify: s.features?.feesAutoVerify ?? true,
    reminders: s.features?.reminders ?? {},
  };
  return {
    ...s,
    notifications,
    features,
    limits,
    // Flat aliases for the Owner Settings UI
    emailNotifications: notifications.email,
    smsNotifications: notifications.sms,
    criticalAlerts: notifications.criticalAlerts,
    activityNotifications: notifications.activity,
    defaultStudentLimit: limits.maxStudentsPerCollege,
    defaultWardenLimit: limits.maxWardensPerCollege,
    defaultHostelLimit: limits.maxHostelsPerCollege,
  };
}

export async function getSettings(req, res, next) {
  try {
    const settings = await getSettingsOrDefaults();
    res.json({ settings: normalizeSettingsForResponse(settings) });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await getSettingsOrDefaults();
    const previous = settings.toJSON();
    const changes = {};

    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
      }
    }

    // --- scalar fields -------------------------------------------------
    const scalars = [
      'registrationEnabled',
      'maintenanceMode',
      'maintenanceMessage',
      'approvalsEnabled',
      'forcePasswordReset',
      'twoFactorEnabled',
      'autoLogoutMinutes',
      'complaintSlaHours',
      'overdueThresholdHours',
      'autoEscalation',
      'escalateToOwner',
      'emailEscalationAlerts',
      'smsEscalationAlerts',
    ];
    for (const field of scalars) {
      if (changes[field] !== undefined) settings[field] = changes[field];
    }

    // --- notifications: merge nested + flat (flat wins when provided) --
    const notifMerge = { ...(settings.notifications?.toJSON?.() ?? settings.notifications ?? {}) };
    if (changes.notifications && typeof changes.notifications === 'object') {
      Object.assign(notifMerge, changes.notifications);
    }
    if (changes.emailNotifications !== undefined) notifMerge.email = changes.emailNotifications;
    if (changes.smsNotifications !== undefined) notifMerge.sms = changes.smsNotifications;
    if (changes.criticalAlerts !== undefined) notifMerge.criticalAlerts = changes.criticalAlerts;
    if (changes.activityNotifications !== undefined) notifMerge.activity = changes.activityNotifications;
    settings.notifications = {
      email: notifMerge.email ?? true,
      sms: notifMerge.sms ?? false,
      criticalAlerts: notifMerge.criticalAlerts ?? true,
      activity: notifMerge.activity ?? true,
    };

    // --- features: deep-merge so UI flags never wipe enforcement flags --
    const featMerge = { ...(settings.features?.toJSON?.() ?? settings.features ?? {}) };
    if (changes.features && typeof changes.features === 'object') {
      Object.assign(featMerge, changes.features);
    }
    settings.features = {
      notifications: featMerge.notifications ?? true,
      reports: featMerge.reports ?? true,
      analytics: featMerge.analytics ?? true,
      bulkOperations: featMerge.bulkOperations ?? true,
      outings: featMerge.outings ?? true,
      announcements: featMerge.announcements ?? true,
      feesAutoVerify: featMerge.feesAutoVerify ?? true,
      reminders: featMerge.reminders ?? {},
    };

    // --- limits: merge nested + flat defaults ---------------------------
    const limMerge = { ...(settings.limits?.toJSON?.() ?? settings.limits ?? {}) };
    if (changes.limits && typeof changes.limits === 'object') {
      Object.assign(limMerge, changes.limits);
    }
    if (changes.defaultStudentLimit !== undefined) limMerge.maxStudentsPerCollege = changes.defaultStudentLimit;
    if (changes.defaultWardenLimit !== undefined) limMerge.maxWardensPerCollege = changes.defaultWardenLimit;
    if (changes.defaultHostelLimit !== undefined) limMerge.maxHostelsPerCollege = changes.defaultHostelLimit;
    settings.limits = {
      maxStudentsPerCollege: Number(limMerge.maxStudentsPerCollege ?? 500),
      maxWardensPerCollege: Number(limMerge.maxWardensPerCollege ?? 10),
      maxHostelsPerCollege: Number(limMerge.maxHostelsPerCollege ?? 20),
    };

    if (settings.complaintSlaHours !== undefined && settings.complaintSlaHours < 1) {
      throw new AppError(400, 'SLA_HOURS_MIN_1');
    }
    if (settings.overdueThresholdHours !== undefined && settings.overdueThresholdHours < 1) {
      throw new AppError(400, 'OVERDUE_HOURS_MIN_1');
    }

    settings.version = (settings.version || 1) + 1;
    // Mongoose nested-object assignment needs explicit dirty marking
    settings.markModified('notifications');
    settings.markModified('features');
    settings.markModified('limits');
    await settings.save();

    await recordAudit({
      actor: req.user,
      action: 'SETTINGS_UPDATED',
      targetType: 'SystemSetting',
      targetId: settings._id,
      metadata: { changes, fromVersion: previous.version },
    });

    res.json({ settings: normalizeSettingsForResponse(settings) });
  } catch (error) {
    next(error);
  }
}

export async function getCollegeCapacity(req, res, next) {
  try {
    const capacity = await checkCollegeCapacity(req.user, req.params.collegeId);
    res.json(capacity);
  } catch (error) {
    next(error);
  }
}

export async function listAuditLogs(req, res, next) {
  try {
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.targetType) filter.targetType = req.query.targetType;
    if (req.query.limit) req.query.limit = Number(req.query.limit);
    const logs = await AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(Math.min(req.query.limit || 100, 500));
    res.json({ logs });
  } catch (error) {
    next(error);
  }
}
