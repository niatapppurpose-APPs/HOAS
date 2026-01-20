import { ChevronDown } from "lucide-react";
import Avatar from '../../../components/OwnerServices/Avatar';

const QuickApproval = ({ pendingUser, onApprove, onViewDetails }) => {
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
          <div className="user-badge">{pendingUser.role}</div>
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
          <button onClick={onApprove} className="btn-approve">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickApproval;
