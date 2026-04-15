import { useState, useEffect, useRef } from "react";
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from "../../../firebase/firebaseConfig";
import ManagementHeader from "../components/layout/ManagementHeader";
import { Users, Mail, Search, Filter, Plus, GraduationCap, CheckCircle, Building2, RefreshCw, CircleX, FileSpreadsheet } from "lucide-react";
import "../ManagementDashboard.css";
import { HashLoader } from "react-spinners";
import { useAuth } from "../../../context/AuthContext";
import Avatar from "../../../components/OwnerServices/Avatar";
import { useTheme } from "../../../context/ThemeContext";
import EmptyState from "../../../components/OwnerServices/EmptyState";
import BulkUploadStudents from './BulkUploadStudents';
import AddStudentModal from './AddStudentModal';
import NoDataLight from '../../../assets/No-Data.avif';
import NoDataDark from '../../../assets/NoDataDark.png';
import { useToast } from "../../../components/Toast";
const Students = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)
  const searchInputRef = useRef(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [unverifyModal, setUnverifyModal] = useState({ show: false, studentId: null, reason: "" });
  const { isDark } = useTheme()
  const toast = useToast();

  // Use Auth context — management user's own UID is the tenant key
  const { userData, user } = useAuth();

  // The management user's UID is stored as `managementId` on every student/warden they own.
  // This is the most reliable tenant-isolation filter.
  const managementUid = user?.uid;

  // parse query param for block filter
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const block = params.get('block');
    if (block) setBlockFilter(block);
  }, [location.search]);

  useEffect(() => {
    if (!managementUid) return; // wait until auth resolves
    let timer;

    const constraints = [
      where('role', '==', 'student'),
      where('managementId', '==', managementUid)
    ];
    if (blockFilter) {
      constraints.push(where('hostelBlock', '==', blockFilter));
    }

    const q = query(collection(db, 'users'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(list);
        timer = setTimeout(() => setLoading(false), 1000);
      },
      (error) => {
        console.error('Failed to fetch students:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [managementUid, blockFilter]);

  // Helper function to get role badge color
  const getRoleBadgeColor = (user) => {
    if (user.role === 'student') {
      return 'from-blue-400/90 to-cyan-400/90 border border-blue-300/30'; // Blue gradient for students
    }
    return 'from-gray-500/90 to-gray-600/90'; // Default
  };

  const serachStudentList = students.filter((student) => (
    student.fullName.includes(searchTerm)
  ))


  const handleRefresh = async () => {
    if (!managementUid) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('managementId', '==', managementUid)
      );
      const snapshot = await getDocs(q);
      const studentList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(studentList);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh students:', err);
      setError(err.message || 'Refresh failed');
    } finally {
      setLoading(false);
    }
  };



  const clearSearchStudent = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  }

  const handleVerificationChange = async (studentId, field, value) => {
    if (field === 'managementVerification' && value === 'Unverified') {
      setUnverifyModal({ show: true, studentId, reason: "" });
      return;
    }
    
    try {
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        [field]: value,
        unverifyReason: null // horizontal clear
      });
      toast.success(`${field === 'managementVerification' ? 'Management' : 'Warden'} verification updated to ${value}`);
    } catch (err) {
      console.error("Error updating verification:", err);
      toast.error("Failed to update status");
    }
  };

  const confirmUnverify = async () => {
    if (unverifyModal.reason.trim().split('\n').filter(l => l.trim()).length < 2) {
      toast.error("Reason must be at least 2 lines long.");
      return;
    }

    try {
      const studentRef = doc(db, 'users', unverifyModal.studentId);
      await updateDoc(studentRef, {
        managementVerification: 'Unverified',
        unverifyReason: unverifyModal.reason,
        unverifiedAt: new Date().toISOString()
      });
      toast.success("Student unverified with reason.");
      setUnverifyModal({ show: false, studentId: null, reason: "" });
    } catch (err) {
      console.error("Error un-verifying:", err);
      toast.error("Failed to un-verify");
    }
  };

  const contextInfo = {
    collegeName: "Professional Institution",
    hostelBlock: "Premium Hostel – Block A"
  };
  return (
    <>
      {/* Header */}
      <ManagementHeader
        title="Students · Management"
        pendingCount={0}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-icon">
              <Users size={24} />
            </div>
            <div>
              <h1 className="page-title">Students Management</h1>
              <p className="page-subtitle">Manage and monitor all students</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-primary" onClick={() => setShowAddStudent(true)} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <Plus size={20} />
              Add Student
            </button>
            <button type="button" className="btn-primary" onClick={() => setShowBulkUpload(true)}>
              <FileSpreadsheet size={20} />
              Bulk Upload
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={20} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border cursor-pointer transition-all duration-300 group"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-primary)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            }}
            aria-label="Refresh"
            title="Refresh list"
          >
            <RefreshCw className="w-5 h-5 transition-transform cursor-pointer duration-300 group-hover:rotate-180" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* This is for when Search student are not found this will display */}
        {searchTerm.trim() && students.length > 0 && serachStudentList.length === 0 && !loading ? (
          <div className="mb-4">
            <EmptyState
              title={`No matches for "${searchTerm}"`}
              description={"Try a different name, or clear the search to see all students."}
              ctaLabel="Clear search"
              onCta={clearSearchStudent}
              videoSrc={!isDark ? NoDataLight : NoDataDark}
              className="max-w-5xl mx-auto"
            />
          </div>
        ) : null}
        {/* Results / Empty / Loading */}
        {loading ? (
          <div className="flex items-center justify-center w-full min-h-[calc(40vh)]">
            <HashLoader loading={loading} color="#6366f1" size={80} />
          </div>
        ) : (students.length === 0 ? (
          <div className="mb-4">
            <EmptyState
              title="No students yet"
              description="You haven't added any students to your institution yet. Use Bulk Upload to add students from an Excel sheet."
              ctaLabel="Bulk Upload"
              onCta={() => setShowBulkUpload(true)}
              videoSrc={!isDark ? NoDataLight : NoDataDark}
              className="max-w-5xl mx-auto"
            />
          </div>
        ) : (
          <div className="space-y-3 " >
            {serachStudentList.map((student) => (
              <div
                key={student.id}
                className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-xl p-3 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderLeftWidth: '4px',
                  borderLeftColor: student.isOnline ? "green" : "red",
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar
                    image={student.photoURL}
                    name={student.fullName || student.email}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {student.fullName || 'Unknown Student'}
                      </h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-gradient-to-r ${getRoleBadgeColor(student)} text-white shadow-sm`}>
                        {student.role || 'Student'}
                      </span>
                      {student.hostelBlock && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          {student.hostelBlock}
                        </span>
                      )}
                      {student.collegeName && (
                        <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50">
                          {student.collegeName || contextInfo.collegeName}
                        </span>
                      )}
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 xl:gap-6 text-xs">
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
                      <span className="font-bold text-[10px] uppercase opacity-70" style={{ color: 'var(--text-muted)' }}>MV:</span>
                      <select 
                        value={student.managementVerification || 'Unverified'} 
                        onChange={(e) => handleVerificationChange(student.id, 'managementVerification', e.target.value)}
                        disabled={!student.feeDetails?.paidFee || student.feeDetails?.paidFee === 0}
                        title={(!student.feeDetails?.paidFee || student.feeDetails?.paidFee === 0) ? "Verification locked: Student has paid ₹0" : "Update Management Verification"}
                        className={`bg-transparent border border-gray-300 dark:border-gray-600 rounded py-0.5 px-1 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 transition-colors ${(!student.feeDetails?.paidFee || student.feeDetails?.paidFee === 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <option value="Unverified">Unverified</option>
                        <option value="Verify">Verify</option>
                      </select>
                    </div>
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[10px] uppercase opacity-70" style={{ color: 'var(--text-muted)' }}>WV:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${student.wardenVerification === 'Verify' ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'}`}>
                        {student.wardenVerification || 'Unverified'}
                      </span>
                    </div>
                  </div>

                  {/* Overall Status */}
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
            ))}
          </div>
        ))}
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadStudents
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        collegeName={userData?.collegeName}
      />
      
      {/* Add Single Student Modal */}
      <AddStudentModal
        isOpen={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        collegeName={userData?.collegeName}
      />

      {/* Unverify Reason Modal */}
      {unverifyModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border shadow-2xl p-6" 
               style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Reason for Un-verifying</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Please provide a detailed reason (at least 2 lines) for marking this student as unverified. This will be sent as a notification.
            </p>
            <textarea
              value={unverifyModal.reason}
              onChange={(e) => setUnverifyModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason here...&#10;Line 2 starts here..."
              className="w-full h-32 p-3 rounded-xl border text-sm mb-6 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-3">
              <button 
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold border" 
                style={{ borderColor: 'var(--border-disabled)', color: 'var(--text-secondary)' }}
                onClick={() => setUnverifyModal({ show: false, studentId: null, reason: "" })}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                onClick={confirmUnverify}
              >
                Un-verify Student
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Students;
