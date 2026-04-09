# Student Reminder Notification System - Complete Guide

## Overview

The HOAS Student Reminder Notification System automatically sends reminders to students to check the status of their complaints. This prevents escalation due to missed updates and improves user engagement.

## Key Features

✅ **Automated Reminders**: Scheduled job runs every 6 hours
✅ **Multiple Channels**: Email + In-app notifications
✅ **Spam Prevention**: Maximum 3 reminders per complaint
✅ **Smart Stopping**: Reminders automatically stop when student views complaint
✅ **Configurable**: Fully customizable via Firestore settings
✅ **Real-time Updates**: Instant notification delivery using FCM & Firestore
✅ **User Control**: Students can disable notifications in preferences

## Architecture

### Backend Components

```
server/functions/src/reminders.js
├── checkStudentReminders (scheduled, every 6 hours)
│   └── Finds complaints with interim statuses
│   └── Sends email + in-app reminders
│   └── Updates reminder tracking
├── markComplaintViewed (callable function)
│   └── Marks complaint as viewed
│   └── Disables future reminders
└── getReminderStats (admin utility)
    └── Returns reminder statistics
```

### Frontend Components

```
client/src/
├── context/NotificationContext.jsx
│   ├── Firestore listeners for reminders
│   ├── markReminderAcknowledged() function
│   └── Real-time notification updates
├── components/OwnerServices/NotificationBell.jsx
│   ├── Notification bell with badge
│   ├── Dropdown panel
│   └── Mark as read / Clear all
└── DashBoards/Student-DashBoard/
    ├── components/layout/NotificationPanel.jsx
    ├── components/pages/ComplaintDetailModal.jsx
    │   └── Auto-acknowledges reminders on view
    └── StudentDashboard.jsx
        └── Integrates notifications
```

### Data Structure

#### Complaints Collection - Reminders Field

```javascript
{
  id: "complaint_123",
  title: "Water leakage",
  status: "in-progress",
  studentId: "user_456",

  // Reminder tracking (added by system)
  reminders: {
    enabled: true,          // false after student views
    count: 2,              // 0-3 reminders sent
    lastSentAt: timestamp, // ISO timestamp
    nextDueAt: timestamp   // Next check time
  },

  // Viewing tracking
  studentViewed: false,    // true when student opens detail
  viewedAt: null          // timestamp when first viewed
}
```

#### Notifications Collection - Reminder Entries

```javascript
{
  id: auto_generated,
  userId: "student_123",
  title: "⏰ Complaint Update Reminder",
  body: "Your complaint \"Water leakage\" is in-progress. Please review it.",
  type: "complaint-reminder",
  complaintId: "complaint_123",
  complaintStatus: "in-progress",
  timestamp: serverTimestamp(),
  read: false,
  data: {
    complaintId: "complaint_123",
    complaintStatus: "in-progress"
  }
}
```

## Setup Instructions

### Step 1: Create System Settings Document

1. Open Firebase Console → Firestore Database
2. Create collection: `systemSettings`
3. Create document: `global`
4. Add the following content:

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

### Step 2: Configure Environment Variables

Add to your Firebase Functions environment:

```bash
firebase functions:config:set resend.key="your-resend-api-key"
firebase functions:config:set app.frontend_url="https://hoas.example.com"
firebase deploy --only functions
```

Or set in `.env.local` (for local testing):

```
RESEND_API_KEY=pk_xxx...
FRONTEND_URL=http://localhost:5173
```

### Step 3: Enable Firestore Listeners

The NotificationContext automatically sets up listeners. Make sure:

1. NotificationProvider wraps your app (in main.jsx)
2. Firebase is properly initialized
3. Firestore rules allow reading `notifications` collection

### Step 4: Deploy Cloud Functions

The reminders.js function should be automatically deployed:

```bash
cd server/functions
npm install
firebase deploy --only functions:checkStudentReminders
firebase deploy --only functions:markComplaintViewed
firebase deploy --only functions:getReminderStats
```

## How It Works

### Timeline

```
1. Student files complaint
   ↓
2. Warden marks complaint as "in-progress" / "warden-resolved"
   ↓
3. Scheduled job checks complaints every 6 hours
   ↓
4. If complaint status ∈ triggerStatuses AND reminders.enabled AND reminders.count < 3:
   ├─ Send email reminder
   ├─ Store in-app notification in Firestore
   └─ Increment reminders.count
   ↓
5. Student gets notification:
   ├─ Email: Professional HTML with complaint details
   └─ In-app: Notification bell badge + dropdown
   ↓
6. Student clicks notification or views complaint detail
   ↓
7. ComplaintDetailModal triggers markComplaintViewed()
   ↓
8. Cloud Function updates complaint:
   ├─ studentViewed = true
   ├─ reminders.enabled = false
   └─ No more reminders sent
```

### Email Notification Flow

```
checkStudentReminders (Cloud Function)
├─ Get complaint data
├─ Get student email from users collection
├─ Format HTML email with:
│  ├─ Complaint title
│  ├─ Current status
│  ├─ Last update time
│  └─ Call-to-action button
└─ Send via Resend API
   └─ From: reminders@hoas.example.com
   └─ Reply-To: support@hoas.example.com
```

### In-App Notification Flow

```
checkStudentReminders (Cloud Function)
├─ Create notification document in Firestore
│  ├─ userId: student ID
│  ├─ type: "complaint-reminder"
│  ├─ complaintId: complaint ID
│  └─ read: false
└─ NotificationContext listener detects change
   ├─ Adds to notifications array
   ├─ Increments unreadCount
   └─ Displays in notification bell
```

## Frontend Integration

### In StudentHeader (already integrated):

```jsx
<NotificationBell />
```

The bell shows:
- Unread count badge (red circle)
- Dropdown with all notifications
- Click → marks read & navigates to complaints

### In ComplaintDetailModal (already integrated):

```jsx
const { markReminderAcknowledged } = useNotifications();

useEffect(() => {
  if (complaint?.id) {
    markReminderAcknowledged(complaint.id)
      .catch(err => console.debug('Non-critical:', err));
  }
}, [complaint?.id, markReminderAcknowledged]);
```

When complaint detail opens:
1. markReminderAcknowledged is called
2. Cloud Function marks studentViewed = true
3. Reminders are disabled for that complaint
4. No more reminders sent

## Configuration Options

### System Settings Fields

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | true | Master feature toggle |
| `intervalHours` | number | 6 | Scheduler runs every N hours |
| `maxPerComplaint` | number | 3 | Max reminders per complaint |
| `emailEnabled` | boolean | true | Send email reminders |
| `inAppEnabled` | boolean | true | Create in-app notifications |
| `triggerStatuses` | array | See below | Statuses that trigger reminders |

### Default Trigger Statuses

Reminders are sent for complaints in these states:

- `pending` - Not yet addressed by warden
- `in-progress` - Being worked on
- `warden-resolved` - Requires student review
- `disputed` - Awaiting warden response

Not triggered for:
- `resolved` - Completely resolved
- `escalated` - Sent to management

## Testing

### Manual Test

1. **Create Test Complaint**
   - Student dashboard → Create complaint
   - Select category, add description

2. **Trigger Status Change**
   - Warden: Open complaint → Mark as "In Progress"

3. **Test Manually (Don't Wait 6 Hours)**
   - Firebase Console → Cloud Functions → checkStudentReminders
   - Click "Testing" tab
   - Invoke function manually
   - Or call it via REST (requires authorization)

4. **Verify Reminders**
   - **Email**: Check student's email (check spam)
   - **In-App**: Check notification bell on student dashboard

5. **Test Acknowledgment**
   - Student: Click notification or open complaint detail
   - Verify: Notification marked as read
   - Verify: No more reminders sent

### Debug Commands

```javascript
// Get reminder statistics (admin)
import { getReminderStats } from './firebase/cloudFunctions';
const stats = await getReminderStats();
console.log(stats);
// Output: { totalComplaints, complaintsWithReminders, totalRemindersSent, ...}

// Check Firestore complaint reminders field
db.collection('complaints').doc('id').get().then(doc => {
  console.log(doc.data().reminders);
});

// Check notifications for a user
db.collection('notifications')
  .where('userId', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();
```

## Monitoring

### Check Cloud Functions Logs

```bash
firebase functions:log
```

Look for patterns:
```
✅ Reminder sent - Complaint: abc123, Student: user456
❌ Error sending reminder email
⏸️ Reminders feature is DISABLED
```

### Monitor Firestore

1. Open Firestore Console
2. Go to `systemSettings` → `global`
3. Check `features.reminders` settings
4. Go to `complaints` collection
5. Filter by complaints where `reminders.count > 0`
6. Check `notifications` collection for reminder entries

### User Feedback

- Notification bell badge shows unread count
- Notification body shows complaint title & status
- Email has detailed information with button links

## Troubleshooting

### Reminders Not Sending

**Check 1: Is feature enabled?**
```
systemSettings/global → features.reminders.enabled = true
```

**Check 2: Is complaint in trigger status?**
```
Complaint status must be in triggerStatuses array
```

**Check 3: Has max been reached?**
```
If complaint.reminders.count >= maxPerComplaint, no more reminders
```

**Check 4: Is email configured?**
```
RESEND_API_KEY environment variable set? Check Firebase Functions config
```

**Check 5: Look at Cloud Functions logs**
```
firebase functions:log | grep reminder
```

### Emails Not Received

- Check spam/junk folder
- Verify `from` email is whitelisted in Resend
- Check RESEND_API_KEY is valid
- Look at Resend dashboard for bounce/error logs

### Notifications Not Showing in Bell

- Check user has notifications permission
- Verify NotificationProvider wraps your app
- Check Firestore `notifications` collection exists
- Check user's notification preferences

### Reminders Not Stopping

- Verify ComplaintDetailModal component is updated
- Check markComplaintViewed function is called
- Check user is authenticated (request.auth.uid exists)
- Look at Cloud Functions logs for errors

## API Reference

### Cloud Functions

#### checkStudentReminders (Scheduled)

Runs every 6 hours. No manual invocation needed.

**What it does:**
- Checks all complaints with interim statuses
- For each eligible complaint, sends reminders
- Updates complaint reminder tracking

**Logs:**
```
⏰ Starting student reminders check...
✅ Reminder sent - Complaint: ..., Student: ...
✅ Reminders check complete. Total sent: 5
```

#### markComplaintViewed (Callable)

Marks a complaint as viewed by student, disables reminders.

**Called from:** ComplaintDetailModal (automatic)

**Parameters:**
```javascript
{
  complaintId: "complaint_123"  // Required
}
```

**Returns:**
```javascript
{
  success: true,
  message: "Complaint marked as viewed. Reminders have been stopped."
}
```

#### getReminderStats (Callable)

Returns reminder system statistics. Admin only.

**Called from:** Admin dashboard (manual)

**Returns:**
```javascript
{
  totalComplaints: 42,
  complaintsWithReminders: 18,
  totalRemindersSent: 45,
  avgRemindersPerComplaint: 2.5
}
```

### Client Functions

#### useNotifications Hook

```javascript
const {
  notifications,           // Array of notification objects
  unreadCount,            // Number of unread notifications
  permissionGranted,      // Browser notification permission status
  markAsRead,             // (id) => Promise - Mark single notification as read
  markAllAsRead,          // () => Promise - Mark all as read
  clearAll,               // () => void - Clear all notifications
  requestPermission,      // () => Promise - Request browser notification permission
  markReminderAcknowledged // (complaintId) => Promise - Acknowledge reminder
} = useNotifications();
```

### Firestore Collections

#### systemSettings/global

Configuration document for the reminder system.

#### notifications

Stores all user notifications including reminders.

```javascript
{
  userId,
  title,
  body,
  type: "complaint-reminder" | "complaint" | "...",
  complaintId,               // For reminders
  timestamp,
  read
}
```

## Best Practices

✅ **DO:**
- Test email configuration before deploying to production
- Set reasonable `maxPerComplaint` (2-5)
- Use `intervalHours` of 6-12 for balance
- Monitor Cloud Functions logs regularly
- Include link back to dashboard in emails

❌ **DON'T:**
- Set `maxPerComplaint` too high (prevents spam prevention)
- Forget to configure Resend API key (emails won't send)
- Manually edit complaint `reminders` field in Firestore
- Disable notifications without user consent

## User Preferences

Students can control notification types via settings:

```javascript
userData.notifPrefs = {
  complaints: true,        // Complaint status updates
  systemAlerts: true,      // System notifications
  soundAlerts: true,       // Notification sounds
  emailNotifications: true // All emails
}
```

Note: Reminders follow the `complaints` preference setting.

## Performance Considerations

- **Firestore Queries**: Indexed on `status` and `managementId`
- **Email Sending**: Async operation, doesn't block response
- **Scheduled Job**: Runs once per 6 hours, checks all complaints
- **In-App Notifications**: Real-time using onSnapshot listeners

Expected performance:
- 1000 complaints → ~5-10 seconds to check all
- 100 reminders to send → ~30 seconds with Resend delays

## Security

- ✅ `markComplaintViewed` requires authentication
- ✅ Verifies user owns complaint (studentId check)
- ✅ `getReminderStats` restricted to admin role
- ✅ Firestore rules control collection access
- ✅ Email addresses not exposed in client code

## Future Enhancements

- [ ] SMS reminders (Twilio integration)
- [ ] Customizable reminder messages per status
- [ ] Escalating frequency (1st @ 6hrs, 2nd @ 12hrs, etc.)
- [ ] Student preference: disable reminders per complaint
- [ ] Warden override: Manual reminder trigger
- [ ] Analytics dashboard: Reminder performance metrics
- [ ] A/B testing: Different reminder messages/times

## Support

For issues or questions:
1. Check Cloud Functions logs
2. Review Firestore settings
3. Verify environment variables
4. Check browser console for client errors
5. Review NotificationContext in React DevTools

---

**Version**: 1.0.0
**Last Updated**: 2026-04-09
**Status**: Production Ready
