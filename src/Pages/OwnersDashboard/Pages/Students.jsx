import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import Header from '../../../components/OwnerServices/header';
import DeleteConfirmModal from '../../../components/OwnerServices/DeleteConfirmModal';
import {
    PuffLoader
} from 'react-spinners';
import {Trash2} from 'lucide-react'
import { doc, deleteDoc } from 'firebase/firestore';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let timer;
        const q = query(collection(db, 'users'), where('role', '==', 'student'));// this line for "Fetching" the data where it is present in collection of data in FireStore. 


        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(list);
            timer = setTimeout(() => setLoading(false), 3000);
        });// This Line is for the Fetching Data using the Snapshot


        
        return () => {
            unsubscribe();
            if (timer) clearTimeout(timer);
        };// This line is for Returing the function and clearTimout thing
    }, []);

    return (
        <>
            <Header title="Student" />
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">Student Page</h1>
                <div className="container">
                    {loading ? (
                        <div className="flex items-center justify-center w-full min-h-[calc(80vh-4rem)]">
                            <PuffLoader loading={loading} color="#00ffffff" size={100} />
                        </div>
                    ) : students.length === 0 ? (
                        <p>No Students Registered Yet!</p>
                    ) : (
                        <ul className="space-y-3">
                            {students.map(student => (
                                <li key={student.id} className="flex items-center justify-between bg-slate-800 p-4 rounded-xl text-white">
                                    <div>
                                        <h3>{student.fullName}</h3>
                                    <p className='text-[#828888ff]'>{student.email}</p>
                                    </div>
                                    <button onClick={() => setDeleteModal({ isOpen: true, student })}>
                                        <Trash2 />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
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
