import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from '../../components/OwnerServices/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const OwnersLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { userData } = useAuth();
  const { isDark } = useTheme();

  const theme = userData?.theme || {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    surface: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    background: isDark ? '#0f172a' : '#f8fafc'
  };

  const themeVars = {
    '--owner-accent': theme.primary,
    '--owner-accent-2': theme.secondary,
    '--owner-surface': isDark ? '#1e293b' : '#ffffff',
    '--owner-text': isDark ? '#f8fafc' : '#0f172a',
    '--owner-background': isDark ? '#0f172a' : '#f8fafc',
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
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        <main className={`transition-all duration-300 ease-in-out ml-0 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}>
          <Outlet context={{ isCollapsed, setIsCollapsed }} />
        </main>
      </div>
    </div>
  );
};

export default OwnersLayout;
