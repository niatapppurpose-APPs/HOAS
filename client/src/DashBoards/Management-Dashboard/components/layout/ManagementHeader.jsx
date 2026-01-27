import { LogOut } from "lucide-react";
import Avatar from "../../../../components/OwnerServices/Avatar";


const ManagementHeader = ({ user, pendingCount = 0, handleLogout, collegeLogo }) => {
  return (
    <header className="management-header">
      <div className="header-content">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
  
            <img src={collegeLogo} alt="College logo" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }} />
        
          <div>
            <h1 className="header-greeting">Welcome back, <span className="username">{user?.displayName || 'Management'}!</span></h1>
            <p className="header-subtitle">You have pending approvals that need your attention.</p>
          </div>
        </div>
        
        <div className="header-right">
          {/* Pending Badge */}
          {pendingCount > 0 && (
            <div className="pending-badge">
              {pendingCount} Pending
            </div>
          )}
          
          {/* Logout Button */}
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
          
          {/* User Avatar */}
          <div className="user-avatar-wrapper">
            <Avatar user={user} size="md" />
            <div className="avatar-indicator">N</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ManagementHeader;
