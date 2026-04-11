# Reminder System - Testing & Verification Guide

## Pre-Deployment Checklist

- [ ] Firestore `systemSettings/global` document created with reminder config
- [ ] Environment variables set: `RESEND_API_KEY`, `FRONTEND_URL`
- [ ] Cloud Functions deployed
- [ ] NotificationProvider in React app
- [ ] StudentHeader includes NotificationBell
- [ ] ComplaintDetailModal updated

## Step-by-Step Testing

### Test 1: Firestore Configuration

**Time**: 2 minutes

1. Open Firebase Console → Firestore Database
2. Navigate to `systemSettings` → `global`
3. Verify these fields exist:
   ```
   features.reminders.enabled = true
   features.reminders.intervalHours = 6
   features.reminders.maxPerComplaint = 3
   features.reminders.emailEnabled = true
   features.reminders.inAppEnabled = true
   ```

**Expected Result**: Settings document loads without errors

---

### Test 2: Create Test Complaint

**Time**: 5 minutes

1. **Login as Student**
   - Go to http://localhost:5173/dashboard/student
   - Should see dashboard and complaints page

2. **Create Complaint**
   - Click "File Complaint"
   - Fill in:
     - Title: "Test Reminder - Water Leak"
     - Category: "Maintenance"
     - Description: "Testing reminder system"
     - Add an image (optional)
   - Submit

3. **Verify Complaint Created**
   - Complaint appears in list
   - Status: "pending"
   - Firestore: Check `complaints` collection

**Expected Result**: Complaint successfully created and visible

---

### Test 3: Warden Update Status

**Time**: 2 minutes

1. **Login as Warden**
   - Different account with role: "warden"

2. **Update Complaint**
   - Find the test complaint
   - Mark as "In Progress"
   - Add response: "We're looking into this"

3. **Verify Update**
   - Firestore: Check complaint `status` = "in-progress"

**Expected Result**: Status updated successfully

---

### Test 4: Manual Function Invocation

**Time**: 3 minutes

Since we don't want to wait 6 hours, manually invoke the reminder function:

**Option A: Firebase Console (Easiest)**

1. Firebase Console → Functions
2. Find `checkStudentReminders`
3. Click "Testing" tab
4. Click "Call function" (if available)

**Option B: Cloud Functions Logs**

```bash
cd HOAS
firebase functions:log
# Keep this open to watch for function execution
```

**Option C: Manual via REST (Advanced)**

```bash
# Get ID token
firebase auth:export accounts.json

# Call function (requires proper auth headers)
curl -X POST \
  https://asia-south1-hoas-65dee.cloudfunctions.net/checkStudentReminders \
  -H "Authorization: Bearer <ID_TOKEN>"
```

---

### Test 5: Email Verification

**Time**: 2 minutes

1. **Check Email Inbox**
   - Go to the email address associated with the student account
   - Look for email from: `reminders@hoas.example.com`
   - Subject: `Reminder: "Test Reminder - Water Leak" - Status Update`

2. **Verify Email Content**
   - [ ] Professional HTML layout
   - [ ] Complaint title displayed
   - [ ] Current status shown ("In Progress")
   - [ ] Last updated timestamp
   - [ ] Click button: "View Complaint Details"
   - [ ] Footer with HOAS link

3. **Check Spam Folder** (if not in inbox)
   - Resend emails sometimes go to spam initially
   - Mark as "not spam" to train filter

**Expected Result**: Email received with correct content within 1 minute of function run

---

### Test 6: In-App Notification

**Time**: 2 minutes

1. **Switch to Student Tab**
   - Keep student dashboard open
   - Don't refresh yet

2. **Check Notification Bell**
   - Look at top-right of header
   - Should see red badge with number "1"
   - Example: 🔔 with red circle showing "1"

3. **Click Notification Bell**
   - Dropdown panel appears
   - Shows: "⏰ Complaint Update Reminder"
   - Body: 'Your complaint "Test Reminder - Water Leak" is in-progress...'
   - Time: "just now"

4. **Mark as Read**
   - Click the notification
   - Notification should become highlighted (bold background)
   - Badge count decreases

**Expected Result**: In-app notification appears and can be marked read

---

### Test 7: Notification Navigation

**Time**: 2 minutes

1. **Click Notification in Dropdown**
   - Click on reminder notification
   - Should auto-navigate to Complaints page
   - Notification bar closes

2. **Verify Page Load**
   - Complaints page loads
   - Test complaint is visible
   - Status shows "In Progress"

**Expected Result**: Clicking notification navigates correctly

---

### Test 8: Reminder Acknowledgment

**Time**: 3 minutes

1. **Open Complaint Detail Modal**
   - Click on the test complaint row
   - Detail modal opens
   - Shows all complaint info

2. **Check Backend**
   - Open Firestore Console
   - Go to `complaints` → find test complaint
   - Scroll to `reminders` field
   - Should show:
     ```
     reminders.enabled = false  (was true, now false)
     reminders.lastSentAt = (timestamp)
     ```

3. **Check studentViewed Flag**
   - Same complaint document
   - `studentViewed` should be `true`
   - `viewedAt` should have timestamp

4. **Verify No More Reminders**
   - Close modal
   - Wait several seconds (or invoke function again manually)
   - No new reminders should arrive
   - Notification bell badge stays same

**Expected Result**: Reminders stop after complaint is viewed

---

### Test 9: Notification Preferences

**Time**: 2 minutes

1. **Check User Preferences**
   - Open user settings
   - Look for notification preferences:
     - `notifPrefs.complaints` (should be true)
     - `notifPrefs.soundAlerts` (should be true)

2. **Disable Complaint Notifications**
   - Toggle off: "Complaint Status Updates"

3. **Create Another Test Complaint**
   - Repeat Test 2 & 3
   - Have warden update status again

4. **Verify No Reminders**
   - Wait for function to run
   - Should NOT receive email
   - Should NOT see notification in bell

**Expected Result**: Reminders respect user preferences

---

### Test 10: Max Reminders Prevention

**Time**: 10 minutes

1. **Run Function Multiple Times**
   - Manually invoke function 4 times
   - (Simulates 24 hours of reminders)

2. **Monitor Complaint**
   - Check Firestore: `complaints` → test complaint → `reminders.count`
   - Should see: 1, 2, 3, 3 (stops at 3)

3. **Verify No 4th Reminder**
   - After 3rd reminder, even if function runs, no 4th should be sent

**Expected Result**: Max 3 reminders per complaint enforced

---

## Monitoring & Logs

### Cloud Functions Logs

```bash
firebase functions:log

# Expected output:
# ⏰ Starting student reminders check...
# ✅ Reminder sent - Complaint: abc123, Student: user456, Email: true, Count: 1/3
# ✅ Reminders check complete. Total sent: 1, Emails: 1
```

### Firestore Rules Check

Ensure these rules allow reading notifications:

```
match /notifications/{document=**} {
  allow read: if request.auth.uid != null;
  allow write: if request.time < timestamp.date(2026, 1, 1);
}

match /systemSettings/{document=**} {
  allow read: if request.auth.uid != null;
}

match /complaints/{complaintId} {
  allow read, write: if request.auth.uid != null;
}
```

### Testing Resend Integration

```bash
# Check Resend dashboard: https://resend.com/dashboard

# Verify:
- Mails sent count increases
- No bounces or failures
- From address is correct
```

---

## Troubleshooting During Testing

### Issue: Badge doesn't appear after status change

**Debugging**:
1. Check browser console for errors
2. Verify NotificationContext provider wraps app
3. Check Firestore: notifications collection has entries
4. Check browser notification permission

### Issue: Email not received

**Debugging**:
1. Check spam/junk folder
2. Verify `RESEND_API_KEY` is set:
   ```bash
   firebase functions:config:get
   ```
3. Check Resend dashboard for bounces
4. Verify student email in `users` collection
5. Check Cloud Functions logs for errors

### Issue: Function not running

**Debugging**:
1. Check if feature is enabled:
   ```firestore
   systemSettings/global/features/reminders/enabled = true
   ```
2. Check if complaint status in triggerStatuses
3. Manually invoke function
4. Check Cloud Functions tab → Executions

### Issue: Reminder doesn't stop after viewing

**Debugging**:
1. Check if ComplaintDetailModal has markReminderAcknowledged hook
2. Check browser console for errors
3. Verify Firestore: complaint/reminders/enabled = false
4. Check auth: user must be authenticated

---

## Performance Testing

### Load Test: 1000 Complaints

1. Create 1000 test complaints (script):
   ```javascript
   for(let i = 0; i < 1000; i++) {
     db.collection('complaints').add({
       title: `Test ${i}`,
       status: 'in-progress',
       studentId: 'test-user',
       // ... other fields
     });
   }
   ```

2. Run checkStudentReminders function
3. Monitor:
   - Function execution time (should be <30s)
   - Memory usage
   - Email sending queue

**Expected**: Handles 1000 complaints in <30 seconds

---

## Success Criteria

All of these should pass:

- ✅ Config document created and loaded
- ✅ Test complaint created successfully
- ✅ Warden can update complaint status
- ✅ Email received within 1 min of function run
- ✅ In-app notification appears in bell
- ✅ Notification shows correct complaint details
- ✅ Clicking notification navigates to complaints
- ✅ Viewing complaint de marks reminder as acknowledged
- ✅ No more reminders sent after viewing
- ✅ Max 3 reminders enforced
- ✅ User preferences respected
- ✅ Error logs are clean

---

## Sign-Off Checklist

- [ ] All 10 tests passed
- [ ] No errors in Cloud Functions logs
- [ ] Email templates look professional
- [ ] Notification UI is responsive
- [ ] Dark mode works correctly
- [ ] Mobile experience is good
- [ ] Performance is acceptable
- [ ] Documentation is clear

Once all pass, the system is ready for production! 🎉
