import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import WardenHeader from '../layout/WardenHeader';
import { db } from '../../../../firebase/firebaseConfig';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  MapPin,
  Phone,
  FileText,
} from 'lucide-react';
import ContextChatBox from '../../../../components/ContextChat/ContextChatBox';

const STATUS = {
  pending: { label: 'Pending', icon: Clock, style: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  approved: { label: 'Approved', icon: CheckCircle2, style: 'text-green-600 bg-green-500/10 border-green-500/20' },
  denied: { label: 'Denied', icon: XCircle, style: 'text-red-600 bg-red-500/10 border-red-500/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, style: 'text-gray-600 bg-gray-500/10 border-gray-500/20' },
};

const prettyLeaveType = (value = '') =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDate = (value) => {
  if (!value) return '—';
  const date = value.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const WardenLeaveRequests = () => {
  const { userData } = useAuth();
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const toast = useToast();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const managementId = userData?.managementId;
    if (!managementId) {
      setLeaveRequests([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'leaveRequests'),
      where('managementId', '==', managementId)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }))
          .sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
          });

        setLeaveRequests(rows);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load leave requests:', error);
        toast.error('Unable to load leave requests');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userData?.managementId]);

  const stats = useMemo(() => ({
    total: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === 'pending').length,
    approved: leaveRequests.filter((r) => r.status === 'approved').length,
    denied: leaveRequests.filter((r) => r.status === 'denied').length,
  }), [leaveRequests]);

  const updateLeaveStatus = async (requestId, status) => {
    setUpdatingId(requestId);
    try {
      await updateDoc(doc(db, 'leaveRequests', requestId), {
        status,
        reviewedBy: userData?.uid || '',
        reviewedByName: userData?.fullName || userData?.displayName || 'Warden',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Leave request ${status}`);
    } catch (error) {
      console.error('Failed to update leave request:', error);
      toast.error('Failed to update leave request');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <WardenHeader
        title="Leave Requests · Warden Portal"
        pendingCount={stats.pending}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-500' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-500' },
            { label: 'Approved', value: stats.approved, color: 'text-green-500' },
            { label: 'Denied', value: stats.denied, color: 'text-red-500' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className={`text-2xl font-black mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <div className="p-5 border-b" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
            <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>
              <CalendarDays className="inline w-5 h-5 mr-2 text-orange-500 -mt-1" />
              Student Leave Requests
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
              <p className="mt-3 text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>
                Loading leave requests...
              </p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30 text-orange-500" />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                No leave requests found.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {leaveRequests.map((item) => {
                const statusConfig = STATUS[item.status] || STATUS.pending;
                const StatusIcon = statusConfig.icon;
                const isUpdating = updatingId === item.id;

                return (
                  <div key={item.id} className="p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>
                            {prettyLeaveType(item.leaveType || 'other')}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] uppercase tracking-wider font-black ${statusConfig.style}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {item.studentName || 'Unknown Student'}</p>
                          <p className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {formatDate(item.startDate)} → {formatDate(item.endDate)}</p>
                          <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {item.destination || 'Not specified'}</p>
                          <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {item.contactNumber || item.parentContact || 'No contact provided'}</p>
                        </div>

                        {item.reason && (
                          <div className="mt-3 p-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            <FileText className="inline w-4 h-4 mr-1.5 text-orange-500 -mt-0.5" />
                            {item.reason}
                          </div>
                        )}

                        <div className="mt-3">
                          <ContextChatBox
                            contextType="leave"
                            contextId={item.id}
                            title="Leave Request Chat"
                          />
                        </div>
                      </div>

                      {item.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            disabled={isUpdating}
                            onClick={() => updateLeaveStatus(item.id, 'denied')}
                            className="px-3 py-2 rounded-lg border text-xs font-bold text-red-600 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {isUpdating ? 'Updating...' : 'Deny'}
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => updateLeaveStatus(item.id, 'approved')}
                            className="px-3 py-2 rounded-lg border text-xs font-bold text-green-600 border-green-500/30 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50"
                          >
                            {isUpdating ? 'Updating...' : 'Approve'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WardenLeaveRequests;
