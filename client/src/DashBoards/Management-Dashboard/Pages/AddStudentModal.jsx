import { useState, useEffect } from 'react';
import { createStudent } from '../../../firebase/cloudFunctions';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../components/Toast';
import { db } from '../../../firebase/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
    X, User, Mail, Phone, BookOpen, Building2, CheckCircle2,
    GraduationCap, Briefcase
} from 'lucide-react';

const AddStudentModal = ({ isOpen, onClose, collegeName }) => {
    const { userData, user } = useAuth();
    const { isDark } = useTheme();
    const toast = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        studentId: '',
        phone: '',
        course: '',
        branch: '',
        year: '',
        hostelBlock: '',
        hostelRoom: '',
        fatherName: '',
        address: ''
    });
    const [hostels, setHostels] = useState([]);

    // wardens list is populated when a hostel block is entered
    const [availableWardens, setAvailableWardens] = useState([]);
    const [selectedWarden, setSelectedWarden] = useState('');

    const college = collegeName || userData?.collegeName || '';

    // fetch hostels for suggestions
    useEffect(() => {
        if (!college) return;
        const fetch = async () => {
            try {
                const q = query(
                    collection(db, 'hostels'),
                    where('collegeName', '==', college)
                );
                const snap = await getDocs(q);
                setHostels(snap.docs.map(d => d.data().block || d.data().name));
            } catch (err) {
                console.error('error loading hostels', err);
            }
        };
        fetch();
    }, [college]);


    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Whenever the block changes, fetch matching wardens
    useEffect(() => {
        if (!formData.hostelBlock.trim() || !college) {
            setAvailableWardens([]);
            setSelectedWarden('');
            return;
        }
        const fetchWardens = async () => {
            try {
                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'warden'),
                    where('collegeName', '==', college),
                    where('hostelBlock', '==', formData.hostelBlock.trim())
                );
                const snap = await getDocs(q);
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setAvailableWardens(list);
                if (list.length === 1) {
                    setSelectedWarden(list[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch wardens for block:', err);
            }
        };
        fetchWardens();
    }, [formData.hostelBlock, college]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'hostelBlock') {
            // clear warden selection when block changes
            setSelectedWarden('');
        }
        setError('');
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) return 'Full name is required';
        if (!formData.email.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format';
        if (!formData.studentId.trim()) return 'Student ID is required';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createStudent({
                name: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                studentId: formData.studentId.trim(),
                phone: formData.phone.trim(),
                course: formData.course.trim(),
                branch: formData.branch.trim(),
                year: formData.year.trim(),
                hostelBlock: formData.hostelBlock.trim(),
                hostelRoom: formData.hostelRoom.trim(),
                fatherName: formData.fatherName.trim(),
                address: formData.address.trim(),
                collegeName: college,
                managementId: userData?.uid || user?.uid,
                wardenId: selectedWarden || undefined,
            });

            setSuccess(true);
            toast.success(`Student "${formData.fullName}" created successfully! 🎉`);
        } catch (err) {
            console.error('Create student error:', err);
            const msg = err.message || 'Failed to create student';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({ 
            fullName: '', email: '', studentId: '', phone: '', 
            course: '', branch: '', year: '', hostelBlock: '', hostelRoom: '', 
            fatherName: '', address: '' 
        });
        setSuccess(false);
        setError('');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    const bg = isDark ? '#111827' : '#ffffff';
    const bgSecondary = isDark ? '#1f2937' : '#f8fafc';
    const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const inputBg = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(243, 244, 246, 0.9)';
    const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && !loading && handleClose()}
        >
            <div
                className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                style={{ backgroundColor: bg, border: `1px solid ${border}` }}
            >
                <div
                    className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                    style={{ borderBottom: `1px solid ${border}` }}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: textPrimary }}>Add Student Form</h2>
                            <p className="text-xs" style={{ color: textSecondary }}>{college}</p>
                        </div>
                    </div>
                    {!loading && (
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                            style={{ color: textSecondary }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="px-6 py-5 overflow-y-auto flex-1">
                    {success ? (
                        <div className="text-center space-y-5 py-4">
                            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: textPrimary }}>Student Created! 🎉</h3>
                                <p className="text-sm mt-2" style={{ color: textSecondary }}>
                                    <strong>{formData.fullName}</strong> will receive an email to set their password.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border"
                                    style={{ borderColor: border, color: textPrimary, backgroundColor: bgSecondary }}
                                >
                                    <User className="w-4 h-4" />
                                    Add Another
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/20 text-red-500">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Full Name *</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => handleChange('fullName', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="John Doe"
                                            required
                                        />
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Email Address *</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="john@example.com"
                                            required
                                        />
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Student ID / Roll No *</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.studentId}
                                            onChange={(e) => handleChange('studentId', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="STU12345"
                                            required
                                        />
                                        <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Phone Number</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="+1 234 567 890"
                                        />
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Course</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.course}
                                            onChange={(e) => handleChange('course', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="B.Tech"
                                        />
                                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Branch/Department</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.branch}
                                            onChange={(e) => handleChange('branch', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="Computer Science"
                                        />
                                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Year of Study</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.year}
                                            onChange={(e) => handleChange('year', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="1st Year"
                                        />
                                        <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>

                                {/* Hostel Block and Room */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Hostel Block</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="hostel-blocks"
                                            value={formData.hostelBlock}
                                            onChange={(e) => handleChange('hostelBlock', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="Block A"
                                        />
                                        <datalist id="hostel-blocks">
                                            {hostels.map((b, idx) => (
                                                <option key={idx} value={b} />
                                            ))}
                                        </datalist>
                                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>

                                {availableWardens.length > 0 && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium" style={{ color: textPrimary }}>Assign Warden</label>
                                        <select
                                            value={selectedWarden}
                                            onChange={(e) => setSelectedWarden(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border text-sm"
                                            style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }}
                                        >
                                            <option value="">Auto (based on block)</option>
                                            {availableWardens.map(w => (
                                                <option key={w.id} value={w.id}>{w.fullName || w.email || 'Unnamed'}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Hostel & Room</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.hostelRoom}
                                            onChange={(e) => handleChange('hostelRoom', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="Room 101"
                                        />
                                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Father's/Guardian's Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.fatherName}
                                            onChange={(e) => handleChange('fatherName', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="Mr. Doe"
                                        />
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium" style={{ color: textPrimary }}>Home Address</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => handleChange('address', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-opacity-50"
                                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                                            placeholder="123 Example Street"
                                        />
                                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                                    </div>
                                </div>

                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 mt-4 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}
                            >
                                {loading ? 'Creating...' : 'Create Student'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddStudentModal;
