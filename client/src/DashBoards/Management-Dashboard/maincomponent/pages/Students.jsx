import { useState, useEffect, useRef } from "react";
import { useLocation, useOutletContext } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from "../../../../firebase/firebaseConfig";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { Users, Mail, Search, Filter, Plus, GraduationCap, CheckCircle, Building2, RefreshCw, CircleX, FileSpreadsheet } from "lucide-react";
import "../ManagementDashboard.css";
import { HashLoader } from "react-spinners";
import { useAuth } from "../../../../context/AuthContext";
import Avatar from "../../../../components/OwnerServices/Avatar";
import { useTheme } from "../../../../context/ThemeContext";
import EmptyState from "../../../../components/OwnerServices/EmptyState";
import BulkUploadStudents from './BulkUploadStudents';
import NoDataLight from '../../../../assets/No-Data.avif';
import NoDataDark from '../../../../assets/NoDataDark.png';
const Students = () => {
  const location = useLocation();
  const { isCollapsed } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)
  const searchInputRef = useRef(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { isDark } = useTheme()
  // Read optional collegeId from URL query params (e.g. ?collegeId=COL123)
  const searchParams = new URLSearchParams(location.search);
  const initialCollegeId = searchParams.get('collegeId') ?? null;

  // Use Auth context to get user's college if provided (management user assigned to a college)
  const { userData, user } = useAuth();

  // Determine college filter: URL param takes precedence, otherwise use user's collegeId/collegeName
  const getCollegeFilter = () => {
    if (initialCollegeId) return { field: 'collegeId', value: initialCollegeId };
    if (userData?.collegeId) return { field: 'collegeId', value: userData.collegeId };
    if (userData?.collegeName) return { field: 'collegeName', value: userData.collegeName };
    return null;
  };

  useEffect(() => {
    let timer;
    const collegeFilter = getCollegeFilter();

    const q = collegeFilter
      ? query(collection(db, 'users'), where('role', '==', 'student'), where(collegeFilter.field, '==', collegeFilter.value))
      : query(collection(db, 'users'), where('role', '==', 'student'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(list);
        // small artificial delay for UX (spinner)
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
  }, [initialCollegeId, userData]);

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
    setLoading(true);
    try {
      const collegeFilter = getCollegeFilter();
      const q = collegeFilter
        ? query(collection(db, 'users'), where('role', '==', 'student'), where(collegeFilter.field, '==', collegeFilter.value))
        : query(collection(db, 'users'), where('role', '==', 'student'));

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

  const contextInfo = {
    collegeName: "Professional Institution",
    hostelName: "Premium Hostel – Block A"
  };
  return (
    <>
      {/* Header */}
      <ManagementHeader
        title="Students · Management"
        pendingCount={0}
        isCollapsed={isCollapsed}
      />

      {/* Main Content */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
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
          <button className="btn-primary" onClick={() => setShowBulkUpload(true)}>
            <FileSpreadsheet size={20} />
            Bulk Upload
          </button>
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
          <div className="space-y-3">
            {serachStudentList.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-xl p-4 transition-all"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)'
                }}
              ><Avatar
                  image={student.photoURL}
                  name={student.fullName || student.email}
                  size="lg"
                />

                <div className="flex-1 min-w-0">

                  {/* Name and Badge */}
                  <div className="flex items-center gap-8 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {student.fullName || 'Unknown Student'}
                    </h3>
                    {/* College and Hostel Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Professional Institution Badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white text-xs font-semibold shadow-lg border border-purple-500/30">
                        <Building2 className="w-3.5 h-3.5" />
                        {student.collegeName || contextInfo.collegeName}

                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${getRoleBadgeColor(student)} text-white text-xs font-medium shadow-md`}>
                        <GraduationCap className="w-3.5 h-3.5" />
                        {student.role || 'Student'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-medium ${student.isOnline ? 'bg-gradient-to-r from-green-600/80 to-emerald-600/80' : 'bg-gradient-to-r from-red-600/80 to-rose-600/80'}`}>
                        {student.isOnline ? (
                          <><CheckCircle className="w-3 h-3" /> Active</>
                        ) : (
                          <><CircleX className="w-3 h-3" /> Inactive</>
                        )}
                      </span>
                      {/* Premium Hostel Badge */}
                      {/* <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white text-xs font-semibold shadow-lg border border-emerald-500/30">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {warden.hostelBlock || contextInfo.hostelName}
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                        ★
                      </span>
                    </span> */}
                    </div>
                  </div>

                  {/* Email */}
                  {student.email && (
                    <div className="flex items-center gap-1.5 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}


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
    </>
  );
};

export default Students;
