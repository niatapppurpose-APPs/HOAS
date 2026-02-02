import { LogOut, GraduationCap, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../../../../components/ThemeToggle";
import { useAuth } from "../../../../context/AuthContext";

const StudentHeader = ({ title = "Dashboard · Student Portal", isCollapsed = true, setIsCollapsed }) => {
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
            <GraduationCap size={28} className="text-blue-500" />
            <h1 style={{ color: 'var(--text-primary)' }} className="text-lg sm:text-xl font-bold truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Room Number Badge */}
            {userData?.roomNumber && (
              <span 
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30"
              >
                Room {userData.roomNumber}
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
              <span className="hidden sm:inline text-xs sm:text-sm font-medium group-hover:text-red-300 transition-colors" style={{ color: 'var(--text-secondary)' }}>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;
