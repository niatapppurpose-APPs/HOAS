import { useAuth } from '../../context/AuthContext';
// ProtectedRoute component for role-based route protection
const ProtectedRoute = ({ roles, children }) => {
    const { user, loading, userData, userDataLoading, isAdmin, claims } = useAuth();
    const claimsRole = claims?.role;
    // While authentication state is initializing, don't render anything (avoids premature redirects)
    if (loading || userDataLoading) {
        return null; // could show a loader if desired
    }
    // After initialization, if there's no authenticated user, send to login
    if (!user) return <Navigate to="/login" replace />;
    // Allow admin/owner access for any route that includes admin or owner in roles
    if ((roles.includes('admin') || roles.includes('owner')) && (isAdmin || claimsRole === 'admin' || claimsRole === 'owner')) {
        return children;
    }
    // If we still don't have userData or role doesn't match, redirect to login
    if (!userData || !roles.includes(userData.role)) return <Navigate to="/login" replace />;
    return children;
};
import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { HashLoader } from "react-spinners";
import { FeatureGate } from "../../hooks/useSystemSettings";
import FeatureDisabled from "../FeatureDisabled";

// Loading component for lazy loaded routes
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <HashLoader color="var(--accent-primary, #6366F1)" size={50} />
    </div>
);

// Core pages - loaded immediately for better UX
import Home from '../../Pages/HOME/home';
import Login from '../../Pages/LoginPage/Login';
import Dashboard from '../../Pages/Dashboard/Dashboard';
import WaitingApproval from "../../Pages/WaitingApproval/WaitingApproval";
import NotFound from "../../Pages/NotFound";


// Lazy loaded pages - loaded on demand for better performance


// Lazy loaded dashboards
const StudentDashboard = lazy(() => import("../../DashBoards/Student-DashBoard/StudentDashboard"));
const StudentLayout = lazy(() => import("../../DashBoards/Student-DashBoard/components/layout/StudentLayout"));
const StudentComplaints = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentComplaints"));
const StudentLeaveRequests = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentLeaveRequests"));
const StudentAnnouncements = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentAnnouncements"));
const StudentSettings = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentSettings"));
const StudentHelpSupport = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentHelpSupport"));
const StudentProfile = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentProfile"));
const WardenDashboard = lazy(() => import("../../DashBoards/Warden-Dashboard/WardenDashboard"));
const WardenLayout = lazy(() => import("../../DashBoards/Warden-Dashboard/components/layout/WardenLayout"));
const WardenStudents = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenStudents"));
const WardenComplaints = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenComplaints"));
const WardenLeaveRequests = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenLeaveRequests"));
const WardenAnnouncements = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenAnnouncements"));
const WardenSettings = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenSettings"));
const WardenHelpSupport = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenHelpSupport"));
const WardenProfile = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenProfile"));

// Management Dashboard - lazy loaded
const ManagementDashboard = lazy(() => import("../../DashBoards/Management-Dashboard/ManagementDashboard"));
const ManagementLayout = lazy(() => import("../../DashBoards/Management-Dashboard/ManagementLayout"));
const ManagementWardens = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/Wardens"));
const ManagementStudents = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/Students"));
const ManagementHostels = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/Hostels"));
const ManagementReports = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/Reports"));
const ManagementComplaints = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/ManagementComplaints"));
const ManagementHelp = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/HelpSupport"));
const ManagementSettings_Page = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/ManagementSettings"));
const ManagementProfile = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/ManagementProfile"));

// Firebase Mode Page - public, lazy loaded
const FirebaseModePage = lazy(() => import("../../Pages/FirebaseModePage/FirebaseModePage"));

// Owner Dashboard - lazy loaded
const OwnersDashboard = lazy(() => import("../../Pages/OwnersDashboard/ownersdashbord"));
const OwnersLayout = lazy(() => import("../../Pages/OwnersDashboard/OwnersLayout"));
const Wardens = lazy(() => import("../../Pages/OwnersDashboard/Pages/Wardens"));
const Students = lazy(() => import("../../Pages/OwnersDashboard/Pages/Students"));
const Analytics = lazy(() => import("../../Pages/OwnersDashboard/Pages/Analytics"));
const Reports = lazy(() => import("../../Pages/OwnersDashboard/Pages/Reports"));
const Notifications = lazy(() => import("../../Pages/OwnersDashboard/Pages/Notifications"));
const Settings = lazy(() => import("../../Pages/OwnersDashboard/Pages/GlobalSystemSettings"));
const SupportTickets = lazy(() => import("../../Pages/OwnersDashboard/Pages/SupportTickets"));
const OwnerProfile = lazy(() => import("../OwnerServices/OwnerProfile"));

const Routes_path = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* ------------------------------ Home Page to User role page --------------------------- */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/waiting-approval" element={<WaitingApproval />} />
                <Route path="/firebase-mode" element={<FirebaseModePage />} />

                {/* ------------------------------ Profile Pages ----------------------------------------- */}
                <Route path="/profile/student-profile" element={<StudentProfile />} />
                <Route path="/profile/warden-profile" element={<WardenProfile />} />
                <Route path="/profile/management-profile" element={<ManagementProfile />} />

                {/* ------------------------------ Dashboards ---------------------------------------------*/}
                {/* Student Dashboard with Layout */}
                                <Route path="/dashboard/student" element={
                                    <ProtectedRoute roles={["student"]}><StudentLayout /></ProtectedRoute>
                                }>
                    <Route index element={<StudentDashboard />} />
                    <Route path="complaints" element={<StudentComplaints />} />
                    <Route path="leave" element={<StudentLeaveRequests />} />
                    <Route path="announcements" element={<StudentAnnouncements />} />
                    <Route path="settings" element={<StudentSettings />} />
                    <Route path="help" element={<StudentHelpSupport />} />
                    <Route path="profile" element={<StudentProfile />} />
                </Route>

                {/* Warden Dashboard with Layout */}
                                <Route path="/dashboard/warden" element={
                                    <ProtectedRoute roles={["warden"]}><WardenLayout /></ProtectedRoute>
                                }>
                    <Route index element={<WardenDashboard />} />
                    <Route path="students" element={<WardenStudents />} />
                    <Route path="complaints" element={<WardenComplaints />} />
                    <Route path="leave-requests" element={<WardenLeaveRequests />} />
                    <Route path="announcements" element={<WardenAnnouncements />} />
                    <Route path="settings" element={<WardenSettings />} />
                    <Route path="help" element={<WardenHelpSupport />} />
                    <Route path="profile" element={<WardenProfile />} />
                </Route>

                {/* Management Dashboard with Layout */}
                                <Route path="/dashboard/management" element={
                                    <ProtectedRoute roles={["management","admin"]}><ManagementLayout /></ProtectedRoute>
                                }>
                    <Route index element={<ManagementDashboard />} />
                    <Route path="wardens" element={<ManagementWardens />} />
                    <Route path="students" element={<ManagementStudents />} />
                    <Route path="hostels" element={<ManagementHostels />} />
                    <Route path="complaints" element={<ManagementComplaints />} />
                    <Route path="reports" element={
                        <FeatureGate feature="reports" fallback={<FeatureDisabled feature="reports" />}>
                            <ManagementReports />
                        </FeatureGate>
                    } />
                    <Route path="settings" element={<ManagementSettings_Page />} />
                    <Route path="help" element={<ManagementHelp />} />
                    <Route path="profile" element={<ManagementProfile />} />
                </Route>

                {/* --------------------------------------- Owners Page ------------------------------------- */}
                <Route path="/admin-login" element={<Navigate to="/login" replace />} />
                                <Route path="/OwnersDashboard" element={
                                    <ProtectedRoute roles={["admin"]}><OwnersLayout /></ProtectedRoute>
                                }>
                    <Route index element={<OwnersDashboard />} />
                    <Route path="wardens" element={<Wardens />} />
                    <Route path="students" element={<Students />} />
                    <Route path="analytics" element={
                        <FeatureGate feature="analytics" fallback={<FeatureDisabled feature="analytics" />}>
                            <Analytics />
                        </FeatureGate>
                    } />
                    <Route path="analytics" element={
                        <FeatureGate feature="analytics" fallback={<FeatureDisabled feature="analytics" />}>
                            <Analytics />
                        </FeatureGate>
                    } />
                    <Route path="reports" element={
                        <FeatureGate feature="reports" fallback={<FeatureDisabled feature="reports" />}>
                            <Reports />
                        </FeatureGate>
                    } />
                    <Route path="notifications" element={
                        <FeatureGate feature="notifications" fallback={<FeatureDisabled feature="notifications" />}>
                            <Notifications />
                        </FeatureGate>
                    } />
                    <Route path="settings" element={<Settings />} />
                    <Route path="support-tickets" element={<SupportTickets />} />
                    <Route path="profile" element={<OwnerProfile />} />
                </Route>

                {/* 404 Not Found - Catch all unmatched routes */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    )
}

export default Routes_path