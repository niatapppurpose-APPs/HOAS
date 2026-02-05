import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../context/NotificationContext';
import { useTheme } from '../../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../../components/OwnerServices/header';
import {
  Bell,
  Clock,
  Ticket,
  CheckCircle,
  Trash2,
  AlertCircle,
  CheckCheck,
  Search
} from 'lucide-react';

const Notifications = () => {
  const { isCollapsed } = useOutletContext();
  const {
    notifications,
    unreadCount,
    permissionGranted,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission
  } = useNotifications();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    switch (notification.type) {
      case 'approval':
        navigate('/OwnersDashboard');
        break;
      case 'support':
        navigate('/OwnersDashboard/support-tickets');
        break;
      default:
        break;
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;
    if (filter === 'approval' && notif.type !== 'approval') return false;
    if (filter === 'support' && notif.type !== 'support') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = notif.title?.toLowerCase().includes(query);
      const matchBody = notif.body?.toLowerCase().includes(query);
      return matchTitle || matchBody;
    }
    return true;
  });

  const filters = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'read', label: 'Read', count: notifications.length - unreadCount },
    { id: 'approval', label: 'Approvals', count: notifications.filter(n => n.type === 'approval').length },
    { id: 'support', label: 'Support', count: notifications.filter(n => n.type === 'support').length },
  ];

  return (
    <>
      <Header title="Notifications" isCollapsed={isCollapsed} />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
        {!permissionGranted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border flex items-start gap-4"
            style={{
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#dbeafe',
              borderColor: isDark ? 'rgba(59,130, 246, 0.3)' : '#93c5fd'
            }}
          >
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: isDark ? '#93c5fd' : '#1e40af' }}>
                Enable Desktop Notifications
              </h3>
              <p className="text-sm mb-3" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>
                Get real-time alerts for new approvals and support tickets, even when HOAS is closed.
              </p>
              <button onClick={requestPermission} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm">
                Enable Notifications
              </button>
            </div>
          </motion.div>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  Total Notifications
                </p>
                <p className="text-3xl font-bold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                  {notifications.length}
                </p>
              </div>
              <Bell className="w-10 h-10 text-indigo-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  Unread
                </p>
                <p className="text-3xl font-bold text-orange-400">{unreadCount}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  Read
                </p>
                <p className="text-3xl font-bold text-green-400">{notifications.length - unreadCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </motion.div>
        </div>

        {/* Search and Actions */}
        <div
          className="p-4 rounded-xl border mb-6"
          style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0'
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            {/* Search Bar */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: isDark ? '#64748b' : '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#0f172a'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 text-sm font-medium flex items-center justify-center gap-2"
                style={{
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#cbd5e1' : '#475569'
                }}
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>

              <button
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f.id
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'hover:bg-white/5'
                }`}
                style={
                  filter === f.id
                    ? undefined
                    : {
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        color: isDark ? '#cbd5e1' : '#475569'
                      }
                }
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0'
          }}
        >
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell
                className="w-16 h-16 mx-auto mb-4 opacity-20"
                style={{ color: isDark ? '#475569' : '#94a3b8' }}
              />
              <p className="text-lg font-medium mb-2" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                {searchQuery ? 'No matching notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm" style={{ color: isDark ? '#475569' : '#cbd5e1' }}>
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Youll see notifications for approvals and support tickets here'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-indigo-500/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3
                            className={`font-semibold ${!notification.read ? 'font-bold' : ''}`}
                            style={{ color: isDark ? '#ffffff' : '#0f172a' }}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                          )}
                        </div>

                        <p className="text-sm mb-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                          {notification.body}
                        </p>

                        <div className="flex items-center gap-4 text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                          <span>{formatTime(notification.createdAt)}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white/10 capitalize">
                            {notification.type}
                          </span>
                        </div>
                      </div>

                      {/* Mark as Read Button */}
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="Mark as read"
                          style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;
