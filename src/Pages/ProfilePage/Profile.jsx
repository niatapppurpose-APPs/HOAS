import { useParams, useNavigate } from "react-router-dom";

const Profile = () => {
  const { role } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <h1>{role} Profile</h1>

      <input placeholder="Name" />
      <input placeholder="Email" />
      <input placeholder="Phone" />

      <button onClick={() => navigate(`/dashboard/${role}`)}>
        Submit Profile
      </button>
    </div>
  );
};

export default Profile;
