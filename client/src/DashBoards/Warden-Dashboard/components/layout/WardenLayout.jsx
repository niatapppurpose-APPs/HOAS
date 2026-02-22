import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase/firebaseConfig";
import WardenSidebar from './WardenSidebar';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';

const WardenLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [managementData, setManagementData] = useState(null);
  const { userData } = useAuth();
  const { isDark } = useTheme();

  // Fetch management data (college logo, location, etc.)
  useEffect(() => {
    const managementId = userData?.managementId;
    if (!managementId) {
      setManagementData(null);
      return;
    }

    const managementRef = doc(db, "users", managementId);
    const unsubscribe = onSnapshot(managementRef, (snap) => {
      if (snap.exists()) {
        setManagementData(snap.data());
      } else {
        setManagementData(null);
      }
    }, () => {
      setManagementData(null);
    });

    return () => unsubscribe();
  }, [userData]);

  const collegeLogo = managementData?.collegeLogo || null;

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
          managementData={managementData}
        />

        <main className={`transition-all duration-300 ease-in-out ml-0 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
          }`}>
          <Outlet context={{ isCollapsed, setIsCollapsed, collegeLogo, managementData }} />
        </main>
      </div>
    </div>
  );
};

export default WardenLayout;
