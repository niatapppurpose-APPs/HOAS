# Reminder System - Code Reference & Examples

## Using the Notification System in Components

### Example 1: Basic Notification Hook Usage

```jsx
import { useNotifications } from '../../context/NotificationContext';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    markReminderAcknowledged,
  } = useNotifications();

  return (
    <div>
      <p>Unread: {unreadCount}</p>

      <button onClick={markAllAsRead}>
        Mark all as read
      </button>

      <ul>
        {notifications.map(notif => (
          <li key={notif.id}>
            <span>{notif.title}</span>
            {!notif.read && (
              <button onClick={() => markAsRead(notif.id)}>
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 2: Complaint Reminder Notification

```jsx
import { useNotifications } from '../../context/NotificationContext';

function ComplaintList() {
  const { notifications } = useNotifications();

  // Filter only complaint reminders
  const reminderNotifications = notifications.filter(
    notif => notif.type === 'complaint-reminder'
  );

  return (
    <div>
      <h3>Complaint Reminders ({reminderNotifications.length})</h3>
      {reminderNotifications.map(notif => (
        <div key={notif.id} className={notif.read ? 'read' : 'unread'}>
          <p>{notif.body}</p>
          <small>{formatTime(notif.createdAt)}</small>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Acknowledge Reminder on View

```jsx
import { useNotifications } from '../../context/NotificationContext';
import { useEffect } from 'react';

function ComplaintDetail({ complaintId }) {
  const { markReminderAcknowledged } = useNotifications();

  // Automatically stops reminders when complaint is viewed
  useEffect(() => {
    if (complaintId) {
      markReminderAcknowledged(complaintId)
        .catch(err => console.error('Failed to acknowledge:', err));
    }
  }, [complaintId, markReminderAcknowledged]);

  return (
    <div>
      {/* Complaint details here */}
    </div>
  );
}
```

---

## Cloud Function Examples

### Example 1: Get System Settings

```javascript
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

async function getSystemSettings() {
  try {
    const doc = await db.collection('systemSettings').doc('global').get();
    if (doc.exists) {
      return doc.data();
    }
    return {};
  } catch (error) {
    logger.warn('Could not read system settings:', error);
    return {};
  }
}

// Usage in Cloud Function
export const myFunction = onSchedule('every 6 hours', async (event) => {
  const settings = await getSystemSettings();
  const remindersEnabled = settings.features?.reminders?.enabled;

  if (!remindersEnabled) {
    logger.info('Reminders disabled');
    return;
  }

  // ... process reminders
});
```

### Example 2: Send Email Reminder

```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendReminderEmail(studentEmail, studentName, complaint) {
  const htmlContent = `
    <div style="font-family: Arial; max-width: 600px;">
      <h2>Complaint Status Update</h2>
      <p>Hi ${studentName},</p>
      <p>Your complaint has been updated:</p>

      <div style="background: #f5f5f5; padding: 20px;">
        <strong>${complaint.title}</strong>
        <p>Status: ${complaint.status}</p>
        <p>Last Updated: ${new Date(complaint.updatedAt).toLocaleString()}</p>
      </div>

      <a href="${process.env.FRONTEND_URL}/dashboard/student/complaints">
        View Details
      </a>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: 'HOAS Reminders <reminders@hoas.example.com>',
      to: studentEmail,
      subject: `Reminder: "${complaint.title}" - Status Update`,
      html: htmlContent,
      replyTo: 'support@hoas.example.com'
    });

    if (response.error) {
      logger.error('Email send error:', response.error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
}
```

### Example 3: Store In-App Notification

```javascript
async function storeReminderNotification(studentId, complaint) {
  try {
    await db.collection('notifications').add({
      userId: studentId,
      title: '⏰ Complaint Update Reminder',
      body: `Your complaint "${complaint.title}" is ${complaint.status}.`,
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

    logger.info(`Notification stored for student ${studentId}`);
    return true;
  } catch (error) {
    logger.error('Error storing notification:', error);
    return false;
  }
}
```

### Example 4: Mark Complaint as Viewed

```javascript
import { onCall } from 'firebase-functions/v2/https';

export const markComplaintViewed = onCall(async (request) => {
  const { complaintId } = request.data;
  const userId = request.auth?.uid;

  if (!userId || !complaintId) {
    throw new Error('Missing required parameters');
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

    // Mark as viewed and disable reminders
    await complaintRef.update({
      studentViewed: true,
      viewedAt: FieldValue.serverTimestamp(),
      'reminders.enabled': false,
      updatedAt: FieldValue.serverTimestamp()
    });

    logger.info(`Complaint ${complaintId} marked as viewed by ${userId}`);

    return {
      success: true,
      message: 'Complaint marked as viewed. Reminders have been stopped.'
    };
  } catch (error) {
    logger.error('Error marking complaint as viewed:', error);
    throw new Error(`Failed: ${error.message}`);
  }
});
```

---

## Firestore Query Examples

### Example 1: Find All Reminders for a User

```javascript
// Frontend with Firebase SDK
import { query, where, collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';

function watchUserReminders(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('type', '==', 'complaint-reminder')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.forEach(doc => {
      console.log('Reminder:', doc.data());
    });
  });

  return unsubscribe;
}
```

### Example 2: Get Complaints That Need Reminders

```javascript
// Backend in Cloud Function
async function getComplaintsNeedingReminders(triggerStatuses) {
  const complaints = [];

  for (const status of triggerStatuses) {
    const snapshot = await db.collection('complaints')
      .where('status', '==', status)
      .get();

    snapshot.forEach(doc => {
      const complaint = { id: doc.id, ...doc.data() };
      const reminders = complaint.reminders || {};

      // Check if eligible for reminder
      if (
        reminders.enabled !== false &&
        reminders.count < 3 &&
        (!reminders.nextDueAt || reminders.nextDueAt.toDate() <= new Date())
      ) {
        complaints.push(complaint);
      }
    });
  }

  return complaints;
}
```

### Example 3: Update Complaint Reminder Count

```javascript
// Backend in Cloud Function
async function incrementReminderCount(complaintId, intervalHours) {
  const complaintRef = db.collection('complaints').doc(complaintId);
  const now = new Date();
  const nextDue = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);

  await complaintRef.update({
    'reminders.count': FieldValue.increment(1),
    'reminders.lastSentAt': FieldValue.serverTimestamp(),
    'reminders.nextDueAt': nextDue,
    updatedAt: FieldValue.serverTimestamp()
  });
}
```

---

## Testing Code Snippets

### Test 1: Simulate Function Execution

```javascript
// Local testing with Firebase Emulator
import { connectFunctionsEmulator } from 'firebase/functions';
import { httpsCallable } from 'firebase/functions';

const functions = initializeApp(firebaseConfig);
if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Call the function
const markViewed = httpsCallable(functions, 'markComplaintViewed');
const result = await markViewed({ complaintId: 'test-id' });
console.log(result.data);
```

### Test 2: Mock Notification Listener

```javascript
// Unit test for notification handling
import { vi } from 'vitest';

test('marks reminder as acknowledged', async () => {
  const markReminderAcknowledged = vi.fn().mockResolvedValue({
    success: true
  });

  const useNotifications = () => ({
    markReminderAcknowledged
  });

  // ... test component

  expect(markReminderAcknowledged).toHaveBeenCalledWith('complaint-123');
});
```

### Test 3: Test Email Content

```javascript
// Integration test for email
test('sends correctly formatted reminder email', async () => {
  const complaint = {
    id: 'test-123',
    title: 'Water Leak',
    status: 'in-progress',
    updatedAt: new Date()
  };

  const html = generateEmailHTML('John', complaint);

  expect(html).toContain('Water Leak');
  expect(html).toContain('in-progress');
  expect(html).toContain('View Complaint Details');
  expect(html).toContain('<a href=');
});
```

---

## Configuration Examples

### Example 1: Development Settings

```json
{
  "features": {
    "reminders": {
      "enabled": true,
      "intervalHours": 1,
      "maxPerComplaint": 5,
      "emailEnabled": true,
      "inAppEnabled": true,
      "triggerStatuses": ["pending", "in-progress", "warden-resolved", "disputed"]
    }
  }
}
```

**Use case**: Local testing, get reminders every hour

### Example 2: Production Settings

```json
{
  "features": {
    "reminders": {
      "enabled": true,
      "intervalHours": 6,
      "maxPerComplaint": 3,
      "emailEnabled": true,
      "inAppEnabled": true,
      "triggerStatuses": ["pending", "in-progress", "warden-resolved", "disputed"]
    }
  }
}
```

**Use case**: Production, balanced reminder frequency

### Example 3: Conservative Settings

```json
{
  "features": {
    "reminders": {
      "enabled": true,
      "intervalHours": 24,
      "maxPerComplaint": 2,
      "emailEnabled": true,
      "inAppEnabled": false,
      "triggerStatuses": ["warden-resolved"]
    }
  }
}
```

**Use case**: Light touch, only email for reviews

---

## Type Definitions (TypeScript)

```typescript
interface Complaint {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'warden-resolved' | 'resolved' | 'disputed' | 'escalated';
  studentId: string;
  studentName: string;

  // Reminder tracking
  reminders?: {
    enabled: boolean;
    count: number;
    lastSentAt?: Date;
    nextDueAt?: Date;
  };

  // Viewing tracking
  studentViewed?: boolean;
  viewedAt?: Date;
}

interface ReminderNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'complaint-reminder';
  complaintId: string;
  complaintStatus: string;
  timestamp: Date;
  read: boolean;
  data: {
    complaintId: string;
    complaintStatus: string;
  };
}

interface ReminderConfig {
  enabled: boolean;
  intervalHours: number;
  maxPerComplaint: number;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  triggerStatuses: string[];
}
```

---

## Common Patterns

### Pattern 1: Watching Reminders in Real-time

```jsx
import { useEffect, useState } from 'react';
import { useNotifications } from './context/NotificationContext';

function ReminderBadge() {
  const { notifications } = useNotifications();
  const reminderCount = notifications.filter(
    n => n.type === 'complaint-reminder' && !n.read
  ).length;

  return (
    <div className="reminder-badge">
      {reminderCount > 0 && <span>{reminderCount}</span>}
    </div>
  );
}
```

### Pattern 2: Batch Processing Complaints

```javascript
async function processComplaintBatch(complaints) {
  const results = [];

  for (const complaint of complaints) {
    try {
      if (shouldSendReminder(complaint)) {
        await sendReminderEmail(complaint);
        results.push({ id: complaint.id, success: true });
      }
    } catch (error) {
      results.push({ id: complaint.id, success: false, error });
    }
  }

  return results;
}
```

### Pattern 3: Safe Firestore Updates

```javascript
async function updateComplaintSafely(complaintId, updates) {
  const batch = db.batch();
  const complaintRef = db.collection('complaints').doc(complaintId);

  // Add timestamp
  updates.updatedAt = FieldValue.serverTimestamp();

  // Update with batch
  batch.update(complaintRef, updates);

  // Also update audit log
  batch.set(
    db.collection('complaintHistory').doc(),
    {
      complaintId,
      changes: updates,
      timestamp: FieldValue.serverTimestamp()
    }
  );

  await batch.commit();
}
```

---

## Debugging Tips

### Log Reminder Data

```javascript
// In Cloud Function
const complaints = await getComplaintsNeedingReminders(triggerStatuses);
complaints.forEach(c => {
  logger.info(`Complaint ${c.id}:`, {
    status: c.status,
    reminders: c.reminders,
    enabled: c.reminders?.enabled,
    count: c.reminders?.count,
    nextDue: c.reminders?.nextDueAt?.toDate?.()
  });
});
```

### Check Notification Content

```javascript
// In browser console
// Get user's reminders
db.collection('notifications')
  .where('userId', '==', firebase.auth().currentUser.uid)
  .where('type', '==', 'complaint-reminder')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => console.log(doc.data()));
  });
```

### Monitor Email Delivery

```javascript
// Check Resend dashboard
fetch('https://api.resend.com/emails', {
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`
  }
}).then(r => r.json()).then(data => {
  console.log('Recent emails:', data.data);
});
```

---

This reference covers the main use cases. For more details, check the full documentation! 📚
