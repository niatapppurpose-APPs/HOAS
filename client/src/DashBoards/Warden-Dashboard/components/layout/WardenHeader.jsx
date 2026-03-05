import { Shield, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../../../../components/ThemeToggle";
import { useAuth } from "../../../../context/AuthContext";
import AnimatedLogoutButton from "../../../../components/AnimatedLogoutButton";
import NotificationBell from "../../../../components/OwnerServices/NotificationBell";

const WardenHeader = ({ pendingCount = 0, title = "Dashboard · Warden Portal", isCollapsed = true, setIsCollapsed }) => {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header
      style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-primary)' }}
      className={`fixed top-0 right-0 border-b backdrop-blur-xl z-30 h-16 sm:h-20 transition-all duration-300 ${isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-72'}`}
    >
      <div className="mx-auto px-3 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsCollapsed && setIsCollapsed(false)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Shield size={24} className="text-orange-500 hidden sm:block flex-shrink-0" />
            <h1 style={{ color: 'var(--text-primary)' }} className="text-sm sm:text-lg font-bold truncate pr-1 sm:pr-2">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
            {pendingCount > 0 && (
              <span className="px-2 sm:px-4 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] sm:text-sm font-bold border border-orange-500/30 animate-pulse flex-shrink-0">
                <span className="hidden sm:inline">{pendingCount} Pending</span>
                <span className="sm:hidden">{pendingCount} P</span>
              </span>
            )}

            {/* Notification Bell */}
            <div className="flex-shrink-0">
              <NotificationBell />
            </div>

            {/* Theme Toggle Button */}
            <div className="flex-shrink-0">
              <ThemeToggle size="sm" />
            </div>

            {/* Logout Button */}
            <div className="flex-shrink-0">
              <AnimatedLogoutButton
                onLogout={handleLogout}
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

export default WardenHeader;
