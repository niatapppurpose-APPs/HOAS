import { Building2, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";


const Header = ({ pendingCount = 0, handleLogout, user, title }) => {
  const navigate = useNavigate();
  return (
    <header style={{ backgroundColor: 'var(--owner-surface)', borderColor: 'rgba(148,163,184,0.1)' }} className="border-b backdrop-blur-xl top-0 z-50 h-20">
      <div className="mx-auto px-6 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            {title && (
              <h1 style={{ color: 'var(--owner-text)' }} className="text-xl font-bold">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <span className="px-5 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/30 animate-pulse">
                {pendingCount} Pending
              </span>
            )}

           

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 border-white/10 group hover:border-red-500/50 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/5"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
              <span className="text-sm font-medium text-slate-300 group-hover:text-red-300 transition-colors">Logout</span>
            </button>


          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;