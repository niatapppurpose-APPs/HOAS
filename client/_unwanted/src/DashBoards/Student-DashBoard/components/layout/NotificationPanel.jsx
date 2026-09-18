import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../../../context/NotificationContext';
import { Bell, X, Check, Trash2, AlertCircle } from 'lucide-react';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const complaintsOnly = notifications.filter(n => n.type === 'complaint-reminder');
  const displayNotifications = notifications.slice(0, 20);

  const togglePanel = () => setIsOpen(!isOpen);

  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleRemoveNotification = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  return (
    <div className="notification-panel-wrapper" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        className="notification-bell-btn"
        onClick={togglePanel}
        title={`${unreadCount} unread notifications`}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel">
          {/* Header */}
          <div className="notification-panel-header">
            <div>
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount} unread</span>
              )}
            </div>
            <button
              className="close-panel-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>

          {/* Action Buttons */}
          {unreadCount > 0 && (
            <div className="notification-actions">
              <button
                className="btn-small"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <Check size={14} />
                Mark all as read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="notification-list">
            {displayNotifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} opacity={0.3} />
                <p>No notifications yet</p>
              </div>
            ) : (
              displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.type} ${
                    notification.read ? 'read' : 'unread'
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead({ stopPropagation: () => {} }, notification.id);
                    }
                  }}
                >
                  {/* Notification Icon */}
                  <div className="notification-icon">
                    {notification.type === 'complaint-reminder' && (
                      <AlertCircle size={16} className="icon-reminder" />
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-body">
                      {notification.body}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.createdAt)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="notification-actions-row">
                    {!notification.read && (
                      <button
                        className="btn-mark-read"
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      className="btn-remove"
                      onClick={(e) => handleRemoveNotification(e, notification.id)}
                      title="Remove notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {displayNotifications.length > 0 && (
            <div className="notification-panel-footer">
              <button className="btn-clear-all" onClick={clearAll}>
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to format time
function formatTime(date) {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
}

export default NotificationPanel;
