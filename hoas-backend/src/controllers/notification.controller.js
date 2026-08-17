import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { recordAudit } from '../services/audit.service.js';
import { notifyUser } from '../services/notification.service.js';

export async function listMyNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    const unread = await Notification.countDocuments({ recipientId: req.user._id, read: false });
    res.json({ notifications, unread });
  } catch (error) {
    next(error);
  }
}

export async function sendCustomNotification(req, res, next) {
  try {
    const { targetRole, title, body, collegeId, userId } = req.body;

    const filter = { status: 'approved' };
    if (targetRole) filter.role = targetRole;
    if (collegeId) filter.collegeId = collegeId;
    if (userId) filter._id = userId;

    const recipients = await User.find(filter);
    for (const recipient of recipients) {
      await notifyUser(recipient, {
        type: 'custom',
        title,
        body,
        data: {},
      });
    }

    await recordAudit({
      actor: req.user,
      action: 'NOTIFICATION_SENT',
      targetType: 'Notification',
      metadata: { targetRole: targetRole || 'all', recipients: recipients.length, title },
    });
    res.json({ sent: recipients.length });
  } catch (error) {
    next(error);
  }
}

export async function listAllNotifications(req, res, next) {
  try {
    const notifications = await Notification.find()
      .populate('recipientId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
}