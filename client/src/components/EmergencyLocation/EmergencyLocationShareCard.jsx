import { useEffect, useRef, useState } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { AlertTriangle, MapPin, ShieldAlert, StopCircle, Timer } from 'lucide-react';
import { useToast } from '../Toast';
import {
  getEmergencyLocationSession,
  shareEmergencyLocation,
  stopEmergencyLocation,
  updateEmergencyLocation,
} from '../../firebase/cloudFunctions';
import 'leaflet/dist/leaflet.css';
import './EmergencyLocation.css';

const UPDATE_THROTTLE_MS = 15000;
const POSITION_TIMEOUT_MS = 10000;
const CLOCK_TICK_MS = 15000;
const SLIDE_KNOB_WIDTH = 56;

const getErrorMessage = (error, fallback) => error?.message || fallback;

const toSessionState = (session) => ({
  latitude: session.latitude,
  longitude: session.longitude,
  accuracy: session.accuracy ?? null,
  expiresAt: session.expiresAt ?? null,
});

const EmergencyLocationShareCard = ({ tone = 'student' }) => {
  const toast = useToast();
  const watchIdRef = useRef(null);
  const autoStopRef = useRef(null);
  const slideTrackRef = useRef(null);
  const slideOffsetRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const lastUpdateMsRef = useRef(0);
  const isSharingRef = useRef(false);

  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [expiresAt, setExpiresAt] = useState(null);
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    slideOffsetRef.current = slideOffset;
  }, [slideOffset]);

  useEffect(() => {
    isSharingRef.current = isSharing;
  }, [isSharing]);

  const clearTrackingWatch = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const clearAutoStop = () => {
    if (autoStopRef.current) {
      window.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  };

  const resetSlide = () => {
    setIsDragging(false);
    setSlideOffset(0);
  };

  const clearSessionState = () => {
    setIsSharing(false);
    setExpiresAt(null);
    setCoords(null);
    setAccuracy(null);
    clearAutoStop();
    clearTrackingWatch();
  };

  const applySessionState = (session) => {
    const normalized = toSessionState(session);
    setCoords({ latitude: normalized.latitude, longitude: normalized.longitude });
    setAccuracy(normalized.accuracy);
    setExpiresAt(normalized.expiresAt);
    setIsSharing(Boolean(session?.isActive));
    if (normalized.expiresAt) {
      clearAutoStop();
      const remainingMs = Math.max(normalized.expiresAt - Date.now(), 0);
      autoStopRef.current = window.setTimeout(() => {
        clearSessionState();
        toast.info('Emergency location sharing expired automatically.');
      }, remainingMs);
    }
  };

  const ensureTrackingWatch = () => {
    if (!navigator.geolocation || watchIdRef.current !== null) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await pushLocationUpdate(position);
        } catch (error) {
          console.error('Emergency location update failed:', error);
        }
      },
      (error) => {
        console.error('Geolocation watch error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: POSITION_TIMEOUT_MS,
      }
    );
  };

  async function pushLocationUpdate(position, options = {}) {
    const { forceStart = false } = options;

    if (requestInFlightRef.current && !forceStart) {
      return;
    }

    const payload = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };

    setCoords({ latitude: payload.latitude, longitude: payload.longitude });
    setAccuracy(payload.accuracy ?? null);

    const now = Date.now();
    if (!forceStart && now - lastUpdateMsRef.current < UPDATE_THROTTLE_MS) {
      return;
    }

    requestInFlightRef.current = true;

    try {
      if (forceStart) {
        const response = await shareEmergencyLocation(payload);
        applySessionState(response?.data);
        toast.success(
          response?.alreadyActive
            ? 'Emergency location sharing resumed.'
            : 'Emergency location sharing is now active.'
        );
      } else if (isSharingRef.current) {
        const response = await updateEmergencyLocation(payload);
        if (response?.data) {
          applySessionState(response.data);
        }
      }

      lastUpdateMsRef.current = now;
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('expired')) {
        clearSessionState();
        toast.info('Emergency location sharing expired automatically.');
        return;
      }

      throw error;
    } finally {
      requestInFlightRef.current = false;
    }
  }

  const getCurrentPositionAsync = () => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: POSITION_TIMEOUT_MS,
      }
    );
  });

  const hydrateSession = async () => {
    try {
      const response = await getEmergencyLocationSession();
      const session = response?.data;

      if (session?.isActive) {
        applySessionState(session);
        ensureTrackingWatch();
      } else {
        clearSessionState();
      }
    } catch (error) {
      console.warn('Failed to restore emergency session:', error);
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleStart = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser.');
      return;
    }

    setIsLoading(true);

    try {
      const position = await getCurrentPositionAsync();
      await pushLocationUpdate(position, { forceStart: true });
      ensureTrackingWatch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to activate emergency sharing'));
      clearTrackingWatch();
    } finally {
      setIsLoading(false);
      resetSlide();
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopEmergencyLocation();
      clearSessionState();
      toast.success('Emergency location sharing stopped.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to stop emergency location sharing'));
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxSlide = () => {
    if (!slideTrackRef.current) return 0;
    const trackWidth = slideTrackRef.current.clientWidth;
    return Math.max(trackWidth - SLIDE_KNOB_WIDTH - 8, 0);
  };

  const completeSlide = async () => {
    setIsDragging(false);
    setSlideOffset(getMaxSlide());
    await handleStart();
  };

  const beginDrag = (startClientX) => {
    if (isLoading || isSharing || isBootstrapping) return;

    const startOffset = slideOffset;
    const maxSlide = getMaxSlide();

    if (maxSlide <= 0) return;

    setIsDragging(true);

    const onMove = (clientX) => {
      const delta = clientX - startClientX;
      const nextOffset = Math.min(Math.max(startOffset + delta, 0), maxSlide);
      setSlideOffset(nextOffset);
    };

    const cleanupListeners = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    const onEnd = async () => {
      cleanupListeners();

      if (isLoading || isSharing) return;

      const threshold = maxSlide * 0.85;
      if (slideOffsetRef.current >= threshold) {
        await completeSlide();
      } else {
        resetSlide();
      }
    };

    const handleMouseMove = (event) => onMove(event.clientX);
    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        onMove(event.touches[0].clientX);
      }
    };
    const handleMouseUp = () => onEnd();
    const handleTouchEnd = () => onEnd();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  useEffect(() => {
    hydrateSession();

    const tickId = window.setInterval(() => {
      setNowMs(Date.now());
    }, CLOCK_TICK_MS);

    return () => {
      window.clearInterval(tickId);
      clearTrackingWatch();
      clearAutoStop();
    };
  }, []);

  useEffect(() => {
    if (isSharing) {
      ensureTrackingWatch();
    }
  }, [isSharing]);

  useEffect(() => {
    if (isSharing && expiresAt && expiresAt <= nowMs) {
      clearSessionState();
    }
  }, [expiresAt, isSharing, nowMs]);

  const remainingMinutes = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - nowMs) / (1000 * 60)))
    : null;

  return (
    <section className={`emergency-share-card tone-${tone} rounded-[1.25rem] border p-4 md:rounded-[1.5rem] md:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="emergency-eyebrow">Emergency Safety</p>
          <h3 className="emergency-title">Live Location Sharing</h3>
          <p className="emergency-subtitle">
            Manual and temporary. Shared only with assigned warden and management.
          </p>
        </div>
        <div className={`emergency-status-pill ${isSharing ? 'active' : 'idle'}`}>
          <span className="emergency-status-dot" />
          {isSharing ? 'Sharing Active' : 'Inactive'}
        </div>
      </div>

      <div className="mt-5">
        {!isSharing ? (
          <div
            ref={slideTrackRef}
            className={`emergency-slide-button ${isDragging ? 'dragging' : ''} ${isLoading || isBootstrapping ? 'loading' : ''}`}
          >
            <span className="slide-track" />
            <span className="slide-content">
              {isBootstrapping
                ? 'Checking Emergency Status...'
                : isLoading
                  ? 'Starting...'
                  : 'Slide To Share Emergency Location'}
            </span>
            <button
              type="button"
              className="slide-knob"
              style={{ transform: `translateX(${slideOffset}px)` }}
              onMouseDown={(event) => beginDrag(event.clientX)}
              onTouchStart={(event) => beginDrag(event.touches[0].clientX)}
              disabled={isLoading || isBootstrapping}
              aria-label="Slide to share emergency location"
            >
              <ShieldAlert className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            disabled={isLoading}
            className="emergency-stop-button"
          >
            <StopCircle className="h-4 w-4" />
            {isLoading ? 'Stopping...' : 'Stop Sharing'}
          </button>
        )}
      </div>

      <div className="mt-4 emergency-meta-grid">
        <div className="meta-item">
          <Timer className="h-4 w-4" />
          <span>{remainingMinutes !== null ? `${remainingMinutes} min left` : 'Not started'}</span>
        </div>
        <div className="meta-item">
          <AlertTriangle className="h-4 w-4" />
          <span>{accuracy ? `Accuracy: ${Math.round(accuracy)}m` : 'Accuracy pending'}</span>
        </div>
      </div>

      {coords && (
        <div className="mt-4 emergency-map-shell">
          <div className="map-headline">
            <MapPin className="h-4 w-4" />
            <span>Current shared position</span>
          </div>
          <MapContainer
            center={[coords.latitude, coords.longitude]}
            zoom={16}
            className="emergency-map-frame"
            scrollWheelZoom
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle
              center={[coords.latitude, coords.longitude]}
              radius={Math.max(Number(accuracy) || 25, 20)}
              pathOptions={{ color: '#b91c1c', fillColor: '#f87171', fillOpacity: 0.12, weight: 1.5 }}
            />
            <CircleMarker
              center={[coords.latitude, coords.longitude]}
              radius={8}
              pathOptions={{ color: '#b91c1c', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]}>
                You
              </Tooltip>
            </CircleMarker>
          </MapContainer>
        </div>
      )}
    </section>
  );
};

export default EmergencyLocationShareCard;
