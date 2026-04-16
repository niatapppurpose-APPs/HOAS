import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import WardenHeader from '../layout/WardenHeader';
import Avatar from '../../../../components/OwnerServices/Avatar';
import { db } from '../../../../firebase/firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import {
    Users, Search, Filter, Loader2, GraduationCap,
    Phone, Mail, Home, Hash, Building2, ChevronDown,
    ChevronUp, User, X, SortAsc, SortDesc,
    Eye, Calendar, CheckCircle, Clock
} from 'lucide-react';

const WardenStudents = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const toast = useToast();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortField, setSortField] = useState('fullName');
    const [sortDir, setSortDir] = useState('asc');
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Fetch students under this warden
    useEffect(() => {
        if (!userData?.managementId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('managementId', '==', userData.managementId)
        );

        const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
            if (snapshot.metadata.fromCache && snapshot.empty) return;

            const list = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            setStudents(list);
            setLoading(false);
        }, (error) => {
            console.error('Students fetch error:', error);
            toast.error('Failed to load students');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.managementId]);

    const handleVerificationChange = async (studentId, value) => {
        try {
            const studentRef = doc(db, 'users', studentId);
            await updateDoc(studentRef, {
                wardenVerification: value
            });
            toast.success(`Warden verification updated to ${value}`);
        } catch (err) {
            console.error("Error updating verification:", err);
            toast.error("Failed to update status");
        }
    };

    const filteredStudents = useMemo(() => {
        let result = [...students];

        // Filter by status
        if (filterStatus !== 'all') {
            result = result.filter(s => s.status === filterStatus);
        }

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.fullName?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q) ||
                s.roomNumber?.toLowerCase().includes(q) ||
                s.studentId?.toLowerCase().includes(q) ||
                s.hostelBlock?.toLowerCase().includes(q) ||
                s.phone?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            const aVal = (a[sortField] || '').toString().toLowerCase();
            const bVal = (b[sortField] || '').toString().toLowerCase();
            return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

        return result;
    }, [students, searchQuery, filterStatus, sortField, sortDir]);

    const stats = {
        total: students.length,
        approved: students.filter(s => s.status === 'approved').length,
        pending: students.filter(s => s.status === 'pending').length,
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    return (
        <>
            <WardenHeader
                title="Students · Warden Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
                    {[
                        { label: 'Total Students', value: stats.total, color: 'orange', icon: Users },
                        { label: 'Active', value: stats.approved, color: 'green', icon: CheckCircle },
                        { label: 'Pending', value: stats.pending, color: 'amber', icon: Clock },
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
                        <div className="relative flex-1 sm:flex-none sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, room, ID..."
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
                            <option value="approved">Active</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        {['fullName', 'roomNumber', 'hostelBlock'].map(field => (
                            <button
                                key={field}
                                onClick={() => toggleSort(field)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${sortField === field ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : ''}`}
                                style={sortField !== field ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : undefined}
                            >
                                {field === 'fullName' ? 'Name' : field === 'roomNumber' ? 'Room' : 'Hostel'}
                                {sortField === field && (sortDir === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Students List */}
                <div className="rounded-2xl border overflow-hidden shadow-sm"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <div className="p-5 md:p-6 border-b flex items-center justify-between"
                        style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Student Directory</h3>
                            <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
                                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                    </div>

                    <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                        {loading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
                                <p className="mt-4 text-xs font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading students...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-14 h-14 bg-orange-500/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/10">
                                    <GraduationCap className="w-7 h-7 text-orange-500 opacity-30" />
                                </div>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>No Students Found</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                    {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filters.' : 'No students registered yet.'}
                                </p>
                            </div>
                        ) : (
                            filteredStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-xl p-3 transition-all hover:bg-black/5 dark:hover:bg-white/5 mb-3"
                                    onClick={() => setSelectedStudent(student)}
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border-primary)',
                                        borderLeftWidth: '4px',
                                        borderLeftColor: student.status === 'approved' ? "green" : "red",
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar
                                            image={student.photoURL}
                                            name={student.fullName || 'Unnamed'}
                                            size="md"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                    {student.fullName || 'Unnamed'}
                                                </h3>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${student.status === 'approved' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                                                    {student.status || 'pending'}
                                                </span>
                                                {student.roomNumber && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                        <Home className="w-3 h-3 inline-block mr-1 opacity-70" /> Room {student.roomNumber}
                                                    </span>
                                                )}
                                                {student.hostelBlock && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                        {student.hostelBlock}
                                                    </span>
                                                )}
                                                {student.studentId && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50">
                                                        <Hash className="w-3 h-3 inline-block mr-0.5 opacity-70" />{student.studentId}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 xl:gap-6 text-xs" onClick={(e) => e.stopPropagation()}>
                                        {/* Fee Details */}
                                        <div className="flex items-center gap-2 md:gap-3 border border-gray-200 dark:border-gray-700/50 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                                            <div>
                                                <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1">Total:</span>
                                                <span style={{ color: 'var(--text-primary)' }} className="font-mono font-medium">₹{student.feeDetails?.totalFee || 0}</span>
                                            </div>
                                            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
                                            <div>
                                                <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1">Paid:</span>
                                                <span className="text-green-600 dark:text-green-400 font-mono font-bold">₹{student.feeDetails?.paidFee || 0}</span>
                                            </div>
                                            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
                                            <div>
                                                <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1">Pending:</span>
                                                <span className="text-red-500 font-mono font-bold">₹{student.feeDetails?.pendingFee || 0}</span>
                                            </div>
                                        </div>

                                        {/* Verifications */}
                                        <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-transparent dark:border-gray-700/30">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-[10px] uppercase opacity-70" style={{ color: 'var(--text-muted)' }}>WV:</span>
                                                <select 
                                                    value={student.wardenVerification || 'Unverified'} 
                                                    onChange={(e) => handleVerificationChange(student.id, e.target.value)}
                                                    disabled={!student.feeDetails?.paidFee || student.feeDetails?.paidFee === 0}
                                                    title={(!student.feeDetails?.paidFee || student.feeDetails?.paidFee === 0) ? "Verification locked: Student has paid ₹0" : "Update Warden Verification"}
                                                    className={`bg-transparent border border-gray-300 dark:border-gray-600 rounded py-0.5 px-1 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 transition-colors ${(!student.feeDetails?.paidFee || student.feeDetails?.paidFee === 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
                                                >
                                                    <option value="Unverified" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Unverified</option>
                                                    <option value="Verify" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Verify</option>
                                                </select>
                                            </div>
                                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-[10px] uppercase opacity-70" style={{ color: 'var(--text-muted)' }}>MV:</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${student.managementVerification === 'Verify' ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'}`}>
                                                    {student.managementVerification || 'Unverified'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="w-auto xl:w-24 flex justify-end">
                                            {(student.managementVerification === 'Verify' && student.wardenVerification === 'Verify') ? (
                                                <span className="px-2 py-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-sm w-max">
                                                    <CheckCircle size={12} /> Verified
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 border border-gray-200 dark:border-gray-700 w-max">
                                                    <CircleX size={12} className="opacity-70" /> Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedStudent(null)}>
                    <div className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                        onClick={(e) => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="relative p-6 md:p-8 bg-gradient-to-br from-orange-500/10 to-amber-500/5">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="absolute top-4 right-4 p-2 rounded-full transition-colors"
                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-orange-500/20 shadow-xl">
                                    <Avatar name={selectedStudent.fullName} image={selectedStudent.photoURL} className="w-full h-full" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                                        {selectedStudent.fullName}
                                    </h3>
                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase mt-1 inline-block ${selectedStudent.status === 'approved'
                                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                        }`}>
                                        {selectedStudent.status || 'pending'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 md:p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                            {[
                                { icon: Mail, label: 'Email', value: selectedStudent.email },
                                { icon: Phone, label: 'Phone', value: selectedStudent.phone },
                                { icon: Home, label: 'Room Number', value: selectedStudent.roomNumber },
                                { icon: Building2, label: 'Hostel Block', value: selectedStudent.hostelBlock },
                                { icon: Hash, label: 'Student ID', value: selectedStudent.studentId },
                                { icon: GraduationCap, label: 'College', value: selectedStudent.collegeName },
                                { icon: Calendar, label: 'Joined', value: formatDate(selectedStudent.createdAt) },
                            ].map((item, i) => {
                                const ItemIcon = item.icon;
                                return (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <ItemIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.value || '—'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WardenStudents;