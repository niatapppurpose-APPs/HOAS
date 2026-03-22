import { CheckCircle, XCircle, Trash2, CheckSquare, Square, Building2, MapPin, Calendar } from "lucide-react";
import { HashLoader } from "react-spinners";
import Avatar from "../../../components/OwnerServices/Avatar";
import StatusBadge from "../../../components/OwnerServices/StatusBadge";
import { useTheme } from "../../../context/ThemeContext";
import { roleIcons } from "../constants";

// Safely convert any createdAt value to a Date object
const parseDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate(); // Firestore Timestamp
  if (value instanceof Date) return value;
  if (value._seconds != null) return new Date(value._seconds * 1000); // serialized Timestamp
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const UserCard = ({
  userData,
  isSelected,
  isPending,
  showCheckbox,
  isApproving,
  isDenying,
  isDeleteLoading,
  roleColors,
  isFirst,
  onToggleSelection,
  onStatusChange,
  onDelete
}) => {
  const { isDark } = useTheme();
  const RoleIcon = roleIcons[userData.role] || Building2;
  const colorClass = roleColors[userData.role] || "from-gray-500 to-gray-600";
  const createdDate = parseDate(userData.createdAt);

  return (
    <div
      id={isFirst ? 'tour-user-card' : undefined}
      className={`rounded-2xl p-5 sm:p-6 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl will-change-transform ${isSelected ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' : 'shadow-md'} `}
      style={{
        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-card)',
        border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: User Info */}
        <div className="flex items-center gap-4 min-w-0">          {/* Checkbox for pending users */}
          {isPending && showCheckbox && (
            <button
              onClick={() => onToggleSelection(userData.id)}
              className="flex-shrink-0 p-1 rounded transition-colors"
              style={{ backgroundColor: 'var(--bg-hover)' }}
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-indigo-400" />
              ) : (
                <Square className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              )}
            </button>
          )}
          <div className="relative flex-shrink-0" style={{ overflow: 'visible' }}>
            <Avatar image={userData.photoURL} name={userData.displayName} size="xl" rounded="full" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center" style={{ zIndex: 20 }}>
              <span
                className="absolute inline-flex h-full w-full rounded-full animate-ping"
                style={{ backgroundColor: userData.isOnline ? '#22c55e' : '#ef4444', opacity: 1 }}
              />
              <span
                className="relative inline-flex h-3 w-3 rounded-full border-2"
                style={{
                  backgroundColor: userData.isOnline ? '#22c55e' : '#ef4444',
                  borderColor: isDark ? '#1f2937' : '#ffffff',
                }}
                title={userData.isOnline ? 'Online' : 'Offline'}
              />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {userData.displayName || "Unknown User"}
              </h3>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${colorClass} text-white`}>
                {userData.role}
              </span>
            </div>
            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{userData.email}</p>
            {/* College Name & Location - Real-time from Firestore */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              {userData.collegeName && (
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[180px]">{userData.collegeName}</span>
                </div>
              )}
              {userData.collegeLocation && (
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <MapPin className="w-3 h-3 flex-shrink-0 text-emerald-500" />
                  <span className="truncate max-w-[180px]">{userData.collegeLocation}</span>
                </div>
              )}
              {!userData.collegeLocation && userData.status === 'approved' && (
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="italic">No location set</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col items-end gap-2 mt-2 sm:mt-0">
          <div className="flex items-center gap-3">
            {userData.status === "pending" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onStatusChange(userData.id, "approved")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors"
                  disabled={isApproving === userData.id}
                >
                  {isApproving === userData.id ? (
                    <>
                      <HashLoader size={20} color="#ffffff" />
                      Approving
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => onStatusChange(userData.id, "denied")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
                  disabled={isDenying === userData.id}
                >
                  {isDenying === userData.id ? (
                    <>
                      <HashLoader size={20} color="#ffffff" />
                      Denying
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Deny
                    </>
                  )}
                </button>
              </div>
            ) : (
              <StatusBadge status={userData.status} />
            )}

            {/* Delete Button */}
            <button
              onClick={() => onDelete(userData)}
              className="p-2 rounded-lg hover:bg-red-600/80 transition-colors"
              style={{ backgroundColor: 'var(--bg-tertiary)',  border: `1px solid ${isDark ? '#ffffff  ' : '#000'}` }}
              title="Delete College"
              disabled={isDeleteLoading === userData.id}
            >
              {isDeleteLoading === userData.id ? (
                <HashLoader size={20} color="#ffffff" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Date */}
          {createdDate ? (
            <p className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md"
              style={{ backgroundColor: isDark ? '#4b4646' : 'rgba(0, 0, 0, 0.10)', color: `${isDark ? '#ffffff  ' : '#000'}` }}>
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>{createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </p>
          ) : (
            <p className="text-[11px] px-2 py-0.5 rounded-md"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: 'var(--text-muted)' }}>Unknown date</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;
