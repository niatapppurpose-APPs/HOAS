/**
 * Notification Helpers & Utilities
 * Shared functions for notification management
 */

/**
 * Sanitize notification strings to prevent XSS
 */
export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '');
}

let notificationAudio = null;

/**
 * Play notification sound based on user preferences
 */
export function playSound(userData) {
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
}

/**
 * Resolve notification URL based on user role and type
 */
export function resolveNotificationUrl(userRole, notificationType = '', notificationTag = '') {
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
}

/**
 * Create notification trigger function with sound and URL resolution
 */
export function createNotificationTrigger(
  role,
  resolveNotificationUrl,
  playSound,
  notificationService
) {
  return (title, options) => {
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
}

/**
 * Format notification title with emoji based on priority
 */
export function formatAnnouncementTitle(priority) {
  const priorityEmoji = priority === 'urgent' ? '🔴' : priority === 'important' ? '🟡' : '📢';
  return `${priorityEmoji} New Announcement`;
}

/**
 * Format leave status emoji
 */
export function formatLeaveStatusEmoji(status) {
  return status === 'approved' ? '✅' : status === 'denied' ? '❌' : '📋';
}

/**
 * Format ticket status emoji
 */
export function formatTicketStatusEmoji(status) {
  return status === 'resolved' ? '✅' : status === 'in-progress' ? '🔄' : '📩';
}
