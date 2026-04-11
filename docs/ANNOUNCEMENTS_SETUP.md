# Smart Announcements System - Setup Guide

## Firestore Configuration

The announcements system requires configuration in the Firestore `systemSettings/global` document.

### Step 1: Create System Settings Document (if it doesn't exist)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to your HOAS project
3. Go to **Firestore Database**
4. Create a collection named `systemSettings` (if not already present)
5. Create a document with ID `global`

### Step 2: Add Announcements Configuration

Add the following JSON structure to the `global` document:

```json
{
  "features": {
    "announcements": {
      "enabled": true,
      "schedulingEnabled": true,
      "emailNotifications": false,
      "smsNotifications": false,
      "minAdvanceMinutes": 5,
      "maxScheduledPerWarden": 20
    }
  }
}
```

### Configuration Fields Explained

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `features.announcements.enabled` | boolean | `true` | Master toggle for announcements feature |
| `features.announcements.schedulingEnabled` | boolean | `true` | Allow scheduled/recurring announcements |
| `features.announcements.emailNotifications` | boolean | `false` | Send email when announcements are published (future) |
| `features.announcements.smsNotifications` | boolean | `false` | Send SMS when announcements are published (future) |
| `features.announcements.minAdvanceMinutes` | number | `5` | Minimum minutes in advance to schedule |
| `features.announcements.maxScheduledPerWarden` | number | `20` | Max pending scheduled announcements per warden |

### Step 3: Verify Cloud Function Deployment

After deploying the updated Cloud Functions:

```bash
cd server/functions
npm run deploy
```

### Step 4: Test the Scheduler

1. Go to **Cloud Scheduler** in Google Cloud Console
2. Look for `publishScheduledAnnouncements` function
3. Click "Force run" to trigger it immediately (or wait for next 5-minute interval)
4. Check **Cloud Function Logs** for status

### Firestore Collection Structure

After setup, verify your Firestore has these collections:

```
firestore
├── announcements
│   ├── {announcementId}
│   │   ├── title: string
│   │   ├── content: string
│   │   ├── priority: string ('urgent'|'important'|'normal'|'low')
│   │   ├── pinned: boolean
│   │   ├── status: string ('published'|'scheduled'|'recurring'|'draft')
│   │   ├── managementId: string
│   │   ├── scheduledTime: timestamp (optional)
│   │   ├── isRecurring: boolean
│   │   ├── recurrencePattern: object (optional)
│   │   ├── recurrenceEndDate: timestamp (optional)
│   │   ├── isSent: boolean
│   │   ├── sentAt: timestamp
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
├── notifications
│   ├── {notificationId}
│   │   ├── userId: string
│   │   ├── title: string
│   │   ├── body: string
│   │   ├── type: string ('announcement'|'complaint'|...)
│   │   ├── timestamp: timestamp
│   │   ├── read: boolean
│   │   └── data: object
├── systemSettings
│   └── global
│       └── features.announcements: object (see above)
└── users
    └── (existing user documents)
```

## Testing the System

### Test 1: Immediate Announcement
1. Login as Warden
2. Go to Announcements
3. Create announcement with "Post Now"
4. Verify it appears immediately in Student view

### Test 2: Scheduled Announcement
1. Create announcement with "Schedule Later"
2. Pick a time 1-2 minutes from now
3. Verify it shows "⏰ Scheduled" badge in Warden view
4. Wait for scheduler to run (max 5 minutes)
5. Verify it appears in Student view after scheduled time

### Test 3: Recurring Announcement
1. Create announcement with "Repeat" enabled
2. Set to "Daily" at 9:00 AM
3. Verify it shows "🔄 Recurring" badge
4. Each day at 9 AM, scheduler will publish a copy to students

### Test 4: Draft Announcement
1. Create any announcement, then manually change `status: 'draft'` in Firestore (or update UI to support draft toggle)
2. Verify draft does NOT appear in Student view
3. Verify it appears in Warden view (in future with draft section)

## Troubleshooting

### Scheduler Not Running
- Check Cloud Function logs in Google Cloud Console
- Verify `publishScheduledAnnouncements` is deployed
- Check that Firestore has correct collection structure

### Announcements Not Appearing
- Verify announcement `status` is 'published' or 'scheduled'
- Check announcement `managementId` matches student's `managementId`
- Verify student `status` is 'approved' in users collection

### Timezone Issues
- All scheduled times are stored in UTC (browser converts to local)
- Server scheduler runs in UTC
- If issues persist, add `timezone` field to Firestore document

## Environment Variables

No additional environment variables needed for announcements beyond existing setup:
- ✅ Firebase credentials (already configured)
- ✅ Resend API key (optional, for future email support)

## Future Enhancements

- [ ] Email notifications for scheduled announcements
- [ ] SMS notifications (Twilio integration)
- [ ] Announcement templates
- [ ] Advanced recurrence patterns (every 2 weeks, etc.)
- [ ] Edit/cancel scheduled announcements from warden view
- [ ] Analytics/open rate tracking
- [ ] Announcement expiration
