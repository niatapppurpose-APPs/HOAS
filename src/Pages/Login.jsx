import LoginButton from "../LoginButton";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" />;

  return (
    <div>
      <h1>Login Page</h1>
      <LoginButton />
    </div>
  );
};

export default Login;
