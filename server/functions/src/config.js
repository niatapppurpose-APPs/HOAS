import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import cors from 'cors';

// Initialize Firebase Admin
initializeApp();

// Set global options
setGlobalOptions({ region: 'us-central1' });

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
