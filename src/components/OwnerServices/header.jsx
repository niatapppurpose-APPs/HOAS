import { Building2, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";


const Header = ({ pendingCount = 0, handleLogout, user }) => {
  const navigate = useNavigate();
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl  top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">HOAS</h1>
              <p className="text-xs text-slate-400">Owner Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <span className="px-5 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/30">
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


          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;