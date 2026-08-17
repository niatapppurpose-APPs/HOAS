import { schedule } from './runner.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { notifyUser } from '../services/notification.service.js';
import { sendMail } from '../services/email.service.js';
import { getSettingsOrDefaults } from '../services/capacity.service.js';

export async function checkComplaintReminders() {
  const settings = await getSettingsOrDefaults();
  const feature = settings.features?.reminders;
  if (!feature?.enabled) return { sent: 0 };

  const triggerStatuses = feature.triggerStatuses || ['pending', 'in-progress', 'warden-resolved', 'disputed'];
  const maxPerComplaint = feature.maxPerComplaint || 3;
  const intervalHours = feature.intervalHours || 6;
  const now = new Date();

  const complaints = await Complaint.find({
    status: { $in: triggerStatuses },
    studentViewed: false,
    'reminders.enabled': true,
    'reminders.sentCount': { $lt: maxPerComplaint },
    'reminders.nextDueAt': { $lte: now },
  });

  let sent = 0;
  for (const complaint of complaints) {
    const student = await User.findById(complaint.studentId);
    if (!student) continue;

    const message = `You have an update on your complaint "${complaint.title}" that you haven't viewed yet.`;
    if (feature.emailEnabled && student.email) {
      await sendMail({
        to: student.email,
        subject: `HOAS — Complaint update reminder`,
        html: `<p>${message}</p><p><a href="${env.appUrl}">Open HOAS</a></p>`,
      }).catch(() => {});
    }
    if (feature.inAppEnabled !== false) {
      await notifyUser(student, {
        type: 'complaint_reminder',
        title: 'Complaint update waiting',
        body: message,
        data: { complaintId: String(complaint._id) },
      });
    }

    complaint.reminders.sentCount += 1;
    complaint.reminders.nextDueAt = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
    await complaint.save();
    sent++;
  }

  return { sent };
}

export function startReminderScheduler() {
  schedule(6 * 60 * 60 * 1000, async () => {
    const result = await checkComplaintReminders();
    if (result.sent > 0) console.log('Complaint reminders sent:', result);
  });
}

export function stopReminderScheduler() {}