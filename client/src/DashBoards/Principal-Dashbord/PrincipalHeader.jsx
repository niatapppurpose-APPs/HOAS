import { Crown, GraduationCap } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import NotificationBell from '../../components/OwnerServices/NotificationBell';
import AnimatedLogoutButton from '../../components/AnimatedLogoutButton';
import Avatar from '../../components/OwnerServices/Avatar';
import SearchModal from '../../components/ui/SearchModal/SearchModal';

export default function PrincipalHeader({
  collegeName = 'Campus Executive Portal',
  totalPending = 0,
  handleLogout,
  user,
  userData,
}) {
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Brand / Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md flex-shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-black text-white truncate">
                  {collegeName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hidden sm:inline">
                  Principal Executive
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                Institutional Safety, Governance & Multi-Block Oversight
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Scoped Principal Search */}
            <SearchModal compact defaultScope="principal" />

            {totalPending > 0 && (
              <span className="px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-bold border border-amber-500/30 animate-pulse flex-shrink-0">
                <span className="hidden sm:inline">{totalPending} Pending Approvals</span>
                <span className="sm:hidden">{totalPending} P</span>
              </span>
            )}

            <div className="flex-shrink-0">
              <NotificationBell />
            </div>

            <div className="flex-shrink-0">
              <ThemeToggle size="sm" />
            </div>

            <div className="flex-shrink-0">
              <AnimatedLogoutButton onLogout={handleLogout} variant="dark" text="Log Out" />
            </div>

            <div className="flex-shrink-0 hidden sm:block">
              <Avatar
                uid={user?.uid}
                image={userData?.photoURL || user?.photoURL}
                name={user?.displayName || 'Principal'}
                email={user?.email}
                size="md"
                rounded="full"
                collections={['users']}
                editable
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
