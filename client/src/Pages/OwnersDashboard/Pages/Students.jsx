import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { deleteUserAccount } from '../../../firebase/cloudFunctions';
import { db } from '../../../firebase/firebaseConfig';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../components/OwnerServices/header';
import Avatar from '../../../components/OwnerServices/Avatar';
import DeleteConfirmModal from '../../../components/OwnerServices/DeleteConfirmModal';
import { HashLoader } from "react-spinners";

import search from './Search.mp4'
import { Mail, GraduationCap, UserMinus, Building2, Search, X, RefreshCw, Shield } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import EmptyState from '../../../components/OwnerServices/EmptyState';
import NoDataLight from '../../../assets/No-Data.avif';
import NoDataDark from '../../../assets/NoDataDark.png';

const Students = () => {
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchListStudent, setSearchListStudent] = useState('')
    const [searchOpen, setSearchOpen] = useState(false);
    const [error, setError] = useState(null);
    const [simulateError, setSimulateError] = useState(false);
    const searchInputRef = useRef(null);
    const clearSearch = () => { setSearchListStudent(''); searchInputRef.current?.focus(); }

    // Theme (for dark/light mode adjustments)
    const { isDark } = useTheme();

    // TODO: Replace with actual college and hostel data from props/context
    const contextInfo = {
        collegeName: "Professional Institution",
        collegeLocation: "Bangalore, Karnataka",
        hostelBlock: "Premium Hostel – Block A",
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

    // When the expandable search opens, ensure the input is focused so it stays visible
    useEffect(() => {
        if (searchOpen) {
            const id = setTimeout(() => searchInputRef.current?.focus(), 40);
            return () => clearTimeout(id);
        }
    }, [searchOpen]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'student'));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setStudents(list);
            setError(null);
        } catch (err) {
            console.error('Failed to refresh students:', err);
            setError(err.message || 'Refresh failed');
        } finally {
            setLoading(false);
        }
    };

    const searchStudent = students.filter((studentlist) =>
        !searchListStudent.trim() || 
        studentlist.fullName?.toLowerCase().includes(searchListStudent.toLowerCase()) ||
        studentlist.email?.toLowerCase().includes(searchListStudent.toLowerCase())
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

    if (simulateError) {
        throw new Error('Demo error: Simulated crash for testing ErrorBoundary');
    }

    return (
        <>
            <Header
                title="Hostel Students"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                onProfileClick={savePageState}
            />

            {/* Main Container */}
            <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">

                {/* Page Header */}
                <section className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Student Directory</h2>
                            <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Manage and view all students assigned to this hostel</p>
                        </div>
                        <div className="relative flex items-center justify-end gap-2">
                            {/* Search Icon Button */}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className={`p-2.5 rounded-xl border transition-all duration-300 z-10 group ${searchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
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
                                aria-label="Toggle search"
                            >
                                <Search className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" style={{ color: 'var(--text-muted)' }} />
                            </button>

                            {/* Refresh button visible when search is closed */}
                            {!searchOpen && (
                                <button
                                    onClick={handleRefresh}
                                    className="p-2.5 rounded-xl border transition-all duration-300 group"
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
                                    <RefreshCw className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            )}
                            {/* Expandable Search Input */}
                            <div
                                className={`flex justify-around gap-5 py-5 absolute  right-10 overflow-hidden transition-all duration-500 ease-in-out ${searchOpen ? 'w-full sm:w-80 opacity-100' : 'w-0 opacity-0'
                                    }`}
                            >
                                <button
                                    onClick={handleRefresh}
                                    className="ml-2 p-2.5 rounded-lg border-2 hover:border-indigo-500/50 transition-all duration-300"
                                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                                    aria-label="Refresh"
                                    title="Refresh list"
                                >
                                    <RefreshCw className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                </button>
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
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center cursor-pointer rounded-full p-2 z-20 transition-colors"
                                            style={{ border: '1px solid #E1251B', backgroundColor: 'var(--bg-card)' }}
                                        >
                                            <X className="w-4 h-4 text-[#E1251B]" stroke="#E1251B" />
                                        </button>
                                    )}
                                </div>

                            </div>

                        </div>

                    </div>
                    <div className='flex justify-end items-center'>

                    </div>
                </section>

                {/* This is for when Search student are not found this will display */}
                {searchListStudent.trim() && students.length > 0 && searchStudent.length === 0 && !loading ? (
                    <div className="mb-4">
                        <EmptyState
                            title={`No matches for "${searchListStudent}"`}
                            description={"Try a different name, or clear the search to see all students."}
                            ctaLabel="Clear search"
                            onCta={clearSearch}
                            videoSrc={!isDark ? NoDataLight : NoDataDark}
                            className="max-w-5xl mx-auto"
                        />
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
                        <div className="mb-8">
                            <EmptyState
                                title="No Students Assigned"
                                subtitle="This hostel is awaiting student assignments"
                                description={`No students have been linked to ${contextInfo.hostelBlock} yet. Students will appear here once they are assigned to this hostel through the admin portal or registration process.`}
                                ctaLabel="Open Search"
                                onCta={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                                videoSrc={!isDark ? NoDataLight : NoDataDark}
                                className="max-w-5xl mx-auto"
                            />
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
                                                size="xl"
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
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>

                                                        {student.collegeName || contextInfo.collegeName}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                                        <Shield className="w-3.5 h-3.5 opacity-80" />
                                                        {student.hostelBlock || 'No block assigned'}
                                                    </span>
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
                        await deleteUserAccount(deleteModal.student.id);
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
