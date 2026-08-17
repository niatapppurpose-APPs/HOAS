import crypto from 'crypto';
import { firebaseAuth } from '../config/firebase.js';
import { env } from '../config/env.js';

export async function createAuthUser({ email, password, name }) {
  try {
    const authUser = await firebaseAuth.createUser({ email, password, displayName: name });
    return { uid: authUser.uid, external: true };
  } catch (error) {
    if (env.firebaseDevMode) {
      const uid = 'dev_' + crypto.randomBytes(12).toString('hex');
      console.warn(`Firebase unavailable, using local dev uid ${uid}: ${error.message}`);
      return { uid, external: false };
    }
    throw error;
  }
}

export async function deleteAuthUser(uid) {
  try {
    await firebaseAuth.deleteUser(uid);
  } catch {
    if (env.firebaseDevMode) return;
    throw error;
  }
}

export async function generateResetLink(email) {
  try {
    return await firebaseAuth.generatePasswordResetLink(email);
  } catch {
    if (env.firebaseDevMode) return null;
    throw error;
  }
}