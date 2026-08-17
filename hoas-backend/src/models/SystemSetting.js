import { Schema, model } from 'mongoose';

const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    registrationEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: String,
    approvalsEnabled: { type: Boolean, default: true },
    forcePasswordReset: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    autoLogoutMinutes: { type: Number, default: 0 },
    complaintSlaHours: { type: Number, default: 48 },
    overdueThresholdHours: { type: Number, default: 72 },
    autoEscalation: { type: Boolean, default: true },
    escalateToOwner: { type: Boolean, default: false },
    emailEscalationAlerts: { type: Boolean, default: false },
    smsEscalationAlerts: { type: Boolean, default: false },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      criticalAlerts: { type: Boolean, default: true },
      activity: { type: Boolean, default: true },
    },
    features: {
      outings: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      feesAutoVerify: { type: Boolean, default: true },
      reminders: { type: Schema.Types.Mixed, default: {} },
    },
    limits: {
      maxStudentsPerCollege: { type: Number, default: 500 },
      maxWardensPerCollege: { type: Number, default: 10 },
      maxHostelsPerCollege: { type: Number, default: 20 },
    },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const SystemSetting = model('SystemSetting', systemSettingSchema);
export default SystemSetting;