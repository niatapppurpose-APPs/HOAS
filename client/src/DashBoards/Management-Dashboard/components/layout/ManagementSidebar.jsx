import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Home,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  Pin,
  Shield,
  X,
  MessageSquare 
} from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useTheme } from "../../../../context/ThemeContext";
import Avatar from '../../../../components/OwnerServices/Avatar';
import AppLogo4k from '../../../../assets/AppLogo4k.png';
import NewBadge from "../../../../components/NewBadge";
import { isNavItemNew, dismissNavItemFeatures } from "../../../../data/newFeatures";

const ManagementSidebar = ({ isCollapsed, setIsCollapsed, collegeLogo }) => {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPinned, setIsPinned] = useState(false);
  const [showLogoPopup, setShowLogoPopup] = useState(false);
  const [, forceUpdate] = useState(0);

  // Close popup on Escape key
  useEffect(() => {
    if (!showLogoPopup) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowLogoPopup(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoPopup]);

  // Get active item from current path
  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/wardens')) return 'wardens';
    if (path.includes('/students')) return 'students';
    if (path.includes('/hostels')) return 'hostels';
    if (path.includes('/complaints')) return 'complaints';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/help')) return 'help';
    return 'dashboard';
  };

  const activeItem = getActiveItem();

  // Restore pinned state from localStorage and reset on mobile view
  useEffect(() => {
    const storedValue = localStorage.getItem("managementSidebarPinned");
    if (storedValue === "true") {
      setIsPinned(true);
      setIsCollapsed(false);
    }

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsPinned(false);
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed]);

  // Determine if sidebar content should be shown (expanded view)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const showContent = isMobile ? !isCollapsed : (!isCollapsed || isPinned);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/management" },
    { id: "wardens", label: "Wardens", icon: Building2, path: "/dashboard/management/wardens" },
    { id: "students", label: "Students", icon: Users, path: "/dashboard/management/students" },
    { id: "hostels", label: "Hostels", icon: Home, path: "/dashboard/management/hostels" },
    { id: "complaints", label: "Complaints", icon: MessageSquare, path: "/dashboard/management/complaints" },
    { id: "reports", label: "Reports", icon: FileText, path: "/dashboard/management/reports" },
  ];

  const bottomMenuItems = [
    { id: "settings", label: "Settings", icon: Settings, path: "/dashboard/management/settings" },
    { id: "help", label: "Help & Support", icon: HelpCircle, path: "/dashboard/management/help" },
  ];

  const handleMouseEnter = () => {
    if (!isPinned && window.innerWidth >= 1024) {
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned && window.innerWidth >= 1024) {
      setIsCollapsed(true);
    }
  };

  const handlePinClick = () => {
    const newValue = !isPinned;
    setIsPinned(newValue);
    localStorage.setItem('managementSidebarPinned', String(newValue));
    if (newValue) {
      setIsCollapsed(false);
    } else {
      setIsCollapsed(true);
    }
  };

  const handleDateYear = () => new Date().getFullYear();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${!isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsCollapsed(true)}
      />

      {/* Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border-primary)'
        }}
        className={`fixed top-0 left-0 h-full backdrop-blur-xl border-r z-40 transition-all duration-300 ease-in-out overflow-hidden
          ${isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "translate-x-0 w-72 lg:w-72"}`}
      >
        {/* Logo Section */}
        <div
          className="flex items-center justify-between h-20 px-4 border-b shrink-0 overflow-hidden"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          {/* Logo + Name — takes remaining space, never pushes buttons off screen */}
          <div className={`flex items-center gap-3 min-w-0 flex-1 transition-all duration-300 ${!showContent ? "lg:justify-center lg:flex-none" : ""}`}>
            <button
              onClick={() => setShowLogoPopup(true)}
              className={`relative flex-shrink-0 transition-all duration-300 group cursor-pointer ${!showContent ? "w-12 h-12" : "w-11 h-11"}`}
              title="Click to view logo"
            >
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src={collegeLogo ? collegeLogo : AppLogo4k}
                className="relative w-full h-full rounded-xl object-cover border-2 border-slate-600/50 shadow-lg group-hover:border-indigo-500/50 transition-all duration-300 group-hover:scale-105"
                alt={collegeLogo ? "College Logo" : "HOAS Logo"}
              />
            </button>

            {/* Text block: hidden when collapsed, truncates when name is long */}
            <div
              className={`flex flex-col min-w-0 overflow-hidden transition-all duration-300 origin-left ${!showContent ? "lg:hidden opacity-0 w-0 scale-95" : "opacity-100 flex-1 scale-100"
                }`}
            >
              <h1
                className="text-sm font-bold leading-tight tracking-tight truncate"
                style={{ color: 'var(--text-primary)' }}
                title={userData?.collegeName || 'HOAS'}
              >
                {userData?.collegeName || 'HOAS'}
              </h1>
              <p className="text-xs font-medium mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {collegeLogo ? 'College Portal' : 'Management Portal'}
              </p>
            </div>
          </div>

          {/* Action buttons — always visible, never pushed off */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            {/* Pin Button - Desktop Only */}
            <button
              onClick={handlePinClick}
              className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${!showContent ? "opacity-0 pointer-events-none" : "opacity-100"} ${isPinned ? "bg-indigo-600 text-white" : "hover:text-white"}`}
              style={{
                backgroundColor: isPinned ? undefined : 'var(--bg-tertiary)',
                color: isPinned ? undefined : 'var(--text-muted)'
              }}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <Pin className={`w-4 h-4 transition-transform ${isPinned ? "rotate-60" : ""}`} />
            </button>

            <button
              onClick={() => setIsCollapsed(true)}
              className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-muted)'
              }}
              title="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-[calc(100%-5rem)] py-4">
          {/* Main Menu */}
          <div className="flex-1 px-3 space-y-1">
            <p
              className={`text-xs font-semibold uppercase tracking-wider mb-3 px-3 ${!showContent ? "lg:hidden" : ""}`}
              style={{ color: 'var(--text-muted)' }}
            >
              Main Menu
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              const activeStyle = isActive
                ? { background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', color: '#ffffff' }
                : {};

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth < 1024) setIsCollapsed(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${!showContent ? "lg:justify-center" : ""}`}
                  style={isActive ? activeStyle : { color: 'var(--text-secondary)' }}
                >
                  <span className="relative flex-shrink-0">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110`}
                      style={{ color: isActive ? '#ffffff' : 'var(--text-secondary)' }}
                    />
                    {isNavItemNew(item.id) && !showContent && <NewBadge dot />}
                  </span>
                  <span className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${!showContent ? "lg:hidden" : ""}`}>
                    {item.label}
                  </span>
                  {isNavItemNew(item.id) && showContent && (
                    <NewBadge onDismiss={() => { dismissNavItemFeatures(item.id); forceUpdate(n => n + 1); }} />
                  )}

                  {/* Tooltip for collapsed state */}
                  {!showContent && (
                    <div
                      className="hidden lg:block absolute left-full ml-3 px-3 py-2 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50"
                      style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }}
                    >
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--bg-card)' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="px-6 my-4">
            <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border-primary), transparent)' }} />
          </div>

          {/* Bottom Menu */}
          <div className="px-3 space-y-1">
            <p
              className={`text-xs font-semibold uppercase tracking-wider mb-3 px-3 ${!showContent ? "lg:hidden" : ""}`}
              style={{ color: 'var(--text-muted)' }}
            >
              More
            </p>
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth < 1024) setIsCollapsed(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${!showContent ? "lg:justify-center" : ""}`}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="relative flex-shrink-0">
                    <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    {isNavItemNew(item.id) && !showContent && <NewBadge dot />}
                  </span>
                  <span className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${!showContent ? "lg:hidden" : ""}`}>
                    {item.label}
                  </span>
                  {isNavItemNew(item.id) && showContent && (
                    <NewBadge onDismiss={() => { dismissNavItemFeatures(item.id); forceUpdate(n => n + 1); }} />
                  )}

                  {/* Tooltip for collapsed state */}
                  {!showContent && (
                    <div
                      className="hidden lg:block absolute left-full ml-3 px-3 py-2 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50"
                      style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }}
                    >
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--bg-card)' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* User Profile Card */}
          <button
            onClick={() => {
              navigate("/dashboard/management/profile");
              if (window.innerWidth < 1024) setIsCollapsed(true);
            }}
            className={`mt-auto mb-3 mx-2 group relative ${!showContent ? "flex justify-center" : "block"} cursor-pointer`}
          >
            <div
              className={`transition-all duration-200 ${showContent ? "p-3 rounded-xl border" : "p-1 hover:scale-105 transition-transform"}`}
              style={showContent ? {
                background: isDark
                  ? 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.4))'
                  : 'linear-gradient(to bottom right, rgba(241, 245, 249, 0.8), rgba(241, 245, 249, 0.4))',
                borderColor: 'var(--border-secondary)'
              } : undefined}
            >
              <div className={`flex items-center ${showContent ? "gap-3" : "justify-center"}`}>
                <Avatar image={userData?.photoURL || user?.photoURL} name={user?.displayName} size="sm" rounded="lg" />
                {showContent && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.displayName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tooltip for collapsed state */}
            {!showContent && (
              <div
                className="hidden lg:block absolute left-full ml-3 px-3 py-2 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 top-1/2 -translate-y-1/2"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }}
              >
                My Profile
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45" style={{ backgroundColor: 'var(--bg-card)' }} />
              </div>
            )}
          </button>
        </nav>
      </aside>

      {/* Logo Popup Modal — z-[9999] ensures it's above everything */}
      {showLogoPopup && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onMouseDown={(e) => {
            // Close only when clicking the backdrop itself, not the card
            if (e.target === e.currentTarget) setShowLogoPopup(false);
          }}
        >
          <div
            className="relative rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            style={{
              background: isDark
                ? 'linear-gradient(to bottom right, #0f172a, #1e293b)'
                : 'linear-gradient(to bottom right, #ffffff, #f1f5f9)',
              border: '1px solid var(--border-primary)',
              zIndex: 10000
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowLogoPopup(false)}
              className="absolute top-4 right-4 p-2 rounded-full transition-all duration-200 hover:bg-red-500/20"
              style={{ backgroundColor: 'var(--bg-tertiary)', zIndex: 10001 }}
              title="Close (Esc)"
            >
              <X className="w-5 h-5 text-red-500" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <div className="inline-block relative">
                  <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl animate-pulse" />
                  <img
                    src={collegeLogo ? collegeLogo : AppLogo4k}
                    alt={collegeLogo ? "College Logo" : "HOAS Logo"}
                    className="relative max-w-xs w-full mx-auto rounded-xl object-contain border-4 border-red-700/50 shadow-2xl"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {userData?.collegeName}
              </h2>
              <p className="text-base mb-1" style={{ color: 'var(--text-secondary)' }}>
                Hostel Operation Accountability System
              </p>

              <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Shield className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Management Portal</span>
              </div>

              <div className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                © {handleDateYear()} HOAS. All rights reserved.
              </div>

              {/* Tap outside hint */}
              <p className="mt-3 text-xs opacity-50" style={{ color: 'var(--text-muted)' }}>
                Click outside or press Esc to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManagementSidebar;
