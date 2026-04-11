# 🔔 Smart Announcements & Notifications - Comprehensive Fix Guide

## 🎯 What Was Fixed

### **1. Notifications Not Coming**
**Problem**: Notifications were blocked because `notifPrefs.announcements` was checked with strict logic:
```javascript
if (!prefs.announcements) return; // BLOCKED unless explicitly true
```

**Solution**: Changed to opt-out model (enabled by default):
```javascript
const announcementsEnabled = prefs.announcements !== false; // Enabled unless explicitly disabled
```

### **2. Sound Not Playing**
**Problem**: Sound only played if `userData?.notifPrefs?.soundAlerts` was explicitly `true`:
```javascript
if (!userData?.notifPrefs?.soundAlerts) return; // No sound unless explicitly set
```

**Solution**:
- Changed to opt-out model with better sound
- Sound plays by default unless disabled
- Enhanced audio with multiple tones:
  - 1000Hz → 700Hz → 1000Hz (three-note pattern)
  - Louder volume (0.15 instead of 0.07)
  - Better sustain and fade

### **3. Missing Initialization**
**Problem**: New users had no `notifPrefs` field, causing all checks to fail.

**Solution**: Created automatic initialization system:
- On login: Call `initializeNotificationPrefs(userId)`
- When saving FCM token: Auto-set default preferences
- Provides full default preferences for all types

### **4. Permission Not Requested**
**Problem**: No automatic request for browser notification permission.

**Solution**:
- Modified FCM setup to always request permission
- Gracefully handles denied permissions (still works with Firestore notifications)
- Logs success/denial for debugging

---

## 📋 Default Notification Preferences

All new users are initialized with:
```javascript
{
  soundAlerts: true,              // ✅ Play sound
  systemAlerts: true,             // ✅ Show system notifications
  announcements: true,            // ✅ Show announcements
  complaints: true,               // ✅ Show complaint updates
  leaveUpdates: true,             // ✅ Show leave request updates
  leaveRequests: true,            // ✅ Show new leave requests (wardens)
  newComplaints: true,            // ✅ Show new complaints (wardens)
  complaintUpdates: true,         // ✅ Show complaint updates (wardens)
  newStudents: true,              // ✅ Show new student registrations (wardens)
  emailNotifications: false,       // ❌ (Future: Resend integration)
}
```

---

## 🚀 How to Deploy the Fixes

### **Step 1: Deploy Updated Code**
```bash
# Frontend changes are already in place
git add -A
git commit -m "Fix notifications: enable by default, enhance sound, auto-initialize prefs"
git push origin main
```

### **Step 2: Fix Existing Users (One-Time Migration)**

Create a Cloud Function to initialize preferences for existing users:

```bash
# Server-side script (run once in Firebase Console or via Cloud Function)
# This ensures all existing users get default preferences
```

Or use the browser console to manually fix a user:
```javascript
// In browser console (while logged in):
const { initializeNotificationPrefs } = await import('./src/utils/notificationPrefsManager.js');
const userId = firebase.auth().currentUser.uid;
await initializeNotificationPrefs(userId);
console.log('✅ Preferences initialized!');
```

### **Step 3: Test the System**

**For Students (Receiving Announcements):**
1. Login as a student
2. Open browser DevTools → Console
3. Look for: `✅ Notification permission granted` or `ℹ️ Notification permission is already: granted`
4. Check that notification preferences are initialized:
   ```javascript
   const { getNotificationStats } = await import('./src/utils/notificationPrefsManager.js');
   const stats = await getNotificationStats(firebase.auth().currentUser.uid);
   console.log(stats);
   ```
5. Create a scheduled announcement from Warden Dashboard
6. Wait 5 minutes (scheduler cycle) or create immediate announcement
7. Student should hear 3-note sound and see notification

**For Testing Sound Manually:**
```javascript
// In browser console:
const { useNotifications } = await import('./src/context/NotificationContext.jsx');
// Or directly call:
const { playNotificationSound } = await import('./src/firebase/notificationService.js');
playNotificationSound('announcement'); // Try different types: 'urgent', 'success', 'normal'
```

---

## 🎵 Sound Options

The enhanced notification system includes multiple sound types:

```javascript
playNotificationSound('announcement') // 3-note ascending tone (best for announcements)
playNotificationSound('urgent')       // Double beep + high note (for urgent alerts)
playNotificationSound('success')      // Happy two-note (for approvals)
playNotificationSound('normal')       // Calm two-note (default)
```

---

## 🔧 Files Modified

### **Modified Files:**
1. **NotificationContext.jsx**
   - Changed all preference checks to opt-out model
   - Added automatic initialization on login
   - Enhanced sound generation

2. **notificationService.js**
   - Updated FCM token saving to initialize prefs
   - Added `playNotificationSound()` function with multiple sound types
   - Better permission request handling

### **New Files:**
1. **notificationPrefsManager.js** (New utility)
   - `initializeNotificationPrefs()` - Auto-init on login
   - `enableNotifPref()` - Enable specific notification type
   - `disableNotifPref()` - Disable specific type
   - `resetNotificationPrefs()` - Reset to defaults
   - `getNotificationStats()` - Diagnostics

---

## 🐛 Troubleshooting

### **Symptoms: No notifications or sound**

**Check 1: Verify Browser Permission**
```javascript
console.log(Notification.permission); // Should be 'granted'
```

**Check 2: Verify Firestore Preferences**
```javascript
// In Firebase Console → Firestore → users collection
// Find your user document and check notifPrefs field
// Should have all the keys set to true
```

**Check 3: Check Cloud Function Logs**
```bash
firebase functions:log --region asia-south1 --follow
# Should see: "publishScheduledAnnouncements" running every 5 minutes
```

**Check 4: Verify Announcements Collection**
```javascript
// In Firebase Console → Firestore → announcements collection
// Look for your announcement with:
// - status: 'published' (for immediate)
// - status: 'scheduled' (for future)
// - isSent: true (if already published)
```

**Check 5: Verify Notifications Created**
```javascript
// In Firebase Console → Firestore → notifications collection
// Should see documents created by Cloud Function with:
// - userId: [student's ID]
// - type: 'announcement'
// - timestamp: [when scheduler ran]
```

### **Symptoms: Sound too quiet/loud**

Volume is set to `0.2-0.3`. To adjust:
1. Open `notificationService.js`
2. Find `playNotificationSound()` function
3. Change the `volume` parameter in `playTone()` calls
4. Value range: 0 (silent) to 1 (max)

### **Symptoms: Users not getting notifications in real-time**

1. Verify FCM token is saved: Check user document for `fcmToken` field
2. Verify notification preference is enabled:
   ```javascript
   const prefs = userData.notifPrefs;
   console.log('Announcements enabled?', prefs.announcements !== false);
   ```
3. Check Cloud Function logs for errors
4. Verify `managementId` field exists in both user and announcement documents

---

## 📊 System Architecture (Updated)

```
┌─────────────────────────────────────────────────────────┐
│                   Warden Creates Announcement            │
│         (Immediate, Scheduled, or Recurring)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │ Cloud Function (Every 5min)│
        │ publishScheduledAnnouncements
        └────────┬───────────────────┘
                 │
      ┌──────────┴──────────┐
      ↓                     ↓
 Immediate         Scheduled @ Time
 (Mark isSent)     (Check if time passed)
      │                     │
      └──────────┬──────────┘
                 │
          ┌──────↓──────┐
          │ For Each    │
          │ Student     │
          └──────┬──────┘
                 │
        ┌────────↓───────────┐
        │ Create Notification│
        │ Document for User  │
        └────────┬───────────┘
                 │
         ┌───────↓────────┐
         │ FirebaseListener│ (Real-time)
         │ (Firestore)    │
         └───────┬────────┘
                 │
      ┌──────────┴───────────┐
      │                      │
      ↓                      ↓
   Play Sound          Show Visual
   (Audio API)         Notification
      │                      │
      └──────────┬───────────┘
                 │
         ┌───────↓──────────┐
         │ Student Sees &   │
         │ Hears Notification
         └────────────────────┘
```

---

## ✅ Verification Checklist

After deploying the fixes:

- [ ] Existing users have `notifPrefs` field in Firestore
- [ ] New users automatically get default preferences
- [ ] Browser notification permission is requested on login
- [ ] Sound plays on notifications (3-note pattern)
- [ ] Immediate announcements appear instantly in student view
- [ ] Scheduled announcements publish at correct time
- [ ] Recurring announcements publish at correct intervals
- [ ] Notification badge shows unread count
- [ ] NotificationPanel opens correctly
- [ ] Cloud Function logs show announcements being published
- [ ] No errors in browser console

---

## 🎯 Next Steps (Optional Enhancements)

1. **Email Notifications**: Integrate with Resend API
2. **SMS Notifications**: Integrate with Twilio
3. **Push Notifications**: Add native app support
4. **Notification Preferences UI**: Let students customize preferences
5. **Notification History**: Archive old notifications
6. **Notification Analytics**: Track delivery and read rates

---

## 📞 Support

If notifications still don't work after deploying these fixes:

1. Check browser console for errors
2. Verify Firebase project has proper rules for notifications collection
3. Ensure Cloud Functions are deployed: `firebase deploy --only functions`
4. Check Cloud Function logs for runtime errors
5. Verify Firestore has announcements collection with proper data
6. Test with manual notification creation via the testing utilities

**Emergency Test**: Create a notification directly in Firestore:
```
Collection: notifications
Document: (auto-generate)
Fields:
  - userId: [your-user-id]
  - title: "Test Notification"
  - body: "This is a test"
  - type: "announcement"
  - timestamp: (server timestamp)
  - read: false

Should see notification appear within 1-2 seconds!
```
