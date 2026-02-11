import { Shield, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../../../../components/ThemeToggle";
import { useAuth } from "../../../../context/AuthContext";
import AnimatedLogoutButton from "../../../../components/AnimatedLogoutButton";

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
      className={`fixed top-0 right-0 border-b backdrop-blur-xl z-30 h-20 transition-all duration-300 ${isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-72'}`}
    >
      <div className="mx-auto px-4 pl-4 sm:pl-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsCollapsed && setIsCollapsed(false)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Shield size={28} className="text-orange-500" />
            <h1 style={{ color: 'var(--text-primary)' }} className="text-lg sm:text-xl font-bold truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {pendingCount > 0 && (
              <span className="px-2 sm:px-5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs sm:text-sm font-medium border border-orange-500/30 animate-pulse">
                <span className="hidden sm:inline">{pendingCount} Pending</span>
                <span className="sm:hidden">{pendingCount}</span>
              </span>
            )}
            {/* Theme Toggle Button */}
            <ThemeToggle size="md" />

            {/* Logout Button */}
            <AnimatedLogoutButton 
              onLogout={handleLogout}
              variant="dark"
              text="Log Out"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default WardenHeader;
