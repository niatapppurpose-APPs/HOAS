import { useState } from "react";
import ManagementSidebar from "../../components/layout/ManagementSidebar";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { Building2, Search, Filter, Plus } from "lucide-react";
import "../ManagementDashboard.css";

const Wardens = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="management-dashboard">
      <ManagementSidebar />
      
      <main className="dashboard-main">
        <ManagementHeader user={{ displayName: "Admin" }} />
        
        <div className="dashboard-content">
          {/* Page Header */}
          <div className="page-header">
            <div className="page-header-left">
              <Building2 className="page-icon" size={32} />
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
      </main>
    </div>
  );
};

export default Wardens;
