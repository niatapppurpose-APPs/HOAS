import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';
import * as notificationService from '../firebase/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission === 'granted'
      : false
  );

  // Request notification permission and setup FCM token
  useEffect(() => {
    const setupNotifications = async () => {
      if (user && isAdmin) {
        const token = await notificationService.getFCMToken();
        if (token) {
          await notificationService.saveFCMToken(db, user.uid, token);
          setPermissionGranted(true);
        }
      }
    };

    setupNotifications();
  }, [user, isAdmin]);

  // Listen for foreground messages
  useEffect(() => {
    if (!user || !isAdmin) return;

    const unsubscribe = notificationService.onForegroundMessage((payload) => {
      // Add to local notifications list
      const newNotification = {
        id: Date.now().toString(),
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        type: payload.data?.type || 'general',
        createdAt: new Date(),
        read: false,
        data: payload.data
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [user, isAdmin]);

  // Listen to Firestore for pending approvals
  useEffect(() => {
    if (!user || !isAdmin) return;

    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'management'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const userData = change.doc.data();

          // Show notification
          notificationService.showNotification('New Approval Request', {
            body: `${userData.displayName || 'A college'} is requesting approval`,
            tag: `approval-${change.doc.id}`,
            data: {
              type: 'approval',
              userId: change.doc.id,
              url: '/OwnersDashboard'
            }
          });

          // Add to notifications list
          setNotifications(prev => [{
            id: change.doc.id,
            title: 'New Approval Request',
            body: `${userData.displayName || 'A college'} is requesting approval`,
            type: 'approval',
            createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : (userData.createdAt ? new Date(userData.createdAt) : new Date()),
            read: false,
            data: {
              userId: change.doc.id,
              userName: userData.displayName
            }
          }, ...prev]);

          setUnreadCount(prev => prev + 1);
        }
      });
    });

    return unsubscribe;
  }, [user, isAdmin]);

  // Listen to Firestore for support tickets (if collection exists)
  useEffect(() => {
    if (!user || !isAdmin) return;

    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const ticketData = change.doc.data();

          // Show notification
          notificationService.showNotification('New Support Ticket', {
            body: ticketData.subject || 'A new support ticket has been created',
            tag: `ticket-${change.doc.id}`,
            data: {
              type: 'support',
              ticketId: change.doc.id,
              url: '/OwnersDashboard/support-tickets'
            }
          });

          // Add to notifications list
          setNotifications(prev => [{
            id: `ticket-${change.doc.id}`,
            title: 'New Support Ticket',
            body: ticketData.subject || 'A new support ticket has been created',
            type: 'support',
            createdAt: ticketData.createdAt?.toDate ? ticketData.createdAt.toDate() : (ticketData.createdAt ? new Date(ticketData.createdAt) : new Date()),
            read: false,
            data: {
              ticketId: change.doc.id,
              subject: ticketData.subject
            }
          }, ...prev]);

          setUnreadCount(prev => prev + 1);
        }
      });
    }, (error) => {
      // Silently handle if supportTickets collection doesn't exist
      console.debug('Support tickets collection not available:', error.code);
    });

    return unsubscribe;
  }, [user, isAdmin]);

  // Listen to Firestore notifications collection created by backend
  useEffect(() => {
    if (!user || !isAdmin) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notifData = change.doc.data();

          // Show browser notification
          notificationService.showNotification(notifData.title, {
            body: notifData.body,
            tag: change.doc.id,
            data: notifData
          });

          // Add to notifications list
          setNotifications(prev => [{
            id: change.doc.id,
            title: notifData.title,
            body: notifData.body,
            type: notifData.type || 'general',
            createdAt: notifData.timestamp?.toDate() || new Date(),
            read: notifData.read || false,
            data: notifData.data || {}
          }, ...prev]);

          if (!notifData.read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      });
    }, (error) => {
      console.debug('Notifications collection error:', error);
    });

    return unsubscribe;
  }, [user, isAdmin]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );

    setUnreadCount(prev => Math.max(0, prev - 1));

    // Update in Firestore if it exists
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.debug('Error updating notification read status:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);

    // Update all in Firestore
    try {
      const updates = notifications
        .filter(n => !n.read)
        .map(async (notif) => {
          const notifRef = doc(db, 'notifications', notif.id);
          await updateDoc(notifRef, { read: true });
        });
      await Promise.all(updates);
    } catch (error) {
      console.debug('Error marking all as read:', error);
    }
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Request notification permission
  const requestPermission = async () => {
    const granted = await notificationService.requestNotificationPermission();
    if (granted && user && isAdmin) {
      const token = await notificationService.getFCMToken();
      if (token) {
        await notificationService.saveFCMToken(db, user.uid, token);
      }
    }
    setPermissionGranted(granted);
    return granted;
  };

  const value = {
    notifications,
    unreadCount,
    permissionGranted,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
