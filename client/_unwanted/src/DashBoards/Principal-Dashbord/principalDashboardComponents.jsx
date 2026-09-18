import { memo } from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";

// --- Hoisted constants (created once, shared by all instances) ---

const AVATAR_SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
];

const STATUS_STYLES = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
  DENIED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_ICONS = {
  PENDING: <Clock className="w-3 h-3" />,
  APPROVED: <CheckCircle className="w-3 h-3" />,
  DENIED: <XCircle className="w-3 h-3" />,
};

// --- Helper functions ---

const getColorFromName = (name) => {
  if (!name) return AVATAR_COLORS[0];
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// --- Components ---

/** Avatar with fallback to initials */
const Avatar = memo(({ image, name, size = "md" }) => {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${AVATAR_SIZE_CLASSES[size]} rounded-full object-cover ring-2 ring-white/20`}
      />
    );
  }

  return (
    <div
      className={`${AVATAR_SIZE_CLASSES[size]} ${getColorFromName(name)} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white/20`}
    >
      {getInitials(name)}
    </div>
  );
});
Avatar.displayName = "Avatar";

/** Status badge (Pending / Approved / Denied) */
const StatusBadge = memo(({ status }) => {
  const normalizedStatus = status?.toUpperCase() || "PENDING";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[normalizedStatus] || STATUS_STYLES.PENDING}`}
    >
      {STATUS_ICONS[normalizedStatus] || STATUS_ICONS.PENDING}
      {normalizedStatus}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

/** Gradient stats card with icon */
const StatsCard = memo(({ icon: Icon, title, value, subtitle, gradient }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient}`}>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          <p className="text-white/80 font-medium mt-1">{title}</p>
          {subtitle && (
            <p className="text-white/60 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
});
StatsCard.displayName = "StatsCard";

export { Avatar, StatusBadge, StatsCard };
