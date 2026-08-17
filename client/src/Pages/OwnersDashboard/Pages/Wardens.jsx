import { useState, useEffect, useRef } from 'react';
import { listUsers, deleteUserAccount } from '../../../firebase/cloudFunctions';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../components/OwnerServices/header';
import Avatar from '../../../components/OwnerServices/Avatar';
import { HashLoader } from "react-spinners";
import { User, Mail, Shield, Eye, Edit2, UserMinus, Building2, Search, X, RefreshCw } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import EmptyState from '../../../components/OwnerServices/EmptyState';
import { useTheme } from '../../../context/ThemeContext';
import NoDataLight from '../../../assets/No-Data.avif';
import NoDataDark from '../../../assets/NoDataDark.png';
const Wardens = () => {
    const { isDark } = useTheme();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [wardens, setWardens] = useState([]);
    const toast = useToast();
    
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
            const { users } = await listUsers({ role: 'warden' });
            const wardenList = (users || []).map(w => ({
                id: w._id,
                uid: w.uid,
                fullName: w.name,
                displayName: w.name,
                email: w.email,
                isOnline: w.isOnline,
                photoURL: w.avatarUrl,
                hostelBlock: w.hostelBlock,
                collegeName: w.collegeId?.name,
            }));
            setWardens(wardenList);
            setError(null);
        } catch (err) {
            console.error('Failed to refresh wardens:', err);
            setError(err.message || 'Refresh failed');
        } finally {
            setLoading(false);
        }
    };

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
        let cancelled = false;

        listUsers({ role: 'warden' })
            .then(({ users }) => {
                if (cancelled) return;
                const wardenList = (users || []).map(w => ({
                    id: w._id,
                    uid: w.uid,
                    fullName: w.name,
                    displayName: w.name,
                    email: w.email,
                    isOnline: w.isOnline,
                    photoURL: w.avatarUrl,
                    hostelBlock: w.hostelBlock,
                    collegeName: w.collegeId?.name,
                }));
                setWardens(wardenList);
                timer = setTimeout(() => setLoading(false), 500);
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
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

    const handleRemove = async (warden) => {
        const confirmed = await toast.confirm("Are you sure you want to remove this warden?", null, { confirmText: "Yes, Remove", cancelText: "Cancel" });
        if (confirmed) {
            try {
                await deleteUserAccount(warden.id);
                toast.success('Warden removed successfully');
            } catch (err) {
                console.error('Failed to delete warden:', err);
                toast.error(err.message || 'Failed to remove warden');
            }
        }
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
                setIsCollapsed={setIsCollapsed}
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
                            videoSrc={!isDark ? NoDataLight : NoDataDark}
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
                                description={`No wardens have been assigned to ${contextInfo.hostelBlock} yet. Assign a warden to help manage students, handle daily operations, and maintain hostel discipline.`}
                                ctaLabel="Open Search"
                                onCta={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                                videoSrc={!isDark ? NoDataLight : NoDataDark}
                                className="max-w-5xl mx-auto"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {searchWarden.map((warden) => (
    <div
        key={warden.id}
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-xl p-3 transition-all hover:bg-black/5 dark:hover:bg-white/5"
        style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderLeftWidth: '4px',
            borderLeftColor: warden.isOnline ? "green" : "red",
        }}
    >
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar
                image={warden.photoURL}
                name={warden.fullName || warden.displayName || warden.email}
                size="md"
            />
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {warden.fullName || warden.displayName || 'Unknown Warden'}
                    </h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-gradient-to-r ${getRoleBadgeColor(getRoleLabel(warden))} text-white shadow-sm`}>
                        {getRoleLabel(warden)}
                    </span>
                    {warden.hostelBlock && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            {warden.hostelBlock}
                        </span>
                    )}
                    {warden.collegeName && (
                        <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50">
                            {warden.collegeName || contextInfo.collegeName}
                        </span>
                    )}
                </div>
                {warden.email && (
                    <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{warden.email}</span>
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 xl:gap-6 text-xs">
            <button
                onClick={() => handleRemove(warden)}
                className="p-2 rounded-lg transition-all border border-[#E1251B] flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                title="Remove Warden"
            >
                <UserMinus className="text-[#E1251B] w-4 h-4" />
            </button>
        </div>
    </div>
))}
                        </div>
                    )}
                </section>
            </div>
            
        </>
    );
};

export default Wardens;
