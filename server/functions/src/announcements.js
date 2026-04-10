/**
 * Smart Announcements with Scheduling System
 * Handles scheduled and recurring announcements
 *
 * Features:
 * - Immediate announcements (post now)
 * - Scheduled announcements (post at specific time)
 * - Recurring announcements (daily/weekly/monthly)
 * - Draft announcements (saved but not published)
 * - Automatic notifications to students at scheduled time
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

const db = getFirestore();

// ─────────────────────────────────────────────────────────────
// Helper: Read system settings
// ─────────────────────────────────────────────────────────────
async function getSystemSettings() {
  try {
    const doc = await db.collection('systemSettings').doc('global').get();
    if (doc.exists) {
      return doc.data();
    }
    return {};
  } catch (error) {
    logger.warn('Could not read system settings, using defaults:', error);
    return {};
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Check if announcements feature is enabled
// ─────────────────────────────────────────────────────────────
async function areAnnouncementsEnabled() {
  const settings = await getSystemSettings();
  if (settings.features?.announcements?.enabled === false) {
    logger.info('Announcements feature is DISABLED globally.');
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// Helper: Get students in a hostel or college
// ─────────────────────────────────────────────────────────────
async function getStudentsForAnnouncement(announcement) {
  try {
    const { managementId, hostelBlock } = announcement;
    if (!managementId) return [];

    let query = db.collection('users')
      .where('managementId', '==', managementId)
      .where('role', '==', 'student')
      .where('status', '==', 'approved');

    // Filter by hostelBlock if specified
    if (hostelBlock) {
      query = query.where('hostelBlock', '==', hostelBlock);
    }

    const snapshot = await query.get();
    const students = [];
    snapshot.forEach(doc => {
      students.push({ uid: doc.id, ...doc.data() });
    });
    return students;
  } catch (error) {
    logger.error('Error getting students for announcement:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Calculate next occurrence for recurring announcements
// ─────────────────────────────────────────────────────────────
function getNextOccurrence(announcement, after = new Date()) {
  const { recurrencePattern } = announcement;
  if (!recurrencePattern) return null;

  try {
    const [hours, mins] = (recurrencePattern.time || '09:00').split(':').map(Number);
    let next = new Date(after);
    next.setHours(hours, mins, 0, 0);

    if (recurrencePattern.type === 'daily') {
      if (next <= after) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    } else if (recurrencePattern.type === 'weekly') {
      const daysOfWeek = recurrencePattern.daysOfWeek || [1]; // Default Monday
      const currentDay = next.getDay();
      let daysToAdd = 0;

      // Find next occurrence day
      for (let i = 1; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (daysOfWeek.includes(checkDay)) {
          daysToAdd = i;
          break;
        }
      }

      if (daysToAdd === 0) {
        // No matching day found this week, use first day next week
        daysToAdd = 7 - currentDay + daysOfWeek[0];
      }

      next.setDate(next.getDate() + daysToAdd);
      next.setHours(hours, mins, 0, 0);
      return next;
    } else if (recurrencePattern.type === 'monthly') {
      const dayOfMonth = recurrencePattern.dayOfMonth || 1;
      next.setDate(dayOfMonth);
      next.setHours(hours, mins, 0, 0);

      if (next <= after) {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    }

    return null;
  } catch (error) {
    logger.error('Error calculating next occurrence:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Create notification documents for students
// ─────────────────────────────────────────────────────────────
async function notifyStudents(announcement, students) {
  if (students.length === 0) {
    logger.info(`No students to notify for announcement: ${announcement.title}`);
    return;
  }

  try {
    // Batch create notifications (max 500 per batch)
    const chunkSize = 400; // Leave room for announcement update
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      const batch = db.batch();

      chunk.forEach(student => {
        const notifRef = db.collection('notifications').doc();
        const priorityEmoji = announcement.priority === 'urgent' ? '🔴 '
          : announcement.priority === 'important' ? '🟡 '
            : announcement.priority === 'low' ? '⚪ '
              : '🔵 ';

        batch.set(notifRef, {
          userId: student.uid,
          title: `${priorityEmoji}${announcement.title}`,
          body: announcement.content.substring(0, 150) + (announcement.content.length > 150 ? '...' : ''),
          type: 'announcement',
          timestamp: FieldValue.serverTimestamp(),
          read: false,
          data: {
            announcementId: announcement.id,
            priority: announcement.priority,
            managementId: announcement.managementId,
          }
        });
      });

      await batch.commit();
      logger.info(`Created notification batch for ${chunk.length} students`);
    }
  } catch (error) {
    logger.error('Error notifying students:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Main Scheduler: Publish scheduled and recurring announcements
// ─────────────────────────────────────────────────────────────
export const publishScheduledAnnouncements = onSchedule('every 5 minutes', async (event) => {
  try {
    if (!(await areAnnouncementsEnabled())) {
      logger.info('Announcements disabled, skipping scheduler');
      return;
    }

    const now = new Date();
    logger.info(`Starting scheduled announcement check at ${now.toISOString()}`);

    // ─────────────────────────────────────────────────────────────
    // 1. Publish one-time scheduled announcements
    // ─────────────────────────────────────────────────────────────
    const scheduledSnapshot = await db.collection('announcements')
      .where('status', '==', 'scheduled')
      .where('isSent', '==', false)
      .get();

    let scheduledCount = 0;
    for (const doc of scheduledSnapshot.docs) {
      const announcement = doc.data();
      const scheduledTime = announcement.scheduledTime?.toDate?.() || new Date(announcement.scheduledTime);

      // Check if it's time to publish
      if (scheduledTime <= now) {
        const students = await getStudentsForAnnouncement(announcement);
        const batch = db.batch();

        // Create notification docs for each student
        await notifyStudents({ id: doc.id, ...announcement }, students);

        // Mark announcement as sent and published
        batch.update(doc.ref, {
          isSent: true,
          sentAt: FieldValue.serverTimestamp(),
          status: 'published',
          updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();
        scheduledCount++;
        logger.info(`Published scheduled announcement: ${announcement.title} (${students.length} students notified)`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Publish recurring announcement instances
    // ─────────────────────────────────────────────────────────────
    const recurringSnapshot = await db.collection('announcements')
      .where('status', '==', 'recurring')
      .where('isRecurring', '==', true)
      .get();

    let recurringCount = 0;
    for (const doc of recurringSnapshot.docs) {
      const announcement = doc.data();

      // Check if recurrence has ended
      if (announcement.recurrenceEndDate) {
        const endDate = announcement.recurrenceEndDate?.toDate?.() || new Date(announcement.recurrenceEndDate);
        if (now > endDate) {
          logger.info(`Recurring announcement expired: ${announcement.title}`);
          // Update status to expired (optional: delete or archive)
          await db.collection('announcements').doc(doc.id).update({
            status: 'expired',
            updatedAt: FieldValue.serverTimestamp()
          });
          continue;
        }
      }

      // Calculate when this announcement should be published
      const lastPublished = announcement.lastPublishedAt?.toDate?.() || new Date(0);
      const nextOccurrence = getNextOccurrence(announcement, lastPublished);

      if (nextOccurrence && nextOccurrence <= now) {
        const students = await getStudentsForAnnouncement(announcement);

        // Create notification docs
        await notifyStudents({ id: doc.id, ...announcement }, students);

        // Update lastPublishedAt
        await db.collection('announcements').doc(doc.id).update({
          lastPublishedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });

        recurringCount++;
        logger.info(`Published recurring announcement: ${announcement.title} (${students.length} students notified)`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Summary
    // ─────────────────────────────────────────────────────────────
    logger.info(`Announcement scheduler complete. Scheduled: ${scheduledCount}, Recurring: ${recurringCount}`);

  } catch (error) {
    logger.error('Error in publishScheduledAnnouncements scheduler:', error);
  }
});

// ─────────────────────────────────────────────────────────────
// Callable function: Test publish (for manual testing)
// ─────────────────────────────────────────────────────────────
export const testPublishAnnouncement = async (announcementId) => {
  try {
    const doc = await db.collection('announcements').doc(announcementId).get();
    if (!doc.exists) {
      throw new Error('Announcement not found');
    }

    const announcement = doc.data();
    const students = await getStudentsForAnnouncement(announcement);
    await notifyStudents({ id: doc.id, ...announcement }, students);

    await db.collection('announcements').doc(announcementId).update({
      isSent: true,
      sentAt: FieldValue.serverTimestamp(),
      status: 'published'
    });

    logger.info(`Test published announcement: ${announcement.title}`);
    return { success: true, studentsNotified: students.length };
  } catch (error) {
    logger.error('Error in testPublishAnnouncement:', error);
    throw error;
  }
};
