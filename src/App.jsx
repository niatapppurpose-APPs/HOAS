import { useAuth } from "./context/AuthContext";
import Login from "./components/Pages/Login";
import Dashboard from "./components/Pages/Dashboard";

const App = () => {
  const { user } = useAuth();

  // If not authenticated, show login, otherwise show dashboard ok na
  return user ? <Dashboard /> : <Login />;
};

export default App;
