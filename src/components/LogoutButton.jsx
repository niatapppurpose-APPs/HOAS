import { signOut } from "firebase/auth";
import { auth } from "./firebase/firebaseConfig";

const LogoutButton = () => {
  return <button onClick={() => signOut(auth)}>Logout</button>;
};

export default LogoutButton;
