import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Clock, AlertCircle, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    permissionGranted,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission,
    role,
  } = useNotifications();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    // Navigate based on role + type
    if (role === 'student') {
      navigate('/dashboard/student/complaints');
    } else if (role === 'warden' || role === 'management') {
      navigate(role === 'warden' ? '/dashboard/warden/complaints' : '/dashboard/management/complaints');
    } else {
      // admin / owner
      switch (notification.type) {
        case 'approval': navigate('/OwnersDashboard'); break;
        case 'support':  navigate('/OwnersDashboard/support-tickets'); break;
        default:         navigate('/OwnersDashboard');
      }
    }

    setIsOpen(false);
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval':
        return <Clock className="w-5 h-5 text-orange-400" />;
      case 'support':
        return <Ticket className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const formatTime = (date) => {
    if (!(date instanceof Date)) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
        style={{ color: isDark ? '#cbd5e1' : '#475569' }}
        title="Notifications"
      >
        <Bell className="w-6 h-6" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}

        {/* Notification Pulse Animation */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75" />
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-2 right-2 mt-0 rounded-xl shadow-2xl border z-50 overflow-hidden sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-96"
            style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0'
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
            >
              <h3
                className="font-semibold text-lg"
                style={{ color: isDark ? '#ffffff' : '#0f172a' }}
              >
                Notifications ({unreadCount})
              </h3>

              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      title="Mark all as read"
                      style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>

                    <button
                      onClick={clearAll}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Clear all"
                      style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/*Permission Request Banner */}
            {!permissionGranted && (
              <div
                className="px-4 py-3 border-b flex items-start gap-3"
                style={{
                  backgroundColor: isDark ? '#1e3a8a20' : '#dbeafe',
                  borderColor: isDark ? '#334155' : '#e2e8f0'
                }}
              >
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: isDark ? '#93c5fd' : '#1e40af' }}
                  >
                    Enable Desktop Notifications
                  </p>
                  <p
                    className="text-xs mb-2"
                    style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}
                  >
                    Get notified even when HOAS is closed
                  </p>
                  <button
                    onClick={handleRequestPermission}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Enable
                  </button>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div
              className="max-h-96 overflow-y-auto custom-scrollbar"
              style={{
                backgroundColor: isDark ? '#0f172a' : '#f8fafc'
              }}
            >
              {notifications.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Bell
                    className="w-12 h-12 mx-auto mb-3 opacity-30"
                    style={{ color: isDark ? '#475569' : '#94a3b8' }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                  >
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.button
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 border-b flex items-start gap-3 hover:bg-white/5 transition-colors text-left ${
                      !notification.read ? 'bg-indigo-500/10' : ''
                    }`}
                    style={{ borderColor: isDark ? '#1e293b' : '#e2e8f0' }}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium mb-1 ${
                          !notification.read ? 'font-semibold' : ''
                        }`}
                        style={{ color: isDark ? '#ffffff' : '#0f172a' }}
                      >
                        {notification.title}
                      </p>
                      <p
                        className="text-xs line-clamp-2 mb-1"
                        style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                      >
                        {notification.body}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                      >
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
