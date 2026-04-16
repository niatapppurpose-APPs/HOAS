import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import ManagementHeader from "../components/layout/ManagementHeader";
import { collection, query, where, onSnapshot, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { User, Shield, Eye, Edit2, X, RefreshCw, CircleX, CheckCircle } from 'lucide-react';
import { db } from '../../../firebase/firebaseConfig';
import Avatar from "../../../components/OwnerServices/Avatar";
import { Building2, Mail, Search, Filter, Plus } from "lucide-react";
import "../ManagementDashboard.css";
import { HashLoader } from 'react-spinners'
import EmptyState from "../../../components/OwnerServices/EmptyState";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import AddWardenModal from './AddWardenModal';
import NoDataLight from '../../../assets/No-Data.avif';
import NoDataDark from '../../../assets/NoDataDark.png';

const Wardens = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const [getwarden, setGetAllwarden] = useState([])
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const searchInputRef = useRef(null);
  const [showAddWarden, setShowAddWarden] = useState(false);
  const { isDark } = useTheme()
  const { userData, user } = useAuth();
  const managementUid = user?.uid;

  const handleRefresh = async () => {
    if (!managementUid) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'warden'),
        where('managementId', '==', managementUid)
      );
      const snapshot = await getDocs(q);
      const wardenList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGetAllwarden(wardenList);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh wardens:', err);
      setError(err.message || 'Refresh failed');
    } finally {
      setLoading(false);
    }
  };




  const contextInfo = {
    collegeName: "Professional Institution",
    hostelBlock: "Premium Hostel – Block A"
  };

  useEffect(() => {
    if (!managementUid) return; // wait until auth resolves
    let timer;

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'warden'),
      where('managementId', '==', managementUid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wardenlist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGetAllwarden(wardenlist);
      timer = setTimeout(() => setLoading(false), 2000);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [managementUid]);
  const clearSearchWarden = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  }
  // Helper function to get role badge color
  const getRoleBadgeColor = (role) => {
    if (role?.toLowerCase().includes('warden')) {
      return 'from-amber-500/90 to-yellow-600/90 border border-amber-400/30'; // Yellow gradient for wardens
    }
    return 'from-gray-500/90 to-gray-600/90'; // Default
  };

  const getRoleLabel = (warden) => {
    // Check if there's a specific warden role field
    if (warden.wardenRole) return warden.wardenRole;
    if (warden.position) return warden.position;
    return 'Warden'; // Default
  };

  const handleRemove = (warden) => {
    // TODO: Implement remove functionality
    console.log('Remove warden:', warden);
  };




  const searchWardenList = getwarden.filter(warden => (
    warden.fullName.includes(searchTerm)
  ))
  return (
    <>
      {/* Header */}
      <ManagementHeader
        title="Wardens · Management"
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
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="page-title">Wardens Management</h1>
              <p className="page-subtitle">Manage and monitor all wardens</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setShowAddWarden(true)}>
            <Plus size={20} />
            Add Warden
          </button>
        </div>

        {/* Search and Filter */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={20} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search wardens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

          </div>
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl cursor-pointer border transition-all duration-300 group"
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
            <RefreshCw className="w-5 h-5 transition-transform duration-300 cursor-pointer group-hover:rotate-180" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        {searchTerm.trim() && getwarden.length > 0 && searchWardenList.length === 0 && !loading ? (
          <div className="mb-4">
            <EmptyState
              title={`No matches for "${searchTerm}"`}
              description={'Try a different name, or clear the search to see all wardens.'}
              ctaLabel="Clear search"
              onCta={clearSearchWarden}
              videoSrc={!isDark ? NoDataLight : NoDataDark}
              className="max-w-5xl mx-auto"
            />
          </div>
        ) : null}
        {loading ? (
          <div className="flex items-center justify-center w-full min-h-[calc(60vh)]">
            <div className="text-center">
              <HashLoader loading={loading} color="#6366f1" size={80} />
            </div>
          </div>
        ) : (getwarden.length === 0 ? (
          <div className="mb-4">
            <EmptyState
              title="No wardens yet"
              description="You haven't added any wardens to your institution yet. Add your first warden to get started."
              ctaLabel="Add Warden"
              onCta={() => setShowAddWarden(true)}
              videoSrc={!isDark ? NoDataLight : NoDataDark}
              className="max-w-5xl mx-auto"
            />
          </div>
        ) : (searchWardenList.map(warden => (
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
                name={warden.fullName || warden.email}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {warden.fullName || 'Unknown Warden'}
                  </h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-gradient-to-r ${getRoleBadgeColor(getRoleLabel(warden))} text-white shadow-sm`}>
                    {getRoleLabel(warden)}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50">
                    {warden.collegeName || contextInfo.collegeName}
                  </span>
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
                 {/* Reserved for future Warden actions */}
            </div>
          </div>
        ))))}
      </div>

      {/* Add Warden Modal */}
      <AddWardenModal
        isOpen={showAddWarden}
        onClose={() => setShowAddWarden(false)}
        collegeName={userData?.collegeName}
      />
    </>
  );
};

export default Wardens;
