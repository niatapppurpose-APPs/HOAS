import { useState } from "react";
import { Outlet } from "react-router-dom";
import WardenSidebar from './WardenSidebar';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';

const WardenLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { userData } = useAuth();
  const { isDark } = useTheme();

  const collegeLogo = userData?.collegeId?.logoUrl || userData?.collegeLogo || null;

  const themeInfo = userData?.theme || {
    primary: '#f97316', // Orange theme for warden
    secondary: '#f59e0b',
    surface: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    background: isDark ? '#0f172a' : '#f8fafc'
  };

  const themeVars = {
    '--warden-accent': themeInfo.primary,
    '--warden-accent-2': themeInfo.secondary,
    '--warden-surface': isDark ? '#1e293b' : '#ffffff',
    '--warden-text': isDark ? '#f8fafc' : '#0f172a',
    '--warden-background': isDark ? '#0f172a' : '#f8fafc',
  };

  return (
    <div
      style={themeVars}
      className="min-h-screen font-sans selection:bg-orange-500/30 transition-colors duration-300"
    >
      <div
        className="min-h-screen transition-colors duration-300"
        style={{
          backgroundColor: 'transparent',
          color: 'var(--text-primary)'
        }}
      >
        <WardenSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          collegeLogo={collegeLogo}
        />

        <main className={`transition-all duration-300 ease-in-out ml-0 pb-24 lg:pb-0 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
          }`}>
          <Outlet context={{ isCollapsed, setIsCollapsed, collegeLogo }} />
        </main>
      </div>
    </div>
  );
};

export default WardenLayout;
