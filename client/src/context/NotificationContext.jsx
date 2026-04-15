/**
 * Notification Context
 * Manages all notifications across the application using separate listener modules
 */

import { createContext, useContext, useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';
import * as notificationService from '../firebase/notificationService';
import { playSound, resolveNotificationUrl, createNotificationTrigger } from './notificationHelpers';
import * as notificationListeners from './notificationListeners';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, userData, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission === 'granted'
      : false
  );
  const role = userData?.role || null;

  // Create the trigger function
  const playSoundForNotification = () => playSound(userData);
  const triggerNotification = createNotificationTrigger(
    role,
    resolveNotificationUrl,
    playSoundForNotification,
    notificationService
  );

  // Setup all listeners
  notificationListeners.useInitializeNotificationPrefs(user);
  notificationListeners.useSetupFCMToken(user, setPermissionGranted);
  notificationListeners.useForegroundMessageListener(user, userData, playSoundForNotification, setNotifications, setUnreadCount);
  notificationListeners.useFirestoreNotificationsListener(user, userData, triggerNotification, setNotifications, setUnreadCount);

  // Student listeners
  notificationListeners.useStudentComplaintListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);
  notificationListeners.useStudentLeaveListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);
  notificationListeners.useStudentSupportListener(user, role, triggerNotification, setNotifications, setUnreadCount);

  // Warden listeners
  notificationListeners.useWardenComplaintListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);
  notificationListeners.useWardenLeaveListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);
  notificationListeners.useWardenDisputedListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);
  notificationListeners.useWardenStudentListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);

  // Management listeners
  notificationListeners.useManagementComplaintListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);
  notificationListeners.useManagementEscalationListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);
  notificationListeners.useManagementRegistrationListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);
  notificationListeners.useManagementLeaveListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);

  // Shared listeners
  notificationListeners.useAnnouncementListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount);

  // Admin listeners
  notificationListeners.useAdminApprovalListener(user, isAdmin, triggerNotification, setNotifications, setUnreadCount);
  notificationListeners.useAdminSupportListener(user, isAdmin, triggerNotification, setNotifications, setUnreadCount);

  // Notification management functions
  const markAsRead = async (notificationId) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch { }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await Promise.all(
        notifications.filter(n => !n.read).map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      );
    } catch { }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestNotificationPermission();
    if (granted && user) {
      const token = await notificationService.getFCMToken();
      if (token) await notificationService.saveFCMToken(db, user.uid, token);
    }
    setPermissionGranted(granted);
    return granted;
  };

  const playOnce = () => {
    playSoundForNotification();
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      permissionGranted,
      markAsRead,
      markAllAsRead,
      clearAll,
      requestPermission,
      role,
      playSound: playSoundForNotification,
      triggerNotification,
      playOnce,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
