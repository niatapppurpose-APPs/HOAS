import { useTheme } from "../../../context/ThemeContext";

const UserListTabs = ({ activeTab, allUsersCount, pendingCount, approvedCount, suspendedCount, onTabChange }) => {
  const tabs = [
    { id: "all", label: "All", count: allUsersCount },
    { id: "pending", label: "Pending", count: pendingCount },
    { id: "approved", label: "Approved", count: approvedCount },
    { id: "suspended", label: "Suspended", count: suspendedCount },

  ];
const {isDark} = useTheme();
  return (
    <div id="tour-user-tabs" className="flex flex-wrap gap-10 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
            ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105  "
            : `${isDark ? 'hover:bg-white hover:text-[#000]' : 'hover:bg-black hover:text-[#fff]'}`
            }`}
          style={
            activeTab !== tab.id
              ? { border: '1px solid var(--border-primary)' }
              : { border: '1px solid transparent' }
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default UserListTabs;
