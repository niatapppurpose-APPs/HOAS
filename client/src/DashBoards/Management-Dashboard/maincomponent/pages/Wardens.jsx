import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { collection, query, where, onSnapshot, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { User, Shield, Eye, Edit2, UserMinus, X, RefreshCw, CircleX, CheckCircle } from 'lucide-react';
import { db } from '../../../../firebase/firebaseConfig';
import Avatar from "../../../../components/OwnerServices/Avatar";
import { Building2, Mail, Search, Filter, Plus } from "lucide-react";
import "../ManagementDashboard.css";
import { HashLoader } from 'react-spinners'
import EmptyState from "../../../../components/OwnerServices/EmptyState";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import AddWardenModal from './AddWardenModal';
import NoDataLight from '../../../../assets/No-Data.avif';
import NoDataDark from '../../../../assets/NoDataDark.png';

const Wardens = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { isCollapsed } = useOutletContext();
  const [getwarden, setGetAllwarden] = useState([])
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const searchInputRef = useRef(null);
  const [showAddWarden, setShowAddWarden] = useState(false);
  const { isDark } = useTheme()
  const { userData } = useAuth()
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'warden'));
      const snapshot = await getDocs(q);
      const wardenList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGetAllwarden(wardenList)
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
    hostelName: "Premium Hostel – Block A"
  };

  useEffect(() => {
    let timer;
    const q = query(collection(db, 'users'), where('role', '==', 'warden'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wardenlist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGetAllwarden(wardenlist);
      timer = setTimeout(() => setLoading(false), 2000);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);
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
      />

      {/* Main Content */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
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
            className="rounded-xl p-4 hover:border-slate-600/50 transition-all"

            style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)',
              borderColor: warden.isOnline ? "green" : "red",

            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              {/* Left: Warden Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">

                <Avatar
                  image={warden.photoURL}
                  name={warden.fullName || warden.email}
                  size="lg"
                />

                <div className="flex-1 min-w-0">
                  {/* Name and Badge */}
                  <div className="flex items-center gap-8 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {warden.fullName || 'Unknown Warden'}
                    </h3>
                    {/* College and Hostel Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Professional Institution Badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white text-xs font-semibold shadow-lg border border-purple-500/30">
                        <Building2 className="w-3.5 h-3.5" />
                        {warden.collegeName || contextInfo.collegeName}

                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${getRoleBadgeColor(getRoleLabel(warden))} text-white text-xs font-medium shadow-md`}>
                        <Shield className="w-3.5 h-3.5" />
                        {getRoleLabel(warden)}
                      </span>
                    </div>
                  </div>

                  {/* Email */}
                  {warden.email && (
                    <div className="flex items-center gap-1.5 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{warden.email}</span>
                    </div>
                  )}


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
