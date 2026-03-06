import { useState, useEffect } from "react";
import { X, MapPin, Building, Info, UserPlus } from "lucide-react";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../../../../components/Toast";

const AddHostelModal = ({ isOpen, onClose, collegeName }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        block: "",
        address: "",
        capacity: "",
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.block.trim()) {
            toast.error("Hostel Name and Block are required");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "hostels"), {
                ...formData,
                location: {
                    address: formData.address,
                },
                collegeName,
                wardens: [],
                students: [],
                createdAt: serverTimestamp(),
            });
            toast.success("Hostel added successfully!");
            onClose();
        } catch (error) {
            console.error("Error adding hostel:", error);
            toast.error("Failed to add hostel");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="relative w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Add New Hostel</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Hostel Name *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building size={16} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Boys Hostel A"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Block *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building size={16} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="block"
                                    value={formData.block}
                                    onChange={handleChange}
                                    placeholder="e.g. Block A"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Address / Location</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin size={16} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="e.g. City Name or Street Name"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Capacity (Optional)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Info size={16} className="text-gray-400" />
                                </div>
                                <input
                                    type="number"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    placeholder="Number of beds"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6" style={{ borderColor: 'var(--border-primary)' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl font-medium transition-colors"
                            style={{ color: 'var(--text-secondary)', backgroundColor: 'transparent' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl font-medium text-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <UserPlus size={18} />
                            )}
                            {loading ? 'Adding...' : 'Add Hostel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddHostelModal;
