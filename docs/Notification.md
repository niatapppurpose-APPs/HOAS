# Real-time Notification System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Implementation Guide](#implementation-guide)
5. [Frontend Components](#frontend-components)
6. [Backend Integration](#backend-integration)
7. [Notification Types](#notification-types)
8. [Best Practices](#best-practices)

---

## Overview

The HOAS Real-time Notification System provides instant updates to users about important events, approvals, requests, and system activities. Built on Firebase Cloud Messaging (FCM) and Firestore real-time listeners, this system ensures users stay informed with minimal latency.

### Key Capabilities
- **Real-time Updates**: Instant notification delivery using Firebase listeners
- **Custom Branding**: Notifications include app logo and branding
- **Audio Alerts**: Customizable notification sounds
- **Interactive**: Click notifications to navigate directly to relevant pages
- **Visual Indicators**: Animated bell icon with unread count badge
- **Notification Center**: Dedicated page for viewing all notifications
- **Multi-platform Support**: Works across web, mobile, and desktop

---

## Features

### 1. **Bell Icon with Notification Badge**
- Animated bell icon in the header/navbar
- Real-time unread count displayed as a badge
- Ringing animation when new notifications arrive
- Click to open notification dropdown or navigate to notification page

### 2. **Custom Notification Sound**
- Plays a distinctive sound when notifications arrive
- User preference settings for sound on/off
- Different sounds for different notification types (optional)

### 3. **App Logo in Notifications**
- HOAS logo displayed in browser notifications
- Consistent branding across all notification types
- Custom icons for different notification categories

### 4. **Real-time Notification Page**
- Dedicated page showing all notifications
- Real-time updates without page refresh
- Mark as read/unread functionality
- Filter by notification type
- Delete notifications option
- Infinite scroll or pagination

### 5. **Click-to-Navigate**
- Clicking a notification redirects to the relevant page
- Deep linking to specific resources (e.g., complaint details, approval requests)
- Smart routing based on user role and notification context

### 6. **Notification Categories**
- Student Complaints
- Room Allotments
- Fee Payments
- Approval Requests (Warden/Principal)
- System Announcements
- Maintenance Updates
- Emergency Alerts

---

## Architecture

### System Flow

```
┌─────────────────┐
│  Trigger Event  │
│ (New complaint, │
│  approval, etc) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cloud Function  │
│ (Backend Logic) │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│   Firestore     │ │     FCM      │ │  Email/SMS   │
│  /notifications │ │ Push Notify  │ │  (Optional)  │
└────────┬────────┘ └──────────────┘ └──────────────┘
         │
         ▼
┌─────────────────┐
│ Real-time       │
│ Listener        │
│ (Frontend)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UI Update       │
│ - Bell Badge    │
│ - Sound Alert   │
│ - Toast/Banner  │
└─────────────────┘
```

### Database Structure

**Firestore Collection: `/notifications`**

```javascript
{
  id: "notification_123",
  userId: "user_abc",
  title: "New Complaint Assigned",
  body: "Complaint #456 has been assigned to you",
  type: "complaint_assigned", // complaint, approval, announcement, etc.
  icon: "complaint", // Maps to icon/logo
  imageUrl: "https://your-app.com/logo.png",
  clickAction: "/complaints/456", // Redirect URL
  data: {
    complaintId: "456",
    priority: "high"
  },
  read: false,
  createdAt: Firebase.Timestamp,
  expiresAt: Firebase.Timestamp (optional)
}
```

---

## Implementation Guide

### 1. Firebase Setup

#### Enable Firebase Cloud Messaging
1. Go to Firebase Console → Project Settings
2. Navigate to Cloud Messaging tab
3. Generate Web Push certificates (VAPID keys)
4. Save the keys in your environment variables

#### Firestore Security Rules
```javascript
// /firestore.rules
match /notifications/{notificationId} {
  allow read: if request.auth != null && 
              resource.data.userId == request.auth.uid;
  
  allow write: if false; // Only backend can write
  
  allow update: if request.auth != null && 
                resource.data.userId == request.auth.uid &&
                request.resource.data.diff(resource.data).affectedKeys()
                  .hasOnly(['read']);
}
```

---

### 2. Frontend Components

#### A. Notification Bell Icon Component

**File: `client/src/components/NotificationBell/NotificationBell.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import './NotificationBell.css';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRinging, setIsRinging] = useState(false);
  const navigate = useNavigate();
  const [notificationSound] = useState(new Audio('/notification-sound.mp3'));

  useEffect(() => {
    if (!auth.currentUser) return;

    // Real-time listener for unread notifications
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const previousCount = unreadCount;
      const currentCount = snapshot.docs.length;
      
      setUnreadCount(currentCount);

      // Play sound and animate if new notification arrived
      if (currentCount > previousCount) {
        playNotificationSound();
        triggerRingingAnimation();
      }
    });

    return () => unsubscribe();
  }, []);

  const playNotificationSound = () => {
    notificationSound.play().catch(err => {
      console.log('Sound play failed:', err);
    });
  };

  const triggerRingingAnimation = () => {
    setIsRinging(true);
    setTimeout(() => setIsRinging(false), 1000);
  };

  const handleBellClick = () => {
    navigate('/notifications');
  };

  return (
    <div className="notification-bell-container" onClick={handleBellClick}>
      <Bell 
        className={`bell-icon ${isRinging ? 'ringing' : ''}`} 
        size={24} 
      />
      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
```

**File: `client/src/components/NotificationBell/NotificationBell.css`**

```css
.notification-bell-container {
  position: relative;
  cursor: pointer;
  padding: 8px;
  transition: all 0.3s ease;
}

.notification-bell-container:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
}

.bell-icon {
  color: #333;
  transition: color 0.3s ease;
}

.notification-bell-container:hover .bell-icon {
  color: #007bff;
}

/* Ringing Animation */
.bell-icon.ringing {
  animation: ring 0.5s ease-in-out;
  color: #ff6b6b;
}

@keyframes ring {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  30% { transform: rotate(10deg); }
  40% { transform: rotate(-10deg); }
  50% { transform: rotate(5deg); }
  60% { transform: rotate(-5deg); }
  70% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}

/* Notification Badge */
.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
```

---

#### B. Notification Page Component

**File: `client/src/Pages/NotificationPage/NotificationPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle, 
  Circle, 
  Trash2, 
  Filter,
  AlertCircle,
  FileText,
  Users,
  DollarSign,
  Settings
} from 'lucide-react';
import './NotificationPage.css';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Icon mapping for different notification types
  const iconMap = {
    complaint: AlertCircle,
    approval: CheckCircle,
    announcement: Bell,
    document: FileText,
    user: Users,
    payment: DollarSign,
    system: Settings,
  };

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      const notifRef = doc(db, 'notifications', notification.id);
      await updateDoc(notifRef, { read: true });
    }

    // Navigate to the target page
    if (notification.clickAction) {
      navigate(notification.clickAction);
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this notification?')) {
      await deleteDoc(doc(db, 'notifications', notificationId));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    await Promise.all(
      unreadNotifs.map(n => 
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      )
    );
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="notification-loading">Loading notifications...</div>;
  }

  return (
    <div className="notification-page">
      <div className="notification-header">
        <h1>
          <Bell size={32} />
          Notifications
        </h1>
        <div className="notification-actions">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button 
            onClick={handleMarkAllAsRead}
            className="mark-all-btn"
            disabled={!notifications.some(n => !n.read)}
          >
            Mark All as Read
          </button>
        </div>
      </div>

      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications">
            <Bell size={64} color="#ccc" />
            <p>No notifications</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const IconComponent = iconMap[notification.icon] || Bell;
            return (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {notification.imageUrl ? (
                    <img src={notification.imageUrl} alt="Notification" />
                  ) : (
                    <IconComponent size={24} />
                  )}
                </div>
                
                <div className="notification-content">
                  <h3>{notification.title}</h3>
                  <p>{notification.body}</p>
                  <span className="notification-time">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>

                <div className="notification-actions-btn">
                  {!notification.read && (
                    <button
                      className="action-btn"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      title="Mark as read"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={(e) => handleDelete(notification.id, e)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {!notification.read && <div className="unread-indicator" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
```

**File: `client/src/Pages/NotificationPage/NotificationPage.css`**

```css
.notification-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.notification-header h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  color: #333;
}

.notification-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: white;
}

.mark-all-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.mark-all-btn:hover:not(:disabled) {
  background: #0056b3;
}

.mark-all-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.notification-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.notification-item.unread {
  background: #f0f8ff;
  border-left: 4px solid #007bff;
}

.notification-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-icon img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.notification-content {
  flex: 1;
}

.notification-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.notification-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-actions-btn {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f0f0f0;
}

.delete-btn:hover {
  background: #ffe0e0;
  color: #ff4444;
}

.unread-indicator {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #007bff;
  border-radius: 50%;
}

.no-notifications {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.no-notifications p {
  margin-top: 16px;
  font-size: 16px;
}

.notification-loading {
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #666;
}

/* Responsive Design */
@media (max-width: 768px) {
  .notification-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .notification-actions {
    width: 100%;
    justify-content: space-between;
  }

  .notification-item {
    padding: 12px;
  }

  .notification-icon {
    width: 40px;
    height: 40px;
  }
}
```

---

#### C. Browser Push Notifications

**File: `client/src/utils/notificationService.js`**

```javascript
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase/firebaseConfig';

const messaging = getMessaging(app);

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      console.log('FCM Token:', token);
      // Send this token to your backend to store in user's profile
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Foreground notification received:', payload);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/logo.png', // Your app logo
          badge: '/badge-icon.png',
          tag: payload.data?.notificationId,
          data: payload.data,
          requireInteraction: false,
        });
      }
      
      resolve(payload);
    });
  });

// Play custom notification sound
export const playNotificationSound = () => {
  const audio = new Audio('/notification-sound.mp3');
  audio.play().catch(err => console.log('Sound play error:', err));
};
```

**File: `client/public/firebase-messaging-sw.js`**

```javascript
// Service Worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background notification received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    badge: '/badge-icon.png',
    data: payload.data,
    tag: payload.data?.notificationId,
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.clickAction || '/';
  
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
```

---

### 3. Backend Integration

#### Cloud Function to Send Notifications

**File: `server/functions/src/notifications.js`**

```javascript
const admin = require('firebase-admin');
const functions = require('firebase-functions');

/**
 * Create a notification in Firestore and optionally send FCM push
 * @param {string} userId - Target user ID
 * @param {object} notificationData - Notification details
 */
const createNotification = async (userId, notificationData) => {
  const db = admin.firestore();
  
  const notification = {
    userId,
    title: notificationData.title,
    body: notificationData.body,
    type: notificationData.type || 'general',
    icon: notificationData.icon || 'bell',
    imageUrl: notificationData.imageUrl || null,
    clickAction: notificationData.clickAction || '/',
    data: notificationData.data || {},
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Add to Firestore
  const notifRef = await db.collection('notifications').add(notification);

  // Send FCM push notification if user has FCM token
  const userDoc = await db.collection('users').doc(userId).get();
  const fcmToken = userDoc.data()?.fcmToken;

  if (fcmToken) {
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          notificationId: notifRef.id,
          clickAction: notification.clickAction,
          ...notification.data,
        },
        webpush: {
          notification: {
            icon: '/logo.png',
            badge: '/badge-icon.png',
            vibrate: [200, 100, 200],
            requireInteraction: false,
          },
          fcmOptions: {
            link: notification.clickAction,
          },
        },
      });
    } catch (error) {
      console.error('FCM send error:', error);
    }
  }

  return notifRef.id;
};

/**
 * Trigger notification when a new complaint is created
 */
exports.onComplaintCreated = functions.firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snap, context) => {
    const complaint = snap.data();
    const complaintId = context.params.complaintId;

    // Notify warden
    if (complaint.wardenId) {
      await createNotification(complaint.wardenId, {
        title: 'New Complaint Received',
        body: `${complaint.studentName} submitted a complaint: ${complaint.title}`,
        type: 'complaint',
        icon: 'complaint',
        clickAction: `/complaints/${complaintId}`,
        data: { complaintId, priority: complaint.priority },
      });
    }

    return null;
  });

/**
 * Trigger notification when complaint status changes
 */
exports.onComplaintStatusUpdated = functions.firestore
  .document('complaints/{complaintId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const complaintId = context.params.complaintId;

    // Check if status changed
    if (before.status !== after.status) {
      // Notify student
      await createNotification(after.studentId, {
        title: 'Complaint Status Updated',
        body: `Your complaint "${after.title}" is now ${after.status}`,
        type: 'complaint',
        icon: 'complaint',
        clickAction: `/complaints/${complaintId}`,
        data: { complaintId, status: after.status },
      });
    }

    return null;
  });

/**
 * Trigger notification for approval requests
 */
exports.notifyApprovalRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { targetUserId, approvalType, itemId, itemTitle } = data;

  await createNotification(targetUserId, {
    title: 'Approval Required',
    body: `${approvalType} requires your approval: ${itemTitle}`,
    type: 'approval',
    icon: 'approval',
    clickAction: `/approvals/${itemId}`,
    data: { approvalType, itemId },
  });

  return { success: true };
});

/**
 * Send announcement to multiple users
 */
exports.sendAnnouncement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userIds, title, body, clickAction } = data;

  const notifications = userIds.map(userId =>
    createNotification(userId, {
      title,
      body,
      type: 'announcement',
      icon: 'announcement',
      clickAction: clickAction || '/announcements',
    })
  );

  await Promise.all(notifications);

  return { success: true, count: userIds.length };
});

/**
 * Clean up old notifications (run daily)
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('0 2 * * *') // Run at 2 AM daily
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotifs = await db.collection('notifications')
      .where('createdAt', '<', thirtyDaysAgo)
      .where('read', '==', true)
      .get();

    const batch = db.batch();
    oldNotifs.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    
    console.log(`Deleted ${oldNotifs.size} old notifications`);
    return null;
  });

module.exports = {
  createNotification,
};
```

---

### 4. Integration with Header Component

**File: `client/src/components/OwnerServices/header.jsx` (Update)**

```jsx
import NotificationBell from '../NotificationBell/NotificationBell';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-logo">
        <img src="/logo.png" alt="HOAS" />
        <h1>HOAS</h1>
      </div>
      
      <div className="header-actions">
        {/* Add the notification bell */}
        <NotificationBell />
        
        {/* Other header items */}
        <UserAvatar />
      </div>
    </header>
  );
};

export default Header;
```

---

### 5. Route Configuration

**File: `client/src/components/Routes/index.jsx` (Add notification route)**

```jsx
import NotificationPage from '../../Pages/NotificationPage/NotificationPage';

// Add this route
<Route path="/notifications" element={<NotificationPage />} />
```

---

## Notification Types

### 1. Student Notifications
- **Complaint Status Updates**: When complaint status changes
- **Room Allotment**: Room assignment confirmations
- **Fee Reminders**: Payment due notifications
- **Mess Menu Updates**: Weekly menu changes
- **Event Announcements**: Campus events

### 2. Warden Notifications
- **New Complaints**: When students submit complaints
- **Urgent Issues**: High-priority complaints
- **Approval Requests**: Room change requests
- **Maintenance Alerts**: Facility issues

### 3. Principal Notifications
- **Approval Requests**: Budget approvals, policy changes
- **Reports Ready**: Monthly/annual reports
- **Critical Issues**: Escalated complaints
- **System Alerts**: Important system events

---

## Best Practices

### 1. **User Experience**
- ✅ Keep notification titles concise (under 50 characters)
- ✅ Provide clear, actionable body text
- ✅ Include relevant context in notification data
- ✅ Implement proper error handling for permission denials
- ✅ Allow users to customize notification preferences

### 2. **Performance**
- ✅ Use Firestore listeners efficiently (unsubscribe on unmount)
- ✅ Implement pagination for notification list
- ✅ Clean up old notifications regularly
- ✅ Optimize image sizes for notification icons

### 3. **Security**
- ✅ Validate user permissions before sending notifications
- ✅ Sanitize notification content to prevent XSS
- ✅ Implement proper Firestore security rules
- ✅ Store FCM tokens securely

### 4. **Accessibility**
- ✅ Provide visual and audio indicators
- ✅ Support keyboard navigation
- ✅ Use ARIA labels for screen readers
- ✅ Ensure proper color contrast

### 5. **Testing**
- ✅ Test notification delivery in different browsers
- ✅ Verify notifications work in background/foreground
- ✅ Test notification click actions
- ✅ Verify real-time updates work correctly

---

## Environment Configuration

**File: `client/.env`**

```env
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

---

## Deployment Checklist

- [ ] Enable Firebase Cloud Messaging in Firebase Console
- [ ] Generate and configure VAPID keys
- [ ] Upload service worker to public directory
- [ ] Configure Firestore security rules
- [ ] Deploy Cloud Functions
- [ ] Test notifications on production domain
- [ ] Add app logo and custom sounds to public folder
- [ ] Set up notification cleanup scheduled function
- [ ] Configure notification preferences in user settings
- [ ] Test on multiple devices and browsers

---

## Troubleshooting

### Notifications Not Appearing
1. Check browser notification permissions
2. Verify FCM token is saved in user profile
3. Check Firestore security rules
4. Review browser console for errors
5. Ensure service worker is registered

### Sound Not Playing
1. Check browser autoplay policies
2. Verify audio file path is correct
3. User must interact with page first (click/tap)
4. Check audio file format compatibility

### Real-time Updates Not Working
1. Verify Firestore listener is active
2. Check network connectivity
3. Ensure proper authentication
4. Review Firestore security rules

---

## Future Enhancements

- [ ] Push notifications for mobile apps (React Native)
- [ ] Email fallback for critical notifications
- [ ] SMS notifications for emergencies
- [ ] Notification grouping by category
- [ ] Rich media notifications (images, actions)
- [ ] Notification scheduling
- [ ] User notification preferences page
- [ ] Notification analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode for notification UI

---

## Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Maintained By:** HOAS Development Team
