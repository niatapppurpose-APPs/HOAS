import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase/firebaseConfig";

const LoginButton = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.log("Login Error:", err);
    }
  };

  return (
    <button onClick={handleLogin}>
      Continue with Google
    </button>
  );
};

export default LoginButton;
