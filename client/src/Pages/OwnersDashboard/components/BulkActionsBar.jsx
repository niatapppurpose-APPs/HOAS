import { CheckCircle, CheckSquare, Square } from "lucide-react";
import { HashLoader } from "react-spinners";

const BulkActionsBar = ({ 
  pendingOnPage, 
  selectedUsers, 
  allPendingSelected, 
  isBulkApproving,
  onSelectAll, 
  onBulkApprove 
}) => {
  return (
    <div 
      className="rounded-xl p-4 mb-6 border"
      style={{ 
        background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
        borderColor: 'rgba(99, 102, 241, 0.3)'
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {pendingOnPage.length > 0 && (
            <button
              onClick={onSelectAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            >
              {allPendingSelected ? (
                <CheckSquare className="w-5 h-5 text-indigo-400" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {allPendingSelected ? 'Deselect All' : 'Select All'} ({pendingOnPage.length})
              </span>
            </button>
          )}
          {selectedUsers.size > 0 && (
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold text-indigo-400">{selectedUsers.size}</span> selected
            </span>
          )}
        </div>
        {selectedUsers.size > 0 && (
          <button
            onClick={onBulkApprove}
            disabled={isBulkApproving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBulkApproving ? (
              <>
                <HashLoader size={20} color="#ffffff" />
                Approving {selectedUsers.size} Colleges...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Approve Selected ({selectedUsers.size})
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BulkActionsBar;
