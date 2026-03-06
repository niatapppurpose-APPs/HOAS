import { useState, useEffect } from "react";
import { X, Building2, MapPin, Users, Settings, UserCircle, Trash2, Plus, Mail } from "lucide-react";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, doc, onSnapshot, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { useToast } from "../../../../components/Toast";
import AssignWardenModal from './AssignWardenModal';
import AssignStudentModal from './AssignStudentModal';

const HostelDetailsModal = ({ isOpen, onClose, hostelId }) => {
    const toast = useToast();
    const [hostel, setHostel] = useState(null);
    const [wardens, setWardens] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAssignWarden, setShowAssignWarden] = useState(false);
    const [showAssignStudent, setShowAssignStudent] = useState(false);

    useEffect(() => {
        if (!isOpen || !hostelId) return;

        setLoading(true);
        const hostelRef = doc(db, "hostels", hostelId);

        const unsubscribe = onSnapshot(hostelRef, async (hostelSnap) => {
            if (hostelSnap.exists()) {
                const data = { id: hostelSnap.id, ...hostelSnap.data() };
                setHostel(data);

                // Fetch warden details
                if (data.wardens && data.wardens.length > 0) {
                    try {
                        const wardenPromises = data.wardens.map(id => getDoc(doc(db, "users", id)));
                        const wardenDocs = await Promise.all(wardenPromises);
                        setWardens(wardenDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
                    } catch (error) {
                        console.error("Error fetching wardens", error);
                    }
                } else {
                    setWardens([]);
                }

                // Fetch student details
                if (data.students && data.students.length > 0) {
                    try {
                        const studentPromises = data.students.map(id => getDoc(doc(db, "users", id)));
                        const studentDocs = await Promise.all(studentPromises);
                        setStudents(studentDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
                    } catch (error) {
                        console.error("Error fetching students", error);
                    }
                } else {
                    setStudents([]);
                }
            } else {
                toast.error("Hostel not found");
                onClose();
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching hostel details:", err);
            toast.error("Failed to load hostel details");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, hostelId]);

    const removeWarden = async (wardenId) => {
        if (!window.confirm("Are you sure you want to remove this warden from the hostel?")) return;

        try {
            // 1. Remove from hostel document
            const hostelRef = doc(db, "hostels", hostelId);
            await updateDoc(hostelRef, {
                wardens: arrayRemove(wardenId)
            });

            // 2. Remove hostel reference from user document
            const wardenRef = doc(db, "users", wardenId);
            await updateDoc(wardenRef, {
                hostelId: null,
                hostelBlock: null
            });

            toast.success("Warden removed successfully");
        } catch (error) {
            console.error("Error removing warden", error);
            toast.error("Failed to remove warden");
        }
    };

    const removeStudent = async (studentId) => {
        if (!window.confirm("Are you sure you want to remove this student from the hostel?")) return;

        try {
            // 1. Remove from hostel document
            const hostelRef = doc(db, "hostels", hostelId);
            await updateDoc(hostelRef, {
                students: arrayRemove(studentId)
            });

            // 2. Remove hostel reference from user document
            const studentRef = doc(db, "users", studentId);
            await updateDoc(studentRef, {
                hostelId: null,
                hostelBlock: null,
                assignedWarden: null
            });

            toast.success("Student removed successfully");
        } catch (error) {
            console.error("Error removing student", error);
            toast.error("Failed to remove student");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div
                className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col my-auto"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0 sticky top-0 bg-inherit z-10" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Building2 className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {loading ? "Loading..." : hostel?.name}
                            </h2>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {loading ? "..." : `Block: ${hostel?.block} • ${hostel?.location?.address || 'No address'}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-black/5 transition-colors absolute top-4 right-4"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : !hostel ? (
                        <div className="text-center py-12">Hostel details could not be loaded.</div>
                    ) : (
                        <>
                            {/* Wardens Section */}
                            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                                <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-orange-500/10 rounded-xl">
                                            <UserCircle className="text-orange-500" size={22} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Assigned Wardens</h3>
                                            <div className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold ring-4 ring-orange-500/5">
                                                {wardens.length}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAssignWarden(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-indigo-100 shadow-sm"
                                    >
                                        <Plus size={16} /> Assign Warden
                                    </button>
                                </div>

                                <div className="p-0">
                                    {wardens.length === 0 ? (
                                        <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            No wardens assigned to this hostel yet.
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 border-b text-xs font-semibold" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-primary)' }}>
                                                    <th className="px-6 py-3 uppercase tracking-wider">Warden</th>
                                                    <th className="px-6 py-3 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-3 uppercase tracking-wider text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                                {wardens.map((warden) => (
                                                    <tr key={warden.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-3">
                                                                {warden.photoURL ? (
                                                                    <img src={warden.photoURL} alt={warden.displayName} className="w-8 h-8 rounded-full border" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                                        {warden.displayName?.[0]?.toUpperCase() || 'W'}
                                                                    </div>
                                                                )}
                                                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{warden.displayName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                                <Mail size={14} className="text-gray-400" />
                                                                {warden.email}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <button
                                                                onClick={() => removeWarden(warden.id)}
                                                                className="text-sm font-medium text-red-500 hover:text-red-600 hover:underline"
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {/* Students Section */}
                            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                                <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-green-500/10 rounded-xl">
                                            <Users className="text-green-500" size={22} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Assigned Students</h3>
                                            <div className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-green-100 text-green-600 text-xs font-bold ring-4 ring-green-500/5">
                                                {students.length}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAssignStudent(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-indigo-100 shadow-sm"
                                    >
                                        <Plus size={16} /> Assign Student
                                    </button>
                                </div>

                                <div className="p-0">
                                    {students.length === 0 ? (
                                        <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            No students assigned to this hostel yet.
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 border-b text-xs font-semibold" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-primary)' }}>
                                                    <th className="px-6 py-3 uppercase tracking-wider">Student</th>
                                                    <th className="px-6 py-3 uppercase tracking-wider">ID / Role No</th>
                                                    <th className="px-6 py-3 uppercase tracking-wider">Room</th>
                                                    <th className="px-6 py-3 uppercase tracking-wider text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                                {students.map((student) => (
                                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-3">
                                                                {student.photoURL ? (
                                                                    <img src={student.photoURL} alt={student.displayName} className="w-8 h-8 rounded-full border" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                                        {student.displayName?.[0]?.toUpperCase() || 'S'}
                                                                    </div>
                                                                )}
                                                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{student.displayName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                            {student.studentId || student.rollNumber || '-'}
                                                        </td>
                                                        <td className="px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                                            <span className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs border">
                                                                {student.roomNumber || 'Not assigned'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <button
                                                                onClick={() => removeStudent(student.id)}
                                                                className="text-sm font-medium text-red-500 hover:text-red-600 hover:underline"
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showAssignWarden && hostel && (
                <AssignWardenModal
                    isOpen={showAssignWarden}
                    onClose={() => setShowAssignWarden(false)}
                    hostel={hostel}
                    collegeName={hostel.collegeName}
                />
            )}

            {showAssignStudent && hostel && (
                <AssignStudentModal
                    isOpen={showAssignStudent}
                    onClose={() => setShowAssignStudent(false)}
                    hostel={hostel}
                    collegeName={hostel.collegeName}
                    assignedWardens={wardens}
                />
            )}
        </div>
    );
};

export default HostelDetailsModal;
