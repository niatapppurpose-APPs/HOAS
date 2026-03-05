import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { Home, Search, Filter, Plus } from "lucide-react";
import "../ManagementDashboard.css";

const Hostels = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { isCollapsed, setIsCollapsed } = useOutletContext();

  return (
    <>
      {/* Header */}
      <ManagementHeader 
        title="Hostels · Management"
        pendingCount={0}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      {/* Main Content */}
      <div className="pt-20 sm:pt-24 px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-icon">
              <Home size={24} />
            </div>
            <div>
              <h1 className="page-title">Hostels Management</h1>
              <p className="page-subtitle">Manage and monitor all hostels</p>
            </div>
          </div>
          <button className="btn-primary">
            <Plus size={20} />
            Add Hostel
          </button>
        </div>

        {/* Search and Filter */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search hostels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary">
            <Filter size={20} />
            Filter
          </button>
        </div>

        {/* Content Area */}
        <div className="content-card">
          <div className="empty-state">
            <Home size={64} className="empty-icon" />
            <h3>No Hostels Found</h3>
            <p>Start by adding your first hostel to the system</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hostels;
