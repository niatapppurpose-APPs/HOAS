import { firebaseAuth } from '../config/firebase.js';

export async function createAuthUser({ email, password, name }) {
  const authUser = await firebaseAuth.createUser({ email, password, displayName: name });
  return { uid: authUser.uid, external: true };
}

export async function deleteAuthUser(uid) {
  await firebaseAuth.deleteUser(uid);
}

export async function generateResetLink(email) {
  return await firebaseAuth.generatePasswordResetLink(email);
}
