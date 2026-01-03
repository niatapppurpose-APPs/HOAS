import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

const Home = () => {
  const { user, isAdmin, loading, adminChecked } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is logged in and is an admin, redirect to admin dashboard
    if (!loading && adminChecked && user && isAdmin) {
      navigate("/OwnersDashboard", { replace: true });
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  // Show loading while checking auth
  if (loading || (user && !adminChecked)) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to HOAS</h1>
      <p>This is the Home Page</p>
      <nav>
        <Link to="/login">Go to Login</Link>
        {" | "}
        <Link to="/role">Get Start</Link>
      </nav>
    </div>
  );
};

export default Home