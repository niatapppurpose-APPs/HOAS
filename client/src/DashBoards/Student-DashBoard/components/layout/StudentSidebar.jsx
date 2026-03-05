import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  FileText,
  Calendar,
  Bell,
  Settings,
  HelpCircle,
  Pin,
  ChevronLeft,
  X,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useTheme } from "../../../../context/ThemeContext";
import Avatar from '../../../../components/OwnerServices/Avatar';
import Applogo from '../../../../assets/AppLogo4k.png';
import NewBadge from "../../../../components/NewBadge";
import { isNavItemNew, dismissNavItemFeatures } from "../../../../data/newFeatures";

const StudentSidebar = ({ isCollapsed, setIsCollapsed, collegeLogo, managementData }) => {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPinned, setIsPinned] = useState(false);
  const [showLogoPopup, setShowLogoPopup] = useState(false);
  const [, forceUpdate] = useState(0);

  // Get active item from current path
  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/complaints')) return 'complaints';
    if (path.includes('/leave')) return 'leave';
    if (path.includes('/announcements')) return 'announcements';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/help')) return 'help';
    return 'dashboard';
  };

  const activeItem = getActiveItem();

  // Restore pinned state from localStorage and reset on mobile view
  useEffect(() => {
    const storedValue = localStorage.getItem("studentSidebarPinned");
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
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/student" },
    { id: "complaints", label: "Complaints", icon: FileText, path: "/dashboard/student/complaints" },
    { id: "leave", label: "Leave Requests", icon: Calendar, path: "/dashboard/student/leave" },
    { id: "announcements", label: "Announcements", icon: Bell, path: "/dashboard/student/announcements" },
  ];

  const bottomMenuItems = [
    { id: "settings", label: "Settings", icon: Settings, path: "/dashboard/student/settings" },
    { id: "help", label: "Help & Support", icon: HelpCircle, path: "/dashboard/student/help" },
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
    localStorage.setItem('studentSidebarPinned', String(newValue));
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
          className="flex items-center justify-between h-20 px-4 border-b shrink-0"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className={`flex items-center gap-3 min-w-0 flex-1 transition-all duration-300 ${!showContent ? "lg:justify-center lg:flex-none" : ""}`}>
            <button
              onClick={() => setShowLogoPopup(true)}
              className={`relative flex-shrink-0 transition-all duration-300 group cursor-pointer ${!showContent ? "w-9 h-9" : "w-11 h-11"}`}
              title="Click to view logo"
            >
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src={collegeLogo ? collegeLogo : Applogo}
                className={`relative w-full h-full rounded-xl object-cover border-2 border-slate-600/50 shadow-lg group-hover:border-blue-500/50 transition-all duration-300 group-hover:scale-105 ${collegeLogo ? 'bg-white' : ''}`}
                alt={collegeLogo ? "College Logo" : "HOAS Logo"}
              />
            </button>

            <div className={`flex flex-col min-w-0 overflow-hidden transition-all duration-300 origin-left ${!showContent ? "lg:hidden opacity-0 w-0 scale-95" : "opacity-100 flex-1 scale-100"}`}>
              <h1 className="text-sm font-bold leading-tight tracking-tight truncate" style={{ color: 'var(--text-primary)' }} title={managementData?.collegeName || userData?.collegeName || 'HOAS'}>
                {managementData?.collegeName || userData?.collegeName || 'HOAS'}
              </h1>
              <p className="text-xs font-medium mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                Student Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            {/* Pin Button - Desktop Only */}
            <button
              onClick={handlePinClick}
              className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${!showContent ? "opacity-0 pointer-events-none" : "opacity-100"} ${isPinned ? "bg-blue-600 text-white" : "hover:text-white"}`}
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
                ? { background: 'linear-gradient(90deg, #3b82f6, #6366f1)', color: '#ffffff' }
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
              const isActive = activeItem === item.id;

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
                    <Icon
                      className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                      style={{ color: 'var(--text-secondary)' }}
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

          {/* User Profile Section */}
          <button
            onClick={() => {
              navigate("/dashboard/student/profile");
              if (window.innerWidth < 1024) setIsCollapsed(true);
            }}
            className={`mt-auto mb-3 mx-2 group relative ${!showContent ? "flex justify-center" : "block"} cursor-pointer`}
          >
            <div
              className={`transition-all duration-200 ${showContent ? "p-3 rounded-xl border" : "p-1 hover:scale-105"}`}
              style={showContent ? {
                background: isDark
                  ? 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.4))'
                  : 'linear-gradient(to bottom right, rgba(241, 245, 249, 0.8), rgba(241, 245, 249, 0.4))',
                borderColor: 'var(--border-secondary)'
              } : undefined}
            >
              <div className={`flex items-center ${showContent ? "gap-3" : "justify-center"}`}>
                <Avatar image={userData?.photoURL || user?.photoURL} name={user?.displayName} size="sm" rounded="full" />
                {showContent && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {user?.displayName || 'Student'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {user?.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
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

      {/* Logo Popup */}
      {showLogoPopup && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogoPopup(false)}
        >
          <div
            className="relative max-w-md w-full rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoPopup(false)}
              className="absolute top-4 right-4 p-2 rounded-full transition-colors"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <img
                src={collegeLogo ? collegeLogo : Applogo}
                className="w-full h-full rounded-lg object-contain border-4 border-blue-500/30 shadow-lg"
                alt={collegeLogo ? "College Logo" : "HOAS Logo"}
              />
              <h2 className="mt-4 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {userData?.collegeName || 'HOAS'}
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {collegeLogo ? 'College Portal' : 'Hostel Accommodation System'}
              </p>
              <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <GraduationCap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Student Portal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentSidebar;
