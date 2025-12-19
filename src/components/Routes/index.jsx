import { Routes, Route } from "react-router-dom";
import Home from '../../Pages/HOME/home'
import Login from '../../Pages/LoginPage/Login'
import Dashboard from '../../Pages/Dashboard/Dashboard'
import UserRole from "../UserServices/userrole";
import StudentProfile from '../../DashBoards/Student-DashBoard/index'
import WardenProfile from '../../DashBoards/Warden-Dashboard/index'
import ManagementProfile from '../../DashBoards/Principal-Dashbord/index'
import StudentDashboard from "../../DashBoards/Student-DashBoard/StudentDashboard";
import WardenDashboard from "../../DashBoards/Warden-Dashboard/WardenDashboard";
import ManagementDashboard from "../../DashBoards/Principal-Dashbord/PrincipalDashboard";
import OwnersDashboard from "../../Pages/OwnersDashboard/ownersdashbord"
import OwnerProfile from "../OwnerServices/OwnerProfile"
import AdminLogin from '../OwnerServices/AdminLogin'
import WaitingApproval from "../../Pages/WaitingApproval/WaitingApproval"

const Routes_path = () => {
    return (
        <>
            <Routes>
                {/* ------------------------------ Home Page to User role page --------------------------- */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/role" element={<UserRole />} />
                <Route path="/waiting-approval" element={<WaitingApproval />} />
                {/* ------------------------------ Profile Pages ----------------------------------------- */}
                <Route path="/profile/student-profile" element={<StudentProfile />} />
                <Route path="/profile/warden-profile" element={<WardenProfile />} />
                <Route path="/profile/management-profile" element={<ManagementProfile />} />
                {/* ------------------------------ Dashboards ---------------------------------------------*/}
                <Route path="/dashboard/student" element={<StudentDashboard />} />
                <Route path="/dashboard/warden" element={<WardenDashboard />} />
                <Route path="/dashboard/management" element={<ManagementDashboard />} />
                {/* --------------------------------------- Owners Page ------------------------------------- */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/OwnersDashboard" element={<OwnersDashboard />} />
                <Route path="/owner-profile" element={<OwnerProfile />} />

            </Routes>
        </>
    )
}

export default Routes_path