import { schedule } from './runner.js';
import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { notifyUser } from '../services/notification.service.js';
import { getSettingsOrDefaults } from '../services/capacity.service.js';

const PRIORITY_EMOJI = { urgent: '🔴', important: '🟡', low: '⚪', normal: '🔵' };

export async function publishDueAnnouncements() {
  const settings = await getSettingsOrDefaults();
  if (!settings.features?.announcements) return { published: 0 };

  const now = new Date();
  const due = await Announcement.find({
    status: 'scheduled',
    isSent: false,
    publishAt: { $lte: now },
  });

  let published = 0;
  for (const announcement of due) {
    await fanOut(announcement);
    announcement.status = 'published';
    announcement.isSent = true;
    await announcement.save();
    published++;
  }

  const recurring = await Announcement.find({
    status: 'recurring',
    recurrenceEndDate: { $gte: now },
  });
  for (const announcement of recurring) {
    if (!announcement.isSent && isRecurrenceDue(announcement, now)) {
      await fanOut(announcement);
      announcement.isSent = true;
      announcement.publishAt = now;
      await announcement.save();
      published++;
    }
  }

  await Announcement.updateMany(
    { status: 'recurring', recurrenceEndDate: { $lt: now } },
    { status: 'expired' }
  );

  return { published };
}

function isRecurrenceDue(announcement, now) {
  const recurrence = announcement.recurrence;
  if (!recurrence) return true;
  const [hour, minute] = (recurrence.time || '09:00').split(':').map(Number);
  const timeMatches = now.getHours() === hour && now.getMinutes() === minute;
  if (recurrence.type === 'daily') return timeMatches;
  if (recurrence.type === 'weekly' && Array.isArray(recurrence.daysOfWeek)) {
    return timeMatches && recurrence.daysOfWeek.includes(now.getDay());
  }
  if (recurrence.type === 'monthly') {
    return timeMatches && recurrence.daysOfWeek && recurrence.daysOfWeek.includes(now.getDate());
  }
  return timeMatches;
}

async function fanOut(announcement) {
  const filter = { role: 'student', status: 'approved', collegeId: announcement.collegeId };
  if (announcement.hostelBlock) filter.hostelBlock = announcement.hostelBlock;
  const students = await User.find(filter);

  const emoji = PRIORITY_EMOJI[announcement.priority] || '🔵';
  const body = announcement.body.length > 150 ? announcement.body.slice(0, 150) + '...' : announcement.body;

  for (const student of students) {
    await notifyUser(student, {
      type: 'announcement',
      title: `${emoji} ${announcement.title}`,
      body,
      data: { announcementId: String(announcement._id) },
    });
  }
}

export function startAnnouncementScheduler() {
  schedule(5 * 60 * 1000, async () => {
    const result = await publishDueAnnouncements();
    if (result.published > 0) console.log('Announcements published:', result);
  });
}

export function stopAnnouncementScheduler() {}