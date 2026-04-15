/**
 * Outing Scheduled Functions & Triggers
 * Background jobs and Firestore triggers for outing management
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { calculateTimingStatus, sendNotification } from './outingHelpers.js';

const db = getFirestore();

/**
 * Auto-detect and mark late returns
 * Runs every 10 minutes to check for late entries
 */
export const autoMarkLateOutings = onSchedule(
  {
    schedule: 'every 10 minutes',
    region: 'asia-south1',
  },
  async (event) => {
    try {
      logger.info('Starting auto-mark late outings job');

      const now = new Date();

      // Query approved outings with no return marked and expected time passed
      const snapshot = await db.collection('outings')
        .where('status', '==', 'approved')
        .where('actualReturnTime', '==', null)
        .get();

      let processedCount = 0;
      const batch = db.batch();

      snapshot.forEach(doc => {
        const outing = doc.data();
        const expectedReturnTime = new Date(outing.expectedReturnTime).getTime();

        // If expected time has passed, mark as late
        if (expectedReturnTime < now.getTime()) {
          const timingStatus = calculateTimingStatus(
            outing.expectedReturnTime,
            now.toISOString()
          );

          if (timingStatus) {
            batch.update(doc.ref, {
              timingStatus,
              status: 'completed',
              actualReturnTime: now.toISOString(),
              updatedAt: FieldValue.serverTimestamp(),
              autoMarkedLate: true,
            });
            processedCount++;

            logger.info(`Marked outing ${doc.id} as ${timingStatus} automatically`);
          }
        }
      });

      if (processedCount > 0) {
        await batch.commit();
        logger.info(`Auto-marked ${processedCount} outings as late`);
      }

      // Send notifications for auto-marked late entries
      const lateSnapshot = await db.collection('outings')
        .where('autoMarkedLate', '==', true)
        .where('notificationSent', '!=', true)
        .get();

      for (const doc of lateSnapshot.docs) {
        const outing = doc.data();

        // Notify warden
        await sendNotification(
          outing.wardenId,
          '⚠️ Student Auto-Marked as Late',
          `${outing.studentName} has not returned from ${outing.destination} and is marked as ${outing.timingStatus}`,
          {
            outingId: doc.id,
            type: 'outing_auto_late',
            timingStatus: outing.timingStatus,
          }
        );

        // Mark notification as sent
        await doc.ref.update({
          notificationSent: true,
        });
      }

      logger.info('Auto-mark late outings job completed');
    } catch (error) {
      logger.error('Error in autoMarkLateOutings:', error);
    }
  }
);

/**
 * Trigger when outing timing status changes
 */
export const outingStatusChange = onDocumentUpdated(
  'outings/{outingId}',
  async (event) => {
    try {
      const before = event.data.before.data();
      const after = event.data.after.data();

      // Check if timing status changed to very-late
      if (before.timingStatus !== 'very-late' && after.timingStatus === 'very-late') {
        // Get management users
        const managementUsers = await db.collection('users')
          .where('managementId', '==', after.managementId)
          .where('role', 'in', ['management', 'admin'])
          .get();

        // Send escalation notifications
        for (const doc of managementUsers.docs) {
          await sendNotification(
            doc.id,
            '🚨 CRITICAL: Student Extremely Late',
            `${after.studentName} is EXTREMELY LATE returning from ${after.destination}!`,
            {
              outingId: event.params.outingId,
              type: 'outing_critical',
              studentId: after.studentId,
            }
          );
        }

        logger.info(`Critical late escalation sent for outing ${event.params.outingId}`);
      }

      // Check if status changed from pending to approved or rejected
      if (before.status === 'pending' && (after.status === 'approved' || after.status === 'rejected')) {
        logger.info(`Outing ${event.params.outingId} status changed to ${after.status}`);
      }
    } catch (error) {
      logger.error('Error in outingStatusChange trigger:', error);
    }
  }
);
