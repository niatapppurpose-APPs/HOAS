import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { LocateFixed, MapPin, RefreshCw, ShieldCheck, Activity, Users, ChevronRight } from 'lucide-react';
import { useToast } from '../Toast';
import { getActiveEmergencyLocations } from '../../firebase/cloudFunctions';
import HighAlertNotification from './HighAlertNotification';
import { useTheme } from '../../context/ThemeContext';
import './EmergencyLocation.css';
import 'leaflet/dist/leaflet.css';

const POLL_MS = 5000;
const PATH_LIMIT = 50;
const HIGH_ALERT_WINDOW_MS = 60 * 1000;
const HIGH_ALERT_DISMISS_MS = 2 * 60 * 1000;

const formatDateTime = (epoch) => {
  if (!epoch) return 'N/A';
  return new Date(epoch).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const hasMoved = (prevPoint, nextPoint) => {
  if (!prevPoint || !nextPoint) return true;
  const latDiff = Math.abs(prevPoint[0] - nextPoint[0]);
  const lngDiff = Math.abs(prevPoint[1] - nextPoint[1]);
  return latDiff > 0.00001 || lngDiff > 0.00001;
};

const easeOutCubic = (t) => 1 - ((1 - t) ** 3);

const MapViewportController = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    const zoom = Math.max(map.getZoom(), 15);
    map.flyTo(center, zoom, {
      animate: true,
      duration: 1.2,
    });
  }, [center, map]);

  return null;
};

const tonePalette = {
  warden: { track: '#f59e0b', markerBorder: '#b45309', markerFill: '#f59e0b', accuracyBorder: '#b45309', accuracyFill: '#fbbf24' },
  management: { track: '#6366f1', markerBorder: '#4338ca', markerFill: '#6366f1', accuracyBorder: '#4338ca', accuracyFill: '#818cf8' },
};

const EmergencyLocationMonitor = ({ title = 'Emergency Live Locations', tone = 'warden' }) => {
  const toast = useToast();
  const { isDark } = useTheme();
  const colors = tonePalette[tone] || tonePalette.warden;

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [trackByStudent, setTrackByStudent] = useState({});
  const [displayPosition, setDisplayPosition] = useState(null);
  const [highAlertStudentId, setHighAlertStudentId] = useState(null);

  const animationFrameRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const announcedAlertsRef = useRef(new Set());
  const alertTimeoutsRef = useRef({});

  const selectedLocation = useMemo(
    () => locations.find((location) => location.studentId === selectedStudentId) || locations[0] || null,
    [locations, selectedStudentId]
  );

  const selectedPath = useMemo(() => {
    if (!selectedLocation) return [];
    const tracked = trackByStudent[selectedLocation.studentId] || [];
    if (tracked.length > 0) return tracked;
    return [[selectedLocation.latitude, selectedLocation.longitude]];
  }, [selectedLocation, trackByStudent]);

  const animateMarkerTo = (target) => {
    const from = displayPosition || target;
    if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);

    const start = window.performance.now();
    const duration = 1500;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setDisplayPosition([
        from[0] + (target[0] - from[0]) * eased,
        from[1] + (target[1] - from[1]) * eased,
      ]);

      if (progress < 1) animationFrameRef.current = window.requestAnimationFrame(animate);
    };
    animationFrameRef.current = window.requestAnimationFrame(animate);
  };

  const queueHighAlert = (location) => {
    const alertKey = `${location.studentId}:${location.sharedAt}`;
    if (announcedAlertsRef.current.has(alertKey)) return;

    announcedAlertsRef.current.add(alertKey);
    setHighAlertStudentId(location.studentId);

    if (alertTimeoutsRef.current[location.studentId]) {
      window.clearTimeout(alertTimeoutsRef.current[location.studentId]);
    }

    alertTimeoutsRef.current[location.studentId] = window.setTimeout(() => {
      setHighAlertStudentId((current) => (current === location.studentId ? null : current));
      delete alertTimeoutsRef.current[location.studentId];
    }, HIGH_ALERT_DISMISS_MS);
  };

  const fetchLocations = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);

      const response = await getActiveEmergencyLocations();
      const data = Array.isArray(response?.data) ? response.data : [];
      const now = Date.now();

      data.forEach((item) => {
        const startedRecently = item.sharedAt && now - item.sharedAt < HIGH_ALERT_WINDOW_MS;
        if (startedRecently) queueHighAlert(item);
      });

      setLocations(data);

      setTrackByStudent((prev) => {
        const next = { ...prev };
        const activeIds = new Set(data.map((item) => item.studentId));

        data.forEach((item) => {
          const point = [item.latitude, item.longitude];
          const existingPath = next[item.studentId] || [];
          const lastPoint = existingPath[existingPath.length - 1];

          next[item.studentId] = hasMoved(lastPoint, point) ? [...existingPath, point].slice(-PATH_LIMIT) : existingPath;
        });
        Object.keys(next).forEach((studentId) => { if (!activeIds.has(studentId)) delete next[studentId]; });
        return next;
      });

      if (data.length > 0) {
        setSelectedStudentId((current) => (current && data.some((item) => item.studentId === current) ? current : data[0].studentId));
      } else {
        setSelectedStudentId(null);
        setDisplayPosition(null);
        setHighAlertStudentId(null);
      }
    } catch (error) {
      console.error('Emergency fetch error:', error);
      if (!silent) toast.error(error?.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    pollIntervalRef.current = window.setInterval(() => fetchLocations({ silent: true }), POLL_MS);
    return () => {
      if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
      Object.values(alertTimeoutsRef.current).forEach(window.clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    const target = [selectedLocation.latitude, selectedLocation.longitude];
    if (!displayPosition) { setDisplayPosition(target); return; }
    animateMarkerTo(target);
  }, [selectedLocation]);

  return (
    <>
      <HighAlertNotification
        studentName={highAlertStudentId ? locations.find((l) => l.studentId === highAlertStudentId)?.studentName || 'Student' : ''}
        isActive={Boolean(highAlertStudentId)}
        onDismiss={() => setHighAlertStudentId(null)}
      />

      <section className={`relative overflow-hidden rounded-[2rem] border p-6 md:p-8 backdrop-blur-2xl transition-all duration-500 shadow-2xl ${isDark ? 'bg-slate-900/40 border-slate-700/50 shadow-black/50' : 'bg-white/60 border-white/60 shadow-indigo-900/5'} tone-${tone}`}>
        {/* Soft Inner Glow effect */}
        <div className="absolute top-0 right-0 -m-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -m-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-2 border 
                bg-red-500/10 text-red-500 border-red-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Safety Operations
            </div>
            <h3 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-rose-400`}>
              {title}
            </h3>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-2`}>
              Monitor exact positioning of students requesting immediate assistance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchLocations()}
            disabled={loading}
            className={`group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 border backdrop-blur-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100
              ${isDark ? 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50 hover:shadow-lg hover:shadow-slate-900/50' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:shadow-xl hover:shadow-indigo-500/10'}`}
          >
            <RefreshCw className={`w-4 h-4 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            {loading ? 'Syncing...' : 'Refresh Radar'}
          </button>
        </div>

        {/* Live Status Overview Band */}
        <div className={`relative z-10 mb-6 flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md transition-colors 
            ${locations.length > 0 ? (isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100') : (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100')}`}>
          <div className={`p-3 rounded-xl ${locations.length > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'} shadow-lg`}>
            {locations.length > 0 ? <Activity className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {locations.length} {locations.length === 1 ? 'Active Emergency' : 'Active Emergencies'}
            </h4>
            <p className={`text-xs font-semibold ${locations.length > 0 ? "text-red-500" : "text-emerald-500"}`}>
              {locations.length > 0 ? 'Immediate action may be required.' : 'All clear. No active distress signals.'}
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
          {/* Active Sessions List View */}
          <div className="lg:col-span-4 max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading && locations.length === 0 ? (
              <div className={`p-8 rounded-2xl text-center border border-dashed ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-300 bg-slate-50'}`}>
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-400" />
                <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Scanning frequencies...</p>
              </div>
            ) : locations.length === 0 ? (
              <div className={`p-10 rounded-2xl text-center border border-dashed flex flex-col items-center justify-center
                  ${isDark ? 'border-slate-700 bg-slate-800/20' : 'border-slate-300 bg-slate-50/50'}`}>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Environment Secure</p>
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No active tracking sessions at this moment.</p>
              </div>
            ) : (
              locations.map((item) => {
                const isActive = selectedLocation?.studentId === item.studentId;
                return (
                  <button
                    key={item.studentId}
                    onClick={() => setSelectedStudentId(item.studentId)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border-2 relative overflow-hidden group hover:-translate-y-1
                      ${isActive
                        ? (isDark ? 'bg-slate-800 border-red-500/50 shadow-[0_8px_20px_rgba(239,68,68,0.15)]' : 'bg-white border-red-500 shadow-xl shadow-red-500/10')
                        : (isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600' : 'bg-white/80 border-transparent hover:bg-white hover:shadow-lg')}`}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-bold text-base flex items-center gap-2 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.studentName || 'Student'}
                          {isActive && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                        </h5>
                        <p className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Accuracy: {item.accuracy ? <span className={isDark ? "text-slate-200" : "text-slate-700"}>{Math.round(item.accuracy)}m</span> : 'N/A'}
                        </p>
                        <p className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <Activity size={10} /> Pinged {formatDateTime(item.lastUpdatedAt || item.sharedAt)}
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? 'text-red-500 translate-x-1' : (isDark ? 'text-slate-600 group-hover:text-slate-400' : 'text-slate-300 group-hover:text-slate-500')}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Map View */}
          <div className={`lg:col-span-8 min-h-[400px] h-[500px] relative rounded-[2rem] overflow-hidden border shadow-2xl z-10 ${isDark ? 'dark-map-wrapper bg-slate-900 border-slate-700/60' : 'bg-slate-100 border-slate-300 light-map-wrapper'}`}>
            {selectedLocation ? (
              <>
                <div className={`absolute top-4 left-4 z-[1000] px-4 py-2 rounded-xl backdrop-blur-xl border shadow-lg flex items-center gap-2
                    ${isDark ? 'bg-slate-900/80 border-slate-700 text-white' : 'bg-white/90 border-white text-slate-800'}`}>
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">{selectedLocation.studentName}</span>
                </div>

                <MapContainer
                  center={displayPosition || [selectedLocation.latitude, selectedLocation.longitude]}
                  zoom={17}
                  className={`w-full h-full ${isDark ? 'dark-map-tiles' : 'light-map-tiles'}`}
                  scrollWheelZoom
                  zoomControl={false}
                >
                  <TileLayer
                    attribution="&copy; <a href='https://openstreetmap.org/copyright'>OpenStreetMap</a>"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapViewportController center={displayPosition || [selectedLocation.latitude, selectedLocation.longitude]} />
                  {selectedPath.length > 1 && (
                    <Polyline
                      positions={selectedPath}
                      pathOptions={{ color: isDark ? '#ef4444' : '#2563eb', weight: 4, opacity: 0.8 }}
                    />
                  )}
                  <Circle
                    center={displayPosition || [selectedLocation.latitude, selectedLocation.longitude]}
                    radius={Math.max(Number(selectedLocation.accuracy) || 25, 20)}
                    pathOptions={{
                      color: isDark ? '#3b82f6' : '#2563eb',
                      fillColor: isDark ? '#3b82f6' : '#3b82f6',
                      fillOpacity: isDark ? 0.2 : 0.15,
                      weight: 1.5,
                      dashArray: '4 4'
                    }}
                  />
                  <CircleMarker
                    center={displayPosition || [selectedLocation.latitude, selectedLocation.longitude]}
                    radius={10}
                    pathOptions={{
                      color: '#fff',
                      fillColor: '#ef4444',
                      fillOpacity: 1,
                      weight: 3,
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -12]} className="custom-premium-tooltip">
                      {selectedLocation.studentName}
                    </Tooltip>
                  </CircleMarker>
                </MapContainer>

                <div className={`absolute bottom-4 left-4 z-[1000] px-3 py-1.5 rounded-lg backdrop-blur-md border flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest
                    ${isDark ? 'bg-slate-900/60 border-slate-700/50 text-slate-300' : 'bg-white/80 border-white/50 text-slate-600'}`}>
                  <LocateFixed className="w-3.5 h-3.5" /> GPS FIX ACTIVE
                </div>
              </>
            ) : (
              <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center
                  ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                <MapPin className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-semibold max-w-sm">
                  Map interface is currently dormant. Select an active emergency session to initiate live student tracking.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
        .custom-premium-tooltip { 
          background: rgba(15, 23, 42, 0.9) !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          font-weight: bold !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .custom-premium-tooltip::before {
          border-top-color: rgba(15, 23, 42, 0.9) !important;
        }
      `}</style>
    </>
  );
};

export default EmergencyLocationMonitor;
