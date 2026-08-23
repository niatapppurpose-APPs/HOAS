/**
 * One-time migration script: moves legacy images (data URIs and Firebase
 * Storage download URLs) to Cloudinary and rewrites the DB records.
 *
 * Collections/fields covered:
 *   - College.logoUrl, User.avatarUrl, User.logoUrl,
 *     Complaint.imageUrl, Fee.proofImageUrl, User.paymentProofUrl
 *
 * Usage (run from hoas-backend so dotenv/cloudinary resolve):
 *   node scripts/migrate-to-cloudinary.js            # dry run (no writes)
 *   node scripts/migrate-to-cloudinary.js --write    # actually migrate
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

const WRITE = process.argv.includes('--write');
const DRY_RUN = !WRITE;

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hoas';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const stats = { scanned: 0, migrated: 0, skipped: 0, failed: 0 };

function classify(url) {
  if (!url) return 'none';
  if (url.startsWith('data:')) return 'dataUri';
  if (url.includes('firebasestorage.googleapis.com') || url.includes('firebasestorage')) return 'firebase';
  return 'external';
}

async function uploadToCloudinary(source, folder, publicIdHint) {
  // Data URIs can be uploaded directly; Firebase URLs must be fetched first
  let dataUri = source;
  if (!source.startsWith('data:')) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`fetch failed ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const mime = response.headers.get('content-type') || 'application/octet-stream';
    dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
  }
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: publicIdHint || undefined,
    resource_type: 'image',
  });
  return result.secure_url;
}

async function migrateField(Model, field, folder) {
  const query = { [field]: { $exists: true, $nin: [null, ''] } };
  const docs = await Model.find(query).select(`_id ${field}`).lean();
  for (const doc of docs) {
    stats.scanned++;
    const kind = classify(doc[field]);
    if (kind === 'external' || kind === 'none' || doc[field].includes('res.cloudinary.com')) {
      stats.skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`[dry-run] ${Model.modelName}.${field} doc=${doc._id} (${kind})`);
      stats.migrated++;
      continue;
    }
    try {
      const url = await uploadToCloudinary(doc[field], folder, `${Model.modelName.toLowerCase()}-${doc._id}`);
      await Model.updateOne({ _id: doc._id }, { $set: { [field]: url } });
      console.log(`[migrated] ${Model.modelName}.${field} doc=${doc._id} -> ${url}`);
      stats.migrated++;
    } catch (error) {
      stats.failed++;
      console.error(`[failed] ${Model.modelName}.${field} doc=${doc._id}:`, error.message);
    }
  }
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN (use --write to apply) ===' : '=== LIVE MIGRATION ===');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const { default: College } = await import('../src/models/College.js');
  const { default: User } = await import('../src/models/User.js');
  const { default: Complaint } = await import('../src/models/Complaint.js');
  const { default: Fee } = await import('../src/models/Fee.js');

  await migrateField(College, 'logoUrl', 'hoas/logos');
  await migrateField(User, 'avatarUrl', 'hoas/avatars');
  await migrateField(User, 'logoUrl', 'hoas/logos');
  await migrateField(User, 'paymentProofUrl', 'hoas/fee-proofs');
  await migrateField(Complaint, 'imageUrl', 'hoas/complaints');
  await migrateField(Fee, 'proofImageUrl', 'hoas/fee-proofs');

  console.log('--- Summary ---');
  console.log(`scanned:  ${stats.scanned}`);
  console.log(`migrated: ${stats.migrated}`);
  console.log(`skipped:  ${stats.skipped}`);
  console.log(`failed:   ${stats.failed}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
