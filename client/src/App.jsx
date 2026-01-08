import { useAuth } from "./context/AuthContext";
import Routes_path from "./components/Routes/index";
import GlobalDeleteModal from "./components/OwnerServices/GlobalDeleteModal";

const App = () => {
  const { user } = useAuth();

  return (
    <>
      <Routes_path />
      <GlobalDeleteModal />
    </>
  );
};

export default App;
