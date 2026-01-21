import { CheckCircle, ChevronDown } from "lucide-react";
import Avatar from "../../../../components/OwnerServices/Avatar";


const RecentActivity = ({ recentUsers, onApprove }) => {
  return (
    <div className="recent-activity-section">
      <h2 className="section-title">Recent Activity</h2>
      <p className="section-subtitle">Manage pending warden and student registrations</p>

      <div className="activity-list">
        {recentUsers.map((user) => (
          <div key={user.id} className="activity-card">
            <div className="activity-user-info">
              <Avatar user={user} size="md" />
              <div className="activity-details">
                <h4 className="activity-name">{user.displayName}</h4>
                <p className="activity-email">{user.email}</p>
              </div>
            </div>

            <div className="activity-meta">
              <span className={`activity-role ${user.role}`}>{user.role}</span>
              <span className="activity-status">Pending</span>
              <span className="activity-date">
                {user.createdAt?.toDate().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <div className="activity-actions">
              <button 
                onClick={() => onApprove(user.id)} 
                className="btn-approve-inline"
              >
                <CheckCircle size={16} />
                Approve
              </button>
              <button className="btn-more">
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
