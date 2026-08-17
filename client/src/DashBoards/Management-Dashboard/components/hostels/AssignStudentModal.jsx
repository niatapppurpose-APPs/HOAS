import { useState, useEffect } from "react";
import { X, Search, UserCheck } from "lucide-react";
import { listUsers } from "../../../../firebase/cloudFunctions";
import { getHostels, updateHostel } from "../../../../firebase/hostelApi";
import { useToast } from "../../../../components/Toast";

const mapUser = (u) => ({
    id: u._id,
    uid: u.uid,
    displayName: u.name || u.displayName,
    email: u.email,
    studentId: u.studentId,
    rollNumber: u.rollNumber,
});

const AssignStudentModal = ({ isOpen, onClose, hostel, collegeName, assignedWardens }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [selectedWarden, setSelectedWarden] = useState("");

    useEffect(() => {
        if (!isOpen || !collegeName) return;

        let cancelled = false;

        const fetchStudents = async () => {
            setLoading(true);
            try {
                const { users } = await listUsers({ role: "student" });
                if (cancelled) return;
                const allStudents = (users || []).map(mapUser);

                // Filter out students already in the hostel
                const hostelStudentIds = (hostel.students || []).map(s => (typeof s === 'string' ? s : s?._id || s?.id));
                const availableStudents = allStudents.filter(s => !hostelStudentIds.includes(s.id));
                setStudents(availableStudents);
            } catch (error) {
                console.error("Error fetching students:", error);
                toast.error("Failed to fetch abstract students");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        setSelectedStudents([]);
        fetchStudents();

        return () => {
            cancelled = true;
        };
    }, [isOpen, collegeName, hostel.students]);

    const handleSubmit = async () => {
        if (selectedStudents.length === 0) {
            toast.error("Please select at least one student");
            return;
        }

        setLoading(true);
        try {
            const fresh = (await getHostels()).find(h => h._id === hostel.id || h.id === hostel.id);
            const currentStudents = (fresh?.students || hostel.students || [])
                .map(s => (typeof s === 'string' ? s : s?._id || s?.id))
                .filter(Boolean);
            const merged = Array.from(new Set([...currentStudents, ...selectedStudents]));

            await updateHostel(hostel.id, { students: merged });

            if (roomNumber.trim() || selectedWarden) {
                console.warn('Per-student room/warden assignment not available in this build');
            }

            toast.success("Students assigned successfully");
            onClose();
        } catch (error) {
            console.error("Error assigning students:", error);
            toast.error("Failed to assign students");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAllSelected = filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length;
    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.id));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Assign Student to {hostel.name}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-xl mb-4 text-sm border border-blue-200">
                        <span className="font-semibold block">Hostel Block:</span> {hostel.block || 'None specified'}
                    </div>

                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students by name, email, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none border"
                            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto border rounded-xl" style={{ borderColor: 'var(--border-primary)' }}>
                        {loading && students.length === 0 ? (
                            <div className="flex justify-center p-6"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No unassigned students found.</div>
                        ) : (
                            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                <label className="flex items-center gap-3 p-4 hover:bg-black/5 cursor-pointer transition-colors bg-black/5">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Select All {filteredStudents.length} Students</p>
                                    </div>
                                </label>
                                {filteredStudents.map(student => (
                                    <label key={student.id} className="flex items-center gap-3 p-4 hover:bg-black/5 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            value={student.id}
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedStudents(prev => [...prev, student.id]);
                                                } else {
                                                    setSelectedStudents(prev => prev.filter(id => id !== student.id));
                                                }
                                            }}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{student.displayName}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {student.email} • ID: {student.studentId || student.rollNumber || 'N/A'}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Room (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. A101"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none border"
                                style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Assign Warden (Optional)</label>
                            <select
                                value={selectedWarden}
                                onChange={(e) => setSelectedWarden(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none border"
                                style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            >
                                <option value="">-- No specific warden --</option>
                                {assignedWardens?.map(warden => (
                                    <option key={warden.id} value={warden.id}>{warden.displayName}</option>
                                ))}
                            </select>
                        </div>
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
                            disabled={loading || selectedStudents.length === 0}
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

export default AssignStudentModal;
