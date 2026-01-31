import { LogOut, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router";
import { ThemeToggle } from "../../../../components/ThemeToggle";
import { useAuth } from "../../../../context/AuthContext";

const ManagementHeader = ({ pendingCount = 0, title = "Dashboard · Management", isCollapsed = true, collegeLogo }) => {
  const { logout } = useAuth();
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
      <div className="mx-auto px-4 pl-14 sm:pl-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            {collegeLogo && (
              <img 
                src={collegeLogo} 
                alt="College logo" 
                className="w-10 h-10 object-contain rounded-lg border"
                style={{ borderColor: 'var(--border-primary)' }}
              />
            )}
            <LayoutDashboard size={28} style={{ color: 'var(--text-primary)' }} />
            <h1 style={{ color: 'var(--text-primary)' }} className="text-lg sm:text-xl font-bold truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {pendingCount > 0 && (
              <span className="px-2 sm:px-5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs sm:text-sm font-medium border border-red-500/30 animate-pulse">
                <span className="hidden sm:inline">{pendingCount} Pending</span>
                <span className="sm:hidden">{pendingCount}</span>
              </span>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle size="md" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border transition-all duration-200 group hover:border-red-500/50 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/5"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
              title="Logout"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" style={{ color: 'var(--text-secondary)' }} />
              <span className="text-xs sm:text-sm font-medium group-hover:text-red-300 transition-colors" style={{ color: 'var(--text-secondary)' }}>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ManagementHeader;
