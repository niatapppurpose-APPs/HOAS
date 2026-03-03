import { useState, memo } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, StatusBadge } from "./principalDashboardComponents";

/** Expandable user card with approve/deny actions for pending users */
const UserCard = memo(({ userItem, onStatusChange, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPending = (userItem.status || "pending").toUpperCase() === "PENDING";

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-colors duration-300">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar image={userItem.photoURL} name={userItem.displayName} size="md" />
            <div>
              <p className="text-white font-medium">{userItem.displayName}</p>
              <p className="text-slate-400 text-sm">{userItem.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onStatusChange(userItem.uid, "approved")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => onStatusChange(userItem.uid, "denied")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Deny
                </button>
              </div>
            ) : (
              <StatusBadge status={userItem.status} />
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-700/50 space-y-2 animate-fadeIn">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Role</p>
              <p className="text-slate-300 capitalize">{type}</p>
            </div>
            <div>
              <p className="text-slate-500">Joined</p>
              <p className="text-slate-300">
                {userItem.createdAt 
                  ? (userItem.createdAt.toDate ? userItem.createdAt.toDate().toLocaleDateString() : new Date(userItem.createdAt).toLocaleDateString())
                  : "N/A"}
              </p>
            </div>
            {userItem.collegeName && (
              <div className="col-span-2">
                <p className="text-slate-500">College</p>
                <p className="text-slate-300">{userItem.collegeName}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
UserCard.displayName = "UserCard";

export default UserCard;
