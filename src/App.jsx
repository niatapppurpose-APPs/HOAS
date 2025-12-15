import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Home from "./Pages/HOME/home";
import StudentProfile from "./DashBoards/Student-DashBoard";
import WardenProfile from "./DashBoards/Warden-Dashboard";
import ManagementProfile from "./DashBoards/Principal-Dashbord";
import UserRole from "./components/UserServices/userrole";

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Login />} />
        <Route path="/role" element={<UserRole />} />
        <Route path="/student-profile" element={<StudentProfile />} />
        <Route path="/warden-profile" element={<WardenProfile />} />
        <Route path="/management-profile" element={<ManagementProfile />} />
    </Routes>
  );
};

export default App;
