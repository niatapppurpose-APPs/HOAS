import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import StudentHeader from '../layout/StudentHeader';
import { db } from '../../../../firebase/firebaseConfig';
import {
    collection, addDoc, query, where, onSnapshot,
    serverTimestamp, doc, updateDoc, orderBy
} from 'firebase/firestore';
import {
    Calendar, Clock, Plus, X, MapPin, FileText,
    CheckCircle, XCircle, Loader2, AlertCircle,
    ChevronDown, ChevronUp, Filter, Search,
    CalendarDays, ArrowRight, Home, LogOut
} from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'amber', icon: Clock },
    approved: { label: 'Approved', color: 'green', icon: CheckCircle },
    denied: { label: 'Denied', color: 'red', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'gray', icon: XCircle },
};

const LEAVE_TYPES = [
    { value: 'home_visit', label: 'Home Visit', icon: '🏠' },
    { value: 'medical', label: 'Medical Leave', icon: '🏥' },
    { value: 'family_emergency', label: 'Family Emergency', icon: '👨‍👩‍👧' },
    { value: 'academic', label: 'Academic Event', icon: '📚' },
    { value: 'personal', label: 'Personal Work', icon: '📋' },
    { value: 'outing', label: 'Day Outing', icon: '🚶' },
    { value: 'other', label: 'Other', icon: '📝' },
];

const StudentLeaveRequests = () => {
    const { user, userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const toast = useToast();

    const [showForm, setShowForm] = useState(false);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const [formData, setFormData] = useState({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        destination: '',
        contactNumber: '',
        parentContact: '',
    });

    // Fetch leave requests
    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'leaveRequests'),
            where('studentId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
            if (snapshot.metadata.fromCache && snapshot.empty) return;

            const list = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })).sort((a, b) => {
                const tA = a.createdAt?.toMillis?.() ?? 0;
                const tB = b.createdAt?.toMillis?.() ?? 0;
                return tB - tA;
            });
            setLeaves(list);
            setLoading(false);
        }, (error) => {
            console.error('Leave fetch error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
            toast.error('Please fill all required fields');
            return;
        }

        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            toast.error('End date must be after start date');
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'leaveRequests'), {
                studentId: user.uid,
                studentName: userData?.fullName || user?.displayName || '',
                studentEmail: user.email,
                roomNumber: userData?.roomNumber || '',
                hostelName: userData?.hostelName || '',
                collegeName: userData?.collegeName || '',
                managementId: userData?.managementId || '',
                wardenId: userData?.wardenId || '',
                ...formData,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success('Leave request submitted successfully!');
            setFormData({
                leaveType: '', startDate: '', endDate: '',
                reason: '', destination: '', contactNumber: '', parentContact: ''
            });
            setShowForm(false);
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Failed to submit leave request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (leaveId) => {
        try {
            await updateDoc(doc(db, 'leaveRequests', leaveId), {
                status: 'cancelled',
                updatedAt: serverTimestamp(),
            });
            toast.success('Leave request cancelled');
        } catch (error) {
            console.error('Cancel error:', error);
            toast.error('Failed to cancel leave request');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getDaysDiff = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
        return diff;
    };

    const filteredLeaves = leaves.filter(l => {
        if (filterStatus !== 'all' && l.status !== filterStatus) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                l.reason?.toLowerCase().includes(q) ||
                l.destination?.toLowerCase().includes(q) ||
                l.leaveType?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const stats = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        denied: leaves.filter(l => l.status === 'denied').length,
    };

    return (
        <>
            <StudentHeader
                title="Leave Requests · Student Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    {[
                        { label: 'Total', value: stats.total, color: 'blue', icon: FileText },
                        { label: 'Pending', value: stats.pending, color: 'amber', icon: Clock },
                        { label: 'Approved', value: stats.approved, color: 'green', icon: CheckCircle },
                        { label: 'Denied', value: stats.denied, color: 'red', icon: XCircle },
                    ].map((s, i) => (
                        <div key={i} className="rounded-2xl border p-4 md:p-5 transition-all hover:scale-[1.02]"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                                    <p className={`text-2xl md:text-3xl font-black mt-1 text-${s.color}-500`}>{s.value}</p>
                                </div>
                                <div className={`p-2.5 rounded-xl bg-${s.color}-500/10`}>
                                    <s.icon className={`w-5 h-5 text-${s.color}-500`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search requests..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
                                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border text-sm"
                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all"
                    >
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showForm ? 'Cancel' : 'New Leave Request'}
                    </button>
                </div>

                {/* New Request Form */}
                {showForm && (
                    <div className="rounded-2xl border p-6 md:p-8 mb-6 shadow-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <h3 className="text-lg font-black uppercase tracking-tighter mb-6" style={{ color: 'var(--text-primary)' }}>
                            <CalendarDays className="inline w-5 h-5 text-blue-500 mr-2 -mt-0.5" />
                            Apply for Leave
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Leave Type */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Leave Type *</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {LEAVE_TYPES.map(lt => (
                                        <button
                                            key={lt.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, leaveType: lt.value }))}
                                            className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2 ${formData.leaveType === lt.value
                                                ? 'border-blue-500 bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/30'
                                                : ''}`}
                                            style={formData.leaveType !== lt.value ? { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' } : undefined}
                                        >
                                            <span>{lt.icon}</span> {lt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Start Date *</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required
                                        className="w-full px-4 py-2.5 rounded-xl border text-sm"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>End Date *</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required
                                        className="w-full px-4 py-2.5 rounded-xl border text-sm"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            {formData.startDate && formData.endDate && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-bold">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    {getDaysDiff(formData.startDate, formData.endDate)} day(s) leave
                                </div>
                            )}

                            {/* Destination */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Destination</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                    <input type="text" name="destination" value={formData.destination} onChange={handleChange}
                                        placeholder="Where are you going?"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Reason *</label>
                                <textarea name="reason" value={formData.reason} onChange={handleChange} required rows={3}
                                    placeholder="Explain the reason for your leave..."
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            {/* Contact Numbers */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Your Contact</label>
                                    <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange}
                                        placeholder="Your phone number"
                                        className="w-full px-4 py-2.5 rounded-xl border text-sm"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Parent Contact</label>
                                    <input type="tel" name="parentContact" value={formData.parentContact} onChange={handleChange}
                                        placeholder="Parent/guardian phone"
                                        className="w-full px-4 py-2.5 rounded-xl border text-sm"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="px-5 py-2.5 rounded-xl border text-sm font-bold transition-all hover:bg-red-500/5"
                                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Requests List */}
                <div className="rounded-2xl border overflow-hidden shadow-sm"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <div className="p-5 md:p-6 border-b flex items-center justify-between"
                        style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>My Requests</h3>
                            <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
                                {filteredLeaves.length} request{filteredLeaves.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                        {loading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                                <p className="mt-4 text-xs font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading requests...</p>
                            </div>
                        ) : filteredLeaves.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-14 h-14 bg-blue-500/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/10">
                                    <Calendar className="w-7 h-7 text-blue-500 opacity-30" />
                                </div>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>No Leave Requests</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                    {filterStatus !== 'all' ? 'No requests match this filter.' : "You haven't submitted any leave requests yet."}
                                </p>
                            </div>
                        ) : (
                            filteredLeaves.map((leave) => {
                                const statusCfg = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                                const StatusIcon = statusCfg.icon;
                                const typeInfo = LEAVE_TYPES.find(t => t.value === leave.leaveType) || { label: leave.leaveType, icon: '📋' };
                                const isExpanded = expandedId === leave.id;

                                return (
                                    <div key={leave.id} className="transition-all" style={{ backgroundColor: isExpanded ? 'var(--bg-tertiary)' : undefined }}>
                                        <div
                                            className="p-4 md:p-5 flex items-center gap-3 md:gap-4 cursor-pointer hover:bg-blue-500/5 transition-all group"
                                            onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                                        >
                                            <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-${statusCfg.color}-500/10 flex items-center justify-center text-2xl`}>
                                                {typeInfo.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm md:text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                                        {typeInfo.label}
                                                    </p>
                                                    <span className={`text-[9px] md:text-[10px] px-2.5 py-1 rounded-lg font-black tracking-wider uppercase bg-${statusCfg.color}-500/10 text-${statusCfg.color}-600 border border-${statusCfg.color}-500/20 flex items-center gap-1`}>
                                                        <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <CalendarDays className="w-3 h-3 text-blue-500" />
                                                    <p className="text-[10px] md:text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                                        {leave.startDate} → {leave.endDate}
                                                        {leave.startDate && leave.endDate && (
                                                            <span className="ml-2 opacity-60">
                                                                ({getDaysDiff(leave.startDate, leave.endDate)} days)
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                                        </div>

                                        {isExpanded && (
                                            <div className="px-4 md:px-5 pb-5 pt-1 space-y-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {leave.reason && (
                                                        <div className="sm:col-span-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Reason</p>
                                                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{leave.reason}</p>
                                                        </div>
                                                    )}
                                                    {leave.destination && (
                                                        <div className="p-3 rounded-xl flex items-start gap-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                                            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Destination</p>
                                                                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{leave.destination}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {leave.contactNumber && (
                                                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Contact</p>
                                                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{leave.contactNumber}</p>
                                                        </div>
                                                    )}
                                                    {leave.adminResponse && (
                                                        <div className="sm:col-span-2 p-3 rounded-xl border-l-4 border-blue-500" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-blue-500">Warden's Response</p>
                                                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{leave.adminResponse}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between pt-2">
                                                    <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                                        Submitted: {formatDate(leave.createdAt)}
                                                    </p>
                                                    {leave.status === 'pending' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCancel(leave.id); }}
                                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-1"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" /> Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentLeaveRequests;