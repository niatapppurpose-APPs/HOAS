import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, getRedirectResult, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useToast } from "../components/Toast";

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
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // User data from Firestore
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    
    // Handle redirect result from Google Sign-In first
    const handleAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect result user:", result.user.email);
          toastRef.current.success('Welcome back! Signing you in...', 3000);
        }
      } catch (error) {
        console.error("Redirect error:", error);
        toastRef.current.error('Sign-in failed. Please try again.', 4000);
      }

      // Then set up auth state listener
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        setAdminChecked(false);

        if (currentUser) {
          // Get the ID token result to check custom claims
          try {
            const tokenResult = await currentUser.getIdTokenResult(true); // Force refresh
            const userClaims = tokenResult.claims;
            setClaims(userClaims);
            // Check both possible admin claim formats
            const adminStatus = userClaims.admin === true || userClaims.role === 'admin';
            setIsAdmin(adminStatus);
            setAdminChecked(true);

            // Check if user document exists, if not create it
            try {
              const userDocRef = doc(db, "users", currentUser.uid);
              const userSnapshot = await getDoc(userDocRef);

              if (!userSnapshot.exists()) {
                if (adminStatus) {
                  // If the user is an admin and doesn't have a doc, create one
                  const adminProfileData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    role: 'admin',
                    status: 'approved',
                    isOnline: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  await setDoc(userDocRef, adminProfileData);
                  console.log("Admin user document created automatically.");
                } else {
                  // For non-admins, role self-selection is disabled — wait for owner/management provisioning
                  console.log("New user detected — awaiting admin/owner provisioning (role selection disabled).");
                }
              } else {
                // User exists - update isOnline to true
              await setDoc(userDocRef, { isOnline: true, updatedAt: new Date().toISOString() }, { merge: true });
            }
          } catch (firestoreError) {
            console.error("Error checking/creating user document:", firestoreError);
            // Don't block login if Firestore fails, just log it
          }
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
        setUserData(null);
        setUserDataLoading(false);
      }

      setLoading(false);
    });
    };
    
    handleAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);
  useEffect(() => {
    if (!user) {
      setUserData(null);
      setUserDataLoading(false);
      return;
    }

    setUserDataLoading(true);

    // Real-time listener for user document
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
      } else {
        setUserData(null);
      }
      setUserDataLoading(false);
    }, (error) => {
      setUserDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Function to refresh token and re-check admin status
  const refreshAdminStatus = async () => {
    if (user) {
      try {
        // Force refresh the token to get updated claims
        const tokenResult = await user.getIdTokenResult(true);
        const userClaims = tokenResult.claims;
        setClaims(userClaims);
        setIsAdmin(userClaims.role === 'admin');
        return userClaims.role === 'admin';
      } catch (error) {
        console.error("Error refreshing admin status:", error);
        return false;
      }
    }
    return false;
  };

  // Function to create or update user profile in Firestore
  const createUserProfile = async (role, additionalData = {}) => {
    if (!user) return false;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role,
        status: "pending", // pending, approved, denied
        createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...additionalData,
      };

      await setDoc(userDocRef, profileData, { merge: true });
      console.log("User profile created/updated:", profileData);
      return true;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return false;
    }
  };



  // Function to logout
  const logout = async () => {
    try {
      // Set isOnline to false before logging out
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { isOnline: false, updatedAt: new Date().toISOString() }, { merge: true });
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
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
