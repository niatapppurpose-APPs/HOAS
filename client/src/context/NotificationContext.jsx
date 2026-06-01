// Sanitize notification strings to prevent XSS
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/on\w+="[^"]*"/gi, '') // Remove onEvent="..."
    .replace(/on\w+='[^']*'/gi, '') // Remove onEvent='...'
    .replace(/javascript:/gi, '') // Remove javascript: URIs
    .replace(/expression\(/gi, ''); // Remove CSS expressions
}
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';
import * as notificationService from '../firebase/notificationService';
import { initializeNotificationPrefs } from '../utils/notificationPrefsManager';

const NotificationContext = createContext();
let notificationAudio = null;

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

  // Play custom WAV sound only for browser notifications.
  const playSound = () => {
    const soundEnabled = userData?.notifPrefs?.soundAlerts ?? true;
    if (!soundEnabled) return;

    try {
      if (typeof window === 'undefined') return;
 
      if (!notificationAudio) {
        notificationAudio = new Audio('/mixkit-positive-notification-951.wav');
        notificationAudio.preload = 'auto';
      }

      notificationAudio.currentTime = 0;
      notificationAudio.play().catch((error) => {
        console.debug('notification sound blocked by browser:', error);
      });
    } catch (e) {
      console.warn('notification sound failed', e);
    }
  };

  const resolveNotificationUrl = (userRole, notificationType = '', notificationTag = '') => {
    const roleKey = String(userRole || '').toLowerCase();
    const typeKey = String(notificationType || '').toLowerCase();
    const tagKey = String(notificationTag || '').toLowerCase();
    const key = `${typeKey} ${tagKey}`;

    if (roleKey === 'student') {
      if (key.includes('announcement')) return '/dashboard/student/announcements';
      if (key.includes('leave')) return '/dashboard/student/leave';
      if (key.includes('support')) return '/dashboard/student/help';
      if (key.includes('complaint') || key.includes('ticket')) return '/dashboard/student/complaints';
      return '/dashboard/student';
    }

    if (roleKey === 'warden') {
      if (key.includes('announcement')) return '/dashboard/warden/announcements';
      if (key.includes('leave')) return '/dashboard/warden/leave-requests';
      if (key.includes('support')) return '/dashboard/warden/help';
      if (key.includes('complaint') || key.includes('ticket')) return '/dashboard/warden/complaints';
      return '/dashboard/warden';
    }

    if (roleKey === 'management') {
      if (key.includes('complaint') || key.includes('ticket')) return '/dashboard/management/complaints';
      return '/dashboard/management';
    }

    if (roleKey === 'owner' || roleKey === 'admin') {
      if (key.includes('support')) return '/OwnersDashboard/support-tickets';
      return '/OwnersDashboard';
    }

    return '/dashboard';
  };

  // wrapper used throughout the context so that every notification uses
  // the shared playing logic and respects the sound preference.
  const triggerNotification = (title, options) => {
    const typeFromOptions = options?.data?.type || options?.type || '';
    const targetUrl = options?.data?.url || resolveNotificationUrl(role, typeFromOptions, options?.tag);
    const enrichedOptions = {
      ...options,
      data: {
        ...(options?.data || {}),
        role,
        type: typeFromOptions,
        url: targetUrl,
      },
    };

    const notification = notificationService.showNotification(title, enrichedOptions);
    // Play sound only when the browser notification is actually shown.
    if (notification) {
      playSound();
    }
  };
 useEffect(() => {
    if (!user) return;
    // Ensure user has notification preferences initialized
    initializeNotificationPrefs(user.uid).catch(err =>
      console.warn('Could not initialize notification preferences:', err)
    );
  }, [user?.uid]);

 useEffect(() => {
    if (!user) return;
    const setup = async () => {
      // Always try to get FCM token - this will request permission if needed
      const token = await notificationService.getFCMToken();
      if (token) {
        await notificationService.saveFCMToken(db, user.uid, token);
        setPermissionGranted(true);
      } else {
        // Permission may have been denied, but we'll still work with Firestore notifications
        setPermissionGranted(Notification.permission === 'granted');
      }
    };
    setup();
  }, [user]);

 useEffect(() => {
    if (!user) return;
    const unsubscribe = notificationService.onForegroundMessage((payload) => {
      const prefs = userData?.notifPrefs || {};
      if (prefs.systemAlerts === false) {
        // drop all generic/system messages
        return;
      }

      // Foreground FCM path shows browser notification internally when granted.
      if (Notification.permission === 'granted' && payload?.notification) {
        playSound();
      }

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
  }, [user, userData?.notifPrefs]);
 useEffect(() => {
    if (!user) return;
    const prefs = userData?.notifPrefs || {};
    // Default to TRUE if system alerts preference is not set (opt-out model)
    const systemAlertsEnabled = prefs.systemAlerts !== false;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          if (!systemAlertsEnabled) return; // ignore only if explicitly disabled
          const d = change.doc.data();
          triggerNotification(d.title, { body: d.body, tag: change.doc.id, data: d });
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
  }, [user, userData?.notifPrefs]);

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
      const prefs = userData?.notifPrefs || {};
      if (!prefs.complaints) return; // student opted out of complaint updates
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const d = change.doc.data();
          const statusLabel = d.status === 'in-progress' ? 'In Progress' : d.status === 'resolved' ? 'Resolved' : d.status;
          const title = `Complaint Updated`;
          const body = `"${d.title}" is now ${statusLabel}`;
          triggerNotification(title, { body, tag: `complaint-${change.doc.id}` });
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
  }, [user, role, userData?.notifPrefs]);

   useEffect(() => {
    if (!user || role !== 'warden' || !userData?.managementId) return;
    const isInitial = { v: true };
    const prefs = userData?.notifPrefs || {};
    const q = query(
      collection(db, 'complaints'),
      where('managementId', '==', userData.managementId),
      where('status', '==', 'pending'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      if (!prefs.newComplaints) return; // warden opted out of new complaint alerts
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const title = `New Complaint`;
          const body = `${d.title} â€” Room ${d.roomNumber || 'N/A'}`;
          triggerNotification(title, { body, tag: `warden-complaint-${change.doc.id}` });
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
  }, [user, role, userData?.managementId, userData?.notifPrefs]);

  // ——— Student & Warden: new announcements browser notifications ————————————
  useEffect(() => {
    if (!user || !userData?.managementId) return;
    if (role !== 'student' && role !== 'warden') return;
    const isInitial = { v: true };
    const prefs = userData?.notifPrefs || {};
    // Default to TRUE if announcements preference is not set (opt-out model)
    const announcementsEnabled = prefs.announcements !== false;
    const q = query(
      collection(db, 'announcements'),
      where('managementId', '==', userData.managementId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      if (!announcementsEnabled) return; // skip announcements only if explicitly disabled
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const priorityEmoji = d.priority === 'urgent' ? '🔴' : d.priority === 'important' ? '🟡' : '📢';
          const title = `${priorityEmoji} New Announcement`;
          const body = d.title || 'A new notice has been posted';
          triggerNotification(title, {
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
  }, [user, role, userData?.managementId, userData?.notifPrefs]);

  // ——— Student: leave request status updates ———————————————————————————————
  useEffect(() => {
    if (!user || role !== 'student') return;
    const isInitial = { v: true };
    const prefs = userData?.notifPrefs || {};
    const q = query(
      collection(db, 'leaveRequests'),
      where('studentId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      if (!prefs.leaveUpdates) return; // student disabled leave updates
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const d = change.doc.data();
          const statusEmoji = d.status === 'approved' ? '✅' : d.status === 'denied' ? '❌' : '📋';
          const title = `${statusEmoji} Leave Request Updated`;
          const body = `Your ${d.leaveType?.replace('_', ' ') || 'leave'} request is now ${d.status}`;
          triggerNotification(title, { body, tag: `leave-${change.doc.id}` });
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
  }, [user, role, userData?.notifPrefs]);

  // ——— Warden: new leave requests from students ————————————————————————————
  useEffect(() => {
    if (!user || role !== 'warden' || !userData?.managementId) return;
    const isInitial = { v: true };
    const prefs = userData?.notifPrefs || {};
    const q = query(
      collection(db, 'leaveRequests'),
      where('managementId', '==', userData.managementId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      if (!prefs.leaveRequests) return; // warden disabled leave request alerts
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const title = '📋 New Leave Request';
          const body = `${d.studentName || 'A student'} — ${d.leaveType?.replace('_', ' ') || 'Leave'} (Room ${d.roomNumber || 'N/A'})`;
          triggerNotification(title, { body, tag: `warden-leave-${change.doc.id}` });
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
  }, [user, role, userData?.managementId, userData?.notifPrefs]);

  // â”€â”€â”€ Management: new warden added or student complaints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user || role !== 'management' || !userData?.managementId) return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'complaints'),
      where('managementId', '==', userData.managementId),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const title = `New Complaint Filed`;
          const body = `${d.title} â€” by ${d.studentName || 'Student'}`;
          triggerNotification(title, { body, tag: `mgmt-complaint-${change.doc.id}` });
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

  // ——— Management: escalated & disputed complaints ——————————————————————————
  useEffect(() => {
    if (!user || role !== 'management' || !userData?.managementId) return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'complaints'),
      where('managementId', '==', userData.managementId),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const d = change.doc.data();
          if (d.status === 'escalated' || d.isEscalated) {
            const title = '🚨 Complaint Escalated';
            const body = `"${d.title}" by ${d.studentName || 'Student'} has been escalated`;
            triggerNotification(title, { body, tag: `mgmt-escalated-${change.doc.id}` });
            setNotifications(prev => [{
              id: `mgmt-escalated-${change.doc.id}-${Date.now()}`,
              title,
              body,
              type: 'escalated-complaint',
              createdAt: new Date(),
              read: false,
              data: { complaintId: change.doc.id },
            }, ...prev]);
            setUnreadCount(prev => prev + 1);
          } else if (d.status === 'disputed') {
            const title = '🚩 Complaint Disputed';
            const body = `"${d.title}" — student disputes the resolution`;
            triggerNotification(title, { body, tag: `mgmt-disputed-${change.doc.id}` });
            setNotifications(prev => [{
              id: `mgmt-disputed-${change.doc.id}-${Date.now()}`,
              title,
              body,
              type: 'disputed-complaint',
              createdAt: new Date(),
              read: false,
              data: { complaintId: change.doc.id },
            }, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      });
    }, (err) => console.debug('management escalation listener error:', err));
    return unsub;
  }, [user, role, userData?.managementId]);

  // ——— Management: new student/warden registrations ————————————————————————
  useEffect(() => {
    if (!user || role !== 'management' || !userData?.uid) return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'users'),
      where('managementId', '==', userData.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const roleLabel = d.role === 'warden' ? 'Warden' : 'Student';
          const title = `👤 New ${roleLabel} Registration`;
          const body = `${d.fullName || d.displayName || 'Someone'} has registered and needs approval`;
          triggerNotification(title, { body, tag: `mgmt-reg-${change.doc.id}` });
          setNotifications(prev => [{
            id: `mgmt-reg-${change.doc.id}`,
            title,
            body,
            type: 'new-registration',
            createdAt: new Date(),
            read: false,
            data: { userId: change.doc.id, role: d.role },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('management registration listener error:', err));
    return unsub;
  }, [user, role, userData?.uid]);

  // ——— Management: new leave requests ——————————————————————————————————————
  useEffect(() => {
    if (!user || role !== 'management' || !userData?.managementId) return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'leaveRequests'),
      where('managementId', '==', userData.managementId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const title = '📋 New Leave Request';
          const body = `${d.studentName || 'A student'} — ${d.leaveType?.replace('_', ' ') || 'Leave'}`;
          triggerNotification(title, { body, tag: `mgmt-leave-${change.doc.id}` });
          setNotifications(prev => [{
            id: `mgmt-leave-${change.doc.id}`,
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
    }, (err) => console.debug('management leave request listener error:', err));
    return unsub;
  }, [user, role, userData?.managementId]);

  // ——— Warden: disputed complaints (student disputes resolution) ——————————
  useEffect(() => {
    if (!user || role !== 'warden' || !userData?.managementId) return;
    const isInitial = { v: true };
    const prefs = userData?.notifPrefs || {};
    const q = query(
      collection(db, 'complaints'),
      where('managementId', '==', userData.managementId),
      limit(30)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      if (!prefs.complaintUpdates) return;
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const d = change.doc.data();
          if (d.status === 'disputed') {
            const title = '🚩 Complaint Disputed by Student';
            const body = `"${d.title}" — ${d.studentName || 'Student'} disputes your resolution`;
            triggerNotification(title, { body, tag: `warden-disputed-${change.doc.id}` });
            setNotifications(prev => [{
              id: `warden-disputed-${change.doc.id}-${Date.now()}`,
              title,
              body,
              type: 'disputed-complaint',
              createdAt: new Date(),
              read: false,
              data: { complaintId: change.doc.id },
            }, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      });
    }, (err) => console.debug('warden disputed complaint listener error:', err));
    return unsub;
  }, [user, role, userData?.managementId, userData?.notifPrefs]);

  // ——— Warden: new student registrations ——————————————————————————————————
  useEffect(() => {
    if (!user || role !== 'warden' || !userData?.managementId) return;
    const isInitial = { v: true };
    const prefs = userData?.notifPrefs || {};
    const q = query(
      collection(db, 'users'),
      where('managementId', '==', userData.managementId),
      where('role', '==', 'student'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      if (!prefs.newStudents) return;
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const title = '🎓 New Student Registration';
          const body = `${d.fullName || d.displayName || 'A student'} has registered for ${d.collegeName || 'your hostel'}`;
          triggerNotification(title, { body, tag: `warden-student-${change.doc.id}` });
          setNotifications(prev => [{
            id: `warden-student-${change.doc.id}`,
            title,
            body,
            type: 'new-student',
            createdAt: new Date(),
            read: false,
            data: { studentId: change.doc.id },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('warden student registration listener error:', err));
    return unsub;
  }, [user, role, userData?.managementId, userData?.notifPrefs]);

  // ——— Student: support ticket status updates ————————————————————————————
  useEffect(() => {
    if (!user || role !== 'student') return;
    const isInitial = { v: true };
    const q = query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const d = change.doc.data();
          const statusEmoji = d.status === 'resolved' ? '✅' : d.status === 'in-progress' ? '🔄' : '📩';
          const title = `${statusEmoji} Support Ticket Updated`;
          const body = `Your ticket "${d.subject || 'Support Request'}" is now ${d.status}`;
          triggerNotification(title, { body, tag: `ticket-${change.doc.id}` });
          setNotifications(prev => [{
            id: `ticket-${change.doc.id}-${Date.now()}`,
            title,
            body,
            type: 'support-update',
            createdAt: new Date(),
            read: false,
            data: { ticketId: change.doc.id, status: d.status },
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('student support ticket listener error:', err.code));
    return unsub;
  }, [user, role]);
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
          triggerNotification('New Approval Request', {
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
 useEffect(() => {
    if (!user || !isAdmin) return;
    const isInitial = { v: true };
    const seenTicketIds = new Set();
    const q = query(
      collection(db, 'supportTickets'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) {
        snapshot.docs.forEach((d) => seenTicketIds.add(d.id));
        isInitial.v = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          if (seenTicketIds.has(change.doc.id)) return;
          seenTicketIds.add(change.doc.id);

          const d = change.doc.data();
          triggerNotification('New Support Ticket', {
            body: d.subject || 'A new support ticket has been created',
            tag: `ticket-${change.doc.id}`,
          });
          setNotifications(prev => {
            const notificationId = `ticket-${change.doc.id}`;
            if (prev.some((n) => n.id === notificationId)) return prev;
            return [{
              id: notificationId,
              title: 'New Support Ticket',
              body: d.subject || 'A new support ticket has been created',
              type: 'support',
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
              read: false,
              data: { ticketId: change.doc.id, subject: d.subject },
            }, ...prev];
          });
          setUnreadCount(prev => prev + 1);
        }
      });
    }, (err) => console.debug('Support tickets collection not available:', err.code));
    return unsub;
  }, [user, isAdmin]);

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

  // expose helpers so UI can play sound or send a notification manually
  // useful for testing or custom triggers
  

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
    playSound();
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
      playSound,
      triggerNotification,
      playOnce
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
