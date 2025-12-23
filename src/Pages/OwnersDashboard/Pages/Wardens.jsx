import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import Header from '../../../components/OwnerServices/header';
import {
    PuffLoader
} from 'react-spinners';
const Wardens = () => {
    const [wardens, setWardens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({})
    useEffect(() => {
        let timer;
        const q = query(collection(db, 'users'), where('role', '==', 'warden'));// this line for "Fetching" the data where it is present in collection of data in FireStore. 


        const unsubscribe = onSnapshot(q, (snapshot) => {
            const wardenList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWardens(wardenList);
            timer = setTimeout(() => setLoading(false), 3000);
        });// This Line is for the Fetching Data using the Snapshot


        
        return () => {
            unsubscribe();
            if (timer) clearTimeout(timer);
        };// This line is for Returing the function and clearTimout thing
    }, []);

    return (
        <>
            <Header title="Wardens" />
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">Wardens Page</h1>
                <div className="container">
                    {loading ? (
                        <div className="flex items-center justify-center w-full min-h-[calc(80vh-4rem)]">
                            <PuffLoader loading={loading} color="#63f1f1ff" size={100} />
                        </div>
                    ) : wardens.length === 0 ? (
                        <p>No Wardens Registered Yet!</p>
                    ) : (
                        <ul className="space-y-2">
                            {wardens.map(warden => (
                                <li key={warden.id} className="bg-slate-800 p-4 rounded-xl text-white">
                                    {warden.fullName || warden.email || warden.id}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
};

export default Wardens;
