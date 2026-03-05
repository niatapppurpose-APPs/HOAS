import { ChevronDown } from "lucide-react";
import Avatar from "../../../../components/OwnerServices/Avatar";


const QuickApproval = ({ pendingUser, onApprove, onViewDetails, isApproving }) => {
  // Helper function to get role badge color
  const getRoleBadgeColor = (role) => {
    if (role === 'student') {
      return 'from-blue-400/90 to-cyan-400/90 border border-blue-300/30'; // Light blue
    } else if (role === 'warden') {
      return 'from-amber-500/90 to-yellow-600/90 border border-amber-400/30'; // Light dark yellow
    }
    return 'from-gray-500/90 to-gray-600/90'; // Default
  };

  if (!pendingUser) {
    return (
      <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl p-4 sm:p-7 shadow-lg h-fit">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] m-0">Quick Approval</h3>
          <span className="flex items-center gap-1 text-xs sm:text-sm text-[var(--text-muted)] font-medium">0 pending</span>
        </div>
        <div className="py-8 sm:py-10 px-4 text-center text-[var(--text-muted)]">
          <p>No pending approvals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl p-4 sm:p-7 shadow-lg h-fit">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] m-0">Quick Approval</h3>
        <span className="flex items-center gap-1 text-xs sm:text-sm text-[var(--text-muted)] font-medium">1 pending <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="text-center">
          <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getRoleBadgeColor(pendingUser.role)} text-white text-[10px] sm:text-xs font-medium shadow-md capitalize mb-3 sm:mb-4`}>
            {pendingUser.role}
          </div>
          <div className="flex justify-center mb-3 sm:mb-4">
            <Avatar user={pendingUser} size="lg" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)] m-0 mb-1">{pendingUser.displayName}</h4>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] m-0 mb-1 truncate">{pendingUser.email}</p>
          <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)] m-0">{(pendingUser.createdAt?.toDate ? pendingUser.createdAt.toDate() : pendingUser.createdAt ? new Date(pendingUser.createdAt) : new Date()).toLocaleDateString()}</p>
        </div>

        <div className="px-2">
          <div className="w-full h-1.5 sm:h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full transition-all duration-300" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:gap-3">
          <button onClick={onViewDetails} className="w-full py-2.5 sm:py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm font-semibold cursor-pointer transition-all hover:bg-[var(--bg-hover)] hover:-translate-y-0.5">
            View Details
          </button>
          <button
            onClick={onApprove}
            className={`w-full py-2.5 sm:py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 border-none rounded-xl text-white text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.4)] ${isApproving ? 'opacity-80 pointer-events-none' : ''}`}
            disabled={isApproving}
            title={isApproving ? 'Approving...' : 'Approve user'}
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickApproval;
