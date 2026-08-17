import { firebaseAuth } from '../src/config/firebase.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import User from '../src/models/User.js';

const VALID_ROLES = ['owner', 'admin', 'management', 'warden', 'student'];

async function listAllUsers() {
  const users = [];
  let nextPageToken = undefined;
  do {
    const page = await firebaseAuth.listUsers(1000, nextPageToken);
    users.push(...page.users);
    nextPageToken = page.pageToken;
  } while (nextPageToken);
  return users;
}

await connectDatabase();

const firebaseUsers = await listAllUsers();
console.log(`Found ${firebaseUsers.length} Firebase users`);

let created = 0;
let updated = 0;
let skipped = 0;

for (const fUser of firebaseUsers) {
  const claimRole = fUser.customClaims?.role;
  if (claimRole && !VALID_ROLES.includes(claimRole)) {
    console.log(`SKIP ${fUser.email || fUser.uid}: invalid claim role "${claimRole}"`);
    skipped++;
    continue;
  }

  const existing = await User.findOne({ uid: fUser.uid });

  if (existing) {
    if (!existing.email && fUser.email) existing.email = fUser.email;
    if (fUser.email) existing.email = existing.email || fUser.email;
    await existing.save();
    updated++;
    continue;
  }

  const role = claimRole || 'student';
  await User.create({
    uid: fUser.uid,
    email: fUser.email || `${fUser.uid}@migrated.hoas`,
    name: fUser.displayName || (fUser.email ? fUser.email.split('@')[0] : 'Migrated User'),
    role,
    status: claimRole ? 'approved' : 'pending',
    approvedAt: claimRole ? new Date() : undefined,
    isActive: true,
  });
  created++;
}

console.log(`Migration complete: ${created} created, ${updated} updated, ${skipped} skipped`);
await disconnectDatabase();
process.exit(0);