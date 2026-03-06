import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { Home, Search, Filter, Plus, X } from "lucide-react";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext";
import "../ManagementDashboard.css";

const Hostels = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newHostel, setNewHostel] = useState("");
  const [newBlock, setNewBlock] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newLogo, setNewLogo] = useState("");
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const { userData } = useAuth();

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
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHostels(list);
      setLoading(false);
    });
    return () => unsub();
  }, [userData?.collegeName]);

  const addHostel = async () => {
    if (!newHostel.trim() || !userData?.collegeName) return;
    try {
      const docRef = await addDoc(collection(db, 'hostels'), {
        name: newHostel.trim(),
        block: newBlock.trim(),
        location: newLocation.trim(),
        logoUrl: newLogo.trim(),
        collegeName: userData.collegeName,
        createdAt: serverTimestamp(),
      });
      // reset fields
      const addedBlock = newBlock.trim();
      setNewHostel('');
      setNewBlock('');
      setNewLocation('');
      setNewLogo('');
      setShowAdd(false);

      // prompt to merge students
      if (addedBlock) {
        const merge = window.confirm("Hostel added. Would you like to merge/assign existing students by block now?");
        if (merge) {
          // navigate to students page with query parameter for block
          navigate(`/dashboard/management/students?block=${encodeURIComponent(addedBlock)}`);
        }
      }
    } catch (err) {
      console.error('Add hostel failed', err);
    }
  };

  const removeHostel = async (id) => {
    try {
      await deleteDoc(doc(db, 'hostels', id));
    } catch (err) {
      console.error('Delete hostel failed', err);
    }
  };

  return (
    <>
      {/* Header */}
      <ManagementHeader 
        title="Hostels · Management"
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
              <Home size={24} />
            </div>
            <div>
              <h1 className="page-title">Hostels Management</h1>
              <p className="page-subtitle">Manage and monitor all hostels</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={20} />
            Add Hostel
          </button>
        </div>

        {/* Search and Filter */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search hostels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary">
            <Filter size={20} />
            Filter
          </button>
        </div>

        {/* Content Area */}
        <div className="content-card">
          {loading ? (
            <p>Loading…</p>
          ) : hostels.length === 0 ? (
            <div className="empty-state">
              <Home size={64} className="empty-icon" />
              <h3>No Hostels Found</h3>
              <p>Start by adding your first hostel to the system</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {hostels.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())).map(h => (
                <li key={h.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {h.logoUrl && (
                      <img src={h.logoUrl} alt="logo" className="w-10 h-10 rounded" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{h.name}</p>
                      {h.block && <p className="text-xs text-gray-500">Block: {h.block}</p>}
                      {h.location && <p className="text-xs text-gray-500">{h.location}</p>}
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 flex gap-2">
                    <button
                      onClick={() => removeHostel(h.id)}
                      className="p-1 rounded-full hover:bg-red-100"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                    <button
                      onClick={() => alert('Assign students functionality coming soon')}
                      className="px-3 py-1 rounded-lg text-sm bg-indigo-500 text-white"
                    >
                      Assign Students
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {showAdd && (
            <div className="mt-4 space-y-2">
              {/* hostel name */}
              <input
                type="text"
                value={newHostel}
                onChange={e => setNewHostel(e.target.value)}
                placeholder="Hostel Name (e.g., Maple Residency)"
                className="px-3 py-2 rounded-xl border w-full"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
              />
              {/* block */}
              <input
                type="text"
                value={newBlock}
                onChange={e => setNewBlock(e.target.value)}
                placeholder="Hostel Block (e.g., Block A)"
                className="px-3 py-2 rounded-xl border w-full"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
              />
              {/* location search placeholder */}
              <input
                type="text"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="Search location (Google)"
                className="px-3 py-2 rounded-xl border w-full"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
              />
              {/* logo url */}
              <input
                type="text"
                value={newLogo}
                onChange={e => setNewLogo(e.target.value)}
                placeholder="Logo image URL"
                className="px-3 py-2 rounded-xl border w-full"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
              />
              <div className="flex gap-2">
                <button onClick={addHostel} className="btn-primary">Save</button>
                <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Hostels;
