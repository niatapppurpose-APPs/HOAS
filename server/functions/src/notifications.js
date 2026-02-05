/**
 * Notifications Cloud Functions
 * Handles automatic push notifications to owners for important events
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

const db = getFirestore();

/**
 * Get all owner FCM tokens
 */
async function getOwnerTokens() {
  try {
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'owner')
      .get();
    
    const tokens = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    });
    
    logger.info(`Found ${tokens.length} owner tokens`);
    return tokens;
  } catch (error) {
    logger.error('Error getting owner tokens:', error);
    return [];
  }
}

/**
 * Send notification to owners and store in Firestore
 */
async function sendNotificationToOwners(title, body, data = {}) {
  try {
    const tokens = await getOwnerTokens();
    
    if (tokens.length === 0) {
      logger.warn('No owner tokens found. Notification not sent.');
      return;
    }

    // Create notification document in Firestore for in-app notifications
    const notificationData = {
      title,
      body,
      ...data,
      timestamp: FieldValue.serverTimestamp(),
      read: false
    };

    // Store notification for each owner
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'owner')
      .get();
    
    const batch = db.batch();
    usersSnapshot.forEach(doc => {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        ...notificationData,
        userId: doc.id
      });
    });
    await batch.commit();

    // Send push notifications
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      tokens
    };

    const response = await getMessaging().sendEachForMulticast(message);
    
    logger.info(`Successfully sent ${response.successCount} notifications`);
    if (response.failureCount > 0) {
      logger.warn(`Failed to send ${response.failureCount} notifications`);
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          logger.error(`Error sending to token ${tokens[idx]}: ${resp.error}`);
        }
      });
    }
    
    return response;
  } catch (error) {
    logger.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Trigger when a new college is created (approval request)
 */
export const onNewCollegeApproval = onDocumentCreated('ManagementData/{collegeId}', async (event) => {
  try {
    const collegeData = event.data.data();
    
    // Only send notification if status is waiting for approval
    if (collegeData.status !== 'approved') {
      const title = '🆕 New College Approval Request';
      const body = `A new college "${collegeData.collegeName}" is waiting for your approval.`;
      
      await sendNotificationToOwners(title, body, {
        type: 'approval',
        collegeId: event.params.collegeId,
        collegeName: collegeData.collegeName,
        link: '/OwnersDashboard'
      });
      
      logger.info(`Approval notification sent for college: ${collegeData.collegeName}`);
    }
  } catch (error) {
    logger.error('Error in onNewCollegeApproval:', error);
  }
});

/**
 * Trigger when a new support ticket is created
 */
export const onNewSupportTicket = onDocumentCreated('supportTickets/{ticketId}', async (event) => {
  try {
    const ticketData = event.data.data();
    
    const title = '🎫 New Support Ticket';
    const body = `New ticket from ${ticketData.userName || 'User'}: ${ticketData.subject || 'Support Request'}`;
    
    await sendNotificationToOwners(title, body, {
      type: 'support',
      ticketId: event.params.ticketId,
      subject: ticketData.subject || 'Support Request',
      link: '/OwnersDashboard/support'
    });
    
    logger.info(`Support ticket notification sent: ${event.params.ticketId}`);
  } catch (error) {
    logger.error('Error in onNewSupportTicket:', error);
  }
});

/**
 * Trigger when a support ticket is updated (e.g., escalated to urgent)
 */
export const onSupportTicketUpdate = onDocumentUpdated('supportTickets/{ticketId}', async (event) => {
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    
    // Check if priority changed to urgent
    if (beforeData.priority !== 'urgent' && afterData.priority === 'urgent') {
      const title = '🚨 Urgent Support Ticket';
      const body = `Ticket escalated to urgent: ${afterData.subject || 'Support Request'}`;
      
      await sendNotificationToOwners(title, body, {
        type: 'urgent_support',
        ticketId: event.params.ticketId,
        subject: afterData.subject || 'Support Request',
        link: '/OwnersDashboard/support'
      });
      
      logger.info(`Urgent ticket notification sent: ${event.params.ticketId}`);
    }
  } catch (error) {
    logger.error('Error in onSupportTicketUpdate:', error);
  }
});

/**
 * Trigger when a new warden registration needs approval
 */
export const onNewWardenRegistration = onDocumentCreated('users/{userId}', async (event) => {
  try {
    const userData = event.data.data();
    
    // Only send notification for warden role and not approved status
    if (userData.role === 'warden' && userData.status !== 'approved') {
      const title = '👤 New Warden Registration';
      const body = `${userData.name || 'A warden'} has registered and is waiting for approval.`;
      
      await sendNotificationToOwners(title, body, {
        type: 'warden_approval',
        userId: event.params.userId,
        userName: userData.name || 'Warden',
        link: '/OwnersDashboard'
      });
      
      logger.info(`Warden registration notification sent: ${userData.name}`);
    }
  } catch (error) {
    logger.error('Error in onNewWardenRegistration:', error);
  }
});

/**
 * Manual function to send custom notification to owners
 * Can be called from client app or other functions
 */
export const sendCustomNotification = async (title, body, data = {}) => {
  return await sendNotificationToOwners(title, body, data);
};
