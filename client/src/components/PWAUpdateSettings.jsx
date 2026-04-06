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
  const [updateMode, setUpdateMode] = useState('auto');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Load saved preferences
    const savedMode = localStorage.getItem('hoas-update-mode') || 'auto';
    const savedNotifPref = localStorage.getItem('hoas-update-notifications') === 'true';
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
    if (!notificationsEnabled) {
      // Request permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('hoas-update-notifications', 'true');
        }
      }
    } else {
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            App Updates
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Control how the app updates to new versions
          </p>
        </div>
        
        {/* Check for Updates Button */}
        <button
          onClick={handleCheckForUpdates}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          Check for Updates
        </button>
      </div>

      {/* Browser Notifications Toggle */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {notificationsEnabled && notificationPermission === 'granted' ? (
              <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Update Notifications
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
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
                ? 'bg-violet-600' 
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
        <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                <Download className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Update Available
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50"
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
                isSelected
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  isSelected 
                    ? 'bg-violet-100 dark:bg-violet-900/40' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isSelected 
                      ? 'text-violet-600 dark:text-violet-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {mode.title}
                    </h4>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {mode.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 <strong>Tip:</strong> Enable notifications to get alerted about updates even when the app is closed. 
          Auto Update is recommended for the best experience.
        </p>
      </div>
    </div>
  );
};

export default PWAUpdateSettings;
