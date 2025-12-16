import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase/firebaseConfig";

const LoginButton = () => {
  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful:", result.user);
    } catch (e) {
      console.log("Login Error Please Try Again:", e);
    }
  };

  return <button onClick={login}>Continue with Google.</button>;
};

export default LoginButton;
