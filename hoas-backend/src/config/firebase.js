import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import { env } from './env.js';

const require = createRequire(import.meta.url);

function createFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  if (env.firebaseServiceAccountJson) {
    try {
      console.log('Firebase Admin: using FIREBASE_SERVICE_ACCOUNT_JSON');
      return initializeApp({ credential: cert(JSON.parse(env.firebaseServiceAccountJson)) });
    } catch (error) {
      console.error('Firebase service account JSON is invalid:', error.message);
    }
  }
  if (existsSync(env.firebaseServiceAccountPath)) {
    console.log(`Firebase Admin: using service account file ${env.firebaseServiceAccountPath}`);
    return initializeApp({ credential: cert(require(env.firebaseServiceAccountPath)) });
  }
  console.warn(`Firebase service account file not found at ${env.firebaseServiceAccountPath}; using application default credentials.`);
  return initializeApp();
}

export const firebaseApp = createFirebaseApp();
export const firebaseAuth = getAuth(firebaseApp);
