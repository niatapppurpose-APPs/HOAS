import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { collection, query, where, onSnapshot, doc } from "firebase/firestore";

import { db } from "../../../firebase/firebaseConfig";
import { useAuth } from "../../../context/AuthContext";
import * as cloudFunctions from "../../../firebase/cloudFunctions";
import { useToast } from "../../../components/Toast";

// Import components
import ManagementSidebar from '../components/layout/ManagementSidebar';
import ManagementHeader from "../components/layout/ManagementHeader";
import KPICards from "../components/dashboard/KPICards";
import QuickApproval from "../components/dashboard/QuickApproval";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatusTable from "../components/dashboard/StatusTable";
import StatusVisualization from "../components/dashboard/StatusVisualization";

// Import styles
import "./ManagementDashboard.css";

const ManagementDashboard = () => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [wardens, setWardens] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // College logo (from colleges collection)
  const [collegeLogo, setCollegeLogo] = useState(null);

  // Fetch wardens and students
  useEffect(() => {
    const wardensQuery = query(collection(db, "users"), where("role", "==", "warden"));
    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"));

    const unsubscribeWardens = onSnapshot(wardensQuery, (snapshot) => {
      const wardensData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWardens(wardensData);
    });

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsData);
      setLoading(false);
    });

    return () => {
      unsubscribeWardens();
      unsubscribeStudents();
    };
  }, []);

  // Subscribe to college doc to get logo (if user has a collegeName)
  // First check userData.collegeLogo (from profile registration), then colleges collection
  useEffect(() => {
    // First priority: collegeLogo stored directly in userData (from profile registration)
    if (userData?.collegeLogo) {
      setCollegeLogo(userData.collegeLogo);
      return;
    }

    // Second priority: fetch from colleges collection
    if (!userData?.collegeName) {
      setCollegeLogo(null);
      return;
    }

    const collegeRef = doc(db, "colleges", userData.collegeName);
    const unsubscribe = onSnapshot(collegeRef, (snap) => {
      if (snap.exists()) {
        setCollegeLogo(snap.data().logo || null);
      } else {
        setCollegeLogo(null);
      }
    }, (err) => {
      setCollegeLogo(null);
    });

    return () => unsubscribe();
  }, [userData]);

  // Calculate statistics
  const stats = {
    totalWardens: wardens.length,
    pendingWardens: wardens.filter(w => w.status === 'pending').length,
    totalStudents: students.length,
    pendingStudents: students.filter(s => s.status === 'pending').length,
    totalPending: wardens.filter(w => w.status === 'pending').length +
      students.filter(s => s.status === 'pending').length,
    totalHostels: 2 // This would come from a hostels collection
  };

  // Get pending users for recent activity
  const allPendingUsers = [
    ...wardens.filter(w => w.status === 'pending'),
    ...students.filter(s => s.status === 'pending')
  ].sort((a, b) => {
    const dateA = a.createdAt?.toDate() || new Date(0);
    const dateB = b.createdAt?.toDate() || new Date(0);
    return dateB - dateA;
  });

  const recentUsers = allPendingUsers.slice(0, 3);
  const firstPendingUser = allPendingUsers[0] || null;

  // Get users for table
  const allUsers = [...wardens, ...students].sort((a, b) => {
    const dateA = a.createdAt?.toDate() || new Date(0);
    const dateB = b.createdAt?.toDate() || new Date(0);
    return dateB - dateA;
  });

  const paginatedUsers = allUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const [approvingUserId, setApprovingUserId] = useState(null);

  const handleApprove = async (userId) => {
    console.log('handleApprove called', { userId, user });

    if (!user) {
      toast.error("You must be signed in to approve users");
      return;
    }

    setApprovingUserId(userId);
    try {
      toast.info('Approving user...');
      await cloudFunctions.approveUser(userId);
      toast.success("User approved successfully");
    } catch (error) {
      const msg = error?.message || error?.code || 'Unknown error';
      toast.error(`Failed to approve user: ${msg}`);
      console.error('approveUser error:', error);
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleViewDetails = () => {
    toast.info("View details clicked");
  };

  // Visualization data
  const wardensViz = {
    total: wardens.length,
    active: wardens.filter(w => w.status === 'approved').length,
    pending: wardens.filter(w => w.status === 'pending').length
  };

  const studentsViz = {
    total: students.length,
    active: students.filter(s => s.status === 'approved').length,
    pending: students.filter(s => s.status === 'pending').length
  };

  if (loading) {
    return (
      <div className="management-dashboard loading">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  return (
    <div className="management-dashboard">
      <ManagementSidebar />

      <div className="dashboard-main">
        <ManagementHeader
          user={user}
          pendingCount={stats.totalPending}
          handleLogout={handleLogout}

          collegeLogo={collegeLogo}

        />

        <div className="dashboard-content">
          {/* Top Row: KPI Cards + Quick Approval */}
          <div className="dashboard-top-row">
            <div className="kpi-section">
              <KPICards stats={stats} />
            </div>
            <div className="quick-approval-section">
              <QuickApproval
                pendingUser={firstPendingUser}
                onApprove={() => handleApprove(firstPendingUser?.id)}
                onViewDetails={handleViewDetails}
                isApproving={approvingUserId === firstPendingUser?.id}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity
            recentUsers={recentUsers}
            onApprove={handleApprove}
            approvingUserId={approvingUserId}
          />

          {/* Bottom Row: Status Table + Visualization */}
          <div className="dashboard-bottom-row">
            <div className="status-table-wrapper">
              <StatusTable
                users={paginatedUsers}
                currentPage={currentPage}
                totalPages={Math.ceil(allUsers.length / itemsPerPage)}
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

export default ManagementDashboard;
