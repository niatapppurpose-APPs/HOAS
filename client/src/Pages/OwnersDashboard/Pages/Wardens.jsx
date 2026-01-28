import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../components/OwnerServices/header';
import Avatar from '../../../components/OwnerServices/Avatar';
import { HashLoader } from "react-spinners";
import { User, Mail, Shield, Eye, Edit2, UserMinus, Building2, Search } from 'lucide-react';
import DeleteConfirmModal from '../../../components/OwnerServices/DeleteConfirmModal';
import NotFound from './NOT-FOUND.mp4'
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
    const videoRef = useRef(null);

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

    // Video autoplay: attempt to play the empty-state video; show controls if blocked
    useEffect(() => {
        if (!loading && wardens.length === 0 && videoRef?.current) {
            const v = videoRef.current;
            // ensure muted for autoplay policy
            v.muted = true;
            v.playsInline = true;
            const tryPlay = async () => {
                try {
                    const p = v.play();
                    if (p !== undefined) await p;
                } catch (err) {
                    console.warn('Video autoplay prevented:', err);
                    v.controls = true;
                } finally {
                    // fallback: if still paused after 700ms, show controls
                    setTimeout(() => {
                        if (v.paused) v.controls = true;
                    }, 700);
                }
            };
            tryPlay();

            const onError = (e) => { console.error('Video error event:', e); v.controls = true; };
            v.addEventListener('error', onError);
            return () => v.removeEventListener('error', onError);
        }
    }, [loading, wardens.length]);

    const onSearchEventWarden = (event) => {
        setSearchListWarden(event.target.value)
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
                            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Assigned List :-</h2>
                            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Active wardens for the selected hostel</p>
                        </div>
                        {/* <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400">Total Wardens:</span>
                            <span className="text-white font-semibold">{wardens.length}</span>
                        </div> */}
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
                                        type="search"
                                        value={searchListWarden}
                                        onChange={onSearchEventWarden}
                                        placeholder="Search wardens..."
                                        className="w-full pl-10 pr-14 py-2.5 bg-slate-800/50 border-2 border-slate-900/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                        style={{
                                            transform: searchOpen ? 'translateX(0)' : 'translateX(20px)',
                                            transition: 'transform 0.5s ease-in-out'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* This is for when Search student are not found this will display */}
                {searchListWarden.trim() && wardens.length > 0 && searchWarden.length === 0 && !loading ? (
                    <div className="rounded-xl p-8 text-center mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <Search className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>No Wardens found</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            No matches for "<span className="text-indigo-400">{searchListWarden}</span>"
                        </p>
                    </div>
                ) : null}
                {/* Wardens List */}
                <section className='min-h-[60vh] flex items-center justify-center'>
                    {loading ? (
                        <div className="flex items-center justify-center w-full min-h-[calc(60vh)]">
                            <div className="text-center">
                                <HashLoader loading={loading} color="#6366f1" size={80} />
                            </div>
                        </div>
                    ) : wardens.length === 0 ? (
                        <div className="mx-auto w-full max-w-2xl p-8 text-center" role="region" aria-labelledby="no-wardens-title" style={{ background: 'transparent', border: 'none' }}>
                            <div className="mx-auto mb-6 w-full max-w-sm">
                                {/* Video-only empty state */}
                                <video
                                    ref={videoRef}
                                    src={NotFound}
                                    autoPlay
                                    muted
                                    playsInline
                                    preload="auto"
                                    controls={false}
                                    aria-label="No wardens animation"
                                    className="mx-auto w-full rounded-md"
                                />
                            </div>

                            <h3 id="no-wardens-title" className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', color: 'var(--text-primary)' }}>No Wardens Assigned Yet</h3>
                            <p className="text-sm mb-6 max-w-[56ch] mx-auto" style={{ color: 'var(--text-muted)' }}>No wardens have been assigned to <strong style={{ color: 'var(--text-primary)' }}>{contextInfo.hostelName}</strong> yet. Assign a warden to manage resident lists, shift schedules, and notifications for this hostel block.</p>

                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={assignWarden}
                                    aria-label="Assign Warden"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md shadow-sm focus:outline-none"
                                    style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--text-inverse)', border: '1px solid rgba(0,0,0,0)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary-hover') || ''; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary') || ''; }}
                                >
                                    Assign Warden
                                </button>


                            </div>
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

                                        {/* Left: Warden Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <Avatar
                                                image={warden.photoURL}
                                                name={warden.fullName || warden.displayName || warden.email}
                                                size="lg"
                                            />

                                            <div className="flex-1 min-w-0">
                                                {/* Name and Badges */}
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                        {warden.fullName || warden.displayName || 'Unknown Warden'}
                                                    </h3>

                                                    {/* Role Badge */}
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${getRoleBadgeColor(getRoleLabel(warden))} text-white text-xs font-medium`}>
                                                        <Shield className="w-3 h-3" />
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
                                                title="Remove Warden">
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
