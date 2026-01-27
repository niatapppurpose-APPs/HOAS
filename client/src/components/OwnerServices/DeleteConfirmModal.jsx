import { Loader2, Trash2, AlertTriangle } from "lucide-react";

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  collegeName, 
  isDeleting, 
  wardenCount, 
  studentCount,
  showDetails = true,
  title = 'Delete College'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        <p className="text-slate-300 mb-4">
          Are you sure you want to delete <span className="font-semibold text-white">{collegeName}</span>?
        </p>

        {showDetails && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm font-medium mb-2">⚠️ This action will permanently delete:</p>
            <ul className="text-red-300/80 text-sm space-y-1">
              <li>• The college/management account</li>
              <li>• {wardenCount} warden(s) under this college</li>
              <li>• {studentCount} student(s) under this college</li>
            </ul>
            <p className="text-red-400 text-xs mt-3 font-medium">This action cannot be undone!</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete All
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
