import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

const uid = process.argv[2] || 'seed-student-1';
if (!env.firebaseDevMode) {
  console.error('FIREBASE_DEV_MODE must be true to mint dev tokens');
  process.exit(1);
}
const token = 'dev.' + jwt.sign({ uid }, env.devTokenSecret, { expiresIn: '12h' });
console.log(token);