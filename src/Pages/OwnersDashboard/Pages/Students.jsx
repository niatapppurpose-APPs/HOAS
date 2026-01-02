import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import Header from '../../../components/OwnerServices/header';
import Avatar from '../../../components/OwnerServices/Avatar';
import DeleteConfirmModal from '../../../components/OwnerServices/DeleteConfirmModal';
import { PuffLoader } from 'react-spinners';
import { User, Mail, GraduationCap, Eye, Edit2, UserMinus, Building2 } from 'lucide-react';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    // TODO: Replace with actual college and hostel data from props/context
    const contextInfo = {
        collegeName: "NIAT Engineering College",
        collegeLocation: "Bangalore, Karnataka",
        hostelName: "Boys Hostel – Block A",
        hostelId: "HST-2024-001"
    };

    useEffect(() => {
        let timer;
        const q = query(collection(db, 'users'), where('role', '==', 'student'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(list);
            timer = setTimeout(() => setLoading(false), 3000);
        });

        return () => {
            unsubscribe();
            if (timer) clearTimeout(timer);
        };
    }, []);

    const handleViewDetails = (studentId) => {
        console.log('View details for student:', studentId);
        // TODO: Implement view details modal or navigation
    };

    const handleEdit = (studentId) => {
        console.log('Edit student:', studentId);
        // TODO: Implement edit functionality
    };

    const handleRemove = (student) => {
        setDeleteModal({ isOpen: true, student });
    };

    return (
        <>
            <Header title="Hostel Students" />
            
            {/* Main Container */}
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Page Header */}
                <section className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Hostel Students</h2>
                            <p className="text-slate-400 mt-1">Students assigned to the selected college hostel</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400">Total Students:</span>
                            <span className="text-white font-semibold">{students.length}</span>
                        </div>
                    </div>
                </section>

                {/* Students List */}
                <section>
                    {loading ? (
                        <div className="flex items-center justify-center w-full min-h-[calc(60vh)]">
                            <div className="text-center">
                                <PuffLoader loading={loading} color="#6366f1" size={80} />
                                <p className="text-slate-400 mt-4">Loading students...</p>
                            </div>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
                            <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Students Assigned</h3>
                            <p className="text-slate-400 max-w-md mx-auto">
                                No students have been assigned to {contextInfo.hostelName} yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {students.map((student) => (
                                <div
                                    key={student.id}
                                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        
                                        {/* Left: Student Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <Avatar 
                                                image={student.photoURL} 
                                                name={student.fullName || student.displayName || student.email} 
                                                size="lg" 
                                            />
                                            
                                            <div className="flex-1 min-w-0">
                                                {/* Name and Badge */}
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="text-white font-semibold text-lg">
                                                        {student.fullName || student.displayName || 'Unknown Student'}
                                                    </h3>
                                                    
                                                    {/* Student Badge */}
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-medium">
                                                        <GraduationCap className="w-3 h-3" />
                                                        Student
                                                    </span>
                                                </div>
                                                
                                                {/* Email */}
                                                {student.email && (
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-2">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span className="truncate">{student.email}</span>
                                                    </div>
                                                )}
                                                
                                                {/* College and Hostel Badges */}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {/* College Badge */}
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white text-xs font-medium">
                                                        <Building2 className="w-3 h-3" />
                                                        {student.collegeName || contextInfo.collegeName}
                                                    </span>
                                                    
                                                    {/* Hostel Badge */}
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white text-xs font-medium">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>
                                                        {student.hostelBlock || contextInfo.hostelName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Action Buttons */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* View Details Button */}
                                            <button
                                                onClick={() => handleViewDetails(student.id)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm font-medium transition-all"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span className="hidden sm:inline">View</span>
                                            </button>

                                            {/* Edit Button */}
                                            <button
                                                onClick={() => handleEdit(student.id)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-white text-sm font-medium transition-all"
                                                title="Edit Student"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span className="hidden sm:inline">Edit</span>
                                            </button>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => handleRemove(student)}
                                                className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-600/80 text-slate-400 hover:text-white transition-all"
                                                title="Remove Student"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, student: null })}
                onConfirm={async () => {
                    if (!deleteModal.student) return;
                    setIsDeleting(true);
                    try {
                        await deleteDoc(doc(db, 'users', deleteModal.student.id));
                        setDeleteModal({ isOpen: false, student: null });
                    } catch (err) {
                        console.error('Failed to delete student:', err);
                        setError(err.message || 'Delete failed');
                    } finally {
                        setIsDeleting(false);
                    }
                }}
                collegeName={deleteModal.student?.fullName || deleteModal.student?.email}
                isDeleting={isDeleting}
                wardenCount={0}
                studentCount={0}
                showDetails={false}
                title="Delete Student"
            />
        </>
    );
};

export default Students;
