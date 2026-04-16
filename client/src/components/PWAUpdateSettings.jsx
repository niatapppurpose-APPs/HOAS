import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, Calendar, Zap, CheckCircle, Bell, BellOff } from 'lucide-react';

/**
 * PWAUpdateSettings Component
 * Allows users to control how the app updates
 * - Auto Update: Updates immediately when available
 * - Scheduled Update: Updates at next app launch
 * - Manual Update: User clicks to update
 * - Browser Notifications: Notify when updates are available
 */
const PWAUpdateSettings = () => {
  const [updateMode, setUpdateMode] = useState('manual');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Load saved preferences
    const savedMode = localStorage.getItem('hoas-update-mode') || 'manual';
    const savedNotifPref = localStorage.getItem('hoas-update-notifications') !== 'false'; // default true
    setUpdateMode(savedMode);
    setNotificationsEnabled(savedNotifPref);
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              
              // Show browser notification if enabled
              if (savedNotifPref && Notification.permission === 'granted') {
                showUpdateNotification();
              }
              
              // Auto-update mode: update immediately
              if (savedMode === 'auto') {
                handleUpdate();
              }
              // Scheduled mode: just notify, will update on next launch
              else if (savedMode === 'scheduled') {
                console.log('Update will apply on next app launch');
              }
            }
          });
        });
      });

      // Listen for update messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setUpdateAvailable(true);
          if (savedNotifPref && Notification.permission === 'granted') {
            showUpdateNotification();
          }
        } else if (event.data && event.data.type === 'RELOAD_PAGE') {
          window.location.reload();
        }
      });
    }
  }, []);

  const showUpdateNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted' && registration) {
      registration.showNotification('HOAS Update Available', {
        body: 'A new version of HOAS is ready to install',
        icon: '/Applogo.png',
        badge: '/Applogo.png',
        tag: 'app-update',
        requireInteraction: true,
        actions: [
          { action: 'update', title: 'Update Now' },
          { action: 'dismiss', title: 'Later' }
        ],
        data: { url: window.location.origin }
      });
    }
  };

  const handleUpdateModeChange = (mode) => {
    setUpdateMode(mode);
    localStorage.setItem('hoas-update-mode', mode);
  };

  const handleNotificationToggle = async () => {
    // If not enabled OR we don't have permission yet, treat it as turning ON
    if (!notificationsEnabled || notificationPermission !== 'granted') {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('hoas-update-notifications', 'true');
        } else {
          setNotificationsEnabled(false);
          localStorage.setItem('hoas-update-notifications', 'false');
        }
      }
    } else {
      // We are enabled and have permission, so turn OFF
      setNotificationsEnabled(false);
      localStorage.setItem('hoas-update-notifications', 'false');
    }
  };

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) return;
    
    setIsUpdating(true);
    
    // Tell the waiting service worker to activate
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleCheckForUpdates = async () => {
    if (!registration) return;
    
    setIsUpdating(true);
    try {
      await registration.update();
      setTimeout(() => setIsUpdating(false), 1000);
    } catch (error) {
      console.error('Update check failed:', error);
      setIsUpdating(false);
    }
  };

  const modes = [
    {
      id: 'auto',
      icon: Zap,
      title: 'Auto Update',
      description: 'Updates install automatically when available',
      color: 'violet'
    },
    {
      id: 'scheduled',
      icon: Calendar,
      title: 'Scheduled Update',
      description: 'Updates install on next app launch',
      color: 'blue'
    },
    {
      id: 'manual',
      icon: Download,
      title: 'Manual Update',
      description: 'You decide when to update',
      color: 'green'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            App Updates
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Control how the app updates to new versions
          </p>
        </div>
        
        {/* Check for Updates Button */}
        <button
          onClick={handleCheckForUpdates}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
        >
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} style={{ color: 'var(--text-secondary)' }} />
          Check for Updates
        </button>
      </div>

      {/* Browser Notifications Toggle */}
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {notificationsEnabled && notificationPermission === 'granted' ? (
              <Bell className="w-5 h-5 text-indigo-500" />
            ) : (
              <BellOff className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Update Notifications
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {notificationPermission === 'denied' 
                  ? 'Notifications blocked by browser' 
                  : 'Get notified when updates are available'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleNotificationToggle}
            disabled={notificationPermission === 'denied'}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              notificationsEnabled && notificationPermission === 'granted'
                ? 'bg-indigo-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              notificationsEnabled && notificationPermission === 'granted'
                ? 'left-[calc(100%-1.625rem)]' 
                : 'left-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Update Available Banner */}
      {updateAvailable && updateMode !== 'auto' && (
        <div className="p-4 border rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Download className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Update Available
                </h4>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {updateMode === 'scheduled' 
                    ? 'Update will install on next app launch'
                    : 'A new version is ready to install'}
                </p>
              </div>
            </div>
            
            {updateMode === 'manual' && (
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Update Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Update Mode Options */}
      <div className="grid gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = updateMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => handleUpdateModeChange(mode.id)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-primary)',
                borderColor: isSelected ? '#6366f1' : 'var(--border-primary)'
              }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg`} style={{ backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-card)' }}>
                  <Icon className={`w-5 h-5`} style={{ color: isSelected ? '#6366f1' : 'var(--text-secondary)' }} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {mode.title}
                    </h4>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-indigo-500" />
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {mode.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          💡 <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> Enable notifications to get alerted about updates even when the app is closed. 
          Auto Update is recommended for the best experience.
        </p>
      </div>
    </div>
  );
};

export default PWAUpdateSettings;
