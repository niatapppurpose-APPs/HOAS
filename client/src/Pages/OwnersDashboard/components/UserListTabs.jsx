const UserListTabs = ({ activeTab, allUsersCount, pendingCount, approvedCount, suspendedCount, onTabChange }) => {
  const tabs = [
    { id: "all", label: "All", count: allUsersCount },
    { id: "pending", label: "Pending", count: pendingCount },
    { id: "approved", label: "Approved", count: approvedCount },
    { id: "suspended", label: "Suspended", count: suspendedCount},

  ];

  return (
    <div id="tour-user-tabs" className="flex flex-wrap gap-2 mb-6">
      {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
                : "hover:bg-indigo-500/10 hover:text-indigo-500"
            }`}
            style={
              activeTab !== tab.id
                ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }
                : { border: '1px solid transparent' }
            }
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-[11px] leading-tight ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-gray-500/15 text-gray-500'}`}>
              {tab.count}
            </span>
          </button>
      ))}
    </div>
  );
};

export default UserListTabs;
