// Bulk backfill profile fields for EXISTING students from a CSV file.
//
// Usage:
//   node scripts/bulk-update-students.js ./students.csv --dry-run
//   node scripts/bulk-update-students.js ./students.csv --apply [--college-id=<id>]
//
// CSV format (header row required, columns case-insensitive):
//   email,studentId,phone,address,roomNumber,course,branch,year,fatherName,hostelBlock
// - Identify each row by `email` (preferred) or `studentId`.
// - Only non-empty cells are updated; everything else is left untouched.
// - Only users with role=student are ever modified (never email/uid/role/status/college).
// - Default mode is DRY-RUN (no writes). Pass --apply to actually save.
// - Optional --college-id=<id> restricts updates to one college as a safety scope.

import '../src/config/env.js';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';

const UPDATABLE = [
  'phone',
  'address',
  'roomNumber',
  'course',
  'branch',
  'year',
  'fatherName',
  'hostelBlock',
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    // Skip fully-empty lines
    if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      pushField();
    } else if (ch === '\n') {
      pushField();
      pushRow();
    } else if (ch === '\r') {
      // ignore, \n handles the break
    } else {
      field += ch;
    }
  }
  pushField();
  pushRow();
  return rows;
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const apply = args.includes('--apply');
  const collegeArg = args.find((a) => a.startsWith('--college-id='));
  const collegeId = collegeArg ? collegeArg.split('=')[1] : null;

  if (!file) {
    console.error('Usage: node scripts/bulk-update-students.js <file.csv> [--dry-run|--apply] [--college-id=<id>]');
    console.error('Default is --dry-run (no writes). Pass --apply to save changes.');
    process.exit(1);
  }
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(filePath, 'utf8'));
  if (rows.length < 2) {
    console.error('CSV has no data rows (need header + at least 1 row).');
    process.exit(1);
  }

  const header = rows[0].map((h) => String(h || '').trim().toLowerCase());
  const idx = {};
  for (const col of ['email', 'studentid', ...UPDATABLE.map((u) => u.toLowerCase())]) {
    const at = header.indexOf(col);
    if (at !== -1) idx[col] = at;
  }
  if (idx.email === undefined && idx.studentid === undefined) {
    console.error('CSV must contain an `email` and/or `studentId` column.');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });

  const results = { total: rows.length - 1, updated: 0, unchanged: 0, skipped: 0, errors: [] };

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const get = (col) => (idx[col] !== undefined ? String(cells[idx[col]] ?? '').trim() : '');
    const email = get('email').toLowerCase();
    const studentId = get('studentid');

    try {
      const query = { role: 'student' };
      if (email) query.email = email;
      else if (studentId) query.studentId = studentId;
      else {
        results.skipped++;
        results.errors.push({ row: r + 1, error: 'Missing email and studentId' });
        continue;
      }
      if (collegeId) query.collegeId = collegeId;

      const student = await User.findOne(query).select('_id name email studentId collegeId');
      if (!student) {
        results.skipped++;
        results.errors.push({ row: r + 1, error: `Student not found (${email || studentId})` });
        continue;
      }

      const set = {};
      for (const field of UPDATABLE) {
        const val = get(field.toLowerCase());
        if (val !== '') set[field] = val;
      }
      if (Object.keys(set).length === 0) {
        results.unchanged++;
        continue;
      }

      if (apply) {
        await User.updateOne({ _id: student._id }, { $set: set });
      }
      results.updated++;
      console.log(`${apply ? 'UPDATED' : 'WOULD-UPDATE'} row=${r + 1} ${student.email} fields=${Object.keys(set).join(',')}`);
    } catch (err) {
      results.skipped++;
      results.errors.push({ row: r + 1, error: err.message });
    }
  }

  console.log(`\nDone (${apply ? 'APPLIED' : 'DRY-RUN'}): total=${results.total} updated=${results.updated} unchanged=${results.unchanged} skipped=${results.skipped}`);
  if (results.errors.length) {
    console.log('Errors/skips:');
    for (const e of results.errors.slice(0, 20)) console.log(`  row ${e.row}: ${e.error}`);
    if (results.errors.length > 20) console.log(`  ...and ${results.errors.length - 20} more`);
  }

  await mongoose.disconnect();
  if (!apply) console.log('\nNothing was written. Re-run with --apply to save.');
}

main().catch((err) => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
