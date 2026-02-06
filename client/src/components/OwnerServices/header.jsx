import { Building2, LogOut, LayoutDashboard  } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../ThemeToggle";
import NotificationBell from "./NotificationBell";


const Header = ({ pendingCount = 0, handleLogout, user, title, isCollapsed = true }) => {
  const navigate = useNavigate();
  return (
    <header
      id="tour-welcome"
      style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-primary)' }}
      className={`fixed top-0 right-0 border-b backdrop-blur-xl z-30 h-20 transition-all duration-300 ${isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-72'
        }`}
    >
      

      <div className="mx-auto px-4 pl-14 sm:pl-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            {title && (
              
             <>
             <LayoutDashboard size={30} />
              <h1 style={{ color: 'var(--text-primary)' }} className="text-lg sm:text-xl font-bold truncate">{title}</h1>
             </>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {pendingCount > 0 && (
              <span className="px-2 sm:px-5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs sm:text-sm font-medium border border-red-500/30 animate-pulse">
                <span className="hidden sm:inline">{pendingCount} Pending</span>
                <span className="sm:hidden">{pendingCount}</span>
              </span>
            )}

            {/* Theme Toggle Button */}
            <div id="tour-theme-toggle">
              <ThemeToggle size="md" />
            </div>

            {/* Notification Bell */}
            <div id="tour-notifications">
              <NotificationBell />
            </div>

            {/* Logout Button */}
            <button
              id="tour-logout"
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

export default Header;