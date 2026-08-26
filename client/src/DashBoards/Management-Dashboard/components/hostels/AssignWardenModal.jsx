import { useState, useEffect } from "react";
import { X, Search, UserCheck } from "lucide-react";
import { listUsers } from "../../../../firebase/cloudFunctions";
import { updateHostel } from "../../../../firebase/hostelApi";
import { useToast } from "../../../../components/Toast";

const mapUser = (u) => ({
    id: u._id,
    uid: u.uid,
    displayName: u.name || u.displayName,
    email: u.email,
});

const AssignWardenModal = ({ isOpen, onClose, hostel, collegeId }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [wardens, setWardens] = useState([]);
    const [selectedWardens, setSelectedWardens] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;

        const fetchWardens = async () => {
            setLoading(true);
            try {
                const { users } = await listUsers({ role: "warden" });
                if (cancelled) return;
                const allWardens = (users || []).map(mapUser);

                // Filter out wardens already in the hostel
                const hostelWardenIds = (hostel.wardens || []).map(w => (typeof w === 'string' ? w : w?._id || w?.id));
                const availableWardens = allWardens.filter(w => !hostelWardenIds.includes(w.id));
                setWardens(availableWardens);
            } catch (error) {
                console.error("Error fetching wardens:", error);
                toast.error("Failed to fetch available wardens");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        setSelectedWardens([]);
        fetchWardens();

        return () => {
            cancelled = true;
        };
    }, [isOpen, collegeId, hostel.wardens]);

    const handleSubmit = async () => {
        if (selectedWardens.length === 0) {
            toast.error("Please select at least one warden");
            return;
        }

        setLoading(true);
        try {
            await updateHostel(hostel.id, { wardens: selectedWardens });

            toast.success("Wardens assigned successfully");
            onClose();
        } catch (error) {
            console.error("Error assigning wardens:", error);
            toast.error("Failed to assign wardens");
        } finally {
            setLoading(false);
        }
    };

    const filteredWardens = wardens.filter(w =>
        w.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Assign Warden to {hostel.name}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-orange-50 text-orange-700 p-3 rounded-xl mb-4 text-sm border border-orange-200">
                        <span className="font-semibold block">Hostel Block:</span> {hostel.block || 'None specified'}
                    </div>

                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search wardens by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none border"
                            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto border rounded-xl" style={{ borderColor: 'var(--border-primary)' }}>
                        {loading && wardens.length === 0 ? (
                            <div className="flex justify-center p-6"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : filteredWardens.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No unassigned wardens found.</div>
                        ) : (
                            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                {filteredWardens.map(warden => (
                                    <label key={warden.id} className="flex items-center gap-3 p-4 hover:bg-black/5 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            value={warden.id}
                                            checked={selectedWardens[0] === warden.id}
                                            onChange={(e) => {
                                                setSelectedWardens(e.target.checked ? [warden.id] : []);
                                            }}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{warden.displayName}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{warden.email}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6" style={{ borderColor: 'var(--border-primary)' }}>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl font-medium"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || selectedWardens.length === 0}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl font-medium text-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                            style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <UserCheck size={18} />
                            )}
                            Assign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignWardenModal;
