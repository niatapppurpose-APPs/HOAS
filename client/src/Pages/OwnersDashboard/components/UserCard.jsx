import { CheckCircle, XCircle, Trash2, CheckSquare, Square, GraduationCap, Shield, Building2 } from "lucide-react";
import { HashLoader } from "react-spinners";
import Avatar from "../../../components/OwnerServices/Avatar";
import StatusBadge from "../../../components/OwnerServices/StatusBadge";

const UserCard = ({
  userData,
  isSelected,
  isPending,
  showCheckbox,
  isApproving,
  isDenying,
  isDeleteLoading,
  roleColors,
  onToggleSelection,
  onStatusChange,
  onDelete
}) => {
  const roleIcons = {
    student: GraduationCap,
    warden: Shield,
    management: Building2,
  };

  const RoleIcon = roleIcons[userData.role] || Building2;
  const colorClass = roleColors[userData.role] || "from-gray-500 to-gray-600";

  return (
    <div
      className={`rounded-xl p-4 transition-all ${isSelected ? 'border-indigo-500/50' : ''}`}
      style={{ 
        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
        border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-primary)'}`
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: User Info */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Checkbox for pending users */}
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
          <Avatar image={userData.photoURL} name={userData.displayName} size="lg" />
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {userData.createdAt?.toDate?.()?.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) || "Unknown"}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {userData.createdAt?.toDate?.()?.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }) || "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
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
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
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
      </div>
    </div>
  );
};

export default UserCard;
