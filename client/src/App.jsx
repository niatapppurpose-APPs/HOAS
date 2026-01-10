import { useAuth } from "./context/AuthContext";
import Routes_path from "./components/Routes/index";
import GlobalDeleteModal from "./components/OwnerServices/GlobalDeleteModal";
import { useServerStatus } from "./hooks/useServerStatus";
import ServerOffline from "./components/ServerOffline/ServerOffline";

const App = () => {
  const { user } = useAuth();
  const { isServerOnline, lastChecked } = useServerStatus();

  // Show server offline screen if server is down
  if (!isServerOnline) {
    return <ServerOffline lastChecked={lastChecked} />;
  }

  return (
    <>
      <Routes_path />
      <GlobalDeleteModal />
    </>
  );
};

export default App;
