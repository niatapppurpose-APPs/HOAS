import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from '../../components/OwnerServices/Sidebar';
import { useAuth } from '../../context/AuthContext';

const OwnersLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { userData } = useAuth();

  const theme = userData?.theme || {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    surface: '#0f172a',
    text: '#ffffff',
    background: '#ffffff'
  };

  const themeVars = {
    '--owner-accent': theme.primary,
    '--owner-accent-2': theme.secondary,
    '--owner-surface': theme.surface,
    '--owner-text': theme.text,
    '--owner-background': theme.background,
    background: 'var(--owner-background)'
  };

  return (
    <div style={themeVars} className="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <main className={`transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <Outlet />
      </main>
    </div>
  );
};

export default OwnersLayout;
