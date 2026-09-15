import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Volume2, X, MapPin, BellRing } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import {
  startEmergencyAlertSound,
  stopEmergencyAlertSound,
  unlockAudio,
  getEmergencySoundMuted,
} from '../../utils/emergencySound';
import useSocket from '../../hooks/useSocket';

/**
 * Global Emergency and Notification Handler
 * 
 * Mounts at the root App level to ensure:
 * 1. Emergency siren sounds everywhere in the app, even when navigating other pages
 * 2. High-visibility emergency distress modal appears immediately for wardens/management/staff
 * 3. Browser native desktop notifications are pushed for emergency, announcements, and complaints on localhost
 */
export default function GlobalEmergencyListener() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const { connected } = useSocket();
  const { activeAlert, isMuted, isPanelVisible, startAlert, dismissAlert, clearAlert, toggleMute } = useEmergency();

  const [permissionState, setPermissionState] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  const isStudent = userData?.role === 'student' || window.location.pathname.startsWith('/dashboard/student');
  const [pulseCount, setPulseCount] = useState(0);

  // Request browser notification permission proactively on user login
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    setPermissionState(Notification.permission);

    if (Notification.permission === 'default' && user) {
      Notification.requestPermission()
        .then((perm) => {
          setPermissionState(perm);
          console.log('[notifications] Browser permission status:', perm);
        })
        .catch((err) => console.warn('[notifications] Permission request error:', err));
    }
  }, [user]);

  // Helper to trigger a native desktop notification
  const pushDesktopNotification = (title, options = {}) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: '/Applogo.png',
          badge: '/Applogo.png',
          ...options,
        });

        notif.onclick = () => {
          window.focus();
          if (options.onClickUrl) {
            navigate(options.onClickUrl);
          }
          notif.close();
        };

        return notif;
      } catch (err) {
        console.warn('[notifications] Failed to push notification:', err);
      }
    }
    return null;
  };

  // Listen to Socket.IO CustomEvents dispatched by useSocket.js
  useEffect(() => {
    if (!user) return;

    // Force re-render on every user/role change to pick up code changes
    console.log('[emergency-listener] Setting up listeners for user:', user?.uid, 'role:', userData?.role);

    // Handle dismiss from EmergencyIndicator (management dashboard)
    const handleEmergencyDismissed = () => {
      console.log('[emergency-listener] Emergency dismissed from management dashboard');
      dismissAlert();
    };

    window.addEventListener('hoas:emergency-dismissed', handleEmergencyDismissed);

    // 1. Emergency Started
    const handleEmergencyStarted = (e) => {
      // NEVER trigger sound or emergency distress panel in the student portal!
      const currentRole = userData?.role;
      const isCurrentStudent = currentRole === 'student' || window.location.pathname.startsWith('/dashboard/student');
      if (isCurrentStudent) {
        console.log('[emergency-listener] Suppressing alert sound and modal for student portal');
        return;
      }

      const payload = e.detail || {};
      console.log('[emergency-listener] Emergency started payload for staff:', payload);

      const studentName = payload.studentName || payload.student?.name || 'A Student';
      const studentId = payload.studentId || payload.student?._id;

      // Use the shared context to set active alert (startAlert checks mute state internally)
      startAlert({
        studentName,
        studentId,
        sessionId: payload.sessionId,
        timestamp: Date.now(),
      });

      // Native desktop notification for responders
      pushDesktopNotification('🚨 EMERGENCY ALERT - HOAS', {
        body: `URGENT: ${studentName} has activated live emergency location sharing!`,
        tag: `emergency-${Date.now()}`,
        requireInteraction: true,
        onClickUrl: currentRole === 'management' ? '/dashboard/management/emergency-location' : '/dashboard/warden/emergency-location',
      });
    };

    // 2. Generic socket notification
    const handleNotification = (e) => {
      const payload = e.detail || {};
      const title = payload.title || payload.notification?.title || 'HOAS Notification';
      const body = payload.body || payload.notification?.body || 'You have a new update';
      pushDesktopNotification(title, { body, tag: `notif-${Date.now()}` });
    };

    // 3. New announcement
    const handleAnnouncement = (e) => {
      const payload = e.detail || {};
      pushDesktopNotification(`📢 Announcement: ${payload.title || 'Campus Update'}`, {
        body: payload.body || payload.content || 'A new campus announcement was posted.',
        tag: `announcement-${payload._id || Date.now()}`,
      });
    };

    // 4. New complaint
    const handleComplaint = (e) => {
      const payload = e.detail || {};
      pushDesktopNotification(`⚠️ Complaint: #${payload.complaintId || ''} ${payload.title || ''}`, {
        body: payload.description || 'A new complaint has been filed.',
        tag: `complaint-${payload._id || Date.now()}`,
      });
    };

    // 5. Emergency Stopped
    const handleEmergencyStopped = () => {
      clearAlert();
    };

    window.addEventListener('hoas:emergency-started', handleEmergencyStarted);
    window.addEventListener('hoas:notification', handleNotification);
    window.addEventListener('hoas:announcement-new', handleAnnouncement);
    window.addEventListener('hoas:complaint-new', handleComplaint);
    window.addEventListener('hoas:emergency-stopped', handleEmergencyStopped);

    return () => {
      window.removeEventListener('hoas:emergency-started', handleEmergencyStarted);
      window.removeEventListener('hoas:notification', handleNotification);
      window.removeEventListener('hoas:announcement-new', handleAnnouncement);
      window.removeEventListener('hoas:complaint-new', handleComplaint);
      window.removeEventListener('hoas:emergency-stopped', handleEmergencyStopped);
      window.removeEventListener('hoas:emergency-dismissed', handleEmergencyDismissed);
    };
  }, [user, userData?.role, connected, dismissAlert, clearAlert, startAlert]);

  // Siren interval counter - only pulse if not muted
  useEffect(() => {
    if (!activeAlert || isMuted || getEmergencySoundMuted()) return;
    const timer = setInterval(() => setPulseCount((c) => c + 1), 4500);
    return () => clearInterval(timer);
  }, [activeAlert, isMuted]);

  // Restore the siren when an active alert is restored after a page reload
  // ONLY if the user hasn't explicitly muted it
  useEffect(() => {
    if (activeAlert && !isMuted && !getEmergencySoundMuted()) {
      startEmergencyAlertSound({ loop: true });
    }
  }, [activeAlert, isMuted]);

  const handleDismissAlert = () => {
    dismissAlert();
  };

  const handleNavigateToEmergency = () => {
    dismissAlert();
    if (activeAlert) {
      // Don't dismiss alert when navigating - keep it active
      // Just navigate to the emergency page
      if (userData?.role === 'management') {
        navigate('/dashboard/management/emergency-location');
      } else {
        navigate('/dashboard/warden/emergency-location');
      }
    }
  };

  const requestPermissionManually = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      await unlockAudio();
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('HOAS Notifications Enabled', {
          body: 'You will receive real-time alerts for emergencies, announcements, and complaints.',
          icon: '/Applogo.png',
        });
      }
    }
  };

  return (
    <>
      {/* Emergency Distress Panel (Slides in from the RIGHT PANEL, non-student only) */}
      {activeAlert && isPanelVisible && !isStudent && (
        <aside
          aria-label="Emergency Audio & Distress Panel"
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[99999] w-[94vw] sm:w-[420px] max-w-full pointer-events-auto transform transition-all duration-300 ease-out shadow-[0_20px_70px_rgba(239,68,68,0.55)] rounded-3xl overflow-hidden border-2 border-white/25 backdrop-blur-2xl bg-gradient-to-b from-red-600 via-red-600 to-red-700 text-white animate-in slide-in-from-right"
        >
          {/* Header */}
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl animate-pulse shadow-inner">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">EMERGENCY ALERT</h2>
                  <p className="text-[11px] uppercase tracking-widest font-extrabold text-red-100">Live SOS Broadcast</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissAlert}
                className="p-2 hover:bg-white/20 rounded-xl transition text-white/80 hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info Card */}
            <div className="mt-4 bg-black/30 rounded-2xl p-4 border border-white/10">
              <p className="text-lg sm:text-xl font-black text-white">{activeAlert.studentName}</p>
              <p className="text-xs sm:text-sm mt-1 text-red-100 font-medium">
                Has initiated emergency tracking and requires immediate staff attention.
              </p>
            </div>

            {/* Sound & Siren Control Bar */}
            <div className="mt-3.5 flex items-center justify-between p-3 rounded-xl bg-black/25 border border-white/10 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <Volume2 className={`w-4 h-4 ${isMuted ? 'text-white/40' : 'animate-ping text-white'}`} />
                <span className={isMuted ? 'text-white/60' : 'text-white font-bold'}>
                  {isMuted ? 'Siren Muted' : 'Siren Ringing'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleMute(!isMuted)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition border ${
                  isMuted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                }`}
              >
                {isMuted ? 'Unmute' : 'Mute Sound'}
              </button>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={handleNavigateToEmergency}
                className="flex-1 bg-white text-red-600 font-black text-sm py-3 px-4 rounded-xl hover:bg-red-50 active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4 text-red-600" />
                Open Live Map
              </button>
              <button
                type="button"
                onClick={handleDismissAlert}
                className="bg-black/30 hover:bg-black/40 text-white font-bold text-xs px-4 py-3 rounded-xl border border-white/20 transition"
              >
                Dismiss
              </button>
            </div>

            {/* Dev Mode: Test Emergency Sound */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    startEmergencyAlertSound({ loop: false });
                    console.log('[dev] Test emergency sound triggered');
                  }}
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs py-2 px-3 rounded-xl border border-amber-500/30 transition"
                >
                  Test Emergency Sound
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Subtle localhost permission prompt banner if notifications are not yet enabled */}
      {user && permissionState === 'default' && (
        <div className="fixed bottom-4 right-4 z-[9990] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs max-w-sm">
          <BellRing className="w-5 h-5 text-amber-400 animate-bounce" />
          <div className="flex-1">
            <p className="font-bold">Enable Desktop Notifications</p>
            <p className="text-slate-400 text-[11px]">Get emergency and campus updates on localhost.</p>
          </div>
          <button
            type="button"
            onClick={requestPermissionManually}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs"
          >
            Allow
          </button>
        </div>
      )}
    </>
  );
}