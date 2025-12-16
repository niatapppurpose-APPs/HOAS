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
  const [isAdmin, setIsAdmin] = useState(false);
  const [claims, setClaims] = useState(null);
  const [adminChecked, setAdminChecked] = useState(false);

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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email);
      setUser(currentUser);
      setAdminChecked(false);
      
      if (currentUser) {
        // Get the ID token result to check custom claims
        try {
          const tokenResult = await currentUser.getIdTokenResult(true); // Force refresh
          const userClaims = tokenResult.claims;
          setClaims(userClaims);
          const adminStatus = userClaims.admin === true;
          setIsAdmin(adminStatus);
          setAdminChecked(true);
          console.log("Logged in user successfully:", currentUser.email);
          console.log("User claims:", userClaims);
          console.log("Is Admin:", adminStatus);
        } catch (error) {
          console.error("Error getting token claims:", error);
          setIsAdmin(false);
          setClaims(null);
          setAdminChecked(true);
        }
      } else {
        setIsAdmin(false);
        setClaims(null);
        setAdminChecked(true);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Function to refresh token and re-check admin status
  const refreshAdminStatus = async () => {
    if (user) {
      try {
        // Force refresh the token to get updated claims
        const tokenResult = await user.getIdTokenResult(true);
        const userClaims = tokenResult.claims;
        setClaims(userClaims);
        setIsAdmin(userClaims.admin === true);
        return userClaims.admin === true;
      } catch (error) {
        console.error("Error refreshing admin status:", error);
        return false;
      }
    }
    return false;
  };

  const value = {
    user,
    loading,
    isAdmin,
    claims,
    adminChecked,
    refreshAdminStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
