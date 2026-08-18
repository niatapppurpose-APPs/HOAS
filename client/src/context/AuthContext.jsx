import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, getRedirectResult, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useToast } from "../components/Toast";
import { getMe, registerRequest, updateProfile } from "../firebase/cloudFunctions";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const getRole = (role) => {
  if (!role) return false;
  return role === 'admin' || role === 'owner';
};

const unknownProfile = (firebaseUser) => ({
  uid: firebaseUser?.uid || '',
  email: firebaseUser?.email || '',
  name: firebaseUser?.displayName || firebaseUser?.email || 'Unknown User',
  displayName: firebaseUser?.displayName || firebaseUser?.email || 'Unknown User',
  role: 'unknown',
  status: 'pending',
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [claims, setClaims] = useState(null);
  const [adminChecked, setAdminChecked] = useState(false);
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // User data from backend
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);

  const fetchProfile = async (firebaseUser = user) => {
    try {
      const profile = await getMe();
      // If profile is empty (user not in MongoDB yet), set minimal defaults
      if (!profile) {
        setUserData(unknownProfile(firebaseUser));
        setIsAdmin(false);
        setAdminChecked(true);
        return;
      }
      setUserData(profile);
      setIsAdmin(getRole(profile.role));
      setAdminChecked(true);
      return profile;
    } catch (error) {
      // If getMe fails (e.g., token expired, backend down), don't crash
      // Keep current state and try again later
      console.error("Error fetching profile, will retry:", error.message);
      setUserData(unknownProfile(firebaseUser));
      setIsAdmin(false);
      setAdminChecked(true);
      return null;
    }
  };

  useEffect(() => {
    let unsubscribe;

    // Handle redirect result in background — don't block auth state listener
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          toastRef.current.success('Welcome back! Signing you in...', 3000);
        }
      })
      .catch((error) => {
        toastRef.current.error('Sign-in failed. Please try again.', 4000);
      });

    // Set up auth state listener immediately (no waiting for getRedirectResult)
    unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          // Mark auth as loaded immediately — don't block on network calls
          setLoading(false);

          // Fetch profile & role from backend in the background (non-blocking)
          (async () => {
            setUserDataLoading(true);
            try {
              const tokenResult = await currentUser.getIdTokenResult(false);
              const userClaims = tokenResult.claims;
              setClaims(userClaims);
              setAdminChecked(true);
               await fetchProfile(currentUser);
               const onlineProfile = await updateProfile({ isOnline: true });
               if (onlineProfile) setUserData(onlineProfile);
            } catch (error) {
              console.error("Error loading profile:", error);
              setIsAdmin(false);
              setClaims(null);
              setAdminChecked(true);
            } finally {
              setUserDataLoading(false);
            }
          })();
        } else {
          setIsAdmin(false);
          setClaims(null);
          setAdminChecked(true);
          setUserData(null);
          setUserDataLoading(false);
          setLoading(false);
        }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const handleRealtimeUserUpdate = (event) => {
      const updatedUser = event.detail?.user;
      if (!updatedUser || !user?.uid || updatedUser.uid !== user.uid) return;
      setUserData(updatedUser);
      setIsAdmin(getRole(updatedUser.role));
    };

    window.addEventListener('hoas:user-updated', handleRealtimeUserUpdate);
    return () => window.removeEventListener('hoas:user-updated', handleRealtimeUserUpdate);
  }, [user?.uid]);

  // Function to refresh role & profile from backend
  const refreshAdminStatus = async () => {
    if (user) {
      try {
        const profile = await fetchProfile();
        return getRole(profile?.role);
      } catch (error) {
        console.error("Error refreshing admin status:", error);
        return false;
      }
    }
    return false;
  };

  // Function to create or update user profile in backend
  const createUserProfile = async (role, additionalData = {}) => {
    if (!user) return false;

    try {
      const profile = await registerRequest({
        name: user.displayName || additionalData.name,
        email: user.email,
        role,
      });
      setUserData(profile);
      setIsAdmin(getRole(profile.role));
      return true;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return false;
    }
  };

  // Function to logout
  const logout = async () => {
    try {
      // Mark user offline before logging out (best-effort)
      if (user) {
        updateProfile({ isOnline: false }).catch(() => {});
      }

      // Clear state first to ensure UI updates immediately
      setUserData(null);
      setIsAdmin(false);
      setClaims(null);
      setAdminChecked(false);
      setLoading(true);
      await signOut(auth);
      // Note: onAuthStateChanged will set user to null and setLoading(false)
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    claims,
    adminChecked,
    userData,
    userDataLoading,
    refreshAdminStatus,
    createUserProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
