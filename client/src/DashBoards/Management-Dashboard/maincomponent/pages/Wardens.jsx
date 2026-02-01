import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { collection, query, where, onSnapshot, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { User, Shield, Eye, Edit2, UserMinus, X, RefreshCw, CircleX, CheckCircle } from 'lucide-react';
import { db } from '../../../../firebase/firebaseConfig';
import Avatar from "../../../../components/OwnerServices/Avatar";
import { Building2, Mail, Search, Filter, Plus } from "lucide-react";
import "../ManagementDashboard.css";

const Wardens = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { isCollapsed } = useOutletContext();
  const [getwarden, setGetAllwarden] = useState([])
  const [loading, setLoading] = useState(null)

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




  const getRoleBadgeColor = (role) => {
    if (role?.toLowerCase().includes('chief')) {
      return;
    }
    return 'from-yellow-600';
  };
  const getRoleLabel = (warden) => {
    // Check if there's a specific warden role field
    if (warden.wardenRole) return warden.wardenRole;
    if (warden.position) return warden.position;
    return 'Warden'; // Default
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
          <button className="btn-primary">
            <Plus size={20} />
            Add Warden
          </button>
        </div>

        {/* Search and Filter */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search wardens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

        </div>

        {searchWardenList.map(warden => (
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-t ${getRoleBadgeColor(getRoleLabel(warden))} text-white text-xs font-medium`}>
                        {getRoleLbel(warden)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-medium ${warden.isOnline ? 'bg-gradient-to-r from-green-600/80 to-emerald-600/80' : 'bg-gradient-to-r from-red-600/80 to-rose-600/80'}`}>
                        {warden.isOnline ? (
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
        ))}
      </div>
    </>
  );
};

export default Wardens;
