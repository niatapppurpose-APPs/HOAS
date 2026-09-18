// One-time migration: add the new profile columns to OLD user documents.
// MongoDB is schemaless (no ALTER TABLE needed) — old docs simply lack the
// keys. This script sets them to "" ONLY where missing, so it never
// overwrites existing values. Safe to re-run (idempotent).
//
// Usage:
//   node scripts/migrate-user-profile-fields.js --dry-run
//   node scripts/migrate-user-profile-fields.js --apply

import '../src/config/env.js';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';

const NEW_FIELDS = {
  roomNumber: '',
  course: '',
  branch: '',
  year: '',
  fatherName: '',
  department: '',
  employeeId: '',
  designation: '',
};

async function main() {
  const apply = process.argv.includes('--apply');

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });

  const total = await User.countDocuments({});
  console.log(`Total users in DB: ${total}\n`);

  for (const [field, defaultVal] of Object.entries(NEW_FIELDS)) {
    const filter = { [field]: { $exists: false } };
    if (apply) {
      const res = await User.updateMany(filter, { $set: { [field]: defaultVal } });
      console.log(`  ${field}: initialized on ${res.modifiedCount} docs (matched ${res.matchedCount})`);
    } else {
      const count = await User.countDocuments(filter);
      console.log(`  ${field}: ${count} docs missing (would initialize)`);
    }
  }

  await mongoose.disconnect();
  console.log(apply ? '\nMigration applied.' : '\nDRY-RUN: nothing was written. Re-run with --apply.');
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
