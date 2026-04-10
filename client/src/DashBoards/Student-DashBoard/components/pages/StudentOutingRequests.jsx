import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import StudentHeader from '../layout/StudentHeader';
import { useNotifications } from '../../../../context/NotificationContext';
import {
  requestOuting,
  markStudentReturn,
  getStudentOutings,
} from '../../../../firebase/cloudFunctions';
import {
  MapPin,
  Send,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  outingStatusConfig,
  timingStatusConfig,
  formatDateTime,
  formatDate,
  formatTime,
  formatDuration,
  validateOutingForm,
  getActiveOuting,
  calculateLateStatistics,
  getMinOutTime,
  getMaxReturnTime,
  datetimeLocalToISO,
} from '../../../../utils/outingUtils';
import './StudentOutingRequests.css';

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════

const StudentOutingRequests = () => {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();
  const { isCollapsed } = useOutletContext();
  const toast = useToast();
  const { notifications } = useNotifications();

  // ── Form State ───────────────────────────────────────────────
  const [formData, setFormData] = useState({
    destination: '',
    reason: '',
    outTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Outing History State ─────────────────────────────────────
  const [outings, setOutings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedOutingId, setExpandedOutingId] = useState(null);
  const [showMarkReturnModal, setShowMarkReturnModal] = useState(false);
  const [selectedOutingForReturn, setSelectedOutingForReturn] = useState(null);
  const [actualReturnTime, setActualReturnTime] = useState('');
  const [isMarkingReturn, setIsMarkingReturn] = useState(false);

  // ── Fetch outings in real-time ───────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const fetchOutings = async () => {
      try {
        setIsLoading(true);
        const result = await getStudentOutings();
        setOutings(result.outings || []);
      } catch (error) {
        console.error('Error fetching outings:', error);
        toast.error('Failed to load outing requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutings();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOutings, 30000);
    return () => clearInterval(interval);
  }, [user?.uid, toast]);

  // ── Filtered outings (memoized) ──────────────────────────────
  const filteredOutings = useMemo(() => {
    if (activeFilter === 'all') return outings;
    return outings.filter(o => o.status === activeFilter);
  }, [outings, activeFilter]);

  // ── Active outing ────────────────────────────────────────────
  const activeOuting = useMemo(() => getActiveOuting(outings), [outings]);

  // ── Statistics (memoized) ────────────────────────────────────
  const stats = useMemo(() => {
    return {
      total: outings.length,
      pending: outings.filter(o => o.status === 'pending').length,
      approved: outings.filter(o => o.status === 'approved').length,
      completed: outings.filter(o => o.status === 'completed').length,
      rejected: outings.filter(o => o.status === 'rejected').length,
      ...calculateLateStatistics(outings),
    };
  }, [outings]);

  // ── Form Handlers ────────────────────────────────────────────
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateOutingForm(formData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    if (!userData?.wardenId) {
      toast.error('Warden not assigned. Contact management.');
      return;
    }

    try {
      setIsSubmitting(true);
      const isoTime = datetimeLocalToISO(formData.outTime);
      const result = await requestOuting(
        formData.destination.trim(),
        formData.reason.trim(),
        isoTime
      );

      toast.success('✅ Outing request submitted successfully!');

      // Reset form
      setFormData({ destination: '', reason: '', outTime: '' });

      // Refresh outings
      const updatedResult = await getStudentOutings();
      setOutings(updatedResult.outings || []);
    } catch (error) {
      console.error('Error submitting outing request:', error);
      toast.error(error.message || 'Failed to submit outing request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Mark Return Handlers ─────────────────────────────────────
  const openMarkReturnModal = useCallback((outing) => {
    setSelectedOutingForReturn(outing);
    setActualReturnTime('');
    setShowMarkReturnModal(true);
  }, []);

  const handleMarkReturn = async () => {
    if (!actualReturnTime) {
      toast.error('Please select return time');
      return;
    }

    try {
      setIsMarkingReturn(true);
      const isoTime = datetimeLocalToISO(actualReturnTime);
      const result = await markStudentReturn(selectedOutingForReturn.id, isoTime);

      toast.success(`✅ Return marked as ${result.timingStatus}!`);

      // Close modal
      setShowMarkReturnModal(false);

      // Refresh outings
      const updatedResult = await getStudentOutings();
      setOutings(updatedResult.outings || []);
    } catch (error) {
      console.error('Error marking return:', error);
      toast.error(error.message || 'Failed to mark return');
    } finally {
      setIsMarkingReturn(false);
    }
  };

  // ── Get min/max times for inputs ─────────────────────────────
  const minOutTime = getMinOutTime();

  return (
    <div className={`student-outing-container ${isDark ? 'dark' : 'light'}`}>
      <StudentHeader title="Outing Requests" icon={MapPin} />

      <div className="outing-content">
        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 1: REQUEST FORM */}
        {/* ════════════════════════════════════════════════════════ */}
        <div className="outing-section outing-form-section">
          <div className="section-header">
            <h2>📋 Request New Outing</h2>
            {activeOuting && <p className="status-hint">⚠️ You have an active request</p>}
          </div>

          <form onSubmit={handleSubmit} className="outing-form">
            {/* Destination */}
            <div className="form-group">
              <label htmlFor="destination">
                <MapPin size={18} /> Destination
              </label>
              <input
                id="destination"
                type="text"
                name="destination"
                placeholder="e.g., Market, Library, Home"
                value={formData.destination}
                onChange={handleFormChange}
                className="form-input"
                maxLength="100"
                disabled={isSubmitting}
              />
              <small>{formData.destination.length}/100 characters</small>
            </div>

            {/* Reason */}
            <div className="form-group">
              <label htmlFor="reason">Reason</label>
              <textarea
                id="reason"
                name="reason"
                placeholder="Why do you need to go out?"
                value={formData.reason}
                onChange={handleFormChange}
                className="form-textarea"
                rows="3"
                maxLength="500"
                disabled={isSubmitting}
              />
              <small>{formData.reason.length}/500 characters</small>
            </div>

            {/* Out Time */}
            <div className="form-group">
              <label htmlFor="outTime">
                <Clock size={18} /> Out Time
              </label>
              <input
                id="outTime"
                type="datetime-local"
                name="outTime"
                value={formData.outTime}
                onChange={handleFormChange}
                className="form-input"
                min={minOutTime}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting || !formData.destination || !formData.reason || !formData.outTime}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Request
                </>
              )}
            </button>
          </form>
        </div>

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 2: ACTIVE OUTING */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeOuting && (
          <div className="outing-section outing-active-section">
            <div className="section-header">
              <h2>🚀 Active Outing</h2>
            </div>

            <div className="active-outing-card">
              <div className="card-header">
                <div className="card-title">
                  <MapPin size={20} />
                  {activeOuting.destination}
                </div>
                <div className={`status-badge ${outingStatusConfig[activeOuting.status]?.className}`}>
                  {outingStatusConfig[activeOuting.status]?.icon} {outingStatusConfig[activeOuting.status]?.label}
                </div>
              </div>

              <div className="card-details">
                <div className="detail-row">
                  <span className="label">📍 Reason:</span>
                  <span className="value">{activeOuting.reason}</span>
                </div>
                <div className="detail-row">
                  <span className="label">🕐 Out Time:</span>
                  <span className="value">{formatDateTime(activeOuting.outTime)}</span>
                </div>

                {activeOuting.status === 'approved' && (
                  <>
                    <div className="detail-row">
                      <span className="label">⏰ Expected Return:</span>
                      <span className="value">{formatDateTime(activeOuting.expectedReturnTime)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Duration:</span>
                      <span className="value">{formatDuration(activeOuting.outTime, activeOuting.expectedReturnTime)}</span>
                    </div>

                    <button
                      className="btn-mark-return"
                      onClick={() => openMarkReturnModal(activeOuting)}
                    >
                      ✅ Mark Return
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 3: STATISTICS */}
        {/* ════════════════════════════════════════════════════════ */}
        <div className="outing-section outing-stats-section">
          <div className="section-header">
            <h2>📊 My Statistics</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <Calendar size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Requests</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pending">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon approved">
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.approved}</div>
                <div className="stat-label">Approved</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon success">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.onTimePercent}%</div>
                <div className="stat-label">On-Time Rate</div>
              </div>
            </div>
          </div>

          {stats.total > 0 && (
            <div className="timing-breakdown">
              <div className="breakdown-item on-time">
                <div className="breakdown-bar" style={{ width: `${stats.onTimePercent}%` }}></div>
                <span>On Time: {stats.onTime}</span>
              </div>
              <div className="breakdown-item late">
                <div className="breakdown-bar" style={{ width: `${stats.latePercent}%` }}></div>
                <span>Late: {stats.late}</span>
              </div>
              <div className="breakdown-item very-late">
                <div className="breakdown-bar" style={{ width: `${stats.veryLatePercent}%` }}></div>
                <span>Very Late: {stats.veryLate}</span>
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 4: HISTORY */}
        {/* ════════════════════════════════════════════════════════ */}
        <div className="outing-section outing-history-section">
          <div className="section-header">
            <h2>📜 Outing History</h2>
          </div>

          {/* Filter Buttons */}
          <div className="filter-buttons">
            {['all', 'pending', 'approved', 'completed', 'rejected'].map(status => (
              <button
                key={status}
                className={`filter-btn ${activeFilter === status ? 'active' : ''}`}
                onClick={() => setActiveFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin" size={40} />
              <p>Loading outing requests...</p>
            </div>
          ) : filteredOutings.length === 0 ? (
            <div className="empty-state">
              <MapPin size={48} />
              <p>No outing requests yet</p>
              <small>Submit your first outing request above</small>
            </div>
          ) : (
            <div className="outings-list">
              {filteredOutings.map(outing => {
                const isExpanded = expandedOutingId === outing.id;
                const config = outingStatusConfig[outing.status];
                const timingConfig = outing.timingStatus ? timingStatusConfig[outing.timingStatus] : null;

                return (
                  <div key={outing.id} className="outing-item">
                    <div
                      className="item-header"
                      onClick={() => setExpandedOutingId(isExpanded ? null : outing.id)}
                    >
                      <div className="item-main">
                        <div className="item-destination">
                          <MapPin size={18} />
                          {outing.destination}
                        </div>
                        <div className="item-badges">
                          <span className={`badge ${config?.className}`}>
                            {config?.icon} {config?.label}
                          </span>
                          {timingConfig && (
                            <span className={`badge ${timingConfig.className}`}>
                              {timingConfig.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="item-date">
                        {formatDate(outing.createdAt)}
                      </div>
                      <Eye size={18} className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
                    </div>

                    {isExpanded && (
                      <div className="item-details">
                        <div className="detail-row">
                          <span className="label">📍 Reason:</span>
                          <span className="value">{outing.reason}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">🕐 Out Time:</span>
                          <span className="value">{formatDateTime(outing.outTime)}</span>
                        </div>

                        {outing.expectedReturnTime && (
                          <div className="detail-row">
                            <span className="label">⏰ Expected Return:</span>
                            <span className="value">{formatDateTime(outing.expectedReturnTime)}</span>
                          </div>
                        )}

                        {outing.actualReturnTime && (
                          <div className="detail-row">
                            <span className="label">✅ Actual Return:</span>
                            <span className="value">{formatDateTime(outing.actualReturnTime)}</span>
                          </div>
                        )}

                        {outing.rejectionReason && (
                          <div className="detail-row">
                            <span className="label">❌ Rejection Reason:</span>
                            <span className="value">{outing.rejectionReason}</span>
                          </div>
                        )}

                        {outing.status === 'approved' && !outing.actualReturnTime && (
                          <button
                            className="btn-mark-return-small"
                            onClick={() => openMarkReturnModal(outing)}
                          >
                            ✅ Mark Return
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL: MARK RETURN */}
      {/* ════════════════════════════════════════════════════════ */}
      {showMarkReturnModal && selectedOutingForReturn && (
        <div className="modal-overlay" onClick={() => !isMarkingReturn && setShowMarkReturnModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mark Your Return 🏠</h3>
              <button
                className="modal-close"
                onClick={() => setShowMarkReturnModal(false)}
                disabled={isMarkingReturn}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="outing-summary">
                <div className="summary-row">
                  <span className="label">Destination:</span>
                  <span className="value">{selectedOutingForReturn.destination}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Out Time:</span>
                  <span className="value">{formatDateTime(selectedOutingForReturn.outTime)}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Expected Return:</span>
                  <span className="value">{formatDateTime(selectedOutingForReturn.expectedReturnTime)}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="returnTime">Actual Return Time</label>
                <input
                  id="returnTime"
                  type="datetime-local"
                  value={actualReturnTime}
                  onChange={e => setActualReturnTime(e.target.value)}
                  className="form-input"
                  disabled={isMarkingReturn}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowMarkReturnModal(false)}
                disabled={isMarkingReturn}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleMarkReturn}
                disabled={isMarkingReturn || !actualReturnTime}
              >
                {isMarkingReturn ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Marking...
                  </>
                ) : (
                  '✅ Confirm Return'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentOutingRequests;
