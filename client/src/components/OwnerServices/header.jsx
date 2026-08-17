import { Crown, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../Toast";
import { ThemeToggle } from "../ThemeToggle";
import NotificationBell from "./NotificationBell";
import AnimatedLogoutButton from "../AnimatedLogoutButton";
import Avatar from "./Avatar";


const Header = ({ pendingCount = 0, handleLogout, user, title, isCollapsed = true, setIsCollapsed, headerExtra, onProfileClick }) => {
  const navigate = useNavigate();
  const { logout, userData } = useAuth();
  const toast = useToast();

  // Use the provided handleLogout, or fall back to a default logout handler
  const onLogout = handleLogout || (async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate("/", { replace: true });
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
      console.error("Logout error:", error);
    }
  });

  const goToProfile = () => {
    const state = onProfileClick?.() || {};
    navigate("/OwnersDashboard/profile", { state });
  };

  return (
    <header
      id="tour-welcome"
      style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-primary)' }}
      className={`fixed top-0 right-0 border-b backdrop-blur-xl z-30 h-16 sm:h-20 transition-all duration-300 ${isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-72'
        }`}
    >


      <div className="mx-auto px-3 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Mobile menu button */}
            {setIsCollapsed && (
              <button
                onClick={() => setIsCollapsed(false)}
                className="hidden p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {title && (

              <>
                <Crown size={24} className="text-indigo-500 hidden sm:block flex-shrink-0" />
                <h1 style={{ color: 'var(--text-primary)' }} className="text-sm sm:text-lg font-bold truncate pr-2">{title}</h1>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {headerExtra && (
              <div className="hidden md:flex items-center mr-0 md:mr-2">
                {headerExtra}
              </div>
            )}
            {pendingCount > 0 && (
              <span className="px-2 sm:px-4 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] sm:text-sm font-medium border border-red-500/30 animate-pulse flex-shrink-0">
                <span className="hidden sm:inline">{pendingCount} Pending</span>
                <span className="sm:hidden">{pendingCount}</span>
              </span>
            )}

            {/* Profile Quick Access (saves page state before navigating) */}
            {onProfileClick && (
              <button
                onClick={goToProfile}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 flex-shrink-0"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                title="Open profile"
              >
                <Avatar
                  image={userData?.photoURL || user?.photoURL}
                  email={userData?.email || user?.email}
                  name={userData?.displayName || userData?.fullName || user?.displayName}
                  size="sm"
                  objectFit="fill"
                />
                <span className="hidden xl:block text-xs font-medium max-w-[90px] truncate" style={{ color: 'var(--text-primary)' }}>
                  {userData?.displayName || userData?.fullName || 'Profile'}
                </span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <div id="tour-theme-toggle" className="flex-shrink-0">
              <ThemeToggle size="sm" />
            </div>

            {/* Notification Bell */}
            <div id="tour-notifications" className="flex-shrink-0">
              <NotificationBell />
            </div>

            {/* Logout Button */}
            <div id="tour-logout" className="flex-shrink-0">
              <AnimatedLogoutButton
                onLogout={onLogout}
                variant="dark"
                text="Log Out"
              />
            </div>


          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;