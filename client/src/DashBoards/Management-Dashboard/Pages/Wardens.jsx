import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import ManagementHeader from "../components/layout/ManagementHeader";
import { User, Shield, Eye, Edit2, X, RefreshCw, CircleX, CheckCircle } from 'lucide-react';
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
import * as cloudFunctions from '../../../firebase/cloudFunctions';

const mapUser = (u) => ({
  id: u._id,
  uid: u.uid,
  fullName: u.name || u.displayName,
  displayName: u.name || u.displayName,
  email: u.email,
  role: u.role,
  status: u.status,
  isOnline: u.isOnline,
  photoURL: u.avatarUrl || u.photoURL,
  hostelBlock: u.hostelBlock,
  collegeName: u.collegeName,
  wardenRole: u.wardenRole,
  position: u.position,
  createdAt: u.createdAt,
});

const Wardens = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
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
      const { users } = await cloudFunctions.listUsers({ role: 'warden' });
      setGetAllwarden((users || []).map(mapUser));
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
    let cancelled = false;
    let timer;

    const fetchWardens = async () => {
      try {
        const { users } = await cloudFunctions.listUsers({ role: 'warden' });
        if (cancelled) return;
        setGetAllwarden((users || []).map(mapUser));
        timer = setTimeout(() => setLoading(false), 1000);
      } catch (err) {
        console.error('Failed to fetch wardens:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to fetch wardens');
          setLoading(false);
        }
      }
    };

    fetchWardens();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [managementUid]);

  useEffect(() => {
    const handleRealtimeWardenUpdate = (event) => {
      const updatedUser = event.detail?.user;
      if (!updatedUser?.uid || updatedUser.role !== 'warden') return;
      setGetAllwarden((current) => current.map((w) =>
        w.uid === updatedUser.uid
          ? { ...w, isOnline: updatedUser.isOnline, fullName: updatedUser.name || w.fullName, displayName: updatedUser.name || w.displayName }
          : w
      ));
    };

    window.addEventListener('hoas:user-updated', handleRealtimeWardenUpdate);
    return () => window.removeEventListener('hoas:user-updated', handleRealtimeWardenUpdate);
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

  const handleRemove = async (warden) => {
    if (!window.confirm(`Are you sure you want to remove ${warden.fullName || warden.email}?`)) return;
    try {
      await cloudFunctions.deleteUserAccount(warden.id);
      setGetAllwarden(prev => prev.filter(w => w.id !== warden.id));
    } catch (err) {
      console.error('Remove warden failed:', err);
      setError(err.message || 'Failed to remove warden');
    }
  };




  const searchWardenList = getwarden.filter(warden => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    if (searchFilter === "name") return warden.fullName?.toLowerCase().includes(term);
    if (searchFilter === "email") return warden.email?.toLowerCase().includes(term);
    const roleMatch = getRoleLabel(warden)?.toLowerCase().includes(term);
    if (searchFilter === "role") return roleMatch;
    
    // all
    return (
      warden.fullName?.toLowerCase().includes(term) ||
      warden.email?.toLowerCase().includes(term) ||
      roleMatch
    );
  });
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
          <div className="search-box !p-1.5 flex items-center group focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <select
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-gray-100 dark:bg-white/5 border-none outline-none text-xs font-bold py-2.5 px-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <option value="all" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>All</option>
              <option value="name" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Name</option>
              <option value="email" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Email</option>
              <option value="role" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Role</option>
            </select>
            <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search by ${searchFilter === 'all' ? 'any' : searchFilter}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm px-2"
              style={{ color: 'var(--text-primary)' }}
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
