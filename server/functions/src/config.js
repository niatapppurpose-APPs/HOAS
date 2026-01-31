import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Initialize Firebase Admin
try {
  // Try to load service account key if available
  const serviceAccount = require('../serviceAccountKey.json');
  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('🔑 Initialized with serviceAccountKey.json');
} catch (error) {
  console.log('⚠️ serviceAccountKey.json not found or invalid, using default credentials');
  initializeApp();
}

// Set global options
setGlobalOptions({
  region: 'us-central1',
  cors: true // Enable CORS for all functions
});

export const db = getFirestore();
export const auth = getAuth();

// Configure CORS
export const corsHandler = cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Check if running in emulator
export const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

console.log('🚀 Functions initialized. Emulator mode:', isEmulator);
