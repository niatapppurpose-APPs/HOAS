import { useState } from "react";
import ManagementSidebar from "../../components/layout/ManagementSidebar";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { FileText, Search, Filter, Download } from "lucide-react";
import "../ManagementDashboard.css";
import { useAuth } from "../../../../context/AuthContext";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user, logout } = useAuth();

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by auth context
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div className="management-dashboard">
      <ManagementSidebar />
      
      <main className="dashboard-main">
        <ManagementHeader 
          user={user} 
          pendingCount={0}
          handleLogout={handleLogout}
        />
        
        <div className="dashboard-content">
          {/* Page Header */}
          <div className="page-header">
            <div className="page-header-left">
              <FileText className="page-icon" size={32} />
              <div>
                <h1 className="page-title">Reports</h1>
                <p className="page-subtitle">View and download system reports</p>
              </div>
            </div>
            <button className="btn-primary">
              <Download size={20} />
              Generate Report
            </button>
          </div>

          {/* Search and Filter */}
          <div className="toolbar">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search reports..."
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
              <FileText size={64} className="empty-icon" />
              <h3>No Reports Available</h3>
              <p>Generate your first report to view it here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
