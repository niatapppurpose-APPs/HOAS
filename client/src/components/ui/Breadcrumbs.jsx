import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  student: 'Student Portal',
  warden: 'Warden Portal',
  management: 'Management',
  principal: 'Principal Portal',
  OwnersDashboard: 'Owner Super-Admin',
  profile: 'Profile',
  settings: 'Settings',
  help: 'Help & Support',
  complaints: 'Complaints',
  fees: 'Fees & Dues',
  leave: 'Leave Requests',
  'leave-requests': 'Leave Requests',
  students: 'Student Directory',
  wardens: 'Warden Directory',
  hostels: 'Hostels & Blocks',
  rooms: 'Room Allotments',
  emergency: 'Emergency SOS',
  reports: 'Analytics & Reports',
  colleges: 'Colleges & Institutions',
  system: 'System Health',
  audit: 'Security Audit',
  'fee-verification': 'Fee Verification',
};

export default function Breadcrumbs({ customCrumbs, className = '' }) {
  const { pathname } = useLocation();

  if (customCrumbs && customCrumbs.length > 0) {
    return (
      <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs ${className}`}>
        <Link
          to="/"
          className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition"
          aria-label="Home"
        >
          <Home className="w-3.5 h-3.5" />
        </Link>
        {customCrumbs.map((crumb, idx) => (
          <span key={crumb.href || idx} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-slate-500 opacity-60" />
            {idx === customCrumbs.length - 1 ? (
              <span className="px-2 py-0.5 rounded-md font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.href}
                className="text-slate-400 hover:text-white transition font-medium"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    );
  }

  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar py-1 ${className}`}
    >
      <Link
        to="/"
        className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition flex-shrink-0"
        aria-label="Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {parts.map((part, index) => {
        const href = `/${parts.slice(0, index + 1).join('/')}`;
        const isLast = index === parts.length - 1;
        const displayLabel = ROUTE_LABELS[part] || part.replace(/[-_]/g, ' ');

        return (
          <span key={href} className="flex items-center gap-1.5 flex-shrink-0">
            <ChevronRight className="w-3 h-3 text-slate-500 opacity-60" />
            {isLast ? (
              <span className="px-2.5 py-0.5 rounded-lg font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 capitalize">
                {displayLabel}
              </span>
            ) : (
              <Link
                to={href}
                className="text-slate-400 hover:text-white transition font-medium capitalize"
              >
                {displayLabel}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
