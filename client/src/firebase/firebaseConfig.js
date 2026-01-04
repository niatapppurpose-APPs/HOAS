import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Enable persistence so user stays logged in after page reload
setPersistence(auth, browserLocalPersistence);

// Auto-detect and connect to emulators
// We use top-level await to ensure connection decision is made BEFORE app loads
// This prevents the "logout on reload" race condition
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  const AUTH_URL = 'http://localhost:9099';
  
  try {
    // Check if Auth Emulator is running (with short timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);
    
    await fetch(AUTH_URL, { 
      method: 'GET', 
      mode: 'no-cors',
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    console.log('🔧 Emulator detected! Connecting...');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    
  } catch (e) {
    console.log('🌐 Emulator not found (or stopped). Using production services.');
  }
} else {
  console.log('🌐 Using production Firebase services');
}

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./debugUtils.js').then((module) => {
    module.logFirebaseMode();
  });
}
