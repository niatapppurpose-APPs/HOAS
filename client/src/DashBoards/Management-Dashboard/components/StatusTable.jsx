import { ChevronLeft, ChevronRight } from "lucide-react";
import Avatar from '../../../components/OwnerServices/Avatar';

const StatusTable = ({ users, currentPage, totalPages, onPageChange }) => {
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
                  <span className={`table-role-badge ${user.role}`}>
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
