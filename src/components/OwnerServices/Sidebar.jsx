import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  BarChart3,
  FileText,
  Pin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Avatar from './Avatar'

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user } = useAuth();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isPinned, setIsPinned] = useState(false);

  // Determine if sidebar content should be shown (expanded view)
  const showContent = !isCollapsed || isPinned;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "colleges", label: "Colleges", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const bottomMenuItems = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: HelpCircle },
    { id: "logout", label: "Logout", icon: LogOut },
  ];

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsCollapsed(true);
    }
  };

  const handlePinClick = () => {
    if (isPinned) {
      setIsPinned(false);
      setIsCollapsed(true);
    } else {
      setIsPinned(true);
      setIsCollapsed(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          !isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsCollapsed(true)}
      />

      {/* Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 h-full bg-slate-900/95 backdrop-blur-xl border-r z-50 transition-all duration-300 ease-in-out
          ${showContent ? "translate-x-0 w-72 lg:w-72" : "-translate-x-full lg:translate-x-0 lg:w-20"}
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-19 px-4 border-b border-slate-700/50">
          <div className={`flex items-center gap-3 ${!showContent ? "lg:justify-center lg:w-full" : ""}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span
              className={`text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent transition-opacity duration-200 ${
                !showContent ? "lg:hidden" : ""
              }`}
            >
              HAOS Admin
            </span>
          </div>

          {/* Pin Button - Desktop Only (visible when expanded) */}
          <button
            onClick={handlePinClick}
            className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
              !showContent ? "opacity-0 pointer-events-none" : "opacity-100"
            } ${
              isPinned
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            }`}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            <Pin className={`w-4 h-4 transition-transform ${isPinned ? "rotate-45" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-[calc(100%-4rem)] py-4">
          {/* Main Menu */}
          <div className="flex-1 px-3 space-y-1">
            <p
              className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 ${
                !showContent ? "lg:hidden" : ""
              }`}
            >
              Main Menu
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                    ${!showContent ? "lg:justify-center" : ""}
                    ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span
                    className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${
                      !showContent ? "lg:hidden" : ""
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Tooltip for collapsed state */}
                  {!showContent && (
                    <div className="hidden lg:block absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="px-6 my-4">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>

          {/* Bottom Menu */}
          <div className="px-3 space-y-1">
            <p
              className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 ${
                !showContent ? "lg:hidden" : ""
              }`}
            >
              Settings
            </p>
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;
              const isLogout = item.id === "logout";

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                    ${!showContent ? "lg:justify-center" : ""}
                    ${
                      isLogout
                        ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${
                      !showContent ? "lg:hidden" : ""
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Tooltip for collapsed state */}
                  {!showContent && (
                    <div className="hidden lg:block absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* User Profile Card */}
          <div className={`mt-4 mx-3 ${!showContent ? "lg:hidden" : ""}`}>
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Avatar image={user?.photoURL} name={user?.displayName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.displayName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`fixed top-4 left-4 z-30 lg:hidden p-2.5 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white transition-colors ${
          !isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </>
  );
};

export default Sidebar;
