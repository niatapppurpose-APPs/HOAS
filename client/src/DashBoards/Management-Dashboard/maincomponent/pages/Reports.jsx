import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import ManagementHeader from "../../components/layout/ManagementHeader";
import { FileText, Search, Filter, Download } from "lucide-react";
import "../ManagementDashboard.css";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { isCollapsed } = useOutletContext();

  return (
    <>
      {/* Header */}
      <ManagementHeader 
        title="Reports · Management"
        pendingCount={0}
        isCollapsed={isCollapsed}
      />
      
      {/* Main Content */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-icon">
              <FileText size={24} />
            </div>
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
    </>
  );
};

export default Reports;
