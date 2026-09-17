import 'dotenv/config';
import { resolve } from 'path';

const required = (name, fallback = '') => process.env[name] || fallback;

export const env = {
  port: Number(required('PORT', '4000')),
  nodeEnv: required('NODE_ENV', 'development'),
  mongoUri: required('MONGODB_URI', ''),
  firebaseProjectId: required('FIREBASE_PROJECT_ID', ''),
  firebaseServiceAccountPath: required('FIREBASE_SERVICE_ACCOUNT_PATH', '/etc/secrets/serviceAccountKey.json').startsWith('/')
    ? required('FIREBASE_SERVICE_ACCOUNT_PATH', '/etc/secrets/serviceAccountKey.json')
    : resolve(process.cwd(), required('FIREBASE_SERVICE_ACCOUNT_PATH', '')),
  firebaseServiceAccountJson: required('FIREBASE_SERVICE_ACCOUNT_JSON', ''),
  allowedOrigins: required('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000,https://hoas-client-4n13.vercel.app,https://hoas.onrender.com')
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
  // Supabase Edge Function for emails - ONLY supabase sends emails now
  supabase: {
    url: required('SUPABASE_URL', ''),
    anonKey: required('SUPABASE_ANON_KEY', ''),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY', ''),
    emailFunctionUrl: required('EMAIL_FUNCTION_URL', ''),
  },
  // Legacy - kept for edge function env but not used directly in backend anymore
  resendApiKey: required('RESEND_API_KEY', ''),
  brevoApiKey: required('BREVO_API_KEY', ''),
  appUrl: required('HOAS_APP_URL', 'http://localhost:5173'),
  renderUrl: required('RENDER_URL', 'https://hoas.onrender.com'),
  cloudinary: {
    cloudName: required('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: required('CLOUDINARY_API_KEY', ''),
    apiSecret: required('CLOUDINARY_API_SECRET', ''),
    url: required('CLOUDINARY_URL', ''),
  },
};
