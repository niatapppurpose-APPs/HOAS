/**
 * Notification Listeners
 * Custom hooks for different notification listener types
 */

import { useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import * as notificationService from '../firebase/notificationService';
import { initializeNotificationPrefs } from '../utils/notificationPrefsManager';
import { sanitize } from './notificationHelpers';

/**
 * Initialize notification preferences on user change
 */
export function useInitializeNotificationPrefs(user) {
  useEffect(() => {
    if (!user) return;
    initializeNotificationPrefs(user.uid).catch(err =>
      console.warn('Could not initialize notification preferences:', err)
    );
  }, [user?.uid]);
}

/**
 * Setup FCM token on user authentication
 */
export function useSetupFCMToken(user, setPermissionGranted) {
  useEffect(() => {
    if (!user) return;
    const setup = async () => {
      const token = await notificationService.getFCMToken();
      if (token) {
        await notificationService.saveFCMToken(db, user.uid, token);
        setPermissionGranted(true);
      } else {
        setPermissionGranted(Notification.permission === 'granted');
      }
    };
    setup();
  }, [user, setPermissionGranted]);
}

/**
 * Listen for foreground FCM messages
 */
export function useForegroundMessageListener(user, userData, playSound, setNotifications, setUnreadCount) {
  useEffect(() => {
    if (!user) return;
    const unsubscribe = notificationService.onForegroundMessage((payload) => {
      const prefs = userData?.notifPrefs || {};
      if (prefs.systemAlerts === false) return;

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
  }, [user, userData?.notifPrefs, playSound, setNotifications, setUnreadCount]);
}

/**
 * Listen for Firestore notifications collection
 */
export function useFirestoreNotificationsListener(user, userData, triggerNotification, setNotifications, setUnreadCount) {
  useEffect(() => {
    if (!user) return;
    const prefs = userData?.notifPrefs || {};
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
          if (!systemAlertsEnabled) return;
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
  }, [user, userData?.notifPrefs, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Student: Listen for complaint status updates
 */
export function useStudentComplaintListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
      if (!prefs.complaints) return;
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
  }, [user, role, userData?.notifPrefs, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Warden: Listen for new complaints
 */
export function useWardenComplaintListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
      if (!prefs.newComplaints) return;
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          const title = `New Complaint`;
          const body = `${d.title} — Room ${d.roomNumber || 'N/A'}`;
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
  }, [user, role, userData?.managementId, userData?.notifPrefs, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Student & Warden: Listen for announcements
 */
export function useAnnouncementListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
  useEffect(() => {
    if (!user || !userData?.managementId) return;
    if (role !== 'student' && role !== 'warden') return;
    const isInitial = { v: true };
    const prefs = userData?.notifPrefs || {};
    const announcementsEnabled = prefs.announcements !== false;
    const q = query(
      collection(db, 'announcements'),
      where('managementId', '==', userData.managementId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (isInitial.v) { isInitial.v = false; return; }
      if (!announcementsEnabled) return;
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
  }, [user, role, userData?.managementId, userData?.notifPrefs, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Student: Listen for leave request status updates
 */
export function useStudentLeaveListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
      if (!prefs.leaveUpdates) return;
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
  }, [user, role, userData?.notifPrefs, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Warden: Listen for new leave requests
 */
export function useWardenLeaveListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
      if (!prefs.leaveRequests) return;
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
  }, [user, role, userData?.managementId, userData?.notifPrefs, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Management: Listen for new complaints
 */
export function useManagementComplaintListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
          const body = `${d.title} — by ${d.studentName || 'Student'}`;
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
  }, [user, role, userData?.managementId, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Management: Listen for escalated & disputed complaints
 */
export function useManagementEscalationListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
  }, [user, role, userData?.managementId, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Management: Listen for new registrations
 */
export function useManagementRegistrationListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
  }, [user, role, userData?.uid, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Admin: Listen for new approval requests
 */
export function useAdminApprovalListener(user, isAdmin, triggerNotification, setNotifications, setUnreadCount) {
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
  }, [user, isAdmin, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Admin: Listen for new support tickets
 */
export function useAdminSupportListener(user, isAdmin, triggerNotification, setNotifications, setUnreadCount) {
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
  }, [user, isAdmin, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Student: Listen for support ticket updates
 */
export function useStudentSupportListener(user, role, triggerNotification, setNotifications, setUnreadCount) {
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
  }, [user, role, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Warden: Listen for new students
 */
export function useWardenStudentListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
  }, [user, role, userData?.managementId, userData?.notifPrefs, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Warden: Listen for disputed complaints
 */
export function useWardenDisputedListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
  }, [user, role, userData?.managementId, userData?.notifPrefs, triggerNotification, setNotifications, setUnreadCount]);
}

/**
 * Management: Listen for new leave requests
 */
export function useManagementLeaveListener(user, role, userData, triggerNotification, setNotifications, setUnreadCount) {
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
  }, [user, role, userData?.managementId, triggerNotification, setNotifications, setUnreadCount]);
}
