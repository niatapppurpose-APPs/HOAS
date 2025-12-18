import { Building2, LogOut } from "lucide-react";
import Avatar from "./Avatar";

const Header = ({ pendingCount = 0, handleLogout, user }) => {
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

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <Avatar
              image={user.photoURL}
              name={user.displayName || "Admin"}
              size="md"
              rounded="full"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;