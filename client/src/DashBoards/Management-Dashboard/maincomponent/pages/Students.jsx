import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from "../../../../firebase/firebaseConfig";
import ManagementSidebar from "../../components/layout/ManagementSidebar";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { Users, Search, Filter, Plus } from "lucide-react";
import "../ManagementDashboard.css";
import { HashLoader } from "react-spinners";

const Students = () => {
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Read optional collegeId from URL query params (e.g. ?collegeId=COL123)
    const searchParams = new URLSearchParams(location.search);
    const initialCollegeId = searchParams.get('collegeId') ?? null; 
    const [collegeId, setCollegeId] = useState(initialCollegeId);

    useEffect(() => {
        let timer;
        const q = collegeId
            ? query(collection(db, 'users'), where('role', '==', 'student'), where('collegeId', '==', collegeId))
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
    }, []);

    const searchStudent = students.filter((studentlist) =>
        !searchTerm.trim() || studentlist.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    )


    return (
        <div className="management-dashboard">
            <ManagementSidebar />

            <main className="dashboard-main">
                <ManagementHeader user={{ displayName: "Admin" }} />

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
                    ) : (searchStudent.length === 0 ? (
                        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Students Found</h3>
                            <p className="max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                                Start by adding your first student to the system
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {searchStudent.map((student) => (
                                <div key={student.id} className="rounded-xl p-4 hover:border-slate-600/50 transition-all" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg text-white">{student.fullName || student.displayName || student.email || 'Unknown Student'}</h3>
                                            <p className="text-sm text-white/80">{student.email || ''}</p>
                                        </div>
                                        <div className="text-sm text-white/80">{student.collegeName ? `${student.collegeName} • ${student.hostelBlock || ''}` : (student.hostelBlock || '')}</div>

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
