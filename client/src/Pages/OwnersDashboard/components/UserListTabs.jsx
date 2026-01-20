const UserListTabs = ({ activeTab, allUsersCount, pendingCount, approvedCount, onTabChange }) => {
  const tabs = [
    { id: "all", label: "All", count: allUsersCount },
    { id: "pending", label: "Pending", count: pendingCount },
    { id: "approved", label: "Approved", count: approvedCount },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.id ? "bg-indigo-600 text-white" : ""
          }`}
          style={
            activeTab !== tab.id 
              ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } 
              : undefined
          }
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
};

export default UserListTabs;
