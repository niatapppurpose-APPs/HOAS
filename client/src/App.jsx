import { useAuth } from "./context/AuthContext";
import Routes_path from "./components/Routes/index"

const App = () => {
  const { user } = useAuth();

  return (
    <Routes_path />
  );
};

export default App;
