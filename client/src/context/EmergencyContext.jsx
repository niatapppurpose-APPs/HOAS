import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  startEmergencyAlertSound,
  stopEmergencyAlertSound,
  setEmergencySoundMuted,
  getEmergencySoundMuted,
} from '../utils/emergencySound';

const EmergencyContext = createContext(null);
const ACTIVE_ALERT_STORAGE_KEY = 'hoas-active-emergency-alert';
const ALERT_DISMISSED_STORAGE_KEY = 'hoas-emergency-alert-dismissed';
const MUTE_STORAGE_KEY = 'hoas-emergency-sound-muted';

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within EmergencyProvider');
  }
  return context;
};

export const EmergencyProvider = ({ children }) => {
  const [activeAlert, setActiveAlert] = useState(() => {
    try {
      const storedAlert = window.localStorage.getItem(ACTIVE_ALERT_STORAGE_KEY);
      return storedAlert ? JSON.parse(storedAlert) : null;
    } catch {
      return null;
    }
  });

  // Load persistent mute state: stays muted until the user explicitly clicks unmute
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
    setEmergencySoundMuted(isMuted);
  }, [isMuted]);

  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [isAlertDismissed, setIsAlertDismissed] = useState(() => (
    window.localStorage.getItem(ALERT_DISMISSED_STORAGE_KEY) === 'true'
  ));

  useEffect(() => {
    try {
      if (activeAlert) {
        window.localStorage.setItem(ACTIVE_ALERT_STORAGE_KEY, JSON.stringify(activeAlert));
      } else {
        window.localStorage.removeItem(ACTIVE_ALERT_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Unable to persist emergency alert state:', error);
    }
  }, [activeAlert]);

  // Close the panel without ending the emergency. Header indicator remains.
  // Permanently stops audio while muted; does NOT auto-unmute on timer.
  const dismissAlert = useCallback(() => {
    stopEmergencyAlertSound();
    setIsPanelVisible(false);
    setIsAlertDismissed(true);
    window.localStorage.setItem(ALERT_DISMISSED_STORAGE_KEY, 'true');
  }, []);

  const startAlert = useCallback((alertData) => {
    setActiveAlert(alertData);
    setIsPanelVisible(true);
    setIsAlertDismissed(false);
    window.localStorage.removeItem(ALERT_DISMISSED_STORAGE_KEY);

    // CRITICAL: If user previously muted the emergency sound, KEEP IT MUTED!
    // Never reset mute state to false on incoming alerts or pings.
    if (!isMutedRef.current && !getEmergencySoundMuted()) {
      startEmergencyAlertSound({ loop: true });
    }
  }, []);

  const toggleMute = useCallback((newMutedState) => {
    setIsMuted(newMutedState);
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(newMutedState));
    } catch {}
    setEmergencySoundMuted(newMutedState);
    if (newMutedState) {
      stopEmergencyAlertSound();
    } else {
      startEmergencyAlertSound({ loop: true });
    }
  }, []);

  const clearAlert = useCallback(() => {
    stopEmergencyAlertSound();
    setActiveAlert(null);
    setIsPanelVisible(false);
    setIsAlertDismissed(false);
    window.localStorage.removeItem(ALERT_DISMISSED_STORAGE_KEY);
  }, []);

  const openAlertPanel = useCallback(() => {
    setIsPanelVisible(true);
  }, []);

  const isActive = !!activeAlert;

  const value = {
    activeAlert,
    isActive,
    isPanelVisible: isPanelVisible && !isAlertDismissed,
    isAlertDismissed,
    openAlertPanel,
    isMuted,
    startAlert,
    dismissAlert,
    clearAlert,
    setIsMuted,
    toggleMute,
    isMutedState: isMuted,
  };

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
};

export default EmergencyContext;