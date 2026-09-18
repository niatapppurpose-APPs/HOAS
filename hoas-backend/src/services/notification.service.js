import { env } from '../config/env.js';
import { getMessaging } from 'firebase-admin/messaging';
import { firebaseApp } from '../config/firebase.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser, emitToAdmins } from './socket.service.js';

let messaging = null;
let cachedSettingsService = null;

function getMessagingInstance() {
  if (!messaging) {
    try {
      messaging = getMessaging(firebaseApp);
    } catch {
      messaging = null;
    }
  }
  return messaging;
}

async function getSettings() {
  try {
    if (!cachedSettingsService) {
      cachedSettingsService = await import('./capacity.service.js');
    }
    return await cachedSettingsService.getSettingsOrDefaults();
  } catch {
    return null;
  }
}

function toPlain(settings) {
  return typeof settings?.toJSON === 'function' ? settings.toJSON() : settings || {};
}

function readNotifications(settings) {
  const s = toPlain(settings);
  return {
    email: s.notifications?.email ?? s.emailNotifications ?? true,
    sms: s.notifications?.sms ?? s.smsNotifications ?? false,
    criticalAlerts: s.notifications?.criticalAlerts ?? s.criticalAlerts ?? true,
    activity: s.notifications?.activity ?? s.activityNotifications ?? true,
  };
}

function readFeatures(settings) {
  const s = toPlain(settings);
  return {
    notifications: s.features?.notifications ?? true,
    reports: s.features?.reports ?? true,
    analytics: s.features?.analytics ?? true,
    bulkOperations: s.features?.bulkOperations ?? true,
  };
}

const CRITICAL_TYPES = new Set([
  'emergency',
  'emergency_alert',
  'complaint_escalated',
  'critical',
  'sos',
]);

const ACTIVITY_TYPES = new Set([
  'login',
  'registration',
  'complaint_reminder',
  'announcement',
  'general',
]);

export function isCriticalType(type) {
  return CRITICAL_TYPES.has(String(type || ''));
}

export function isActivityType(type) {
  return ACTIVITY_TYPES.has(String(type || '')) || String(type || '').startsWith('complaint_');
}

/** Owner → Settings → Notifications → Email Notifications master switch. */
export async function isEmailEnabled() {
  const settings = await getSettings();
  if (!settings) return true;
  return readNotifications(settings).email !== false;
}

/** Owner → Settings → Notifications → SMS Notifications master switch. */
export async function isSmsEnabled() {
  const settings = await getSettings();
  if (!settings) return false;
  return readNotifications(settings).sms === true;
}

async function shouldDeliverInApp(type) {
  const settings = await getSettings();
  if (!settings) return true;
  const features = readFeatures(settings);
  if (features.notifications === false) return false;
  const prefs = readNotifications(settings);
  if (isCriticalType(type) && prefs.criticalAlerts === false) return false;
  if (isActivityType(type) && prefs.activity === false) return false;
  return true;
}

export async function createNotification({ recipientId, recipientRole, type, title, body, data = {} }) {
  if (!(await shouldDeliverInApp(type))) {
    return null;
  }
  const notification = await Notification.create({
    recipientId,
    recipientRole,
    type,
    title,
    body,
    data,
    read: false,
    createdAt: new Date(),
  });
  emitToUser(recipientId, 'notification', notification.toJSON());
  return notification;
}

export async function sendFcm(user, title, body, data = {}) {
  // FCM follows the same master + critical/activity gates as in-app.
  if (!(await shouldDeliverInApp(data?.type || 'general'))) return;
  const fcm = getMessagingInstance();
  if (!fcm || !user?.fcmToken) return;
  try {
    await fcm.send({
      token: user.fcmToken,
      notification: { title, body },
      data: { ...data, type: data.type || 'general' },
      android: { priority: 'high' },
    });
  } catch (error) {
    console.error('FCM send failed:', error.message);
  }
}

export async function notifyUser(user, { type, title, body, data = {} }) {
  await createNotification({ recipientId: user._id, recipientRole: user.role, type, title, body, data });
  await sendFcm(user, title, body, { ...data, type });
}

export async function notifyAdmins({ type, title, body, data = {} }) {
  if (!(await shouldDeliverInApp(type))) return;
  const admins = await User.find({ role: { $in: ['owner', 'admin'] } });
  for (const admin of admins) {
    await createNotification({
      recipientId: admin._id,
      recipientRole: admin.role,
      type,
      title,
      body,
      data,
    });
  }
  emitToAdmins('notification', { type, title, body, data });
}

export function isEmailConfigured() {
  return Boolean(env.smtp.user && env.smtp.password);
}
