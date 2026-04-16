import { useEffect, useRef, useState } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { AlertTriangle, MapPin, ShieldCheck, StopCircle, Timer, Lock, Radio, CheckCircle2, ShieldAlert, Activity, Info } from 'lucide-react';
import { useToast } from '../Toast';
import { useTheme } from '../../context/ThemeContext';
import {
  getEmergencyLocationSession,
  shareEmergencyLocation,
  stopEmergencyLocation,
  updateEmergencyLocation,
} from '../../firebase/cloudFunctions';
import 'leaflet/dist/leaflet.css';
import './EmergencyLocation.css';

const UPDATE_THROTTLE_MS = 6000;
const POSITION_TIMEOUT_MS = 10000;
const SLIDE_KNOB_WIDTH = 56;

const getErrorMessage = (error, fallback) => error?.message || fallback;

const toSessionState = (session) => ({
  latitude: session.latitude,
  longitude: session.longitude,
  accuracy: session.accuracy ?? null,
  expiresAt: session.expiresAt ?? null,
  sharedAt: session.sharedAt ?? session.startedAt ?? session.createdAt ?? null
});

const EmergencyLocationShareCard = ({ tone = 'student' }) => {
  const toast = useToast();
  const { isDark } = useTheme();

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
  const [sessionStartMs, setSessionStartMs] = useState(null);
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);

  const [sessionDurationText, setSessionDurationText] = useState('0 mins active');
  const [lastSyncedText, setLastSyncedText] = useState('Waiting for signal...');

  useEffect(() => { slideOffsetRef.current = slideOffset; }, [slideOffset]);
  useEffect(() => { isSharingRef.current = isSharing; }, [isSharing]);

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
    setSessionStartMs(null);
    lastUpdateMsRef.current = 0;
    clearAutoStop();
    clearTrackingWatch();
    setLastSyncedText('Offline');
  };

  const applySessionState = (session) => {
    const normalized = toSessionState(session);
    setCoords({ latitude: normalized.latitude, longitude: normalized.longitude });
    setAccuracy(normalized.accuracy);
    setExpiresAt(normalized.expiresAt);

    if (session?.isActive) {
      setIsSharing(true);
      setSessionStartMs(normalized.sharedAt || sessionStartMs || Date.now());
      if (lastUpdateMsRef.current === 0) lastUpdateMsRef.current = Date.now();
    } else {
      setIsSharing(false);
    }

    if (normalized.expiresAt && session?.isActive) {
      clearAutoStop();
      const remainingMs = Math.max(normalized.expiresAt - Date.now(), 0);
      autoStopRef.current = window.setTimeout(() => {
        clearSessionState();
        toast.info('Emergency location sharing expired automatically.');
      }, remainingMs);
    }
  };

  const ensureTrackingWatch = () => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try { await pushLocationUpdate(position); }
        catch (error) { console.error('Emergency location update failed:', error); }
      },
      (error) => { console.error('Geolocation watch error:', error); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: POSITION_TIMEOUT_MS }
    );
  };

  async function pushLocationUpdate(position, options = {}) {
    const { forceStart = false } = options;
    if (requestInFlightRef.current && !forceStart) return;

    const payload = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };

    setCoords({ latitude: payload.latitude, longitude: payload.longitude });
    setAccuracy(payload.accuracy ?? null);

    const now = Date.now();
    // throttle updates to avoid flooding backend (every 6 seconds max)
    if (!forceStart && now - lastUpdateMsRef.current < UPDATE_THROTTLE_MS) return;

    requestInFlightRef.current = true;

    try {
      if (forceStart) {
        const response = await shareEmergencyLocation(payload);
        applySessionState(response?.data);
        lastUpdateMsRef.current = Date.now();
        toast.success(response?.alreadyActive ? 'Emergency location sharing resumed.' : 'Emergency location sharing is now active.');
      } else if (isSharingRef.current) {
        // Suppress visual errors for background syncing unless hard failure
        const response = await updateEmergencyLocation(payload);
        if (response?.data) applySessionState(response.data);
        lastUpdateMsRef.current = Date.now();
      }
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('expired')) {
        clearSessionState();
        toast.info('Emergency location sharing expired automatically.');
        return;
      }
      // Silently fail continuous updates to not spam user, but register failure
    } finally {
      requestInFlightRef.current = false;
    }
  }

  const getCurrentPositionAsync = () => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, maximumAge: 0, timeout: POSITION_TIMEOUT_MS,
    });
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
    setShowStopModal(false);
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

  const beginDrag = (startClientX) => {
    if (isLoading || isSharing || isBootstrapping) return;
    const startOffset = slideOffset;
    const maxSlide = getMaxSlide();
    if (maxSlide <= 0) return;
    setIsDragging(true);

    const onMove = (clientX) => {
      const delta = clientX - startClientX;
      setSlideOffset(Math.min(Math.max(startOffset + delta, 0), maxSlide));
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
      if (slideOffsetRef.current >= maxSlide * 0.85) {
        setIsDragging(false);
        setSlideOffset(maxSlide);
        await handleStart();
      } else {
        resetSlide();
      }
    };

    const handleMouseMove = (event) => onMove(event.clientX);
    const handleTouchMove = (event) => { if (event.touches.length > 0) onMove(event.touches[0].clientX); };
    const handleMouseUp = () => onEnd();
    const handleTouchEnd = () => onEnd();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  useEffect(() => {
    hydrateSession();

    // High frequency tick for real-time counters
    const tickId = window.setInterval(() => {
      const now = Date.now();

      // Update session duration text
      if (isSharingRef.current && sessionStartMs) {
        let elapsedMin = Math.floor((now - sessionStartMs) / 60000);
        if (elapsedMin < 0) elapsedMin = 0;
        if (elapsedMin < 60) {
          setSessionDurationText(`${elapsedMin} min${elapsedMin !== 1 ? 's' : ''} active`);
        } else {
          const hrs = Math.floor(elapsedMin / 60);
          const mins = elapsedMin % 60;
          setSessionDurationText(`${hrs} hr ${mins} min active`);
        }
      } else {
        setSessionDurationText('0 mins active');
      }

      // Update sync text
      if (isSharingRef.current && lastUpdateMsRef.current > 0) {
        const diffSecs = Math.floor((now - lastUpdateMsRef.current) / 1000);
        if (diffSecs < 5) setLastSyncedText('Updated just now');
        else if (diffSecs < 60) setLastSyncedText(`Updated ${diffSecs} seconds ago`);
        else {
          const m = Math.floor(diffSecs / 60);
          setLastSyncedText(`Updated ${m} minute${m !== 1 ? 's' : ''} ago`);
        }
      }
    }, 1000);

    return () => {
      window.clearInterval(tickId);
      clearTrackingWatch();
      clearAutoStop();
    };
  }, [sessionStartMs]);

  useEffect(() => { if (isSharing) ensureTrackingWatch(); }, [isSharing]);

  const accState = (() => {
    if (!accuracy || !isSharing) return { label: 'Waiting for GPS', color: 'text-slate-500', bg: isDark ? 'bg-slate-800' : 'bg-slate-100', dot: 'bg-slate-400' };
    if (accuracy <= 20) return { label: 'Strong Signal', color: 'text-emerald-500', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', pulse: true };
    if (accuracy <= 50) return { label: 'Medium Signal', color: 'text-amber-500', bg: 'bg-amber-500/10', dot: 'bg-amber-500' };
    return { label: 'Weak Signal', color: 'text-red-500', bg: 'bg-red-500/10', dot: 'bg-red-500' };
  })();

  const containerTheme = isDark
    ? 'bg-[#0f172a] border-slate-800/80 shadow-2xl shadow-indigo-900/10'
    : 'bg-[#f8fafc] border-slate-200/80 shadow-2xl shadow-slate-200/50';

  return (
    <>
      <section className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 transition-all duration-500 ${containerTheme}`}>

        {/* Top Badges */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase
              ${isDark ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
            <ShieldCheck className="w-3.5 h-3.5" /> Protected by Campus Safety Network
          </div>
          <div className="flex items-center gap-2">
            <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>End-to-End Encrypted</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 flex flex-col items-start gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${isSharing ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : (isDark ? 'bg-slate-800' : 'bg-white shadow-sm')}`}>
              <Radio className={`w-8 h-8 ${isSharing ? 'text-white animate-pulse' : (isDark ? 'text-slate-500' : 'text-slate-400')}`} />
            </div>
            <div>
              <h3 className={`text-3xl md:text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Live Emergency Location
              </h3>
            </div>
          </div>
          <p className={`text-sm md:text-base font-medium max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Your live location is securely shared with assigned wardens and management during emergencies.
            <br className="hidden md:block" />
            <span className={isDark ? 'text-slate-500' : 'text-slate-500'}> Data is strictly encrypted and only accessible to authorized personnel.</span>
          </p>
        </div>

        {/* Real Time Security Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Status */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>Protection Status</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isSharing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSharing ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
              </span>
              <span className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{isSharing ? 'Live Tracking Enabled' : 'Monitoring Inactive'}</span>
            </div>
          </div>

          {/* Session Duration */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>Session Duration</p>
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${isSharing ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{isSharing ? sessionDurationText : 'Not active'}</span>
            </div>
          </div>

          {/* Accuracy */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>GPS Accuracy</p>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${accState.dot} ${accState.pulse ? 'animate-pulse' : ''}`} />
                <span className={`font-bold text-sm ${accState.color}`}>{accState.label}</span>
              </div>
              <span className={`text-[11px] font-semibold mt-1 opacity-70 ${accState.color}`}>
                {accuracy && isSharing ? `Variance: ±${Math.round(accuracy)} meters` : 'Coordinates unavailable'}
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>Assigned Contact</p>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${isSharing ? 'text-emerald-500' : 'text-slate-600'}`} />
                <span className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{isSharing ? 'Security Team Connected' : 'No Assignment'}</span>
              </div>
              {isSharing && <span className={`text-[11px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Wardens Alerted</span>}
            </div>
          </div>

        </div>

        {/* Action Space */}
        <div className="relative z-10 mb-8">
          {!isSharing ? (
            <div className={`p-2 rounded-[1.5rem] relative ${isDark ? 'bg-slate-800/80 outline outline-1 outline-slate-700' : 'bg-white shadow-xl shadow-slate-200 outline outline-1 outline-slate-200'}`}>
              <div
                ref={slideTrackRef}
                className={`emergency-slide-button !rounded-2xl !border-0 !min-h-[72px] !bg-slate-900 ${isDark ? '!bg-slate-950' : '!bg-slate-900'} ${isDragging ? 'dragging' : ''} ${isLoading || isBootstrapping ? 'loading opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent pointer-events-none" />
                <span className="slide-content !font-black !tracking-widest !text-[12px] !text-white z-10" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  {isBootstrapping ? 'INITIALIZING...' : isLoading ? 'SECURING CONNECTION...' : 'SLIDE TO INITIATE LIVE TRACKING'}
                </span>
                <button
                  type="button"
                  className={`slide-knob !top-[4px] !bg-red-500 !text-white hover:!scale-105 active:!scale-[0.98] transition-transform !shadow-[0_4px_20px_rgba(239,68,68,0.5)] flex items-center justify-center`}
                  style={{ transform: `translateX(${slideOffset}px)`, height: '64px', width: '64px', borderRadius: '14px' }}
                  onMouseDown={(event) => beginDrag(event.clientX)}
                  onTouchStart={(event) => beginDrag(event.touches[0].clientX)}
                  disabled={isLoading || isBootstrapping}
                >
                  <ShieldAlert className="w-6 h-6" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowStopModal(true)}
              disabled={isLoading}
              className="w-full relative overflow-hidden group flex items-center justify-center gap-3 py-6 rounded-[1.5rem] bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-sm tracking-widest uppercase hover:from-red-500 hover:to-red-400 transition-all shadow-[0_8px_30px_rgba(239,68,68,0.3)] active:scale-[0.99] border border-red-400/50"
            >
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay"></div>
              <StopCircle className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'DISCONNECTING...' : 'HALT LOCATION SHARING'}
            </button>
          )}
        </div>

        {/* The Advanced Map Area */}
        <div className={`relative z-10 rounded-[2rem] overflow-hidden border transition-colors duration-500 relative ${isDark ? 'bg-slate-900 border-slate-700/60' : 'bg-slate-100 border-slate-300'} h-[500px] shadow-2xl`}>

          {/* Radar background if no coords */}
          {!coords && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
              <div className={`w-64 h-64 border rounded-full ${isDark ? 'border-slate-700' : 'border-slate-300'} flex items-center justify-center`}>
                <div className={`w-32 h-32 border rounded-full ${isDark ? 'border-slate-700' : 'border-slate-300'}`}></div>
              </div>
              <p className={`absolute font-bold text-sm uppercase tracking-widest mt-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Radar Standby</p>
            </div>
          )}

          {isSharing && coords && (
            <>
              {/* Map UI Overlay */}
              <div className={`absolute top-5 left-5 z-[1000] px-5 py-3 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center gap-3
                  ${isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white/95 border-slate-200'}`}>
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Transmission Area</span>
                  <span className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{lastSyncedText}</span>
                </div>
              </div>

              <div className={`absolute bottom-5 right-5 z-[1000] px-4 py-2 flex items-center gap-2 rounded-xl backdrop-blur-md border ${isDark ? 'bg-slate-900/80 border-slate-700 text-slate-400' : 'bg-white/80 border-slate-300 text-slate-500'}`}>
                <Info className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Updates dynamically via Satellite Array</span>
              </div>

              <MapContainer
                center={[coords.latitude, coords.longitude]}
                zoom={17}
                className="w-full h-full"
                scrollWheelZoom
                zoomControl={false}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url={isDark
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
                />

                {/* Accuracy Radius */}
                <Circle
                  center={[coords.latitude, coords.longitude]}
                  radius={Math.max(Number(accuracy) || 25, 15)}
                  pathOptions={{
                    color: isDark ? '#3b82f6' : '#2563eb',
                    fillColor: isDark ? '#3b82f6' : '#3b82f6',
                    fillOpacity: 0.15,
                    weight: 1,
                    dashArray: '8 8'
                  }}
                />

                {/* User Pin */}
                <CircleMarker
                  center={[coords.latitude, coords.longitude]}
                  radius={10}
                  pathOptions={{
                    color: '#fff',
                    fillColor: '#ef4444',
                    fillOpacity: 1,
                    weight: 3,
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -14]} className="custom-secure-tooltip">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                      YOU (LIVE)
                    </span>
                  </Tooltip>
                </CircleMarker>

                {/* Pulsing Backlight */}
                <CircleMarker
                  center={[coords.latitude, coords.longitude]}
                  radius={18}
                  className="animate-ping"
                  pathOptions={{
                    color: 'transparent',
                    fillColor: '#ef4444',
                    fillOpacity: 0.4,
                  }}
                />
              </MapContainer>
            </>
          )}
        </div>

        {/* Security Footer Message */}
        <div className={`mt-6 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span className="text-[11px] font-semibold tracking-wide flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> No location data stored after emergency ends.</span>
          <span className="hidden md:inline text-slate-700 px-2">•</span>
          <span className="text-[11px] font-semibold tracking-wide flex items-center justify-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Only visible to authorized wardens.</span>
        </div>
      </section>

      {/* Confirmation Modal */}
      {showStopModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowStopModal(false)}></div>
          <div className={`relative w-full max-w-md ${isDark ? 'bg-slate-900 border-slate-700 shadow-2xl shadow-red-900/20' : 'bg-white border-slate-200 shadow-2xl'} border rounded-3xl p-6 md:p-8 animate-in zoom-in-95 duration-200`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${isDark ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600'}`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h4 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Stop Sharing Location?</h4>
            <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Are you sure you want to stop emergency location sharing? This may prevent wardens from tracking your location during emergencies.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStopModal(false)}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-colors
                  ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                Cancel
              </button>
              <button
                onClick={handleStop}
                className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm tracking-wider uppercase transition-colors shadow-lg shadow-red-500/30">
                Stop Sharing
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-secure-tooltip { 
          background: rgba(15, 23, 42, 0.95) !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 8px !important;
          font-weight: 800 !important;
          font-size: 11px !important;
          padding: 6px 10px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
        }
        .custom-secure-tooltip::before {
          border-top-color: rgba(15, 23, 42, 0.95) !important;
        }
      `}</style>
    </>
  );
};

export default EmergencyLocationShareCard;
