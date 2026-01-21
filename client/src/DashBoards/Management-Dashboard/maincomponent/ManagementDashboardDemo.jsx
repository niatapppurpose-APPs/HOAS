import { useState } from "react";
import ManagementSidebar from "../components/layout/ManagementSidebar";
import ManagementHeader from "../components/layout/ManagementHeader";
import KPICards from "../components/dashboard/KPICards";
import QuickApproval from "../components/dashboard/QuickApproval";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatusTable from "../components/dashboard/StatusTable";
import StatusVisualization from "../components/dashboard/StatusVisualization";
import "./ManagementDashboard.css";

/**
 * DEMO VERSION - Management Dashboard with Sample Data
 * This version uses hardcoded data for testing the UI
 * Use ManagementDashboard.jsx for the production version with Firebase
 */

const ManagementDashboardDemo = () => {
  const [currentPage, setCurrentPage] = useState(1);

  // Sample user data
  const sampleUser = {
    displayName: "Management Admin",
    email: "admin@management.com",
    photoURL: null
  };

  // Sample statistics
  const sampleStats = {
    totalWardens: 2,
    pendingWardens: 1,
    totalStudents: 2,
    pendingStudents: 1,
    totalPending: 2,
    totalHostels: 2
  };

  // Sample pending user
  const samplePendingUser = {
    id: "1",
    displayName: "Ismail Shaik",
    email: "ismailshaik.730@gmail.com",
    role: "warden",
    status: "pending",
    photoURL: null,
    createdAt: {
      toDate: () => new Date("2025-01-23T12:30:00")
    }
  };

  // Sample recent users
  const sampleRecentUsers = [
    {
      id: "1",
      displayName: "Ismail Shaik",
      email: "ismailshaik.730@gmail.com",
      role: "warden",
      status: "pending",
      photoURL: null,
      createdAt: {
        toDate: () => new Date("2025-01-23T12:30:00")
      }
    },
    {
      id: "2",
      displayName: "Karthik",
      email: "karthik78@gmail.com",
      role: "warden",
      status: "pending",
      photoURL: null,
      createdAt: {
        toDate: () => new Date("2025-01-22T09:15:00")
      }
    },
    {
      id: "3",
      displayName: "Priya",
      email: "priya.22@gmail.com",
      role: "student",
      status: "pending",
      photoURL: null,
      createdAt: {
        toDate: () => new Date("2025-01-22T14:45:00")
      }
    }
  ];

  // Sample table users
  const sampleTableUsers = [
    {
      id: "1",
      displayName: "Karthik",
      email: "karthik78@gmail.com",
      role: "warden",
      status: "pending",
      photoURL: null
    },
    {
      id: "2",
      displayName: "Priya",
      email: "priya.22@gmail.com",
      role: "student",
      status: "pending",
      photoURL: null
    },
    {
      id: "3",
      displayName: "Mohan Reddy",
      email: "mohanreddy.anh@gmail.com",
      role: "student",
      status: "approved",
      photoURL: null
    }
  ];

  // Visualization data
  const wardensViz = {
    total: 2,
    active: 1,
    pending: 1
  };

  const studentsViz = {
    total: 2,
    active: 1,
    pending: 1
  };

  // Handlers
  const handleLogout = () => {
    console.log("Logout clicked");
    alert("Logout functionality - redirect to login page");
  };

  const handleApprove = (userId) => {
    console.log("Approve user:", userId);
    alert(`Approving user ${userId}`);
  };

  const handleViewDetails = () => {
    console.log("View details clicked");
    alert("View details - open user profile modal");
  };

  return (
    <div className="management-dashboard">
      <ManagementSidebar />
      
      <div className="dashboard-main">
        <ManagementHeader 
          user={sampleUser} 
          pendingCount={sampleStats.totalPending}
          handleLogout={handleLogout}
        />

        <div className="dashboard-content">
          {/* Top Row: KPI Cards + Quick Approval */}
          <div className="dashboard-top-row">
            <div className="kpi-section">
              <KPICards stats={sampleStats} />
            </div>
            <div className="quick-approval-section">
              <QuickApproval 
                pendingUser={samplePendingUser}
                onApprove={() => handleApprove(samplePendingUser.id)}
                onViewDetails={handleViewDetails}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity 
            recentUsers={sampleRecentUsers}
            onApprove={handleApprove}
          />

          {/* Bottom Row: Status Table + Visualization */}
          <div className="dashboard-bottom-row">
            <div className="status-table-wrapper">
              <StatusTable 
                users={sampleTableUsers}
                currentPage={currentPage}
                totalPages={1}
                onPageChange={setCurrentPage}
              />
            </div>
            <div className="status-viz-wrapper">
              <StatusVisualization 
                wardens={wardensViz}
                students={studentsViz}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboardDemo;
