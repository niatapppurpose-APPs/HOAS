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
];

export async function getSettings(req, res, next) {
  try {
    const settings = await getSettingsOrDefaults();
    res.json({ settings });
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
        settings[field] = req.body[field];
        changes[field] = req.body[field];
      }
    }

    if (req.body.complaintSlaHours !== undefined && req.body.complaintSlaHours < 1) {
      throw new AppError(400, 'SLA_HOURS_MIN_1');
    }
    if (req.body.overdueThresholdHours !== undefined && req.body.overdueThresholdHours < 1) {
      throw new AppError(400, 'OVERDUE_HOURS_MIN_1');
    }

    settings.version = (settings.version || 1) + 1;
    await settings.save();

    await recordAudit({
      actor: req.user,
      action: 'SETTINGS_UPDATED',
      targetType: 'SystemSetting',
      targetId: settings._id,
      metadata: { changes, fromVersion: previous.version },
    });

    res.json({ settings });
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