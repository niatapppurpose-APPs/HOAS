import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../components/OwnerServices/header';
import Avatar from '../../../components/OwnerServices/Avatar';
import DeleteConfirmModal from '../../../components/OwnerServices/DeleteConfirmModal';
import { HashLoader } from "react-spinners";
import NotFound from './NOT-FOUND.mp4'
import search from './Search.mp4'
import { Mail, GraduationCap, Eye, Edit2, UserMinus, Building2, Search, X } from 'lucide-react';

const Students = () => {
    const { isCollapsed } = useOutletContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchListStudent, setSearchListStudent] = useState('')
    const [searchOpen, setSearchOpen] = useState(false);
    const [error, setError] = useState(null);
    const searchInputRef = useRef(null);
    const clearSearch = () => { setSearchListStudent(''); searchInputRef.current?.focus(); }

    // TODO: Replace with actual college and hostel data from props/context
    const contextInfo = {
        collegeName: "Professional Institution",
        collegeLocation: "Bangalore, Karnataka",
        hostelName: "Premium Hostel – Block A",
        hostelId: "HST-2024-001"
    };

    // Restore state when coming back from profile
    useEffect(() => {
        if (location.state?.searchText !== undefined) {
            setSearchListStudent(location.state.searchText);
            // Restore scroll position after data loads
            if (location.state.scrollPosition) {
                setTimeout(() => {
                    window.scrollTo(0, location.state.scrollPosition);
                    // Clear the state after restoring to prevent it from triggering again
                    window.history.replaceState({}, document.title);
                }, 100);
            }
        }
        // Clear sessionStorage after checking
        sessionStorage.removeItem('studentsPageState');
    }, [location.state]);

    useEffect(() => {
        let timer;
        const q = query(collection(db, 'users'), where('role', '==', 'student'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(list);
            timer = setTimeout(() => setLoading(false), 2000);
        });

        return () => {
            unsubscribe();
            if (timer) clearTimeout(timer);
        };
    }, []);
    const onSearchEventStudent = (event) => {
        setSearchListStudent(event.target.value)
    }

    const searchStudent = students.filter((studentlist) =>
        !searchListStudent.trim() || studentlist.fullName?.toLowerCase().includes(searchListStudent.toLowerCase())
    )

    // Save page state before navigating away
    const savePageState = () => {
        const state = {
            searchText: searchListStudent,
            scrollPosition: window.scrollY,
            returnPath: '/OwnersDashboard/students'
        };
        sessionStorage.setItem('studentsPageState', JSON.stringify(state));
        return state;
    };

    const handleRemove = (student) => {
        setDeleteModal({ isOpen: true, student });
    };

    return (
        <>
            <Header
                title="Hostel Students"
                isCollapsed={isCollapsed}
                onProfileClick={savePageState}
            />

            {/* Main Container */}
            <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">

                {/* Page Header */}
                <section className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Assigned List :-</h2>
                            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Active students for the selected hostel</p>
                        </div>
                        <div className="relative flex items-center justify-end">
                            {/* Search Icon Button */}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className={`p-2.5 rounded-lg border-2 hover:border-indigo-500/50 transition-all duration-300 z-10 ${searchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                                    }`}
                                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                                aria-label="Toggle search"
                            >
                                <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            </button>

                            {/* Expandable Search Input */}
                            <div
                                className={`absolute right-0 overflow-hidden transition-all duration-500 ease-in-out ${searchOpen ? 'w-full sm:w-80 opacity-100' : 'w-0 opacity-0'
                                    }`}
                            >
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Search className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <input
                                        ref={searchInputRef}
                                        type="search"
                                        value={searchListStudent}
                                        onChange={onSearchEventStudent}
                                        placeholder="Search students..."
                                        className="w-full pl-10 pr-14 py-2.5 rounded-lg border-2 focus:outline-none transition-all"
                                        style={{
                                            backgroundColor: 'var(--bg-input)',
                                            borderColor: 'var(--border-primary)',
                                            color: 'var(--text-primary)',
                                            transform: searchOpen ? 'translateX(0)' : 'translateX(20px)',
                                            transition: 'transform 0.5s ease-in-out'
                                        }}
                                    />
                                    {searchListStudent && (
                                        <button
                                            type="button"
                                            aria-label="Clear search"
                                            onClick={clearSearch}
                                            className="absolute inset-y-0 right-3 flex items-center justify-center w-9 h-9 rounded-full z-1000 transition-colors focus:outline-none"
                                            style={{ backgroundColor: 'var(--bg-card)' }}
                                            title="Clear search"
                                        >
                                            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* This is for when Search student are not found this will display */}
                {searchListStudent.trim() && students.length > 0 && searchStudent.length === 0 && !loading ? (
                    <div className="rounded-xl p-8 text-center mb-4" >
                        <div className="mx-auto mb-6 w-full max-w-md md:max-w-lg lg:max-w-xl rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
                            {/* Video-only empty state */}
                            <video
                                src={search}
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="auto"
                                controls={false}
                                aria-label="No wardens animation"
                                className="mx-auto w-full block"
                                style={{ borderRadius: '0.75rem', objectFit: 'contain', backgroundColor: 'var(--bg-card)' }}
                            />
                        </div>
                        <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>No students found</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            No matches for "<span className="text-indigo-400">{searchListStudent}</span>"
                        </p>
                    </div>
                ) : null}
                {/* Students List */}
                <section className=''>
                    {loading ? (
                        <div className="flex items-center justify-center w-full min-h-[calc(60vh)]">
                            <div className="text-center">
                                <HashLoader loading={loading} color="#6366f1" size={80} />
                                {/* <p className="text-slate-400 mt-3">Loading students...</p> */}
                            </div>
                        </div>
                    ) : (students.length === 0) ? (
                        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                            <div className="mx-auto mb-6 w-full max-w-md">
                                {/* Video-only empty state */}
                                <video
                                    src={NotFound}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    preload="auto"
                                    controls={false}
                                    aria-label="No wardens animation"
                                    className="mx-auto w-full rounded-md"
                                />
                            </div>
                            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Students Assigned</h3>
                            <p className="max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                                No students have been assigned to {contextInfo.hostelName} yet.
                            </p>

                        </div>
                    ) : (
                        <div className="space-y-3">
                            {searchStudent.map((student) => (
                                <div
                                    key={student.id}
                                    className="rounded-xl p-4 hover:border-slate-600/50 transition-all"
                                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                                        {/* Left: Student Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">

                                            <Avatar
                                                image={student.photoURL}
                                                name={student.fullName || student.displayName || student.email}
                                                size="lg"
                                            />

                                            <div className="flex-1 min-w-0">
                                                {/* Name and Badge */}
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                        {student.fullName || student.displayName || 'Unknown Student'}
                                                    </h3>

                                                    {/* Student Badge */}
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-medium">
                                                        <GraduationCap className="w-3 h-3" />
                                                        Student
                                                    </span>
                                                </div>

                                                {/* Email */}
                                                {student.email && (
                                                    <div className="flex items-center gap-1.5 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span className="truncate">{student.email}</span>
                                                    </div>
                                                )}

                                                {/* College and Hostel Badges */}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {/* Professional Institution Badge */}
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white text-xs font-semibold shadow-lg border border-purple-500/30">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {student.collegeName || contextInfo.collegeName}
                                                        <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                                                            PRO
                                                        </span>
                                                    </span>

                                                    {/* Premium Hostel Badge */}
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white text-xs font-semibold shadow-lg border border-emerald-500/30">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>
                                                        {student.hostelBlock || contextInfo.hostelName}
                                                        <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                                                            ★
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Action Buttons */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Remove Button */}
                                            <button
                                                onClick={() => handleRemove(student)}
                                                className="p-2 rounded-lg transition-all border border-1 border-[#E1251B]"
                                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                                                title="Remove Student"
                                            >
                                                <UserMinus className="text-[#E1251B] w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, student: null })}
                onConfirm={async () => {
                    if (!deleteModal.student) return;
                    setIsDeleting(true);
                    try {
                        await deleteDoc(doc(db, 'users', deleteModal.student.id));
                        setDeleteModal({ isOpen: false, student: null });
                    } catch (err) {
                        console.error('Failed to delete student:', err);
                        setError(err.message || 'Delete failed');
                    } finally {
                        setIsDeleting(false);
                    }
                }}
                collegeName={deleteModal.student?.fullName || deleteModal.student?.email}
                isDeleting={isDeleting}
                wardenCount={0}
                studentCount={0}
                showDetails={false}
                title="Delete Student"
            />
        </>
    );
};

export default Students;
