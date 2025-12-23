import { Building2, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";


const Header = ({ pendingCount = 0, handleLogout, user, title }) => {
  const navigate = useNavigate();
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl  top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {title && (
              <h1 className="text-xl font-bold text-white">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <span className="px-5 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/30 animate-pulse">
                {pendingCount} Pending
              </span>
            )}

            {/* Profile Icon Button */}
            <button
              onClick={() => navigate("/owner-profile")}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors"
              title="View Profile"
            >
              <User className="w-5 h-5 text-slate-300" />
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 border border-slate-600 hover:border-red-500/50 transition-colors group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-slate-300 group-hover:text-red-400" />
            </button>


          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;