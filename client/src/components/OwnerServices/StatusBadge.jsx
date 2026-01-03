import { Clock, CheckCircle, XCircle } from "lucide-react";

// Status Badge Component - Shows approval status (pending/approved/denied)
const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toUpperCase() || "PENDING";

  const statusStyles = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
    DENIED: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusIcons = {
    PENDING: <Clock className="w-3 h-3" />,
    APPROVED: <CheckCircle className="w-3 h-3" />,
    DENIED: <XCircle className="w-3 h-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[normalizedStatus]}`}
    >
      {statusIcons[normalizedStatus]}
      {normalizedStatus}
    </span>
  );
};

export default StatusBadge;
