import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import WardenHeader from '../layout/WardenHeader';
import {
  approveOuting,
  rejectOuting,
  getWardenOutings,
} from '../../../../firebase/cloudFunctions';
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Eye,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import {
  outingStatusConfig,
  timingStatusConfig,
  formatDateTime,
  formatDate,
  formatDuration,
  validateApprovalForm,
  getMinOutTime,
  getMaxReturnTime,
  datetimeLocalToISO,
} from '../../../../utils/outingUtils';
import './WardenOutingRequests.css';

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════

const WardenOutingRequests = () => {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();
  const { isCollapsed } = useOutletContext();
  const toast = useToast();

  // ── Data State ───────────────────────────────────────────────
  const [outings, setOutings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, history
  const [expandedOutingId, setExpandedOutingId] = useState(null);

  // ── Approval/Rejection Modal State ──────────────────────────
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedOutingForApproval, setSelectedOutingForApproval] = useState(null);
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedOutingForRejection, setSelectedOutingForRejection] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // ── Fetch outings in real-time ───────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const fetchOutings = async () => {
      try {
        setIsLoading(true);
        const result = await getWardenOutings();
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

  // ── Filtered outings by tab ──────────────────────────────────
  const filteredOutings = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return outings.filter(o => o.status === 'pending');
      case 'approved':
        return outings.filter(o => o.status === 'approved');
      case 'history':
        return outings.filter(o => o.status === 'completed' || o.status === 'rejected');
      default:
        return outings;
    }
  }, [outings, activeTab]);

  // ── Statistics ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const completed = outings.filter(o => o.status === 'completed');
    const onTime = completed.filter(o => o.timingStatus === 'on-time').length;
    const late = completed.filter(o => o.timingStatus === 'late').length;
    const veryLate = completed.filter(o => o.timingStatus === 'very-late').length;

    // Find students with most late entries
    const studentLateCount = {};
    completed.forEach(o => {
      if (o.timingStatus === 'late' || o.timingStatus === 'very-late') {
        studentLateCount[o.studentName] = (studentLateCount[o.studentName] || 0) + 1;
      }
    });

    const topLateStudents = Object.entries(studentLateCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total: outings.length,
      pending: outings.filter(o => o.status === 'pending').length,
      approved: outings.filter(o => o.status === 'approved').length,
      completed: completed.length,
      rejected: outings.filter(o => o.status === 'rejected').length,
      onTime,
      late,
      veryLate,
      onTimePercent: completed.length > 0 ? ((onTime / completed.length) * 100).toFixed(1) : 0,
      latePercent: completed.length > 0 ? ((late / completed.length) * 100).toFixed(1) : 0,
      topLateStudents,
    };
  }, [outings]);

  // ── Approval Handlers ────────────────────────────────────────
  const openApprovalModal = useCallback((outing) => {
    setSelectedOutingForApproval(outing);
    setExpectedReturnTime('');
    setShowApprovalModal(true);
  }, []);

  const handleApprove = async () => {
    if (!expectedReturnTime) {
      toast.error('Please select expected return time');
      return;
    }

    const validation = validateApprovalForm(expectedReturnTime, selectedOutingForApproval.outTime);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    try {
      setIsApproving(true);
      const isoTime = datetimeLocalToISO(expectedReturnTime);
      await approveOuting(selectedOutingForApproval.id, isoTime);

      toast.success('✅ Outing approved!');

      // Close modal
      setShowApprovalModal(false);

      // Refresh outings
      const result = await getWardenOutings();
      setOutings(result.outings || []);
    } catch (error) {
      console.error('Error approving outing:', error);
      toast.error(error.message || 'Failed to approve outing');
    } finally {
      setIsApproving(false);
    }
  };

  // ── Rejection Handlers ───────────────────────────────────────
  const openRejectionModal = useCallback((outing) => {
    setSelectedOutingForRejection(outing);
    setRejectionReason('');
    setShowRejectionModal(true);
  }, []);

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsRejecting(true);
      await rejectOuting(selectedOutingForRejection.id, rejectionReason);

      toast.success('❌ Outing rejected');

      // Close modal
      setShowRejectionModal(false);

      // Refresh outings
      const result = await getWardenOutings();
      setOutings(result.outings || []);
    } catch (error) {
      console.error('Error rejecting outing:', error);
      toast.error(error.message || 'Failed to reject outing');
    } finally {
      setIsRejecting(false);
    }
  };

  // ── Get min/max times ────────────────────────────────────────
  const getMinReturnTime = () => {
    if (!selectedOutingForApproval) return '';
    return selectedOutingForApproval.outTime;
  };

  const getMaxReturnTimeForApproval = () => {
    if (!selectedOutingForApproval) return '';
    return getMaxReturnTime(selectedOutingForApproval.outTime);
  };

  return (
    <div className={`warden-outing-container ${isDark ? 'dark' : 'light'}`}>
      <WardenHeader title="Outing Requests" icon={MapPin} />

      <div className="outing-content">
        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 1: STATISTICS */}
        {/* ════════════════════════════════════════════════════════ */}
        <div className="outing-section outing-stats-section">
          <div className="section-header">
            <h2>📊 Outing Statistics</h2>
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

          {stats.completed > 0 && (
            <>
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
                  <div className="breakdown-bar" style={{ width: `${(100 - parseFloat(stats.onTimePercent) - parseFloat(stats.latePercent)).toFixed(1)}%` }}></div>
                  <span>Very Late: {stats.veryLate}</span>
                </div>
              </div>

              {stats.topLateStudents.length > 0 && (
                <div className="top-late-students">
                  <h4>⚠️ Students with Most Late Returns</h4>
                  <ul>
                    {stats.topLateStudents.map(([name, count]) => (
                      <li key={name}>
                        <span>{name}</span>
                        <span className="late-badge">{count}x late</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════ */}
        {/* SECTION 2: TABS */}
        {/* ════════════════════════════════════════════════════════ */}
        <div className="outing-section outing-list-section">
          <div className="section-header">
            <h2>📋 Manage Requests</h2>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={18} />
              Pending ({stats.pending})
            </button>
            <button
              className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              <CheckCircle2 size={18} />
              Approved ({stats.approved})
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Calendar size={18} />
              History ({stats.completed + stats.rejected})
            </button>
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
              <p>No outing requests in this category</p>
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
                        <div className="item-student-destination">
                          <div className="student-name">👤 {outing.studentName}</div>
                          <div className="destination">
                            <MapPin size={16} />
                            {outing.destination}
                          </div>
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
                      <div className="item-info">
                        <div className="item-date">{formatDate(outing.createdAt)}</div>
                        <Eye size={18} className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
                      </div>
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
                          <>
                            <div className="detail-row">
                              <span className="label">⏰ Expected Return:</span>
                              <span className="value">{formatDateTime(outing.expectedReturnTime)}</span>
                            </div>
                            <div className="detail-row">
                              <span className="label">Duration:</span>
                              <span className="value">{formatDuration(outing.outTime, outing.expectedReturnTime)}</span>
                            </div>
                          </>
                        )}

                        {outing.actualReturnTime && (
                          <div className="detail-row">
                            <span className="label">✅ Actual Return:</span>
                            <span className="value">{formatDateTime(outing.actualReturnTime)}</span>
                          </div>
                        )}

                        {outing.rejectionReason && (
                          <div className="detail-row rejection">
                            <span className="label">❌ Rejection Reason:</span>
                            <span className="value">{outing.rejectionReason}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {outing.status === 'pending' && (
                          <div className="action-buttons">
                            <button
                              className="btn-approve"
                              onClick={() => openApprovalModal(outing)}
                            >
                              ✅ Approve
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => openRejectionModal(outing)}
                            >
                              ❌ Reject
                            </button>
                          </div>
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
      {/* MODAL: APPROVE OUTING */}
      {/* ════════════════════════════════════════════════════════ */}
      {showApprovalModal && selectedOutingForApproval && (
        <div className="modal-overlay" onClick={() => !isApproving && setShowApprovalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Outing Request ✅</h3>
              <button
                className="modal-close"
                onClick={() => setShowApprovalModal(false)}
                disabled={isApproving}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="outing-summary">
                <div className="summary-row">
                  <span className="label">Student:</span>
                  <span className="value">{selectedOutingForApproval.studentName}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Destination:</span>
                  <span className="value">{selectedOutingForApproval.destination}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Reason:</span>
                  <span className="value">{selectedOutingForApproval.reason}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Out Time:</span>
                  <span className="value">{formatDateTime(selectedOutingForApproval.outTime)}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="returnTime">Expected Return Time *</label>
                <input
                  id="returnTime"
                  type="datetime-local"
                  value={expectedReturnTime}
                  onChange={e => setExpectedReturnTime(e.target.value)}
                  className="form-input"
                  min={getMinReturnTime()}
                  max={getMaxReturnTimeForApproval()}
                  disabled={isApproving}
                />
                <small>Must be after out time and within 24 hours</small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowApprovalModal(false)}
                disabled={isApproving}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleApprove}
                disabled={isApproving || !expectedReturnTime}
              >
                {isApproving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Approving...
                  </>
                ) : (
                  '✅ Approve Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL: REJECT OUTING */}
      {/* ════════════════════════════════════════════════════════ */}
      {showRejectionModal && selectedOutingForRejection && (
        <div className="modal-overlay" onClick={() => !isRejecting && setShowRejectionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Outing Request ❌</h3>
              <button
                className="modal-close"
                onClick={() => setShowRejectionModal(false)}
                disabled={isRejecting}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="outing-summary">
                <div className="summary-row">
                  <span className="label">Student:</span>
                  <span className="value">{selectedOutingForRejection.studentName}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Destination:</span>
                  <span className="value">{selectedOutingForRejection.destination}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Requested Out Time:</span>
                  <span className="value">{formatDateTime(selectedOutingForRejection.outTime)}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reason">Rejection Reason *</label>
                <textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="form-textarea"
                  rows="4"
                  placeholder="Explain why you're rejecting this request..."
                  maxLength="500"
                  disabled={isRejecting}
                />
                <small>{rejectionReason.length}/500 characters</small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowRejectionModal(false)}
                disabled={isRejecting}
              >
                Cancel
              </button>
              <button
                className="btn-confirm btn-reject-confirm"
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
              >
                {isRejecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  '❌ Reject Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardenOutingRequests;
