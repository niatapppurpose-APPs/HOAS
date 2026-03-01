/**
 * Complaint System Cloud Functions
 * Handles:
 * - Notifications when warden resolves a complaint (student review)
 * - Red flag alerts when student disputes a resolution
 * - Auto-escalation of pending complaints after 48 hours
 * - Auto-escalation of disputed complaints to management after 48 hours
 */

import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

const db = getFirestore();

// ─────────────────────────────────────────────────────────────
// Helper: Get FCM token for a specific user
// ─────────────────────────────────────────────────────────────
async function getUserToken(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data().fcmToken) {
      return userDoc.data().fcmToken;
    }
    return null;
  } catch (error) {
    logger.error('Error getting user token:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Get tokens for wardens of a specific management
// ─────────────────────────────────────────────────────────────
async function getWardenTokens(managementId) {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'warden')
      .where('managementId', '==', managementId)
      .get();

    const tokens = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken) tokens.push(data.fcmToken);
    });
    return tokens;
  } catch (error) {
    logger.error('Error getting warden tokens:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Get management/principal tokens for a college
// ─────────────────────────────────────────────────────────────
async function getManagementTokens(managementId) {
  try {
    const snapshot = await db.collection('users')
      .where('role', 'in', ['management', 'principal'])
      .where('managementId', '==', managementId)
      .get();

    const tokens = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken) tokens.push(data.fcmToken);
    });
    return tokens;
  } catch (error) {
    logger.error('Error getting management tokens:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Send push notification (safe - no throw)
// ─────────────────────────────────────────────────────────────
async function sendPushNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) {
    logger.warn('No tokens to send push notification to.');
    return;
  }

  try {
    // Convert all data values to strings (FCM requirement)
    const stringData = {};
    for (const [key, val] of Object.entries(data)) {
      stringData[key] = String(val);
    }

    const message = {
      notification: { title, body },
      data: stringData,
      tokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);
    logger.info(`Push sent: ${response.successCount} success, ${response.failureCount} failed`);
  } catch (error) {
    logger.error('Error sending push notification:', error);
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Store in-app notification in Firestore
// ─────────────────────────────────────────────────────────────
async function storeNotification(userId, title, body, data = {}) {
  try {
    await db.collection('notifications').add({
      userId,
      title,
      body,
      ...data,
      timestamp: FieldValue.serverTimestamp(),
      read: false,
    });
  } catch (error) {
    logger.error('Error storing notification:', error);
  }
}

// ═════════════════════════════════════════════════════════════
// TRIGGER: When a complaint document is updated
// ═════════════════════════════════════════════════════════════
export const onComplaintUpdated = onDocumentUpdated('complaints/{complaintId}', async (event) => {
  try {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const complaintId = event.params.complaintId;

    // ── 1. Warden marked as "warden-resolved" → Notify student to review ──
    if (before.status !== 'warden-resolved' && after.status === 'warden-resolved') {
      logger.info(`Complaint ${complaintId} marked as warden-resolved. Notifying student.`);

      const studentToken = await getUserToken(after.studentId);
      const title = '📋 Complaint Resolution - Review Required';
      const body = `Your complaint "${after.title}" has been marked as resolved by the warden. Please review and confirm.`;

      if (studentToken) {
        await sendPushNotification(
          [studentToken],
          title,
          body,
          { type: 'complaint_review', complaintId, link: '/dashboard/student/complaints' }
        );
      }

      // Store in-app notification for student
      await storeNotification(after.studentId, title, body, {
        type: 'complaint_review',
        complaintId,
        link: '/dashboard/student/complaints',
      });
    }

    // ── 2. Student disputed the resolution → Red flag for warden ──
    if (before.status !== 'disputed' && after.status === 'disputed') {
      logger.info(`Complaint ${complaintId} disputed by student. Alerting wardens.`);

      const wardenTokens = await getWardenTokens(after.managementId);
      const title = '🚩 Complaint Disputed - Action Required!';
      const body = `Student "${after.studentName}" has disputed the resolution of "${after.title}". Immediate attention needed!`;

      if (wardenTokens.length > 0) {
        await sendPushNotification(wardenTokens, title, body, {
          type: 'complaint_disputed',
          complaintId,
          link: '/dashboard/warden/complaints',
        });
      }

      // Store notification for each warden
      const wardenSnapshot = await db.collection('users')
        .where('role', '==', 'warden')
        .where('managementId', '==', after.managementId)
        .get();

      for (const wardenDoc of wardenSnapshot.docs) {
        await storeNotification(wardenDoc.id, title, body, {
          type: 'complaint_disputed',
          complaintId,
          link: '/dashboard/warden/complaints',
        });
      }
    }

    // ── 3. Student accepted the resolution → Notify warden ──
    if (before.status !== 'resolved' && after.status === 'resolved' && after.studentReviewStatus === 'accepted') {
      logger.info(`Complaint ${complaintId} accepted by student.`);

      const wardenTokens = await getWardenTokens(after.managementId);
      const title = '✅ Complaint Resolution Accepted';
      const body = `Student "${after.studentName}" has confirmed that "${after.title}" is resolved.`;

      if (wardenTokens.length > 0) {
        await sendPushNotification(wardenTokens, title, body, {
          type: 'complaint_accepted',
          complaintId,
        });
      }
    }

    // ── 4. Complaint escalated to management → Notify management ──
    if (before.status !== 'escalated' && after.status === 'escalated') {
      logger.info(`Complaint ${complaintId} escalated to management.`);

      const managementTokens = await getManagementTokens(after.managementId);
      const title = '🚨 Complaint Escalated - Immediate Action Required';
      const body = `Complaint "${after.title}" from ${after.studentName} has been escalated. Reason: ${after.escalationReason || 'Auto-escalation'}`;

      if (managementTokens.length > 0) {
        await sendPushNotification(managementTokens, title, body, {
          type: 'complaint_escalated',
          complaintId,
          link: '/dashboard/management/complaints',
        });
      }

      // Store notification for management users
      const mgmtSnapshot = await db.collection('users')
        .where('role', 'in', ['management', 'principal'])
        .where('managementId', '==', after.managementId)
        .get();

      for (const mgmtDoc of mgmtSnapshot.docs) {
        await storeNotification(mgmtDoc.id, title, body, {
          type: 'complaint_escalated',
          complaintId,
          link: '/dashboard/management/complaints',
        });
      }

      // Also notify the student
      const studentToken = await getUserToken(after.studentId);
      if (studentToken) {
        await sendPushNotification(
          [studentToken],
          '📢 Complaint Escalated to Management',
          `Your complaint "${after.title}" has been escalated to management for review.`,
          { type: 'complaint_escalated', complaintId }
        );
      }
      await storeNotification(after.studentId, '📢 Complaint Escalated to Management',
        `Your complaint "${after.title}" has been escalated to management for review.`, {
        type: 'complaint_escalated',
        complaintId,
      });
    }

  } catch (error) {
    logger.error('Error in onComplaintUpdated:', error);
  }
});

// ═════════════════════════════════════════════════════════════
// SCHEDULED: Auto-escalate complaints every hour
// Checks:
//   1. Pending complaints older than 48 hours → escalate to management
//   2. Disputed complaints where warden hasn't responded in 48 hours → escalate
// ═════════════════════════════════════════════════════════════
export const autoEscalateComplaints = onSchedule('every 60 minutes', async (event) => {
  logger.info('🔄 Running auto-escalation check...');

  const now = new Date();
  const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    // ── 1. Escalate pending complaints older than 48 hours ──
    const pendingSnapshot = await db.collection('complaints')
      .where('status', '==', 'pending')
      .get();

    let pendingEscalated = 0;
    for (const docSnap of pendingSnapshot.docs) {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);

      if (createdAt < cutoff48h) {
        // Build escalation history
        const history = data.complaintHistory || [];
        history.push({
          action: 'auto_escalated',
          reason: 'No warden response for 48 hours',
          timestamp: now.toISOString(),
          previousStatus: 'pending',
        });

        await docSnap.ref.update({
          status: 'escalated',
          isEscalated: true,
          escalatedAt: FieldValue.serverTimestamp(),
          escalationReason: 'No warden response for 48 hours — auto-escalated to management',
          complaintHistory: history,
          updatedAt: FieldValue.serverTimestamp(),
        });
        pendingEscalated++;
      }
    }

    // ── 2. Escalate disputed complaints where warden hasn't responded in 48h ──
    const disputedSnapshot = await db.collection('complaints')
      .where('status', '==', 'disputed')
      .get();

    let disputedEscalated = 0;
    for (const docSnap of disputedSnapshot.docs) {
      const data = docSnap.data();
      const disputedAt = data.disputedAt?.toDate ? data.disputedAt.toDate() : new Date(data.disputedAt);

      if (disputedAt < cutoff48h) {
        const history = data.complaintHistory || [];
        history.push({
          action: 'auto_escalated',
          reason: 'Warden did not respond to student dispute within 48 hours',
          timestamp: now.toISOString(),
          previousStatus: 'disputed',
          disputeCount: data.disputeCount || 1,
          studentDisputeReason: data.disputeReason || 'Not specified',
        });

        await docSnap.ref.update({
          status: 'escalated',
          isEscalated: true,
          escalatedAt: FieldValue.serverTimestamp(),
          escalationReason: `Student disputed warden resolution (${data.disputeCount || 1} time(s)). Warden did not respond within 48 hours. Student reason: "${data.disputeReason || 'Not specified'}"`,
          complaintHistory: history,
          updatedAt: FieldValue.serverTimestamp(),
        });
        disputedEscalated++;
      }
    }

    // ── 3. Escalate in-progress complaints older than 48 hours ──
    const inProgressSnapshot = await db.collection('complaints')
      .where('status', '==', 'in-progress')
      .get();

    let inProgressEscalated = 0;
    for (const docSnap of inProgressSnapshot.docs) {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);

      if (createdAt < cutoff48h) {
        const history = data.complaintHistory || [];
        history.push({
          action: 'auto_escalated',
          reason: 'Complaint in-progress for over 48 hours without resolution',
          timestamp: now.toISOString(),
          previousStatus: 'in-progress',
        });

        await docSnap.ref.update({
          status: 'escalated',
          isEscalated: true,
          escalatedAt: FieldValue.serverTimestamp(),
          escalationReason: 'Complaint was in-progress for over 48 hours without resolution — auto-escalated to management',
          complaintHistory: history,
          updatedAt: FieldValue.serverTimestamp(),
        });
        inProgressEscalated++;
      }
    }

    logger.info(`✅ Auto-escalation complete. Pending: ${pendingEscalated}, Disputed: ${disputedEscalated}, In-Progress: ${inProgressEscalated}`);
  } catch (error) {
    logger.error('❌ Error in autoEscalateComplaints:', error);
  }
});
