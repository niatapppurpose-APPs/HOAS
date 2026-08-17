import 'dotenv/config';
import { resolve } from 'path';

const required = (name, fallback = '') => process.env[name] || fallback;

export const env = {
  port: Number(required('PORT', '4000')),
  nodeEnv: required('NODE_ENV', 'development'),
  mongoUri: required('MONGODB_URI', ''),
  firebaseProjectId: required('FIREBASE_PROJECT_ID', ''),
  firebaseServiceAccountPath: resolve(process.cwd(), required('FIREBASE_SERVICE_ACCOUNT_PATH', '')),
  firebaseDevMode: required('FIREBASE_DEV_MODE', 'false') === 'true',
  devTokenSecret: required('DEV_TOKEN_SECRET', ''),
  allowedOrigins: required('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim()),
  smtp: {
    host: required('SMTP_HOST', 'smtp.gmail.com'),
    port: Number(required('SMTP_PORT', '587')),
    user: required('SMTP_USER', ''),
    password: required('SMTP_PASSWORD', ''),
    fromName: required('SMTP_FROM_NAME', 'HOAS System'),
    fromEmail: required('SMTP_FROM_EMAIL', ''),
  },
  appUrl: required('HOAS_APP_URL', 'http://localhost:5173'),
};