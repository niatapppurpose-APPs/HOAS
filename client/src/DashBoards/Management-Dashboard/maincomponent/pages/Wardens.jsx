import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { Building2, Search, Filter, Plus } from "lucide-react";
import "../ManagementDashboard.css";

const Wardens = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { isCollapsed } = useOutletContext();

  return (
    <>
      {/* Header */}
      <ManagementHeader 
        title="Wardens · Management"
        pendingCount={0}
        isCollapsed={isCollapsed}
      />
      
      {/* Main Content */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-icon">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="page-title">Wardens Management</h1>
              <p className="page-subtitle">Manage and monitor all wardens</p>
            </div>
          </div>
          <button className="btn-primary">
            <Plus size={20} />
            Add Warden
          </button>
        </div>

        {/* Search and Filter */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search wardens..."
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
            <Building2 size={64} className="empty-icon" />
            <h3>No Wardens Found</h3>
            <p>Start by adding your first warden to the system</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Wardens;
