import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from "../../../../firebase/firebaseConfig";
import ManagementSidebar from "../../components/layout/ManagementSidebar";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { Users, Search, Filter, Plus, GraduationCap, CheckCircle, Building2 } from "lucide-react";
import "../ManagementDashboard.css";
import { HashLoader } from "react-spinners";
import { useAuth } from "../../../../context/AuthContext";
import Avatar from "../../../../components/OwnerServices/Avatar";

const Students = () => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Read optional collegeId from URL query params (e.g. ?collegeId=COL123)
    const searchParams = new URLSearchParams(location.search);
    const initialCollegeId = searchParams.get('collegeId') ?? null; 

  // Use Auth context to get user's college if provided (management user assigned to a college)
  const { userData } = useAuth();

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by auth context
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // Determine college filter: URL param takes precedence, otherwise use user's collegeId/collegeName
  const getCollegeFilter = () => {
    if (initialCollegeId) return { field: 'collegeId', value: initialCollegeId };
    if (userData?.collegeId) return { field: 'collegeId', value: userData.collegeId };
    if (userData?.collegeName) return { field: 'collegeName', value: userData.collegeName };
    return null;
  };

  useEffect(() => {
    let timer;
    const collegeFilter = getCollegeFilter();

    const q = collegeFilter
      ? query(collection(db, 'users'), where('role', '==', 'student'), where(collegeFilter.field, '==', collegeFilter.value))
      : query(collection(db, 'users'), where('role', '==', 'student'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(list);
        // small artificial delay for UX (spinner)
        timer = setTimeout(() => setLoading(false), 1000);
      },
      (error) => {
        console.error('Failed to fetch students:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [initialCollegeId, userData]);



    return (
        <div className="management-dashboard">
            <ManagementSidebar />

            <main className="dashboard-main">
                <ManagementHeader 
                  user={user} 
                  pendingCount={0}
                  handleLogout={handleLogout}
                />

                <div className="dashboard-content">
                    {/* Page Header */}
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                            <Users className="text-indigo-400 bg-white/5 p-2 rounded-md" size={32} />
                            <div>
                                <h1 className="text-xl font-bold text-white">Students Management</h1>
                                <p className="text-sm text-indigo-200">Manage and monitor all students</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white rounded-md font-semibold">
                                <Plus size={20} />
                                Add Student
                            </button>
                        </div>
                    </div>
                    {/* Search and Filter */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 bg-white/5 rounded-md px-3 py-2 border border-white/5">
                            <Search size={20} className="text-white/80" />
                            <input
                                className="bg-transparent outline-none text-white w-56"
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="inline-flex items-center gap-2 px-3 py-2 bg-white/6 text-white rounded-md border border-white/6">
                            <Filter size={20} />
                            Filter
                        </button>
                    </div>
                    {/* Results / Empty / Loading */}
                    {loading ? (
                        <div className="flex items-center justify-center w-full min-h-[calc(40vh)]">
                            <HashLoader />
                        </div>
                    ) : (students.length === 0 ? (
                        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Students Found</h3>
                            <p className="max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                                Start by adding your first student to the system
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {students.map((student) => (
                                <div key={student.id} className="rounded-xl p-4 hover:border-slate-600/50 transition-all" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar user={student} size="md" />
                                            <div>
                                                <h3 className="font-semibold text-lg text-white">{student.fullName || student.displayName || student.email || 'Unknown Student'}</h3>
                                                <p className="text-sm text-white/80">{student.email || ''}</p>
                                                {/* Professional Experience Badge */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white text-xs font-medium">
                                                        <GraduationCap className="w-3 h-3" />
                                                        Student
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-green-600/80 to-emerald-600/80 text-white text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {/* Professional Institution Badge */}
                                            <div className="mb-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white text-xs font-semibold shadow-lg border border-purple-500/30">
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    {student.collegeName || 'Professional Institution'}
                                                    <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                                                        PRO
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="text-sm text-white/80">{student.hostelBlock || 'Premium Hostel'}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}


                </div>
            </main>
        </div>
    );
};

export default Students;
