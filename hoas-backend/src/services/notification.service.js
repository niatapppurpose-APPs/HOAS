import { env } from '../config/env.js';
import { getMessaging } from 'firebase-admin/messaging';
import { firebaseApp } from '../config/firebase.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser, emitToAdmins } from './socket.service.js';

let messaging = null;

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

export async function createNotification({ recipientId, recipientRole, type, title, body, data = {} }) {
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