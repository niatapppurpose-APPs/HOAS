import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result from Google Sign-In
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Redirect result user:", result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect error:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        console.log("Logged in user:", user);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
