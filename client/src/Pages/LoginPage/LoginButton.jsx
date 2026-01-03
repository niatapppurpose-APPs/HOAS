import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase/firebaseConfig";

const LoginButton = () => {
  const login = async () => {
    try {
      // Use redirect instead of popup to avoid COOP warnings
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.log("Login Error Please Try Again:", e);
    }
  };

  return <button onClick={login}>Continue with Google.</button>;
};

export default LoginButton;

