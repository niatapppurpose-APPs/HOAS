import { useState } from "react";
import { Outlet } from "react-router-dom";
import StudentSidebar from './StudentSidebar';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';

const StudentLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { userData } = useAuth();
  const { isDark } = useTheme();

  const theme = userData?.theme || {
    primary: '#3b82f6', // Blue theme for student
    secondary: '#6366f1',
    surface: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    background: isDark ? '#0f172a' : '#f8fafc'
  };

  const themeVars = {
    '--student-accent': theme.primary,
    '--student-accent-2': theme.secondary,
    '--student-surface': isDark ? '#1e293b' : '#ffffff',
    '--student-text': isDark ? '#f8fafc' : '#0f172a',
    '--student-background': isDark ? '#0f172a' : '#f8fafc',
  };

  return (
    <div 
      style={themeVars} 
      className="min-h-screen font-sans selection:bg-blue-500/30 transition-colors duration-300"
    >
      <div 
        className="min-h-screen transition-colors duration-300"
        style={{ 
          backgroundColor: 'transparent',
          color: 'var(--text-primary)' 
        }}
      >
        <StudentSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        <main className={`transition-all duration-300 ease-in-out ml-0 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}>
          <Outlet context={{ isCollapsed, setIsCollapsed }} />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
