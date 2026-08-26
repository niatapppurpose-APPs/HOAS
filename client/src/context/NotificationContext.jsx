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
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as notificationService from '../firebase/notificationService';
import { initializeNotificationPrefs } from '../utils/notificationPrefsManager';
import {
  getMyNotifications,
  getMyComplaints,
  getWardenComplaints,
  getManagementComplaints,
  getAnnouncements,
  getMyLeaves,
  getWardenLeaves,
  getManagementLeaves,
  listUsers,
  listSupportTickets,
  markNotificationRead,
  markAllNotificationsRead,
} from '../firebase/cloudFunctions';

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

  const seenRef = useRef({});

  // Central dedupe: the same event can arrive via FCM push, the DB
  // notifications feed, and the specialized feed polls. Claiming an
  // entity+event key ensures the user is notified only once per event.
  const notifiedKeysRef = useRef(new Set());

  const entityKeyFromData = (data = {}, type = '') => {
    const d = data || {};
    const t = String(type || '');
    if (d.leaveId) return t === 'leave_request' ? `leave:${d.leaveId}:new` : `leave:${d.leaveId}:status:${d.status || 'updated'}`;
    if (d.outingId) return t === 'outing_request' ? `outing:${d.outingId}:new` : `outing:${d.outingId}:status:${d.status || 'updated'}`;
    if (d.complaintId) {
      if (t === 'complaint_new') return `complaint:${d.complaintId}:new`;
      if (t === 'complaint_disputed') return `complaint:${d.complaintId}:disputed`;
      if (t === 'complaint_escalated') return `complaint:${d.complaintId}:escalated`;
      return `complaint:${d.complaintId}:status:${d.status || t || 'updated'}`;
    }
    if (d.announcementId) return `announcement:${d.announcementId}`;
    if (d.ticketId) return `ticket:${d.ticketId}:${t || d.status || 'new'}`;
    if (d.userId || d.studentId) return `user:${d.userId || d.studentId}:pending`;
    if (d.feeId) return `fee:${d.feeId}:${t || 'update'}`;
    return null;
  };

  const claimKey = (key) => {
    if (!key) return true; // no key -> nothing to dedupe against
    if (notifiedKeysRef.current.has(key)) return false;
    notifiedKeysRef.current.add(key);
    return true;
  };

  const runPoll = async (feedKey, fetchItems, onNew, onChanged, sigOf) => {
    const feed = seenRef.current[feedKey] || { seen: new Map(), seeded: false };
    let items = [];
    try {
      items = await fetchItems();
    } catch (err) {
      console.debug('poll error:', err);
      return;
    }
    const nextSeen = new Map();
    for (const item of items) {
      const sig = sigOf ? sigOf(item) : item.id;
      nextSeen.set(item.id, sig);
      if (!feed.seen.has(item.id)) {
        if (feed.seeded && onNew) onNew(item);
        continue;
      }
      if (onChanged && sig !== feed.seen.get(item.id)) onChanged(item);
    }
    seenRef.current[feedKey] = { seen: nextSeen, seeded: true };
  };

  const useFeedPoll = (feedKey, enabled, fetchItems, onNew, onChanged, sigOf, deps) => {
    useEffect(() => {
      if (!enabled) return;
      let cancelled = false;
      const tick = async () => {
        const feed = seenRef.current[feedKey] || { seen: new Map(), seeded: false };
        let items = [];
        try {
          items = await fetchItems();
        } catch (err) {
          console.debug('poll error:', err);
          return;
        }
        if (cancelled) return;
        const nextSeen = new Map();
        for (const item of items) {
          const sig = sigOf ? sigOf(item) : item.id;
          nextSeen.set(item.id, sig);
          if (!feed.seen.has(item.id)) {
            if (feed.seeded && onNew) onNew(item);
            continue;
          }
          if (onChanged && sig !== feed.seen.get(item.id)) onChanged(item);
        }
        seenRef.current[feedKey] = { seen: nextSeen, seeded: true };
      };
      tick();
      const interval = setInterval(tick, 30000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
  };

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
        await notificationService.saveFCMToken(undefined, user.uid, token);
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

      // Skip if this event was already notified via another channel
      // (DB notifications feed or a specialized feed poll).
      const fcmType = payload.data?.type || 'general';
      if (!claimKey(entityKeyFromData(payload.data, fcmType))) return;

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
 useFeedPoll(
    'notifications',
    !!user,
    async () => {
      const { notifications } = await getMyNotifications();
      return (notifications || []).map(n => ({
        id: n._id,
        title: n.title,
        body: n.body,
        type: n.type || 'general',
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
        read: n.read || false,
        data: n.data || {},
      }));
    },
    (n) => {
      const prefs = userData?.notifPrefs || {};
      if (prefs.systemAlerts === false) return;
      // Skip events already delivered via FCM or a specialized feed poll.
      if (!claimKey(entityKeyFromData(n.data, n.type))) return;
      triggerNotification(n.title, { body: n.body, tag: n.id, data: n.data });
      setNotifications(prev => {
        if (prev.some(existing => existing.id === n.id)) return prev;
        return [n, ...prev];
      });
      if (!n.read) setUnreadCount(prev => prev + 1);
    },
    null,
    (n) => `${n.title}|${n.body}`,
    [user, userData?.notifPrefs],
  );

  useFeedPoll(
    'student-complaints',
    !!user && role === 'student',
    async () => {
      const { complaints } = await getMyComplaints();
      return (complaints || []).map(c => ({ id: c._id, ...c }));
    },
    null,
    (c) => {
      const prefs = userData?.notifPrefs || {};
      if (!prefs.complaints) return;
      if (!claimKey(`complaint:${c.id}:status:${c.status}`)) return;
      const statusLabel = c.status === 'in-progress' ? 'In Progress' : c.status === 'resolved' ? 'Resolved' : c.status;
      const title = `Complaint Updated`;
      const body = `"${c.title}" is now ${statusLabel}`;
      triggerNotification(title, { body, tag: `complaint-${c.id}` });
      setNotifications(prev => [{
        id: `complaint-${c.id}-${Date.now()}`,
        title: sanitize(title),
        body: sanitize(body),
        type: 'complaint',
        createdAt: new Date(),
        read: false,
        data: { complaintId: c.id },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    (c) => c.status,
    [user, role, userData?.notifPrefs],
  );

   useFeedPoll(
    'warden-complaints',
    !!user && role === 'warden',
    async () => {
      const { complaints } = await getWardenComplaints();
      return (complaints || []).filter(c => c.status === 'pending').map(c => ({ id: c._id, ...c }));
    },
    (c) => {
      const prefs = userData?.notifPrefs || {};
      if (!prefs.newComplaints) return;
      if (!claimKey(`complaint:${c.id}:new`)) return;
      const title = `New Complaint`;
      const body = `${c.title} — Room ${c.roomNumber || 'N/A'}`;
      triggerNotification(title, { body, tag: `warden-complaint-${c.id}` });
      setNotifications(prev => [{
        id: `warden-complaint-${c.id}`,
        title,
        body,
        type: 'new-complaint',
        createdAt: new Date(),
        read: false,
        data: { complaintId: c.id },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    null,
    (c) => c.status,
    [user, role, userData?.notifPrefs],
  );

  useFeedPoll(
    'announcements',
    !!user && (role === 'student' || role === 'warden'),
    async () => {
      const { announcements } = await getAnnouncements();
      return (announcements || []).map(a => ({ id: a._id, title: a.title, priority: a.priority || 'normal' }));
    },
    (a) => {
      const prefs = userData?.notifPrefs || {};
      if (prefs.announcements === false) return;
      if (!claimKey(`announcement:${a.id}`)) return;
      const priorityEmoji = a.priority === 'urgent' ? '🔴' : a.priority === 'important' ? '🟡' : '📢';
      const title = `${priorityEmoji} New Announcement`;
      const body = a.title || 'A new notice has been posted';
      triggerNotification(title, { body, tag: `announcement-${a.id}` });
      setNotifications(prev => [{
        id: `announcement-${a.id}`,
        title,
        body,
        type: 'announcement',
        createdAt: new Date(),
        read: false,
        data: { announcementId: a.id, priority: a.priority },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    null,
    (a) => a.id,
    [user, role, userData?.notifPrefs],
  );

  useFeedPoll(
    'student-leaves',
    !!user && role === 'student',
    async () => {
      const { leaves } = await getMyLeaves();
      return (leaves || []).map(l => ({ id: l._id, status: l.status, leaveType: l.leaveType }));
    },
    null,
    (l) => {
      const prefs = userData?.notifPrefs || {};
      if (!prefs.leaveUpdates) return;
      if (!claimKey(`leave:${l.id}:status:${l.status}`)) return;
      const statusEmoji = l.status === 'approved' ? '✅' : l.status === 'denied' ? '❌' : '📋';
      const title = `${statusEmoji} Leave Request Updated`;
      const body = `Your ${(l.leaveType || 'leave').replace('_', ' ')} request is now ${l.status}`;
      triggerNotification(title, { body, tag: `leave-${l.id}` });
      setNotifications(prev => [{
        id: `leave-${l.id}-${Date.now()}`,
        title,
        body,
        type: 'leave-update',
        createdAt: new Date(),
        read: false,
        data: { leaveId: l.id, status: l.status },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    (l) => l.status,
    [user, role, userData?.notifPrefs],
  );

  useFeedPoll(
    'warden-leaves',
    !!user && role === 'warden',
    async () => {
      const { leaves } = await getWardenLeaves();
      return (leaves || []).filter(l => l.status === 'pending').map(l => ({
        id: l._id,
        status: l.status,
        studentName: l.studentId?.name || 'A student',
        leaveType: l.leaveType,
      }));
    },
    (l) => {
      const prefs = userData?.notifPrefs || {};
      if (!prefs.leaveRequests) return;
      if (!claimKey(`leave:${l.id}:new`)) return;
      const title = '📋 New Leave Request';
      const body = `${l.studentName} — ${(l.leaveType || 'Leave').replace('_', ' ')}`;
      triggerNotification(title, { body, tag: `warden-leave-${l.id}` });
      setNotifications(prev => [{
        id: `warden-leave-${l.id}`,
        title,
        body,
        type: 'new-leave-request',
        createdAt: new Date(),
        read: false,
        data: { leaveId: l.id },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    null,
    (l) => l.id,
    [user, role, userData?.notifPrefs],
  );

useFeedPoll(
    'mgmt-complaints',
    !!user && role === 'management',
    async () => {
      const { complaints } = await getManagementComplaints();
      return (complaints || []).map(c => ({ id: c._id, title: c.title, studentName: c.studentId?.name || 'Student', status: c.status }));
    },
    (c) => {
      if (!claimKey(`complaint:${c.id}:new`)) return;
      const title = `New Complaint Filed`;
      const body = `${c.title} \u2014 by ${c.studentName || 'Student'}`;
      triggerNotification(title, { body, tag: `mgmt-complaint-${c.id}` });
      setNotifications(prev => [{
        id: `mgmt-complaint-${c.id}`,
        title,
        body,
        type: 'new-complaint',
        createdAt: new Date(),
        read: false,
        data: { complaintId: c.id },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    (c) => {
      if (c.status === 'escalated') {
        if (!claimKey(`complaint:${c.id}:escalated`)) return;
        const title = '🚨 Complaint Escalated';
        const body = `"${c.title}" by ${c.studentName || 'Student'} has been escalated`;
        triggerNotification(title, { body, tag: `mgmt-escalated-${c.id}` });
        setNotifications(prev => [{
          id: `mgmt-escalated-${c.id}-${Date.now()}`,
          title,
          body,
          type: 'escalated-complaint',
          createdAt: new Date(),
          read: false,
          data: { complaintId: c.id },
        }, ...prev]);
        setUnreadCount(prev => prev + 1);
      } else if (c.status === 'disputed') {
        if (!claimKey(`complaint:${c.id}:disputed`)) return;
        const title = '🚩 Complaint Disputed';
        const body = `"${c.title}" \u2014 student disputes the resolution`;
        triggerNotification(title, { body, tag: `mgmt-disputed-${c.id}` });
        setNotifications(prev => [{
          id: `mgmt-disputed-${c.id}-${Date.now()}`,
          title,
          body,
          type: 'disputed-complaint',
          createdAt: new Date(),
          read: false,
          data: { complaintId: c.id },
        }, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    },
    (c) => c.status,
    [user, role],
  );


useFeedPoll(
    'mgmt-registrations',
    !!user && role === 'management',
    async () => {
      const { users } = await listUsers({ status: 'pending' });
      return (users || []).map(u => ({ id: u._id, role: u.role, name: u.name }));
    },
    (u) => {
      if (!claimKey(`user:${u.id}:pending`)) return;
      const roleLabel = u.role === 'warden' ? 'Warden' : 'Student';
      const title = `👤 New ${roleLabel} Registration`;
      const body = `${u.name || 'Someone'} has registered and needs approval`;
      triggerNotification(title, { body, tag: `mgmt-reg-${u.id}` });
      setNotifications(prev => [{
        id: `mgmt-reg-${u.id}`,
        title,
        body,
        type: 'new-registration',
        createdAt: new Date(),
        read: false,
        data: { userId: u.id, role: u.role },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    null,
    (u) => u.id,
    [user, role],
  );



useFeedPoll(
    'mgmt-leaves',
    !!user && role === 'management',
    async () => {
      const { leaves } = await getManagementLeaves();
      return (leaves || []).filter(l => l.status === 'pending').map(l => ({
        id: l._id,
        status: l.status,
        studentName: l.studentId?.name || 'A student',
        leaveType: l.leaveType,
      }));
    },
    (l) => {
      if (!claimKey(`leave:${l.id}:new`)) return;
      const title = '📋 New Leave Request';
      const body = `${l.studentName} — ${(l.leaveType || 'Leave').replace('_', ' ')}`;
      triggerNotification(title, { body, tag: `mgmt-leave-${l.id}` });
      setNotifications(prev => [{
        id: `mgmt-leave-${l.id}`,
        title,
        body,
        type: 'new-leave-request',
        createdAt: new Date(),
        read: false,
        data: { leaveId: l.id },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    null,
    (l) => l.id,
    [user, role],
  );



useFeedPoll(
    'warden-disputes',
    !!user && role === 'warden',
    async () => {
      const { complaints } = await getWardenComplaints();
      return (complaints || []).map(c => ({ id: c._id, title: c.title, studentName: c.studentId?.name || 'Student', status: c.status }));
    },
    null,
    (c) => {
      const prefs = userData?.notifPrefs || {};
      if (!prefs.complaintUpdates) return;
      if (c.status !== 'disputed') return;
      if (!claimKey(`complaint:${c.id}:disputed`)) return;
      const title = '🚩 Complaint Disputed by Student';
      const body = `"${c.title}" — ${c.studentName} disputes your resolution`;
      triggerNotification(title, { body, tag: `warden-disputed-${c.id}` });
      setNotifications(prev => [{
        id: `warden-disputed-${c.id}-${Date.now()}`,
        title,
        body,
        type: 'disputed-complaint',
        createdAt: new Date(),
        read: false,
        data: { complaintId: c.id },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    (c) => c.status,
    [user, role, userData?.notifPrefs],
  );



useFeedPoll(
    'warden-students',
    !!user && role === 'warden',
    async () => {
      const { users } = await listUsers({ role: 'student', status: 'pending' });
      return (users || []).map(u => ({ id: u._id, name: u.name, collegeName: u.collegeId?.name || 'your hostel' }));
    },
    (u) => {
      const prefs = userData?.notifPrefs || {};
      if (!prefs.newStudents) return;
      if (!claimKey(`user:${u.id}:pending`)) return;
      const title = '🎓 New Student Registration';
      const body = `${u.name || 'A student'} has registered for ${u.collegeName || 'your hostel'}`;
      triggerNotification(title, { body, tag: `warden-student-${u.id}` });
      setNotifications(prev => [{
        id: `warden-student-${u.id}`,
        title,
        body,
        type: 'new-student',
        createdAt: new Date(),
        read: false,
        data: { studentId: u.id },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    null,
    (u) => u.id,
    [user, role, userData?.notifPrefs],
  );



useFeedPoll(
    'student-tickets',
    !!user && role === 'student',
    async () => {
      const { tickets } = await listSupportTickets();
      return (tickets || []).map(t => ({ id: t._id, subject: t.subject, status: t.status }));
    },
    null,
    (t) => {
      if (!claimKey(`ticket:${t.id}:${t.status}`)) return;
      const statusEmoji = t.status === 'resolved' ? '✅' : t.status === 'in-progress' ? '🔄' : '📩';
      const title = `${statusEmoji} Support Ticket Updated`;
      const body = `Your ticket "${t.subject || 'Support Request'}" is now ${t.status}`;
      triggerNotification(title, { body, tag: `ticket-${t.id}` });
      setNotifications(prev => [{
        id: `ticket-${t.id}-${Date.now()}`,
        title,
        body,
        type: 'support-update',
        createdAt: new Date(),
        read: false,
        data: { ticketId: t.id, status: t.status },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    (t) => t.status,
    [user, role],
  );


useFeedPoll(
    'admin-approvals',
    !!user && !!isAdmin,
    async () => {
      const { users } = await listUsers({ role: 'management', status: 'pending' });
      return (users || []).map(u => ({ id: u._id, name: u.name, createdAt: u.createdAt }));
    },
    (u) => {
      if (!claimKey(`user:${u.id}:pending`)) return;
      triggerNotification('New Approval Request', {
        body: `${u.name || 'A college'} is requesting approval`,
        tag: `approval-${u.id}`,
      });
      setNotifications(prev => [{
        id: u.id,
        title: 'New Approval Request',
        body: `${u.name || 'A college'} is requesting approval`,
        type: 'approval',
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        read: false,
        data: { userId: u.id, userName: u.name },
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    null,
    (u) => u.id,
    [user, isAdmin],
  );


 useFeedPoll(
    'admin-tickets',
    !!user && !!isAdmin,
    async () => {
      const { tickets } = await listSupportTickets();
      return (tickets || []).filter(t => t.status === 'open').map(t => ({
        id: t._id,
        subject: t.subject,
        status: t.status,
        createdAt: t.createdAt,
      }));
    },
    (t) => {
      if (!claimKey(`ticket:${t.id}:new`)) return;
      triggerNotification('New Support Ticket', {
        body: t.subject || 'A new support ticket has been created',
        tag: `ticket-${t.id}`,
      });
      setNotifications(prev => {
        const notificationId = `ticket-${t.id}`;
        if (prev.some((n) => n.id === notificationId)) return prev;
        return [{
          id: notificationId,
          title: 'New Support Ticket',
          body: t.subject || 'A new support ticket has been created',
          type: 'support',
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          read: false,
          data: { ticketId: t.id, subject: t.subject },
        }, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    },
    null,
    (t) => t.status,
    [user, isAdmin],
  );



  const markAsRead = async (notificationId) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      if (/^[0-9a-f]{24}$/i.test(notificationId)) {
        await markNotificationRead(notificationId);
      }
    } catch { }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch { }
  };

  const clearAll = () => { setNotifications([]); setUnreadCount(0); };

  // expose helpers so UI can play sound or send a notification manually
  // useful for testing or custom triggers
  

  const requestPermission = async () => {
    const granted = await notificationService.requestNotificationPermission();
    if (granted && user) {
      const token = await notificationService.getFCMToken();
      if (token) await notificationService.saveFCMToken(undefined, user.uid, token);
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
