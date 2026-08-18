import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from '../services/audit.service.js';
import { emitToUser, broadcastUserUpdate } from '../services/socket.service.js';

export async function getMe(req, res, next) {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const allowed = [
      'name',
      'phone',
      'address',
      'avatarUrl',
      'notificationPrefs',
      'fcmToken',
      'pwaUpdateMode',
      'tourCompleted',
      'isOnline',
    ];
    for (const field of allowed) {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    }
    await req.user.save();
    emitToUser(req.user._id, 'user:updated', { user: req.user.toObject() });
    broadcastUserUpdate(req.user);
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
}

export async function getMyNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unread = await Notification.countDocuments({ recipientId: req.user._id, read: false });
    res.json({ notifications, unread });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) throw new AppError(404, 'NOTIFICATION_NOT_FOUND');
    res.json({ notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany({ recipientId: req.user._id, read: false }, { read: true, readAt: new Date() });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    const { firebaseAuth } = await import('../config/firebase.js');
    await firebaseAuth.updateUser(req.user.uid, { password: newPassword });
    req.user.lastPasswordResetAt = new Date();
    await req.user.save();
    await recordAudit({ actor: req.user, action: 'PASSWORD_CHANGED', targetType: 'User', targetId: req.user._id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function registerRequest(req, res, next) {
  try {
    const { uid, email } = req.auth;
    const { name, role = 'unknown' } = req.body;

    const existing = await User.findOne({ uid });
    if (existing) {
      return res.json({ user: existing });
    }

    const user = await User.create({
      uid,
      email: email || req.body.email || `${uid}@pending.hoas`,
      name: name || 'Pending User',
      role,
      status: 'pending',
    });

    await recordAudit({
      actor: { _id: user._id, role: user.role },
      action: 'REGISTRATION_REQUESTED',
      targetType: 'User',
      targetId: user._id,
      metadata: { requestedRole: role },
    });

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function resolveStudentLogin(req, res, next) {
  try {
    const studentId = String(req.query.studentId || '').trim();
    if (!studentId) throw new AppError(400, 'STUDENT_ID_REQUIRED');
    const escapedStudentId = studentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const user = await User.findOne({
      role: 'student',
      $or: [
        { studentId: { $regex: `^${escapedStudentId}$`, $options: 'i' } },
        { rollNumber: { $regex: `^${escapedStudentId}$`, $options: 'i' } },
        { idNumber: { $regex: `^${escapedStudentId}$`, $options: 'i' } },
      ],
    }).select('email');

    if (!user) throw new AppError(404, 'STUDENT_NOT_FOUND');
    res.json({ email: user.email });
  } catch (error) {
    next(error);
  }
}
