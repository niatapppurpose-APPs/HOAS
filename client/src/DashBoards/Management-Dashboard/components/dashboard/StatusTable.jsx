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
    <div className="mb-6 sm:mb-8 bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] m-0">Wardens & Students Status</h2>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] p-1.5 px-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
          {currentPage} - {totalPages} {totalPages}
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-[var(--border-primary)]">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-primary)]">
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Name</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Role</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Email</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-primary)]">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-[var(--bg-hover)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar user={user} size="sm" />
                    <span className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">{user.displayName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${getRoleBadgeColor(user.role)} text-white text-[10px] sm:text-xs font-medium shadow-md capitalize`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs sm:text-sm text-[var(--text-muted)] truncate max-w-[200px] sm:max-w-none">{user.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.status === 'pending' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} />
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
