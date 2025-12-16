import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import LoginButton from "./LoginButton";

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="login">
      <h1>Welcome to HOAS</h1>
      <p>Please sign in to continue with your dahsboard</p>
      <LoginButton />
    </div>
  );
};

export default Login;
