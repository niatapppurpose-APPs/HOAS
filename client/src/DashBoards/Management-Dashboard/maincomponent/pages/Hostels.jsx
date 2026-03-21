import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { Home, Search, Filter, Plus, Home as HomeIcon } from "lucide-react";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext";
import { useToast } from "../../../../components/Toast";
import "../ManagementDashboard.css";

import AddHostelModal from "../../components/hostels/AddHostelModal";
import HostelCard from "../../components/hostels/HostelCard";
import HostelDetailsModal from "../../components/hostels/HostelDetailsModal";

const Hostels = () => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [selectedHostelId, setSelectedHostelId] = useState(null);

  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const { userData } = useAuth();

  const getHostelKey = (hostel) =>
    String(hostel?.block || hostel?.name || hostel?.id || "")
      .trim()
      .toLowerCase();

  const getHostelScore = (hostel) => {
    let score = 0;
    if (hostel?.block) score += 3;
    if (hostel?.name) score += 2;
    if (hostel?.location?.address) score += 1;
    if (hostel?.capacity) score += 1;
    if (Array.isArray(hostel?.wardens) && hostel.wardens.length > 0) score += 1;
    if (Array.isArray(hostel?.students) && hostel.students.length > 0) score += 1;
    return score;
  };

  useEffect(() => {
    if (!userData?.collegeName) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'hostels'),
      where('collegeName', '==', userData.collegeName)
    );

    const unsub = onSnapshot(q, snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(h => !h.managementId || h.managementId === userData?.uid)
        .reduce((map, hostel) => {
          const key = getHostelKey(hostel);
          const existing = map.get(key);

          if (!existing || getHostelScore(hostel) > getHostelScore(existing)) {
            map.set(key, hostel);
          }

          return map;
        }, new Map());
      setHostels(Array.from(list.values()));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching hostels", err);
      toast.error("Failed to load hostels");
      setLoading(false);
    });

    return () => unsub();
  }, [userData?.collegeName]);

  const handleDeleteHostel = async (id) => {
    try {
      await deleteDoc(doc(db, 'hostels', id));
      toast.success("Hostel deleted successfully");
    } catch (err) {
      console.error('Delete hostel failed', err);
      toast.error("Failed to delete hostel");
    }
  };

  const handleEditHostel = (hostel) => {
    setEditingHostel(hostel);
    setShowAddModal(true);
  };

  const handleCloseHostelModal = () => {
    setShowAddModal(false);
    setEditingHostel(null);
  };

  const filteredHostels = hostels.filter(h =>
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.block?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <ManagementHeader
        title="Hostels · Management"
        pendingCount={0}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 sm:pt-24 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden min-h-screen">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Home size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Hostels Management</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage and monitor all hostels and blocks</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingHostel(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all transform hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))', boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)' }}
          >
            <Plus size={18} />
            Add Hostel
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search hostels by name, block, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors font-medium"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredHostels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <HomeIcon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Hostels Found</h3>
            <p className="max-w-md mb-6" style={{ color: 'var(--text-secondary)' }}>
              {searchTerm ? "No hostels matched your search criteria." : "Start by adding your first hostel to the system. You can then assign wardens and students to it."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setEditingHostel(null);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all transform hover:scale-[1.02] active:scale-95"
                style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }}
              >
                <Plus size={18} /> Add Your First Hostel
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredHostels.map(hostel => (
              <HostelCard
                key={hostel.id}
                hostel={hostel}
                onClick={() => setSelectedHostelId(hostel.id)}
                onDelete={handleDeleteHostel}
                onEdit={handleEditHostel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddHostelModal
        isOpen={showAddModal}
        onClose={handleCloseHostelModal}
        collegeName={userData?.collegeName}
        managementId={userData?.uid}
        initialHostel={editingHostel}
      />

      {selectedHostelId && (
        <HostelDetailsModal
          isOpen={true}
          onClose={() => setSelectedHostelId(null)}
          hostelId={selectedHostelId}
        />
      )}
    </>
  );
};

export default Hostels;
