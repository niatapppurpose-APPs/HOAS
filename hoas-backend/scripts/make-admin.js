import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { firebaseAuth } from '../src/config/firebase.js';
import User from '../src/models/User.js';

const DEFAULT_ADMIN_IDENTIFIERS = ['ramasaiahemanth@gmail.com', 'faziyashaik81@gmail.com'];
const identifiers = process.argv.slice(2);

if (identifiers.length === 0) identifiers.push(...DEFAULT_ADMIN_IDENTIFIERS);

await connectDatabase();

for (const identifier of identifiers) {
  let user = await User.findOne({
    $or: [
      { uid: identifier },
      { email: { $regex: new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
    ],
  });

  if (!user) {
    const firebaseUser = await findFirebaseUser(identifier);
    if (!firebaseUser) {
      console.log(`User not found for "${identifier}" in MongoDB or Firebase Auth.`);
      continue;
    }

    user = await User.create({
      uid: firebaseUser.uid,
      email: firebaseUser.email || `${firebaseUser.uid}@firebase.hoas`,
      name:
        firebaseUser.displayName ||
        (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Admin User'),
      role: 'admin',
      status: 'approved',
      approvedAt: new Date(),
      isActive: true,
    });
    console.log(`Mongo user created from Firebase Auth: ${user.email}`);
  }

  user.role = 'admin';
  user.status = 'approved';
  user.approvedAt = new Date();
  user.isActive = true;
  await user.save();

  try {
    await firebaseAuth.setCustomUserClaims(user.uid, { role: 'admin' });
    console.log(`Firebase claims set: role=admin for ${user.email}`);
  } catch (err) {
    console.log(`Warning: could not set Firebase claims for ${user.email} (${err.message})`);
  }

  console.log(`Admin granted: ${user.name} <${user.email}> (uid ${user.uid.slice(0, 12)}...)`);
}

await disconnectDatabase();
process.exit(0);

async function findFirebaseUser(value) {
  try {
    if (value.includes('@')) return await firebaseAuth.getUserByEmail(value);
    return await firebaseAuth.getUser(value);
  } catch (err) {
    if (err.code === 'auth/user-not-found') return null;
    throw err;
  }
}
