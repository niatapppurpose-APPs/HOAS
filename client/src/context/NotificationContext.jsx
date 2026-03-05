// Sanitize notification strings to prevent XSS
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '');
}
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
  const { user, userData, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission === 'granted'
      : false
  );
  const role = userData?.role || null;

  // â”€â”€â”€ FCM setup for ALL logged-in users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user) return;
    const setup = async () => {
      const token = await notificationService.getFCMToken();
      if (token) {
        await notificationService.saveFCMToken(db, user.uid, token);
        setPermissionGranted(true);
      }
    };
    setup();
  }, [user]);

  // â”€â”€â”€ Foreground FCM messages for ALL users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user) return;
    const unsubscribe = notificationService.onForegroundMessage((payload) => {
      const newNotification = {
        id: Date.now().toString(),
        title: sanitize(payload.notification?.title || 'New Notification'),
        body: sanitize(payload.notification?.body || ''),
        type: sanitize(payload.data?.type || 'general'),
        createdAt: new Date(),
        read: false,
        data: payload.data,
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    return unsubscribe;
  }, [user]);

  // â”€â”€â”€ Firestore notifications collection (ALL users) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          notificationService.showNotification(d.title, { body: d.body, tag: change.doc.id, data: d });
          setNotifications(prev => [{
            id: change.doc.id,
            title: sanitize(d.title),
            body: sanitize(d.body),
            type: sanitize(d.type || 'general'),
            createdAt: d.timestamp?.toDate?.() || new Date(),
            read: d.read || false,
            data: d.data || {},
          }, ...prev]);
          if (!d.read) setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('notifications listener error:', err));
    return unsub;
  }, [user]);

  // â”€â”€â”€ Student: complaint status updates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user || role !== 'student') return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'complaints'),
      where('studentId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const d = change.doc.data();
          const statusLabel = d.status === 'in-progress' ? 'In Progress' : d.status === 'resolved' ? 'Resolved' : d.status;
          const title = `Complaint Updated`;
          const body = `"${d.title}" is now ${statusLabel}`;
          notificationService.showNotification(title, { body, tag: `complaint-${change.doc.id}` });
          setNotifications(prev => [{
            id: `complaint-${change.doc.id}-${Date.now()}`,
            title: sanitize(title),
            body: sanitize(body),
            type: 'complaint',
            createdAt: new Date(),
            read: false,
            data: { complaintId: change.doc.id },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('student complaint listener error:', err));
    return unsub;
  }, [user, role]);

  // â”€â”€â”€ Warden: new complaints in their college â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user || role !== 'warden' || !userData?.managementId) return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'complaints'),
      where('managementId', '==', userData.managementId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const title = `New Complaint`;
          const body = `${d.title} â€” Room ${d.roomNumber || 'N/A'}`;
          notificationService.showNotification(title, { body, tag: `warden-complaint-${change.doc.id}` });
          setNotifications(prev => [{
            id: `warden-complaint-${change.doc.id}`,
            title,
            body,
            type: 'new-complaint',
            createdAt: new Date(),
            read: false,
            data: { complaintId: change.doc.id },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('warden complaint listener error:', err));
    return unsub;
  }, [user, role, userData?.managementId]);

  // ——— Student & Warden: new announcements browser notifications ————————————
  useEffect(() => {
    if (!user || !userData?.managementId) return;
    if (role !== 'student' && role !== 'warden') return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'announcements'),
      where('managementId', '==', userData.managementId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const priorityEmoji = d.priority === 'urgent' ? '🔴' : d.priority === 'important' ? '🟡' : '📢';
          const title = `${priorityEmoji} New Announcement`;
          const body = d.title || 'A new notice has been posted';
          notificationService.showNotification(title, {
            body,
            tag: `announcement-${change.doc.id}`,
          });
          setNotifications(prev => [{
            id: `announcement-${change.doc.id}`,
            title,
            body,
            type: 'announcement',
            createdAt: new Date(),
            read: false,
            data: { announcementId: change.doc.id, priority: d.priority },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('announcements listener error:', err));
    return unsub;
  }, [user, role, userData?.managementId]);

  // ——— Student: leave request status updates ———————————————————————————————
  useEffect(() => {
    if (!user || role !== 'student') return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'leaveRequests'),
      where('studentId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const d = change.doc.data();
          const statusEmoji = d.status === 'approved' ? '✅' : d.status === 'denied' ? '❌' : '📋';
          const title = `${statusEmoji} Leave Request Updated`;
          const body = `Your ${d.leaveType?.replace('_', ' ') || 'leave'} request is now ${d.status}`;
          notificationService.showNotification(title, { body, tag: `leave-${change.doc.id}` });
          setNotifications(prev => [{
            id: `leave-${change.doc.id}-${Date.now()}`,
            title,
            body,
            type: 'leave-update',
            createdAt: new Date(),
            read: false,
            data: { leaveId: change.doc.id, status: d.status },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('leave request listener error:', err));
    return unsub;
  }, [user, role]);

  // ——— Warden: new leave requests from students ————————————————————————————
  useEffect(() => {
    if (!user || role !== 'warden' || !userData?.managementId) return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'leaveRequests'),
      where('managementId', '==', userData.managementId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const title = '📋 New Leave Request';
          const body = `${d.studentName || 'A student'} — ${d.leaveType?.replace('_', ' ') || 'Leave'} (Room ${d.roomNumber || 'N/A'})`;
          notificationService.showNotification(title, { body, tag: `warden-leave-${change.doc.id}` });
          setNotifications(prev => [{
            id: `warden-leave-${change.doc.id}`,
            title,
            body,
            type: 'new-leave-request',
            createdAt: new Date(),
            read: false,
            data: { leaveId: change.doc.id },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('warden leave request listener error:', err));
    return unsub;
  }, [user, role, userData?.managementId]);

  // â”€â”€â”€ Management: new warden added or student complaints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user || role !== 'management' || !userData?.managementId) return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'complaints'),
      where('managementId', '==', userData.managementId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const title = `New Complaint Filed`;
          const body = `${d.title} â€” by ${d.studentName || 'Student'}`;
          notificationService.showNotification(title, { body, tag: `mgmt-complaint-${change.doc.id}` });
          setNotifications(prev => [{
            id: `mgmt-complaint-${change.doc.id}`,
            title,
            body,
            type: 'new-complaint',
            createdAt: new Date(),
            read: false,
            data: { complaintId: change.doc.id },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('management complaint listener error:', err));
    return unsub;
  }, [user, role, userData?.managementId]);

  // â”€â”€â”€ Admin only: pending management approvals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user || !isAdmin) return;
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'management'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          notificationService.showNotification('New Approval Request', {
            body: `${d.displayName || 'A college'} is requesting approval`,
            tag: `approval-${change.doc.id}`,
          });
          setNotifications(prev => [{
            id: change.doc.id,
            title: 'New Approval Request',
            body: `${d.displayName || 'A college'} is requesting approval`,
            type: 'approval',
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
            read: false,
            data: { userId: change.doc.id, userName: d.displayName },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    });
    return unsub;
  }, [user, isAdmin]);

  // â”€â”€â”€ Admin only: support tickets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user || !isAdmin) return;
    const q = query(
      collection(db, 'supportTickets'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          notificationService.showNotification('New Support Ticket', {
            body: d.subject || 'A new support ticket has been created',
            tag: `ticket-${change.doc.id}`,
          });
          setNotifications(prev => [{
            id: `ticket-${change.doc.id}`,
            title: 'New Support Ticket',
            body: d.subject || 'A new support ticket has been created',
            type: 'support',
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
            read: false,
            data: { ticketId: change.doc.id, subject: d.subject },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('Support tickets collection not available:', err.code));
    return unsub;
  }, [user, isAdmin]);

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const markAsRead = async (notificationId) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try { await updateDoc(doc(db, 'notifications', notificationId), { read: true }); } catch { }
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

  const clearAll = () => { setNotifications([]); setUnreadCount(0); };

  const requestPermission = async () => {
    const granted = await notificationService.requestNotificationPermission();
    if (granted && user) {
      const token = await notificationService.getFCMToken();
      if (token) await notificationService.saveFCMToken(db, user.uid, token);
    }
    setPermissionGranted(granted);
    return granted;
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, permissionGranted, markAsRead, markAllAsRead, clearAll, requestPermission, role }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
