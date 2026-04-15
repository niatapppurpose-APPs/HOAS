import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import { collection, query, where, onSnapshot, doc, limit } from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import * as cloudFunctions from "../../firebase/cloudFunctions";
import { useToast } from "../../components/Toast";
import { useDashboardTour, managementTourSteps } from "../../tours";

// Import components
import ManagementHeader from "./components/layout/ManagementHeader";
import KPICards from "./components/dashboard/KPICards";
// import QuickApproval from "./components/dashboard/QuickApproval";
import RecentActivity from "./components/dashboard/RecentActivity";
import StatusTable from "./components/dashboard/StatusTable";
// Import styles
import "./ManagementDashboard.css";

const ManagementDashboard = () => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isCollapsed, setIsCollapsed } = useOutletContext();

  // State
  const [wardens, setWardens] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-start tour on first visit (waits for data to load)
  useDashboardTour('management', managementTourSteps, { ready: false });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // show 10 users per page in status table

  // College logo (from colleges collection)
  const [collegeLogo, setCollegeLogo] = useState(null);

  // Fetch wardens and students belonging to this management only
  useEffect(() => {
    if (!userData?.uid) return; // wait until we know who the current management is

    const baseConstraints = [where("managementId", "==", userData.uid)];
    const wardensQuery = query(
      collection(db, "users"),
      where("role", "==", "warden"),
      ...baseConstraints,
      limit(50)
    );
    const studentsQuery = query(
      collection(db, "users"),
      where("role", "==", "student"),
      ...baseConstraints,
      limit(100)
    );

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
  }, [userData?.uid]);

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

  // search state for status table
  const [statusSearch, setStatusSearch] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [statusSearch]);

  // Calculate statistics
  const stats = {
    totalWardens: wardens.length,
    pendingWardens: wardens.filter(w => w.status === 'pending').length,
    totalStudents: students.length,
    pendingStudents: students.filter(s => s.status === 'pending').length,
    totalPending: wardens.filter(w => w.status === 'pending').length +
      students.filter(s => s.status === 'pending').length,
    totalHostels: userData?.hostelCount || 0
  };

  // Get pending users for recent activity
  const allPendingUsers = [
    ...wardens.filter(w => w.status === 'pending'),
    ...students.filter(s => s.status === 'pending')
  ].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
    return dateB - dateA;
  });

  // keep full list for RecentActivity so it can paginate internally
  const recentUsers = allPendingUsers;
  // Get users for table
  const allUsers = [...wardens, ...students].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
    return dateB - dateA;
  });

  // apply status table search filter
  const filteredUsers = allUsers.filter(u => {
    const tokens = statusSearch.toLowerCase().split(/\s+/).filter(t => t);
    if (tokens.length === 0) return true;
    const name = u.displayName?.toLowerCase() || '';
    const mail = u.email?.toLowerCase() || '';
    return tokens.every(tok => name.includes(tok) || mail.includes(tok));
  });

  const paginatedUsers = filteredUsers.slice(
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <ManagementHeader
        pendingCount={stats.totalPending}
        title="Dashboard · Management Overview"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        collegeLogo={collegeLogo}
      />

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        {/* Welcome section for tour targeting */}
        <div id="mgmt-tour-welcome" />

        {/* Top Row: KPI Cards */}
        <div id="mgmt-tour-kpi" className="mb-8">
          <KPICards stats={stats} />
        </div>

        {/* Recent Activity */}
        <div id="mgmt-tour-activity">
        <RecentActivity
          recentUsers={recentUsers}
          onApprove={handleApprove}
          approvingUserId={approvingUserId}
        />
        </div>

        {/* Bottom Row: Status Table + Visualization */}
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 mt-4 sm:mt-8">
          <div id="mgmt-tour-status-table" className="flex-1 w-full min-w-0 overflow-x-auto">
            <StatusTable
              users={paginatedUsers}
              currentPage={currentPage}
              totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              searchTerm={statusSearch}
              onSearchChange={setStatusSearch}
            />
          </div>
          {/* <div className="w-full xl:w-[400px] 2xl:w-[500px] flex-shrink-0">
            <StatusVisualization
              wardens={wardensViz}
              students={studentsViz}
            />
          </div> */}
        </div>
      </div>
    </>
  );
};

export default ManagementDashboard;
