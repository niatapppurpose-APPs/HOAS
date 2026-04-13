import { useState, useEffect, useMemo } from "react";
import { Outlet } from "react-router-dom";
import ManagementSidebar from './components/layout/ManagementSidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ManagementLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { userData } = useAuth();
  const { isDark } = useTheme();

  // Compute college logo from userData using useMemo to avoid state in effect
  const collegeLogo = useMemo(() => userData?.collegeLogo || null, [userData?.collegeLogo]);

  const theme = userData?.theme || {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    surface: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    background: isDark ? '#0f172a' : '#f8fafc'
  };

  const themeVars = {
    '--management-accent': theme.primary,
    '--management-accent-2': theme.secondary,
    '--management-surface': isDark ? '#1e293b' : '#ffffff',
    '--management-text': isDark ? '#f8fafc' : '#0f172a',
    '--management-background': isDark ? '#0f172a' : '#f8fafc',
  };

  return (
    <div
      style={themeVars}
      className="min-h-screen font-sans selection:bg-indigo-500/30 transition-colors duration-300"
    >
      <div
        className="min-h-screen transition-colors duration-300"
        style={{
          backgroundColor: 'transparent',
          color: 'var(--text-primary)'
        }}
      >
        <ManagementSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          collegeLogo={collegeLogo}
        />

        <main className={`transition-all duration-300 ease-in-out ml-0 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
          }`}>
          <Outlet context={{ isCollapsed, setIsCollapsed }} />
        </main>
      </div>
    </div>
  );
};

export default ManagementLayout;
