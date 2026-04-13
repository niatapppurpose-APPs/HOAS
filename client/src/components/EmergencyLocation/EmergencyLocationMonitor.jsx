import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { LocateFixed, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { useToast } from '../Toast';
import { getActiveEmergencyLocations } from '../../firebase/cloudFunctions';
import HighAlertNotification from './HighAlertNotification';
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
      duration: 1,
    });
  }, [center, map]);

  return null;
};

const tonePalette = {
  warden: {
    track: '#f59e0b',
    markerBorder: '#b45309',
    markerFill: '#f59e0b',
    accuracyBorder: '#b45309',
    accuracyFill: '#fbbf24',
  },
  management: {
    track: '#6366f1',
    markerBorder: '#4338ca',
    markerFill: '#6366f1',
    accuracyBorder: '#4338ca',
    accuracyFill: '#818cf8',
  },
};

const EmergencyLocationMonitor = ({ title = 'Emergency Live Locations', tone = 'warden' }) => {
  const toast = useToast();
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

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

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

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
  };

  const queueHighAlert = (location) => {
    const alertKey = `${location.studentId}:${location.sharedAt}`;

    if (announcedAlertsRef.current.has(alertKey)) {
      return;
    }

    announcedAlertsRef.current.add(alertKey);
    setHighAlertStudentId(location.studentId);

    if (alertTimeoutsRef.current[location.studentId]) {
      window.clearTimeout(alertTimeoutsRef.current[location.studentId]);
    }

    alertTimeoutsRef.current[location.studentId] = window.setTimeout(() => {
      setHighAlertStudentId((current) => (
        current === location.studentId ? null : current
      ));
      delete alertTimeoutsRef.current[location.studentId];
    }, HIGH_ALERT_DISMISS_MS);
  };

  const fetchLocations = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const response = await getActiveEmergencyLocations();
      const data = Array.isArray(response?.data) ? response.data : [];
      const now = Date.now();

      data.forEach((item) => {
        const startedRecently = item.sharedAt && now - item.sharedAt < HIGH_ALERT_WINDOW_MS;
        if (startedRecently) {
          queueHighAlert(item);
        }
      });

      setLocations(data);

      setTrackByStudent((prev) => {
        const next = { ...prev };
        const activeIds = new Set(data.map((item) => item.studentId));

        data.forEach((item) => {
          const point = [item.latitude, item.longitude];
          const existingPath = next[item.studentId] || [];
          const lastPoint = existingPath[existingPath.length - 1];

          next[item.studentId] = hasMoved(lastPoint, point)
            ? [...existingPath, point].slice(-PATH_LIMIT)
            : existingPath;
        });

        Object.keys(next).forEach((studentId) => {
          if (!activeIds.has(studentId)) {
            delete next[studentId];
          }
        });

        return next;
      });

      if (data.length > 0) {
        setSelectedStudentId((current) => (
          current && data.some((item) => item.studentId === current)
            ? current
            : data[0].studentId
        ));
      } else {
        setSelectedStudentId(null);
        setDisplayPosition(null);
        setHighAlertStudentId(null);
      }
    } catch (error) {
      console.error('Emergency locations fetch error:', error);
      if (!silent) {
        toast.error(error?.message || 'Failed to load emergency locations');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    pollIntervalRef.current = window.setInterval(() => {
      fetchLocations({ silent: true });
    }, POLL_MS);

    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      Object.values(alertTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    const target = [selectedLocation.latitude, selectedLocation.longitude];

    if (!displayPosition) {
      setDisplayPosition(target);
      return;
    }

    animateMarkerTo(target);
  }, [selectedLocation]);

  return (
    <>
      <HighAlertNotification
        studentName={
          highAlertStudentId
            ? locations.find((location) => location.studentId === highAlertStudentId)?.studentName || 'Student'
            : ''
        }
        isActive={Boolean(highAlertStudentId)}
        onDismiss={() => setHighAlertStudentId(null)}
      />

      <section className={`emergency-monitor-card tone-${tone} rounded-[1.25rem] border p-4 md:rounded-[1.5rem] md:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="emergency-eyebrow">Safety Operations</p>
            <h3 className="emergency-title">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => fetchLocations()}
            disabled={loading}
            className="emergency-refresh-button disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-4 emergency-status-band">
          <ShieldCheck className="h-4 w-4" />
          <span>{locations.length} active emergency session{locations.length === 1 ? '' : 's'}</span>
        </div>

        <div className="mt-4 emergency-monitor-grid">
          <div className="emergency-list-panel">
            {loading && locations.length === 0 ? (
              <p className="text-sm opacity-70">Loading active emergency locations...</p>
            ) : locations.length === 0 ? (
              <p className="text-sm opacity-70">No active emergency location sharing right now.</p>
            ) : (
              locations.map((item) => (
                <button
                  key={item.studentId}
                  type="button"
                  onClick={() => setSelectedStudentId(item.studentId)}
                  className={`emergency-list-item ${selectedLocation?.studentId === item.studentId ? 'selected' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{item.studentName || 'Student'}</p>
                    <span className="text-[10px] opacity-70">{formatDateTime(item.sharedAt)}</span>
                  </div>
                  <p className="mt-1 text-xs opacity-80">
                    Lat: {Number(item.latitude).toFixed(5)}, Lng: {Number(item.longitude).toFixed(5)}
                  </p>
                  <p className="mt-1 text-xs opacity-70">
                    Accuracy: {item.accuracy ? `${Math.round(item.accuracy)}m` : 'N/A'}
                  </p>
                  <p className="mt-1 text-[11px] opacity-60">
                    Updated: {formatDateTime(item.lastUpdatedAt || item.sharedAt)}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="emergency-map-panel">
            {selectedLocation ? (
              <>
                <div className="map-headline">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedLocation.studentName} live map</span>
                </div>
                <MapContainer
                  center={displayPosition || [selectedLocation.latitude, selectedLocation.longitude]}
                  zoom={16}
                  className="emergency-map-frame"
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapViewportController center={displayPosition || [selectedLocation.latitude, selectedLocation.longitude]} />
                  {selectedPath.length > 1 && (
                    <Polyline
                      positions={selectedPath}
                      pathOptions={{ color: colors.track, weight: 4, opacity: 0.72 }}
                    />
                  )}
                  <Circle
                    center={displayPosition || [selectedLocation.latitude, selectedLocation.longitude]}
                    radius={Math.max(Number(selectedLocation.accuracy) || 25, 20)}
                    pathOptions={{
                      color: colors.accuracyBorder,
                      fillColor: colors.accuracyFill,
                      fillOpacity: 0.12,
                      weight: 1.5,
                    }}
                  />
                  <CircleMarker
                    center={displayPosition || [selectedLocation.latitude, selectedLocation.longitude]}
                    radius={10}
                    pathOptions={{
                      color: colors.markerBorder,
                      fillColor: colors.markerFill,
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -10]}>
                      {selectedLocation.studentName}
                    </Tooltip>
                  </CircleMarker>
                </MapContainer>
                <div className="mt-2 flex items-center gap-2 text-xs opacity-75">
                  <LocateFixed className="h-3.5 w-3.5" />
                  Last update: {formatDateTime(selectedLocation.lastUpdatedAt || selectedLocation.sharedAt)}
                </div>
              </>
            ) : (
              <div className="empty-map-state">Select an active student to view map location.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default EmergencyLocationMonitor;
