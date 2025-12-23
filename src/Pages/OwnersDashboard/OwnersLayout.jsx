import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from '../../components/OwnerServices/Sidebar';

const OwnersLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
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
