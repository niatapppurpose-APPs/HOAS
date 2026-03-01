# Real-time Notifications Setup Guide

## Overview
The notification system provides real-time browser notifications for:
- New approval requests (pending colleges)
- New support tickets
- Other important events

Notifications work even when the browser/app is closed using Firebase Cloud Messaging (FCM).

---

## Setup Instructions

### 1. Get Firebase Web Push VAPID Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the ⚙️ Settings icon → **Project Settings**
4. Go to the **Cloud Messaging** tab
5. Scroll down to **Web configuration**
6. Under **Web Push certificates**, click **Generate key pair** (if not already generated)
7. Copy the **Key pair** value

### 2. Add VAPID Key to Environment Variables

Add this to your `.env` file:

```env
# Firebase Cloud Messaging
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

### 3. Update notificationService.js

Open `client/src/firebase/notificationService.js` and replace line 7:

```javascript
// FROM:
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';

// TO:
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
```

### 4. Verify Service Worker Configuration

The service worker is already configured in `client/public/firebase-messaging-sw.js` and uses your environment variables.

### 5. Install Firebase Messaging Package

If not already installed, run:

```bash
cd client
npm install firebase
```

### 6. Restart Your Dev Server

```bash
npm run dev
```

---

## How It Works

### 1. **Notification Bell**
- Located in the Owner Dashboard header (next to theme toggle)
- Shows unread count badge
- Displays all notifications in a dropdown panel

### 2. **Real-time Listeners**
The system automatically listens for:

- **Pending Approvals**: When a new college registers and needs approval
- **Support Tickets**: When new tickets are created (if collection exists)

### 3. **Browser Notifications**
- **Foreground**: Shows notifications when app is open
- **Background**: Shows notifications even when browser is closed (requires permission)

### 4. **Permission Flow**
- First time users see a banner asking to enable notifications
- Click "Enable" to request browser notification permission
- FCM token is automatically saved to user's Firestore document

---

## Testing Notifications

### Test Approval Notifications:
1. Open Owner Dashboard
2. Have another user register a new college account
3. You should see:
   - Browser notification popup
   - Red badge on notification bell
   - Notification in dropdown panel

### Test Permission Request:
1. Click the notification bell
2. If permission not granted, you'll see a blue banner at the top
3. Click "Enable" to request permission
4. Accept the browser permission prompt

### Test Notification Panel:
1. Click the notification bell icon
2. View all notifications
3. Click a notification to navigate to relevant page
4. Use "Mark all as read" or "Clear all" buttons

---

## Firestore Data Structure

### User Document (for FCM tokens):
```javascript
{
  uid: "user123",
  fcmTokens: ["token1", "token2"],  // Array of device tokens
  lastTokenUpdate: Timestamp
}
```

### Support Tickets Collection (optional):
```javascript
{
  status: "open",              // Required for notifications
  subject: "Ticket subject",
  createdAt: Timestamp,
  // ... other fields
}
```

---

## Customization

### Add More Notification Types:

Edit `client/src/context/NotificationContext.jsx` and add new listeners:

```javascript
useEffect(() => {
  if (!user || !isAdmin) return;

  const customQuery = query(
    collection(db, 'yourCollection'),
    where('someField', '==', 'someValue')
  );

  const unsubscribe = onSnapshot(customQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        notificationService.showNotification('Title', {
          body: 'Message',
          tag: 'custom-type'
        });
      }
    });
  });

  return unsubscribe;
}, [user, isAdmin]);
```

### Customize Notification Icons:

Edit `client/src/components/OwnerServices/NotificationBell.jsx`:

```javascript
const getNotificationIcon = (type) => {
  switch (type) {
    case 'approval':
      return <Clock className="w-5 h-5 text-orange-400" />;
    case 'support':
      return <Ticket className="w-5 h-5 text-blue-400" />;
    case 'custom':
      return <YourIcon className="w-5 h-5 text-color" />;
    default:
      return <Bell className="w-5 h-5 text-indigo-400" />;
  }
};
```

---

## Troubleshooting

### Notifications not showing:
1. Check browser console for errors
2. Verify VAPID key is correct
3. Ensure you granted notification permission
4. Check if service worker is registered (DevTools → Application → Service Workers)

### Permission denied:
1. Click lock icon in browser address bar
2. Reset notification permission
3. Refresh page and try again

### Service worker not loading:
1. Clear browser cache
2. Unregister old service workers (DevTools → Application → Service Workers)
3. Restart dev server

---

## Browser Support

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari (macOS 16.4+): Full support
- ❌ iOS Safari: Limited (no background notifications)

---

## Security Notes

- FCM tokens are stored in Firestore user documents
- Service worker only shows notifications for authenticated admin users
- Tokens are automatically refreshed by Firebase
- Old/invalid tokens are handled gracefully

---

## Backend Cloud Functions Setup

The notification system uses Firebase Cloud Functions to automatically send notifications when events occur. These functions have been created in `server/functions/src/notifications.js`.

### Automated Notifications

The backend automatically sends notifications for:

1. **New College Approval Requests** - When a new college is created with pending status
2. **New Support Tickets** - When a new support ticket is created
3. **Urgent Support Tickets** - When a ticket priority is changed to "urgent"
4. **New Warden Registrations** - When a warden registers and needs approval

### Deploy Backend Functions

1. **Navigate to server directory:**
   ```powershell
   cd server
   ```

2. **Deploy all functions to Firebase:**
   ```powershell
   firebase deploy --only functions
   ```

   Or deploy specific notification functions:
   ```powershell
   firebase deploy --only functions:onNewCollegeApproval,functions:onNewSupportTicket,functions:onSupportTicketUpdate,functions:onNewWardenRegistration
   ```

3. **Verify deployment:**
   - Check Firebase Console → Functions
   - You should see:
     - `onNewCollegeApproval`
     - `onNewSupportTicket`
     - `onSupportTicketUpdate`
     - `onNewWardenRegistration`

### Test Backend Functions

1. **Test with Emulator (Recommended):**
   ```powershell
   cd server
   firebase emulators:start
   ```
   
   Then create a test college or support ticket to trigger notifications.

2. **Test in Production:**
   - Have a user register a new college
   - Create a support ticket
   - Check if owners receive browser notifications

### Cloud Functions Architecture

```
Event Occurs (Firestore)
       ↓
Cloud Function Triggered
       ↓
Get all owner FCM tokens
       ↓
Send push notifications
       ↓
Store in notifications collection
       ↓
Frontend receives & displays
```

### Firestore Collections Used

1. **users** - Stores user data including `fcmToken` field
2. **notifications** - Stores notification history for each user
3. **ManagementData** - Triggers on new college creation
4. **supportTickets** - Triggers on ticket creation/update

### Monitoring Notifications

1. **Check Function Logs:**
   ```powershell
   firebase functions:log
   ```

2. **View in Firebase Console:**
   - Go to Functions → Logs
   - Filter by function name
   - Check for errors or successful sends

3. **Firestore Console:**
   - Check `notifications` collection
   - Verify new documents are created
   - Check `userId` field matches owner

### Customizing Notifications

Edit `server/functions/src/notifications.js` to:
- Add new event triggers
- Customize notification messages
- Add notification icons/images
- Change notification priority

Example - Add notification for new student registration:
```javascript
export const onNewStudentRegistration = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data.data();
  
  if (userData.role === 'student') {
    await sendNotificationToOwners(
      '👨‍🎓 New Student Registration',
      `${userData.name} has joined ${userData.collegeName}`,
      { type: 'student', userId: event.params.userId }
    );
  }
});
```

---

## Next Steps

1. ✅ Set up your VAPID key
2. ✅ Deploy backend Cloud Functions
3. ✅ Test with emulator first
4. ✅ Test with a new college registration
5. ✅ Customize notification types as needed
6. Consider adding email notifications for critical events

For more information, see [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging).

