import { CheckCircle, ChevronDown, Inbox } from "lucide-react";
import Avatar from "../../../../components/OwnerServices/Avatar";


import { useState , useEffect} from 'react';

// recentUsers  - full list of pending users
// onApprove    - callback to approve a user ID
// approvingUserId - id currently being approved (for loading state)
// perPage      - optional prop controlling rows per page (default 8)
const RecentActivity = ({ recentUsers, onApprove, approvingUserId, perPage = 8 }) => {
  // pagination state for the small activity card
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(recentUsers.length / perPage) || 1;

  const sliceStart = page * perPage;
  const visibleUsers = recentUsers.slice(sliceStart, sliceStart + perPage);

  const handlePageToggle = () => {
    // cycle through pages forward
    setPage(prev => (prev + 1) % totalPages);
  };

  // whenever list length or page-size changes, reset to first page
  useEffect(() => {
    setPage(0);
  }, [recentUsers.length, perPage]);

  const isEmpty = recentUsers.length === 0;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-3 sm:gap-4 overflow-scroll">
        {visibleUsers.map((user) => (
          <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 sm:p-5 bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--accent-primary)]">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <Avatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] m-0 mb-1 truncate">{user.displayName}</h4>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] m-0 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 flex-1">
              <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wide border ${user.role === 'warden' ? 'bg-blue-500/20 border-blue-500/40 text-blue-500' : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-500'}`}>{user.role}</span>
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-500 text-[10px] sm:text-xs font-semibold">Pending</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                {(user.createdAt?.toDate
                  ? user.createdAt.toDate()
                  : user.createdAt ? new Date(user.createdAt) : new Date()
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end mt-2 sm:mt-0">
              <button
                onClick={() => onApprove(user.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-500 text-xs sm:text-sm font-semibold cursor-pointer transition-all hover:bg-emerald-500/30 hover:-translate-y-0.5 ${approvingUserId === user.id ? 'opacity-80 pointer-events-none' : ''}`}
                disabled={approvingUserId === user.id}
                title={approvingUserId === user.id ? 'Approving...' : 'Approve user'}
              >
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {approvingUserId === user.id ? 'Approving...' : 'Approve'}
              </button>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-muted)]">{page+1}/{totalPages}</span>
                  <button
                    onClick={handlePageToggle}
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-muted)] cursor-pointer transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    title="Next page" 
                  >
                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${page !== 0 ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
