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

          // Check claims & sync profile in the background (non-blocking)
          (async () => {
            try {
              // Use cached token first (false = no force refresh) for instant claims check.
              // Then refresh in the background for freshness.
              const tokenResult = await currentUser.getIdTokenResult(false);
              const userClaims = tokenResult.claims;
              setClaims(userClaims);
              const adminStatus = userClaims.admin === true || userClaims.role === 'admin' || userClaims.role === 'owner';
              setIsAdmin(adminStatus);
              setAdminChecked(true);

              // Sync profile to Firestore in the background — don't block UI
              const userDocRef = doc(db, "users", currentUser.uid);
              getDoc(userDocRef).then(async (userSnapshot) => {
                if (!userSnapshot.exists()) {
                  if (adminStatus) {
                    await setDoc(userDocRef, {
                      uid: currentUser.uid,
                      email: currentUser.email,
                      displayName: currentUser.displayName,
                      photoURL: currentUser.photoURL,
                      role: 'admin',
                      status: 'approved',
                      isOnline: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                  }
                } else {
                  setDoc(userDocRef, {
                    isOnline: true,
                    updatedAt: new Date().toISOString(),
                    ...(currentUser.photoURL && { photoURL: currentUser.photoURL }),
                    ...(currentUser.displayName && { displayName: currentUser.displayName }),
                  }, { merge: true }).catch(e => console.error("Profile sync error:", e));
                }
              }).catch(e => console.error("Error checking user document:", e));

              // Refresh token in the background for fresh claims (doesn't block UI)
              currentUser.getIdTokenResult(true).then(freshToken => {
                const freshClaims = freshToken.claims;
                setClaims(freshClaims);
                const freshAdmin = freshClaims.admin === true || freshClaims.role === 'admin' || freshClaims.role === 'owner';
                setIsAdmin(freshAdmin);
              }).catch(e => console.error("Background token refresh error:", e));

            } catch (error) {
              console.error("Error getting token claims:", error);
              setIsAdmin(false);
              setClaims(null);
              setAdminChecked(true);
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
        // If role implies admin/owner and we haven't already marked admin,
        // update isAdmin accordingly. This covers cases where custom
        // claims aren't set but Firestore has the correct role.
        if (!isAdmin && (data.role === 'admin' || data.role === 'owner')) {
          setIsAdmin(true);
        }
        // Ensure adminChecked is true once we know the role from Firestore.
        if (!adminChecked) {
          setAdminChecked(true);
        }
      } else {
        // Document does not exist — user was provisioned via Auth but
        // their Firestore profile is missing. Keep userData null so UI
        // shows defaults instead of crashing, and log for debugging.
        console.warn(`[AuthContext] No Firestore document found for uid=${user.uid}. Profile may not have been provisioned yet.`);
        setUserData(null);
      }
      setUserDataLoading(false);
    }, (error) => {
      // Surface Firestore errors instead of silently swallowing them.
      // Common cause: security rules denying the read (e.g., user doc not yet provisioned).
      console.error(`[AuthContext] Firestore onSnapshot error for uid=${user.uid}:`, error.code, error.message);
      setUserData(null);
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
        setIsAdmin(userClaims.role === 'admin' || userClaims.role === 'owner');
        return userClaims.role === 'admin' || userClaims.role === 'owner';
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
      {children}
    </AuthContext.Provider>
  );
};
