/**
 * System Settings for Reminder System
 *
 * This file contains the configuration structure for the reminder feature.
 * Add this to your Firestore systemSettings collection under: systemSettings/global
 *
 * To enable reminders:
 * 1. Go to Firestore Console
 * 2. Navigate to Collection: systemSettings
 * 3. Document: global
 * 4. Add/Update the 'features.reminders' field with the configuration below
 */

const reminderSystemConfig = {
  features: {
    // Master feature toggle
    reminders: {
      enabled: true,

      // Reminder interval in hours (how often to check for and send reminders)
      // Default: 6 hours (scheduled job runs every 6 hours)
      intervalHours: 6,

      // Maximum number of reminders per complaint (prevents spam)
      // Default: 3 (student gets at most 3 reminders per complaint)
      maxPerComplaint: 3,

      // Enable/disable email reminders
      emailEnabled: true,

      // Enable/disable in-app Firestore notifications (default: always enabled)
      inAppEnabled: true,

      // Statuses that trigger reminders
      // Students get reminded about complaints in these statuses
      triggerStatuses: ['pending', 'in-progress', 'warden-resolved', 'disputed'],

      // Optional: Custom settings per status
      statusSettings: {
        pending: {
          reminderMessage: 'Your complaint is still pending review.',
        },
        'in-progress': {
          reminderMessage: 'Your complaint is being worked on.',
        },
        'warden-resolved': {
          reminderMessage: 'Please review the warden\'s resolution.',
        },
        disputed: {
          reminderMessage: 'Your dispute is awaiting response.',
        },
      },
    },
  },
};

/**
 * STEP-BY-STEP SETUP INSTRUCTIONS
 * ================================
 *
 * 1. CREATE SYSTEM SETTINGS DOCUMENT:
 *    - Go to Firebase Console -> Firestore Database
 *    - Create collection: "systemSettings"
 *    - Create document: "global"
 *    - Add the following structure:
 *
 *    {
 *      "features": {
 *        "reminders": {
 *          "enabled": true,
 *          "intervalHours": 6,
 *          "maxPerComplaint": 3,
 *          "emailEnabled": true,
 *          "inAppEnabled": true,
 *          "triggerStatuses": ["pending", "in-progress", "warden-resolved", "disputed"]
 *        }
 *      }
 *    }
 *
 * 2. CONFIGURE ENVIRONMENT VARIABLES:
 *    Add these to your .env.local / Firebase Functions env:
 *
 *    RESEND_API_KEY=<your-resend-api-key>
 *    FRONTEND_URL=<your-frontend-url>  (e.g., https://hoas.example.com)
 *
 * 3. ENABLE REMINDERS.JS FUNCTION:
 *    In server/functions/src/reminders.js is already deployed.
 *    The scheduled job runs every 6 hours automatically.
 *
 * 4. VERIFY IN FIRESTORE:
 *    - Check systemSettings/global document
 *    - View complaints collection to see 'reminders' field tracking
 *
 * FIRESTORE STRUCTURE
 * ===================
 *
 * complaints/{complaintId}/reminders (field):
 * {
 *   enabled: boolean,      // Is reminder feature active for this complaint?
 *   count: number,         // How many reminders have been sent (0-3)
 *   lastSentAt: timestamp, // When last reminder was sent
 *   nextDueAt: timestamp,  // When next reminder is due to be checked
 * }
 *
 * COMPLAINT FIELDS ADDED BY REMINDER SYSTEM:
 * - reminders.enabled: true by default, set to false when student views
 * - reminders.count: incremented with each reminder sent
 * - reminders.lastSentAt: timestamp
 * - reminders.nextDueAt: timestamp for next check
 * - studentViewed: true (set when student opens complaint detail)
 * - viewedAt: timestamp (when student first viewed)
 */

export const setupReminderSystemInstructions = `
╔════════════════════════════════════════════════════════════════════╗
║           STUDENT REMINDER NOTIFICATION SYSTEM SETUP              ║
╚════════════════════════════════════════════════════════════════════╝

✅ BACKEND SETUP (Already Done):
────────────────────────────────
1. Scheduled Function: checkStudentReminders (runs every 6 hours)
   Location: server/functions/src/reminders.js

2. Callable Function: markComplaintViewed (called when student views)
   - Marks complaint as studentViewed
   - Sets reminders.enabled = false
   - Stops all future reminders for that complaint

3. Email Service: Configured via Resend
   - Sends professional HTML emails with complaint details
   - Includes link back to HOAS dashboard

4. In-App Notifications: Stored in Firestore
   - Type: 'complaint-reminder'
   - Displayed in notification bell dropdown

✅ FRONTEND SETUP (Already Done):
────────────────────────────────
1. NotificationContext Provider
   - Listens for reminder notifications in real-time
   - Tracks unread reminders
   - Provides markReminderAcknowledged() function

2. Notification Bell (Header)
   - Displays unread count badge
   - Shows reminder notifications in dropdown
   - Auto-navigation to complaints page on click

3. ComplaintDetailModal
   - Triggers markReminderAcknowledged when opened
   - Automatically stops reminders when student views complaint

4. Firestore Listeners
   - Real-time updates for reminder notifications
   - Syncs across multiple tabs/devices

⚙️  CONFIGURATION STEPS:
─────────────────────────
1. Firestore Collection Structure:

   Collections you need:
   ├── complaints/          (already exists)
   ├── notifications/       (already exists)
   ├── userNotificationPrefs/ (stores user preferences)
   └── systemSettings/      (needs configuration)

2. Create systemSettings/global document:

   Collection: systemSettings
   Document ID: global

   Content:
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

3. Environment Variables (for email):

   RESEND_API_KEY          - Get from https://resend.com/api-keys
   FRONTEND_URL            - Your HOAS domain (e.g., https://hoas.example.com)

4. Firebase Functions Config:

   firebase functions:config:set resend.key="sk-xxx"
   firebase deploy --only functions

🧪 TESTING THE SYSTEM:
──────────────────────
1. Create a test complaint as a student
2. Warden marks it as "in-progress"
3. Wait max 6 hours for reminder (or test manually)
4. Student receives:
   - Email notification (check spam folder)
   - In-app notification (notification bell)
5. Student opens complaint detail
6. Reminder is acknowledged (reminders.enabled = false)
7. No more reminders sent for this complaint

📊 MONITORING & DEBUGGING:
──────────────────────────
• Firebase Console Logs: Check Cloud Functions logs
• Reminder Stats: Call getReminderStats() (admin only)
• Complaints Collection: Check reminders field on any complaint
• Notifications Collection: View stored reminder notifications

🔧 CONFIGURATION OPTIONS:
─────────────────────────
• Adjust intervalHours: How often scheduler checks (6, 12, 24)
• Adjust maxPerComplaint: Max reminders (2, 3, 5)
• Toggle emailEnabled/inAppEnabled: Choose notification channels
• Modify triggerStatuses: Which complaint statuses trigger reminders

✨ FEATURES:
────────────
✓ Automatic 6-hour reminders for pending complaints
✓ Email + In-app notifications
✓ Max 3 reminders per complaint (prevents spam)
✓ Automatic stop when student views complaint
✓ Configurable via Firestore system settings
✓ Real-time notification updates
✓ Works offline (email still queued if internet down)
✓ Respects user notification preferences

📱 USER EXPERIENCE:
──────────────────
1. Student files complaint
2. Warden updates complaint status
3. System automatically sends reminder after 6 hours if not viewed
4. Student gets notification bell alert + email
5. Student clicks notification to view complaint details
6. Viewing complaint marks reminder as acknowledged
7. No more reminders for that complaint
`;

export default reminderSystemConfig;
