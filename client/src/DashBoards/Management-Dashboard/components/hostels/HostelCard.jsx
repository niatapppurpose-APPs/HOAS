import { useState } from "react";
import { Building2, MapPin, Users, UserCircle, Trash2, Pencil } from "lucide-react";

const HostelCard = ({ hostel, onClick, onDelete, onEdit }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (e) => {
        e.stopPropagation();
        setIsDeleting(true);
        // You could put a confirm dialog here. I'm leaving it simple to trigger onDelete.
        if (window.confirm(`Are you sure you want to delete ${hostel.name}?`)) {
            onDelete(hostel.id);
        }
        setIsDeleting(false);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit?.(hostel);
    };

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl overflow-hidden shadow-sm"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)'
            }}
        >
            <div className="absolute top-0 right-0 p-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleEdit}
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors"
                        title="Edit Hostel"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        title="Delete Hostel"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="flex items-start gap-4 mb-4">
                <div
                    className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' }}
                >
                    <Building2 size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold truncate pr-10" style={{ color: 'var(--text-primary)' }}>
                        {hostel.name}
                    </h3>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {hostel.block}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
                {hostel.location?.address && (
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-indigo-400" />
                        <span className="truncate">{hostel.location.address}</span>
                    </div>
                )}
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <UserCircle size={16} className="text-orange-400" />
                        <span className="font-semibold">{hostel.wardens?.length || 0}</span>
                        <span className="text-xs">Wardens</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <Users size={16} className="text-green-400" />
                        <span className="font-semibold">{hostel.students?.length || 0}</span>
                        <span className="text-xs">Students</span>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 border-2 border-indigo-500 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
    );
};

export default HostelCard;
