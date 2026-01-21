import { useState } from "react";
import ManagementSidebar from "../../components/layout/ManagementSidebar";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { Users, Search, Filter, Plus } from "lucide-react";
import "../ManagementDashboard.css";

const Students = () => {
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
              <Users className="page-icon" size={32} />
              <div>
                <h1 className="page-title">Students Management</h1>
                <p className="page-subtitle">Manage and monitor all students</p>
              </div>
            </div>
            <button className="btn-primary">
              <Plus size={20} />
              Add Student
            </button>
          </div>

          {/* Search and Filter */}
          <div className="toolbar">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search students..."
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
              <Users size={64} className="empty-icon" />
              <h3>No Students Found</h3>
              <p>Start by adding your first student to the system</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Students;
