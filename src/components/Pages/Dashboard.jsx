import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import LogoutButton from "../LogoutButton"


const getLargerPhotoUrl = (url) => {
  if (!url) return null;

  return url.replace(/s\d+-c/, 's5000-c'); 
};


const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;
  

  const highQualityPhotoURL = getLargerPhotoUrl(user.photoURL);

  return (
    <div>
      <img
      
        src={highQualityPhotoURL || user.photoURL} 
        alt={user.displayName}
        width="120" 
        referrerPolicy="no-referrer"
      />
      <h1>Welcome {user.displayName}</h1>
      <p>Email: {user.email}</p>
      <LogoutButton />
    </div>
  );
};

export default Dashboard;