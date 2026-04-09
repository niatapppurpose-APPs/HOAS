/**
 * Student Reminder Notification System
 * Sends periodic reminders to students for unviewed complaint updates
 *
 * Features:
 * - 6-hour interval reminders (configurable via systemSettings)
 * - Email notifications via Resend
 * - In-app Firestore notifications
 * - Max 3 reminders per complaint (prevents spam)
 * - Automatic cleanup when student views complaint or complaint resolved
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { Resend } from 'resend';

const db = getFirestore();
const resend = new Resend(process.env.RESEND_API_KEY);

// Interim statuses that should have reminders
const INTERIM_STATUSES = ['pending', 'in-progress', 'warden-resolved', 'disputed'];

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
// Helper: Get student email from user collection
// ─────────────────────────────────────────────────────────────
async function getStudentEmail(studentId) {
  try {
    const userDoc = await db.collection('users').doc(studentId).get();
    if (userDoc.exists) {
      return userDoc.data().email;
    }
    return null;
  } catch (error) {
    logger.error('Error getting student email:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Send email reminder via Resend
// ─────────────────────────────────────────────────────────────
async function sendReminderEmail(studentEmail, studentName, complaint) {
  if (!studentEmail || !process.env.RESEND_API_KEY) {
    logger.warn('Missing email configuration, skipping email reminder');
    return false;
  }

  try {
    const statusLabel = complaint.status === 'in-progress'
      ? 'In Progress'
      : complaint.status === 'warden-resolved'
        ? 'Awaiting Your Review'
        : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1);

    const lastUpdateTime = complaint.updatedAt
      ? complaint.updatedAt.toDate?.() || new Date(complaint.updatedAt)
      : new Date();

    const formattedTime = lastUpdateTime.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
            <h2 style="margin: 0; color: #0f172a; font-size: 22px;">📋 Complaint Status Update</h2>
          </div>

          <!-- Main Content -->
          <div style="margin-bottom: 24px;">
            <p style="color: #64748b; margin: 0 0 16px 0;">Hi ${studentName || 'Student'},</p>
            <p style="color: #475569; margin: 0 0 16px 0; line-height: 1.6;">
              Your complaint has an update that requires your attention. Please review the details below:
            </p>

            <!-- Complaint Card -->
            <div style="background-color: #f1f5f9; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #0f172a; font-weight: bold; font-size: 16px;">
                ${complaint.title || 'Your Complaint'}
              </p>
              <div style="font-size: 14px; color: #64748b;">
                <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #6366f1; font-weight: bold;">${statusLabel}</span></p>
                <p style="margin: 4px 0;"><strong>Last Updated:</strong> ${formattedTime}</p>
                ${complaint.category ? `<p style="margin: 4px 0;"><strong>Category:</strong> ${complaint.category}</p>` : ''}
              </div>
            </div>

            <!-- Call to Action -->
            <div style="background-color: #dbeafe; border: 1px solid #93c5fd; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: bold;">Action Required</p>
              <p style="margin: 0 0 16px 0; color: #1e40af; font-size: 14px;">
                ${complaint.status === 'warden-resolved'
                  ? 'Please review the warden\'s resolution and confirm if you accept it or dispute it.'
                  : 'Your complaint is being worked on. Please check for updates on the status.'}
              </p>
              <a href="${process.env.FRONTEND_URL || 'https://hoas.example.com'}/dashboard/student/complaints"
                 style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">
                View Complaint Details
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              This is an automated reminder from HOAS (Hostel Operations Accountability System).
              <br />
              <a href="${process.env.FRONTEND_URL || 'https://hoas.example.com'}" style="color: #6366f1; text-decoration: none;">Visit Dashboard</a>
            </p>
          </div>
        </div>
      </div>
    `;

    const response = await resend.emails.send({
      from: 'HOAS Reminders <reminders@hoas.example.com>',
      to: studentEmail,
      subject: `Reminder: "${complaint.title}" - Status Update`,
      html: htmlContent,
      replyTo: 'support@hoas.example.com'
    });

    if (response.error) {
      logger.error('Resend email send error:', response.error);
      return false;
    }

    logger.info(`Email reminder sent to ${studentEmail} for complaint ${complaint.id}`);
    return true;
  } catch (error) {
    logger.error('Error sending reminder email:', error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Store in-app reminder notification
// ─────────────────────────────────────────────────────────────
async function storeReminderNotification(studentId, complaint) {
  try {
    const statusLabel = complaint.status === 'in-progress'
      ? 'In Progress'
      : complaint.status === 'warden-resolved'
        ? 'Awaiting Your Review'
        : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1);

    await db.collection('notifications').add({
      userId: studentId,
      title: '⏰ Complaint Update Reminder',
      body: `Your complaint "${complaint.title}" is ${statusLabel.toLowerCase()}. Please review it.`,
      type: 'complaint-reminder',
      complaintId: complaint.id,
      complaintTitle: complaint.title,
      complaintStatus: complaint.status,
      timestamp: FieldValue.serverTimestamp(),
      read: false,
      data: {
        complaintId: complaint.id,
        complaintStatus: complaint.status
      }
    });

    logger.info(`In-app reminder notification stored for student ${studentId}, complaint ${complaint.id}`);
    return true;
  } catch (error) {
    logger.error('Error storing reminder notification:', error);
    return false;
  }
}

// ═════════════════════════════════════════════════════════════
// SCHEDULED: Check for and send student reminders every 6 hours
// ═════════════════════════════════════════════════════════════
export const checkStudentReminders = onSchedule('every 6 hours', async (event) => {
  logger.info('⏰ Starting student reminders check...');

  const settings = await getSystemSettings();

  // Check if reminders are enabled
  if (!settings.features?.reminders?.enabled) {
    logger.info('⏸️ Reminders feature is DISABLED. Skipping.');
    return;
  }

  const intervalHours = settings.features.reminders.intervalHours || 6;
  const maxReminders = settings.features.reminders.maxPerComplaint || 3;
  const emailEnabled = settings.features.reminders.emailEnabled !== false;
  const inAppEnabled = settings.features.reminders.inAppEnabled !== false;
  const triggerStatuses = settings.features.reminders.triggerStatuses || INTERIM_STATUSES;

  const now = new Date();
  let remindersSent = 0;
  let emailsSent = 0;

  try {
    // Find all complaints with interim statuses that need reminders
    for (const status of triggerStatuses) {
      const snapshot = await db.collection('complaints')
        .where('status', '==', status)
        .get();

      for (const complaintDoc of snapshot.docs) {
        const complaint = { id: complaintDoc.id, ...complaintDoc.data() };
        const reminders = complaint.reminders || {};

        // Check if reminder is eligible
        const isEligible =
          reminders.enabled !== false &&
          reminders.count < maxReminders &&
          (!reminders.nextDueAt || reminders.nextDueAt.toDate?.() <= now);

        if (!isEligible) {
          continue;
        }

        // Get student details
        const studentEmail = await getStudentEmail(complaint.studentId);

        // Send email reminder if enabled
        let emailSent = false;
        if (emailEnabled && studentEmail) {
          emailSent = await sendReminderEmail(
            studentEmail,
            complaint.studentName || 'Student',
            complaint
          );
        }

        // Store in-app notification if enabled
        let notificationStored = false;
        if (inAppEnabled) {
          notificationStored = await storeReminderNotification(complaint.studentId, complaint);
        }

        // Update complaint reminder tracking
        if (emailSent || notificationStored) {
          const nextDue = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);

          await complaintDoc.ref.update({
            'reminders.count': (reminders.count || 0) + 1,
            'reminders.lastSentAt': FieldValue.serverTimestamp(),
            'reminders.nextDueAt': nextDue,
            updatedAt: FieldValue.serverTimestamp()
          });

          remindersSent++;
          if (emailSent) emailsSent++;

          logger.info(
            `✅ Reminder sent - Complaint: ${complaint.id}, Student: ${complaint.studentId}, ` +
            `Email: ${emailSent}, Count: ${(reminders.count || 0) + 1}/${maxReminders}`
          );
        }
      }
    }

    logger.info(`✅ Reminders check complete. Total sent: ${remindersSent}, Emails: ${emailsSent}`);
  } catch (error) {
    logger.error('❌ Error in checkStudentReminders:', error);
  }
});

// ═════════════════════════════════════════════════════════════
// CALLABLE: Mark complaint as viewed by student
// Resets reminder flag so no more reminders are sent
// ═════════════════════════════════════════════════════════════
export const markComplaintViewed = onCall(async (request) => {
  const { complaintId } = request.data;
  const userId = request.auth?.uid;

  if (!userId || !complaintId) {
    throw new Error('Missing required parameters: complaintId and userId');
  }

  try {
    const complaintRef = db.collection('complaints').doc(complaintId);
    const complaintDoc = await complaintRef.get();

    if (!complaintDoc.exists) {
      throw new Error('Complaint not found');
    }

    const complaint = complaintDoc.data();

    // Verify ownership
    if (complaint.studentId !== userId) {
      throw new Error('Unauthorized: Not your complaint');
    }

    // Update complaint: mark as viewed and disable reminders
    await complaintRef.update({
      studentViewed: true,
      viewedAt: FieldValue.serverTimestamp(),
      'reminders.enabled': false,
      updatedAt: FieldValue.serverTimestamp()
    });

    logger.info(`Complaint ${complaintId} marked as viewed by student ${userId}`);

    return {
      success: true,
      message: 'Complaint marked as viewed. Reminders have been stopped.'
    };
  } catch (error) {
    logger.error('Error marking complaint as viewed:', error);
    throw new Error(`Failed to mark complaint as viewed: ${error.message}`);
  }
});

// ═════════════════════════════════════════════════════════════
// HELPER: Log reminder statistics (utility for debugging/admin)
// ═════════════════════════════════════════════════════════════
export const getReminderStats = onCall(async (request) => {
  const userId = request.auth?.uid;

  // Only admins can access this
  if (!userId) {
    throw new Error('Authentication required');
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Get stats
    const allComplaints = await db.collection('complaints').get();
    let withReminders = 0;
    let remindersSent = 0;

    allComplaints.forEach(doc => {
      const data = doc.data();
      if (data.reminders?.enabled) {
        withReminders++;
      }
      if (data.reminders?.count > 0) {
        remindersSent += data.reminders.count;
      }
    });

    logger.info(`Reminder stats - With reminders: ${withReminders}, Total sent: ${remindersSent}`);

    return {
      totalComplaints: allComplaints.size,
      complaintsWithReminders: withReminders,
      totalRemindersSent: remindersSent,
      avgRemindersPerComplaint: withReminders > 0 ? remindersSent / withReminders : 0
    };
  } catch (error) {
    logger.error('Error getting reminder stats:', error);
    throw new Error(`Failed to get stats: ${error.message}`);
  }
});
