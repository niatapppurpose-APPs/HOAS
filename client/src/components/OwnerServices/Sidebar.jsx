import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  BarChart3,
  FileText,
  Pin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Avatar from './Avatar'
import Applogo from '../../assets/Applogo.png'

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPinned, setIsPinned] = useState(false);
  const [showLogoPopup, setShowLogoPopup] = useState(false);

  // Get active item from current path
  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/wardens')) return 'wardens';
    if (path.includes('/students')) return 'students';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/help')) return 'help';
    return 'dashboard';
  };

  const activeItem = getActiveItem();

  // Restore pinned state from localStorage and reset on mobile view
  useEffect(() => {
    const storedValue = localStorage.getItem("sidebarPinned");
    if (storedValue === "true") {
      setIsPinned(true);
      setIsCollapsed(false);
    }

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // Always collapse sidebar on mobile
        setIsPinned(false);
        setIsCollapsed(true);
      }
    };

    // Run once on mount to ensure mobile starts collapsed
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed]);

  // Determine if sidebar content should be shown (expanded view)
  // On mobile: only show when not collapsed, ignore pin state
  // On desktop: show when not collapsed OR pinned
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const showContent = isMobile ? !isCollapsed : (!isCollapsed || isPinned);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/OwnersDashboard" },
    { id: "wardens", label: "Wardens", icon: Building2, path: "/OwnersDashboard/wardens" },
    { id: "students", label: "Students", icon: Users, path: "/OwnersDashboard/students" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/OwnersDashboard/analytics" },
    { id: "reports", label: "Reports", icon: FileText, path: "/OwnersDashboard/reports" },
    { id: "notifications", label: "Notifications", icon: Bell, path: "/OwnersDashboard/notifications" },
  ];

  const bottomMenuItems = [
    { id: "settings", label: "Settings", icon: Settings, path: "/OwnersDashboard/settings" },
    { id: "help", label: "Help & Support", icon: HelpCircle, path: "/OwnersDashboard/help" },
  ];

  const handleMouseEnter = () => {
    // Only enable hover behavior on desktop screens
    if (!isPinned && window.innerWidth >= 1024) {
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    // Only enable hover behavior on desktop screens
    if (!isPinned && window.innerWidth >= 1024) {
      setIsCollapsed(true);
    }
  };

  const handlePinClick = () => {
    const newValue = !isPinned;
    setIsPinned(newValue);
    localStorage.setItem('sidebarPinned', String(newValue));

    if (newValue) {

      setIsCollapsed(false);
    } else {

      setIsCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${!isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsCollapsed(true)}
      />

      {/* Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ backgroundColor: 'var(--owner-surface)', borderColor: 'rgba(255,255,255,0.03)' }}
        className={`fixed top-0 left-0 h-full backdrop-blur-xl border-r z-40 transition-all duration-300 ease-in-out
          ${isCollapsed
            ? "-translate-x-full lg:translate-x-0 lg:w-20"
            : "translate-x-0 w-72 lg:w-72"}
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-slate-700/50 shrink-0">
          <div className={`flex items-center gap-3 transition-all duration-300 ${!showContent ? "lg:justify-center lg:w-full" : ""}`}>
            
            <button 
              onClick={() => setShowLogoPopup(true)}
              className={`relative transition-all duration-300 group cursor-pointer ${!showContent ? "w-12 h-12" : "w-14 h-14"}`}
              title="Click to view logo"
            >
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img 
                src={Applogo} 
                className="relative w-full h-full rounded-full object-cover border-2 border-slate-600/50 shadow-lg group-hover:border-indigo-500/50 transition-all duration-300 group-hover:scale-105" 
                alt="HOAS Logo"
              />
            </button>

            <div className={`flex flex-col transition-all duration-300 origin-left ${!showContent ? "lg:hidden opacity-0 w-0 scale-95" : "opacity-100 w-auto scale-100"}`}>
              <h1 className="text-xl font-bold text-white leading-none tracking-tight">HOAS</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Owner Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pin Button - Desktop Only (visible when expanded) */}
            <button
              onClick={handlePinClick}
              className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${!showContent ? "opacity-0 pointer-events-none" : "opacity-100"
                } ${isPinned
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                }`}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <Pin className={`w-4 h-4 transition-transform ${isPinned ? "rotate-60" : ""}`} />
            </button>


            <button
              onClick={() => {
                setIsPinned(true);
                setIsCollapsed(true);
              }}
              className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200"
              title="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-[calc(100%-4rem)] py-4">
          {/* Main Menu */}
          <div className="flex-1 px-3 space-y-1">
            <p
              className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 ${!showContent ? "lg:hidden" : ""
                }`}
            >
              Main Menu
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              const activeStyle = isActive
                ? { background: `linear-gradient(90deg, var(--owner-accent), var(--owner-accent-2))`, color: 'var(--owner-text)' }
                : {};

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth < 1024) setIsCollapsed(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${!showContent ? "lg:justify-center" : ""}`}
                  style={activeStyle}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                      }`}
                  />
                  <span
                    className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${!showContent ? "lg:hidden" : ""
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
              className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 ${!showContent ? "lg:hidden" : ""
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
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth < 1024) setIsCollapsed(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                    ${!showContent ? "lg:justify-center" : ""}
                    ${isLogout
                      ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  <span
                    className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${!showContent ? "lg:hidden" : ""
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
          <button 
            onClick={() => {
              // Save current page state before navigating to profile
              const currentPath = location.pathname;
              const state = {
                scrollPosition: window.scrollY,
                returnPath: currentPath
              };
              
              // Save to sessionStorage as backup
              sessionStorage.setItem('ownerProfileReturnPath', currentPath);
              
              // Also save the current page's specific state if it exists
              const pageStates = {
                '/OwnersDashboard/students': 'studentsPageState',
                '/OwnersDashboard/wardens': 'wardensPageState',
                '/OwnersDashboard/analytics': 'analyticsPageState',
                '/OwnersDashboard/reports': 'reportsPageState',
                '/OwnersDashboard/settings': 'settingsPageState'
              };
              
              const pageStateKey = pageStates[currentPath];
              if (pageStateKey) {
                const existingState = sessionStorage.getItem(pageStateKey);
                if (existingState) {
                  const parsedState = JSON.parse(existingState);
                  state.searchText = parsedState.searchText;
                }
              }
              
              // Navigate to profile with state
              navigate("/owner-profile", { state });
              
              // Close sidebar on mobile
              if (window.innerWidth < 1024) setIsCollapsed(true);
            }} 
            className={`mt-5 mb-5 mx-2 group relative ${!showContent ? "flex justify-center" : "block"} cursor-pointer  `}
          >
            <div className={`
              transition-all duration-200 
              ${showContent 
                ? "p-3 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-2 border-slate-400/50 hover:border-slate-300/50" 
                : "p-0 hover:scale-105 transition-transform"
              }
            `}>
              <div className={`flex items-center ${showContent ? "gap-3" : "justify-center"}`}>
                <Avatar image={user?.photoURL} name={user?.displayName} size="md" />
                
                {showContent && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">{user?.displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tooltip for collapsed state */}
            {!showContent && (
              <div className="hidden lg:block absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl top-1/2 -translate-y-1/2">
                Profile
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
              </div>
            )}
          </button>


        </nav>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`fixed top-5 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 text-slate-400 hover:text-white shadow-lg transition-all duration-200 ${!isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Logo Popup Modal */}
      {showLogoPopup && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowLogoPopup(false)}
        >
          <div 
            className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-slate-700/50 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowLogoPopup(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200 group"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-block relative">
                  <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl animate-pulse" />
                  <img 
                    src={Applogo} 
                    alt="HOAS Logo" 
                    className="relative w-48 h-48 mx-auto rounded-full object-cover border-4 border-indigo-500/50 shadow-2xl"
                  />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                HOAS
              </h2>
              <p className="text-lg text-slate-300 mb-1">
                Hostel Accommodation System
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Owner Dashboard Management Portal
              </p>
              
              <div className="border-t border-slate-700/50 pt-6">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Platform</p>
                    <p className="text-sm font-semibold text-white">Web Application</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Version</p>
                    <p className="text-sm font-semibold text-white">2.0.0</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Status</p>
                    <p className="text-sm font-semibold text-green-400">Active</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Year</p>
                    <p className="text-sm font-semibold text-white">2026</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-xs text-slate-500">
                © 2026 HOAS. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
