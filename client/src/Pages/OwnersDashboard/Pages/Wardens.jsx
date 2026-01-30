import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../components/OwnerServices/header';
import Avatar from '../../../components/OwnerServices/Avatar';
import { HashLoader } from "react-spinners";
import { User, Mail, Shield, Eye, Edit2, UserMinus, Building2, Search, X, RefreshCw } from 'lucide-react';
import DeleteConfirmModal from '../../../components/OwnerServices/DeleteConfirmModal';
import NotFound from './NOT-FOUND.mp4'
import search from './Search.mp4'
import EmptyState from '../../../components/OwnerServices/EmptyState';
const Wardens = () => {
    const { isCollapsed } = useOutletContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [wardens, setWardens] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, warden: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchListWarden, setSearchListWarden] = useState('')
    const [searchOpen, setSearchOpen] = useState(false);
    const [error, setError] = useState(null);
    const [simulateError, setSimulateError] = useState(false);
    const searchInputRef = useRef(null);

    // Refresh wardens list (manual) and Assign Warden navigation
    const handleRefresh = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'warden'));
            const snapshot = await getDocs(q);
            const wardenList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setWardens(wardenList);
            setError(null);
        } catch (err) {
            console.error('Failed to refresh wardens:', err);
            setError(err.message || 'Refresh failed');
        } finally {
            setLoading(false);
        }
    };

    const assignWarden = () => {
        // preserve current page state so user can return after assigning
        const state = {
            searchText: searchListWarden,
            scrollPosition: window.scrollY,
            returnPath: '/OwnersDashboard/wardens'
        };
        sessionStorage.setItem('wardensPageState', JSON.stringify(state));
        navigate('/OwnersDashboard/assign-warden');
    };

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
            setSearchListWarden(location.state.searchText);
            if (location.state.scrollPosition) {
                setTimeout(() => {
                    window.scrollTo(0, location.state.scrollPosition);
                    // Clear the state after restoring
                    window.history.replaceState({}, document.title);
                }, 100);
            }
        }
        // Clear sessionStorage after checking
        sessionStorage.removeItem('wardensPageState');
    }, [location.state]);

    useEffect(() => {
        let timer;
        const q = query(collection(db, 'users'), where('role', '==', 'warden'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const wardenList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWardens(wardenList);
            timer = setTimeout(() => setLoading(false), 2000);
        });

        return () => {
            unsubscribe();
            if (timer) clearTimeout(timer);
        };
    }, []);



    const onSearchEventWarden = (event) => {
        setSearchListWarden(event.target.value)
    }
    const clearSearchWarden = () => {
        setSearchListWarden('');
        searchInputRef.current?.focus();
    }
    const searchWarden = wardens.filter((wardenList) => (
        !searchListWarden.trim() || wardenList.fullName?.toLowerCase().includes(searchListWarden.toLowerCase())
    ))

    // Save page state before navigating away
    const savePageState = () => {
        const state = {
            searchText: searchListWarden,
            scrollPosition: window.scrollY,
            returnPath: '/OwnersDashboard/wardens'
        };
        sessionStorage.setItem('wardensPageState', JSON.stringify(state));
        return state;
    };

    const handleRemove = (warden) => {
        setDeleteModal({ isOpen: true, warden });
    };

    const getRoleBadgeColor = (role) => {
        if (role?.toLowerCase().includes('chief')) {
            return 'from-purple-600 to-indigo-600';
        }
        return 'from-blue-600 to-cyan-600';
    };

    const getRoleLabel = (warden) => {
        // Check if there's a specific warden role field
        if (warden.wardenRole) return warden.wardenRole;
        if (warden.position) return warden.position;
        return 'Warden'; // Default
    };

    if (simulateError) {
        throw new Error('Demo error: Simulated crash for testing ErrorBoundary');
    }

    return (
        <>
            <Header
                title="Hostel Wardens"
                isCollapsed={isCollapsed}
                onProfileClick={savePageState}
            />

            {/* Main Container */}
            <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">

                {/* Page Header with Context */}
                <section className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Warden Directory</h2>
                            <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Manage and view all wardens assigned to this hostel</p>
                        </div>
                        {/* <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400">Total Wardens:</span>
                            <span className="text-white font-semibold">{wardens.length}</span>
                        </div> */}


                        {/* {import.meta.env.DEV && (
                                <button
                                    onClick={() => setSimulateError(true)}
                                    className="ml-2 p-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    title="Simulate error"
                                >
                                    Simulate Error
                                </button>
                            )}    */}
                        <div className="relative flex items-center justify-end gap-2">
                            {/* Refresh button visible when search is closed */}


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
                                className={`flex justify-around gap-5 py-5 absolute right-10 overflow-hidden transition-all duration-500 ease-in-out ${searchOpen ? 'w-full sm:w-80 opacity-100' : 'w-0 opacity-0'}`}
                            >
                                {/* Refresh button inside expandable search area */}
                                <button
                                    onClick={handleRefresh}
                                    className="p-2.5 rounded-lg border-2 hover:border-indigo-500/50 transition-all duration-300"
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
                                        value={searchListWarden}
                                        onChange={onSearchEventWarden}
                                        placeholder="Search wardens..."
                                        className="w-full pl-10 pr-14 py-2.5 rounded-lg border-2 focus:outline-none transition-all"
                                        style={{
                                            backgroundColor: 'var(--bg-input)',
                                            borderColor: 'var(--border-primary)',
                                            color: 'var(--text-primary)',
                                            transform: searchOpen ? 'translateX(0)' : 'translateX(20px)',
                                            transition: 'transform 0.5s ease-in-out'
                                        }}
                                    />
                                    {searchListWarden && (
                                        <button
                                            type="button"
                                            aria-label="Clear search"
                                            onClick={clearSearchWarden}
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
                </section>
                {/* This is for when Search student are not found this will display */}
                {searchListWarden.trim() && wardens.length > 0 && searchWarden.length === 0 && !loading ? (
                    <div className="mb-4">
                        <EmptyState
                            title={`No matches for "${searchListWarden}"`}
                            description={'Try a different name, or clear the search to see all wardens.'}
                            ctaLabel="Clear search"
                            onCta={clearSearchWarden}
                            videoSrc={search}
                            className="max-w-5xl mx-auto"
                        />
                    </div>
                ) : null}
                {/* Wardens List */}
                <section className=''>
                    {loading ? (
                        <div className="flex items-center justify-center w-full min-h-[calc(60vh)]">
                            <div className="text-center">
                                <HashLoader loading={loading} color="#6366f1" size={80} />
                                {/* <p className="text-slate-400 mt-3">Loading students...</p> */}
                            </div>
                        </div>
                    ) : (wardens.length === 0) ? (
                        <div className="mb-8">
                            <EmptyState
                                title="No Wardens Assigned"
                                subtitle="This hostel needs warden supervision"
                                description={`No wardens have been assigned to ${contextInfo.hostelName} yet. Assign a warden to help manage students, handle daily operations, and maintain hostel discipline.`}
                                ctaLabel="Assign Warden"
                                onCta={assignWarden}
                                videoSrc={NotFound}
                                className="max-w-5xl mx-auto"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {searchWarden.map((warden) => (
                                <div
                                    key={warden.id}
                                    className="rounded-xl p-4 hover:border-slate-600/50 transition-all"
                                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                                        {/* Left: Student Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">

                                            <Avatar
                                                image={warden.photoURL}
                                                name={warden.fullName || warden.displayName || warden.email}
                                                size="lg"
                                            />

                                            <div className="flex-1 min-w-0">
                                                {/* Name and Badge */}
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                        {warden.fullName || warden.displayName || 'Unknown Warden'}
                                                    </h3>

                                                    {/* Warden Badge */}
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${getRoleBadgeColor(getRoleLabel(warden))} text-white text-xs font-medium`}>
                                                        {getRoleLabel(warden)}
                                                    </span>
                                                </div>

                                                {/* Email */}
                                                {warden.email && (
                                                    <div className="flex items-center gap-1.5 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span className="truncate">{warden.email}</span>
                                                    </div>
                                                )}

                                                {/* College and Hostel Badges */}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {/* Professional Institution Badge */}
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white text-xs font-semibold shadow-lg border border-purple-500/30">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {warden.collegeName || contextInfo.collegeName}
                                                        <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                                                            PRO
                                                        </span>
                                                    </span>

                                                    {/* Premium Hostel Badge */}
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white text-xs font-semibold shadow-lg border border-emerald-500/30">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>
                                                        {warden.hostelBlock || contextInfo.hostelName}
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
                                                onClick={() => handleRemove(warden)}
                                                className="p-2 rounded-lg transition-all border border-1 border-[#E1251B]"
                                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                                                title="Remove Warden"
                                                aria-label={`Remove ${warden.fullName || warden.displayName || warden.email || 'warden'}`}
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
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, warden: null })}
                onConfirm={async () => {
                    if (!deleteModal.warden) return;
                    setIsDeleting(true);
                    try {
                        await deleteDoc(doc(db, 'users', deleteModal.warden.id));
                        setDeleteModal({ isOpen: false, warden: null });
                        setError(null);
                    } catch (err) {
                        console.error('Failed to delete warden:', err);
                        setError(err.message || 'Delete failed');
                    } finally {
                        setIsDeleting(false);
                    }
                }}
                collegeName={deleteModal.warden?.fullName || deleteModal.warden?.displayName || deleteModal.warden?.email || 'this warden'}
                isDeleting={isDeleting}
                showDetails={false}
                title="Delete Warden"
            />
        </>
    );
};

export default Wardens;
