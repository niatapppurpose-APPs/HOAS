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
      <div className="quick-approval-card">
        <div className="quick-approval-header">
          <h3 className="quick-approval-title">Quick Approval</h3>
          <span className="pending-count">0 pending</span>
        </div>
        <div className="quick-approval-empty">
          <p>No pending approvals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-approval-card">
      <div className="quick-approval-header">
        <h3 className="quick-approval-title">Quick Approval</h3>
        <span className="pending-count">1 pending <ChevronDown size={16} /></span>
      </div>

      <div className="quick-approval-user">
        <div className="user-info-section">
          <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getRoleBadgeColor(pendingUser.role)} text-white text-xs font-medium shadow-md capitalize mb-3`}>
            {pendingUser.role}
          </div>
          <div className="user-avatar-container">
            <Avatar user={pendingUser} size="lg" />
          </div>
          <h4 className="user-name">{pendingUser.displayName}</h4>
          <p className="user-email">{pendingUser.email}</p>
          <p className="user-date">{pendingUser.createdAt?.toDate().toLocaleDateString()}</p>
        </div>

        <div className="approval-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="approval-actions">
          <button onClick={onViewDetails} className="btn-view-details">
            View Details
          </button>
          <button
            onClick={onApprove}
            className={`btn-approve ${isApproving ? 'opacity-80 pointer-events-none' : ''}`}
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
