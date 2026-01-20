import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Home,
  FileText,
} from "lucide-react";
import Applogo from '../../../assets/Applogo.png';

const ManagementSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get active item from current path
  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/wardens')) return 'wardens';
    if (path.includes('/students')) return 'students';
    if (path.includes('/hostels')) return 'hostels';
    if (path.includes('/reports')) return 'reports';
    return 'dashboard';
  };

  const activeItem = getActiveItem();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/management-dashboard" },
    { id: "wardens", label: "Wardens", icon: Building2, path: "/management-dashboard/wardens" },
    { id: "students", label: "Students", icon: Users, path: "/management-dashboard/students" },
    { id: "hostels", label: "Hostels", icon: Home, path: "/management-dashboard/hostels" },
    { id: "reports", label: "Reports", icon: FileText, path: "/management-dashboard/reports" },
  ];

  return (
    <aside className="management-sidebar">
      {/* Logo Section */}
      <div className="sidebar-logo">
        <img src={Applogo} alt="NxtWave" className="logo-image" />
        <div className="logo-text">
          <span className="logo-title">NxtWave</span>
          <span className="logo-subtitle">Management Dashboard</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="sidebar-icon" size={20} />
              <span className="sidebar-label">{item.label}</span>
              {isActive && <div className="active-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* Settings Section */}
      <div className="sidebar-footer">
        <div className="sidebar-settings">
          <span className="settings-label">SETTINGS</span>
        </div>
      </div>
    </aside>
  );
};

export default ManagementSidebar;
