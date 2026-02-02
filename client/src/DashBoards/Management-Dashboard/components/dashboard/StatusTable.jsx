import { ChevronLeft, ChevronRight } from "lucide-react";
import Avatar from "../../../../components/OwnerServices/Avatar";

const StatusTable = ({ users, currentPage, totalPages, onPageChange }) => {
  // Helper function to get role badge color
  const getRoleBadgeColor = (role) => {
    if (role === 'student') {
      return 'from-blue-400/90 to-cyan-400/90 border border-blue-300/30'; // Light blue
    } else if (role === 'warden') {
      return 'from-amber-500/90 to-yellow-600/90 border border-amber-400/30'; // Light dark yellow
    }
    return 'from-gray-500/90 to-gray-600/90'; // Default
  };

  return (
    <div className="status-table-section">
      <div className="status-table-header">
        <h2 className="section-title">Wardens & Students Status</h2>
        <div className="pagination-info">
          {currentPage} - {totalPages} {totalPages}
          <ChevronRight size={16} />
        </div>
      </div>

      <div className="status-table-container">
        <table className="status-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="table-user-info">
                    <Avatar user={user} size="sm" />
                    <span className="table-user-name">{user.displayName}</span>
                  </div>
                </td>
                <td>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${getRoleBadgeColor(user.role)} text-white text-xs font-medium shadow-md capitalize`}>
                    {user.role}
                  </span>
                </td>
                <td className="table-email">{user.email}</td>
                <td>
                  <span className={`status-chip ${user.status}`}>
                    <span className="status-dot" />
                    {user.status === 'pending' ? 'Pending' : 'Approved'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatusTable;
