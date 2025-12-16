import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Shield, Building2, User, Phone, Briefcase, Loader2, ChevronDown } from 'lucide-react';

const WardenProfile = () => {
    const { user, userData, userDataLoading } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        employeeId: '',
        designation: '',
        collegeName: ''
    });
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingColleges, setFetchingColleges] = useState(true);
    const [error, setError] = useState('');

    // Fetch approved colleges
    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'management'),
                    where('status', '==', 'approved')
                );
                const snapshot = await getDocs(q);
                const collegeList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    collegeName: doc.data().collegeName,
                    location: doc.data().location
                }));
                setColleges(collegeList);
            } catch (err) {
                console.error('Error fetching colleges:', err);
            } finally {
                setFetchingColleges(false);
            }
        };
        fetchColleges();
    }, []);

    // Redirect if profile already exists
    useEffect(() => {
        if (!userDataLoading && userData) {
            if (userData.status === 'approved') {
                navigate('/dashboard/warden');
            } else if (userData.status === 'pending' || userData.status === 'denied') {
                navigate('/waiting-approval');
            }
        }
    }, [userData, userDataLoading, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.collegeName) {
            setError('Please select a college');
            return;
        }

        const selectedCollege = colleges.find(c => c.id === formData.collegeName);

        setLoading(true);
        try {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                photoURL: user.photoURL,
                role: 'warden',
                status: 'pending',
                fullName: formData.fullName,
                phone: formData.phone,
                employeeId: formData.employeeId,
                designation: formData.designation,
                collegeId: formData.collegeName,
                collegeName: selectedCollege?.collegeName || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            navigate('/waiting-approval');
        } catch (err) {
            console.error('Error creating profile:', err);
            setError('Failed to create profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (userDataLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Warden Registration</h1>
                        <p className="text-gray-500 mt-2">Complete your profile to continue</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                        </div>

                        {/* Employee ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    placeholder="Enter your employee ID"
                                />
                            </div>
                        </div>

                        {/* Designation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    placeholder="e.g., Chief Warden, Block Warden"
                                />
                            </div>
                        </div>

                        {/* College Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select College</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    name="collegeName"
                                    value={formData.collegeName}
                                    onChange={handleChange}
                                    required
                                    disabled={fetchingColleges}
                                    className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white"
                                >
                                    <option value="">
                                        {fetchingColleges ? 'Loading colleges...' : 'Select your college'}
                                    </option>
                                    {colleges.map(college => (
                                        <option key={college.id} value={college.id}>
                                            {college.collegeName} - {college.location}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                            {!fetchingColleges && colleges.length === 0 && (
                                <p className="text-amber-600 text-sm mt-2">No colleges available yet. Please wait for approval.</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || fetchingColleges || colleges.length === 0}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Profile...
                                </>
                            ) : (
                                'Complete Registration'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default WardenProfile;
