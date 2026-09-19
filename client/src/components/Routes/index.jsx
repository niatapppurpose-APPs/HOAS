import { useAuth } from '../../context/AuthContext';
// ProtectedRoute component for role-based route protection
const ProtectedRoute = ({ roles = [], children }) => {
    const { user, loading, userData, userDataLoading, isAdmin, claims } = useAuth();
    const claimsRole = claims?.role;
    // Firebase auth is authoritative for identity. Once its role claim is available,
    // render the dashboard shell while the profile refresh continues in the background.
    if (loading) {
        return <PageLoader />;
    }
    // After initialization, if there's no authenticated user, send to login
    if (!user) return <Navigate to="/login" replace />;

    const claimMatchesRoute =
        userDataLoading &&
        typeof claimsRole === 'string' &&
        (roles.length === 0 || roles.includes(claimsRole) ||
            (roles.includes('admin') && claimsRole === 'owner'));
    if (claimMatchesRoute) return children;
    if (userDataLoading) return <PageLoader />;

    // Pending and denied accounts stay on waiting-approval.
    // Suspended (revoked) accounts get their own dedicated page.
    const accountStatus = String(userData?.status || '').toLowerCase();
    if ((accountStatus === 'pending' || accountStatus === 'denied') && window.location.pathname !== '/waiting-approval') {
        return <Navigate to="/waiting-approval" replace />;
    }
    if (accountStatus === 'suspended' && window.location.pathname !== '/suspended') {
        return <Navigate to="/suspended" replace />;
    }

    // Allow admin/owner access for any route that includes admin or owner in roles
    if ((roles.includes('admin') || roles.includes('owner')) && (isAdmin || userData?.role === 'admin' || userData?.role === 'owner')) {
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
import Applogo from "../../assets/Applogo.webp";

// Loading component for lazy loaded routes.
// Branded (logo + status text) so a chunk download never reads as a blank page.
const PageLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-6" style={{ background: 'var(--bg-primary)' }}>
        <img src={Applogo} alt="HOAS" className="h-14 w-auto mb-5" />
        <HashLoader color="var(--accent-primary, #6366F1)" size={44} />
        <p className="mt-5 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Loading your dashboard…
        </p>
    </div>
);

// Core pages - loaded immediately for better UX
import Home from '../../Pages/HOME/home';
import Login from '../../Pages/LoginPage/Login';
import ResetPassword from '../../Pages/ResetPassword/ResetPassword';
import Dashboard from '../../Pages/Dashboard/Dashboard';
import WaitingApproval from "../../Pages/WaitingApproval/WaitingApproval";
import Suspended from "../../Pages/Suspended/Suspended";
import NotFound from "../../Pages/NotFound";


// Lazy loaded pages - loaded on demand for better performance


// Lazy loaded dashboards
const StudentDashboard = lazy(() => import("../../DashBoards/Student-DashBoard/StudentDashboard"));
const StudentLayout = lazy(() => import("../../DashBoards/Student-DashBoard/components/layout/StudentLayout"));
const StudentComplaints = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentComplaints"));
const StudentLeaveRequests = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentLeaveRequests"));
const StudentAnnouncements = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentAnnouncements"));
const StudentEmergencyLocation = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentEmergencyLocation"));
const StudentFees = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentFees"));
const StudentSettings = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentSettings"));
const StudentVisitors = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentVisitors"));
const StudentMessMenu = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentMessMenu"));
const StudentHelpSupport = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentHelpSupport"));
const StudentProfile = lazy(() => import("../../DashBoards/Student-DashBoard/components/pages/StudentProfile"));
const WardenDashboard = lazy(() => import("../../DashBoards/Warden-Dashboard/WardenDashboard"));
const WardenLayout = lazy(() => import("../../DashBoards/Warden-Dashboard/components/layout/WardenLayout"));
const WardenStudents = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenStudents"));
const WardenComplaints = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenComplaints"));
const WardenLeaveRequests = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenLeaveRequests"));
const WardenAnnouncements = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenAnnouncements"));
const WardenEmergencyLocation = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenEmergencyLocation"));
const WardenFeeVerification = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenFeeVerification"));
const WardenSettings = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenSettings"));
const WardenVisitors = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenVisitors"));
const WardenHelpSupport = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenHelpSupport"));
const WardenProfile = lazy(() => import("../../DashBoards/Warden-Dashboard/components/pages/WardenProfile"));

// Management Dashboard - lazy loaded
const ManagementDashboard = lazy(() => import("../../DashBoards/Management-Dashboard/ManagementDashboard"));
const ManagementLayout = lazy(() => import("../../DashBoards/Management-Dashboard/ManagementLayout"));
const ManagementWardens = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/Wardens"));
const ManagementStudents = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/Students"));
const ManagementHostels = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/Hostels"));
const ManagementReports = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/Reports"));
const ManagementAnalytics = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/Analytics/AnalyticsDashboard"));
const ManagementComplaints = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/ManagementComplaints"));
const ManagementEmergencyLocation = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/ManagementEmergencyLocation"));
const ManagementHelp = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/HelpSupport"));
const ManagementSettings_Page = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/ManagementSettings"));
const ManagementMessMenu = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/MessMenu"));
const ManagementProfile = lazy(() => import("../../DashBoards/Management-Dashboard/Pages/ManagementProfile"));

// Management Dashboard - lazy loaded
const OwnersDashboard = lazy(() => import("../../Pages/OwnersDashboard/ownersdashbord"));
const OwnersLayout = lazy(() => import("../../Pages/OwnersDashboard/OwnersLayout"));
const Wardens = lazy(() => import("../../Pages/OwnersDashboard/Pages/Wardens"));
const Students = lazy(() => import("../../Pages/OwnersDashboard/Pages/Students"));
const Analytics = lazy(() => import("../../Pages/OwnersDashboard/Pages/Analytics"));
const Reports = lazy(() => import("../../Pages/OwnersDashboard/Pages/Reports"));
const Notifications = lazy(() => import("../../Pages/OwnersDashboard/Pages/Notifications"));
const Settings = lazy(() => import("../../Pages/OwnersDashboard/Pages/GlobalSystemSettings"));
const SupportTickets = lazy(() => import("../../Pages/OwnersDashboard/Pages/SupportTickets"));
const AccessRequests = lazy(() => import("../../Pages/OwnersDashboard/Pages/AccessRequests"));
const AuditLogs = lazy(() => import("../../Pages/OwnersDashboard/Pages/AuditLogs"));
const ServerLogs = lazy(() => import("../../Pages/OwnersDashboard/Pages/ServerLogs"));
const OwnerProfile = lazy(() => import("../OwnerServices/OwnerProfile"));

const Routes_path = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* ------------------------------ Home Page to User role page --------------------------- */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                {/* WaitingApproval handles its own auth loading/redirect so denied users do not loop. */}
<Route path="/waiting-approval" element={<WaitingApproval />} />
{/* Dedicated page for revoked (suspended) accounts, like waiting-approval. */}
<Route path="/suspended" element={<Suspended />} />

                {/* ------------------------------ Profile Pages ----------------------------------------- */}
                <Route path="/profile/student-profile" element={<ProtectedRoute roles={["student"]}><StudentProfile /></ProtectedRoute>} />
                <Route path="/profile/warden-profile" element={<ProtectedRoute roles={["warden"]}><WardenProfile /></ProtectedRoute>} />
                <Route path="/profile/management-profile" element={<ProtectedRoute roles={["management"]}><ManagementProfile /></ProtectedRoute>} />

                {/* ------------------------------ Dashboards ---------------------------------------------*/}
                {/* Student Dashboard with Layout */}
                                <Route path="/dashboard/student" element={
                                    <ProtectedRoute roles={["student"]}><StudentLayout /></ProtectedRoute>
                                }>
                    <Route index element={<StudentDashboard />} />
                    <Route path="complaints" element={<StudentComplaints />} />
                    <Route path="emergency-location" element={<StudentEmergencyLocation />} />
                    <Route path="leave" element={<StudentLeaveRequests />} />
                    <Route path="fees" element={<StudentFees />} />
                    <Route path="announcements" element={<StudentAnnouncements />} />
                    <Route path="visitors" element={
                        <FeatureGate feature="visitors" fallback={<FeatureDisabled feature="visitors" />}>
                            <StudentVisitors />
                        </FeatureGate>
                    } />
                    <Route path="mess-menu" element={
                        <FeatureGate feature="messMenu" fallback={<FeatureDisabled feature="messMenu" />}>
                            <StudentMessMenu />
                        </FeatureGate>
                    } />
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
                    <Route path="emergency-location" element={<WardenEmergencyLocation />} />
                    <Route path="complaints" element={<WardenComplaints />} />
                    <Route path="leave-requests" element={<WardenLeaveRequests />} />
                    <Route path="fees" element={<WardenFeeVerification />} />
                    <Route path="analytics" element={
                        <FeatureGate feature="analytics" fallback={<FeatureDisabled feature="analytics" />}>
                            <ManagementAnalytics role="warden" />
                        </FeatureGate>
                    } />
                    <Route path="announcements" element={<WardenAnnouncements />} />
                    <Route path="visitors" element={
                        <FeatureGate feature="visitors" fallback={<FeatureDisabled feature="visitors" />}>
                            <WardenVisitors />
                        </FeatureGate>
                    } />
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
                    <Route path="emergency-location" element={<ManagementEmergencyLocation />} />
                    <Route path="complaints" element={<ManagementComplaints />} />
                    <Route path="analytics" element={
                        <FeatureGate feature="analytics" fallback={<FeatureDisabled feature="analytics" />}>
                            <ManagementAnalytics role="management" />
                        </FeatureGate>
                    } />
                    <Route path="reports" element={
                        <FeatureGate feature="reports" fallback={<FeatureDisabled feature="reports" />}>
                            <ManagementReports />
                        </FeatureGate>
                    } />
                    <Route path="mess-menu" element={
                        <FeatureGate feature="messMenu" fallback={<FeatureDisabled feature="messMenu" />}>
                            <ManagementMessMenu />
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
                    <Route path="access-requests" element={<AccessRequests />} />
                    <Route path="audit-logs" element={<ProtectedRoute roles={["admin"]}><AuditLogs /></ProtectedRoute>} />
                    <Route path="server-logs" element={<ProtectedRoute roles={["admin"]}><ServerLogs /></ProtectedRoute>} />
                    <Route path="profile" element={<OwnerProfile />} />
                </Route>

                {/* 404 Not Found - Catch all unmatched routes */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    )
}

export default Routes_path
