import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

/**
 * Trigger when a new user document is created
 * Send notification to appropriate admin/management
 */
export const onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data.data();
  const userId = event.params.userId;

  console.log(`New user created: ${userId}, Role: ${userData.role}`);

  // TODO: Send email notification to admin/management
  // TODO: Create audit log entry

  return null;
});

/**
 * Trigger when user status is updated
 * Send notification to user about approval/denial
 */
export const onUserStatusChanged = onDocumentUpdated('users/{userId}', async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const userId = event.params.userId;

  // Check if status changed
  if (beforeData.status !== afterData.status) {
    console.log(`User ${userId} status changed: ${beforeData.status} -> ${afterData.status}`);

    // TODO: Send email notification to user
    // TODO: Send push notification
    // TODO: Create audit log entry
  }

  return null;
});
