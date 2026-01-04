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

// Connect to emulators if enabled
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  const AUTH_EMULATOR_URL = 'http://localhost:9099';
  const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
  const FIRESTORE_EMULATOR_PORT = 8080;
  const FUNCTIONS_EMULATOR_HOST = 'localhost';
  const FUNCTIONS_EMULATOR_PORT = 5001;

  console.log('🔧 Connecting to Firebase Emulators...');
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  connectFirestoreEmulator(db, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
  connectFunctionsEmulator(functions, FUNCTIONS_EMULATOR_HOST, FUNCTIONS_EMULATOR_PORT);
} else {
  console.log('🌐 Using production Firebase services');
}

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./debugUtils.js').then((module) => {
    module.logFirebaseMode();
  });
}
