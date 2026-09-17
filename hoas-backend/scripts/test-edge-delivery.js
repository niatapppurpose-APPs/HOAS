import '../src/config/env.js';
import { env } from '../src/config/env.js';

const url = env.supabase.emailFunctionUrl
  || `${env.supabase.url.replace(/\/$/, '')}/functions/v1/send-email`;
const key = env.supabase.serviceRoleKey || env.supabase.anonKey;

const to = process.argv[2] || 'hemanthramasaia@gmail.com';

const payload = {
  to,
  type: 'account_created',
  config: {
    appUrl: 'https://hoas-client-4n13.vercel.app',
    supportEmail: env.smtp.fromEmail || env.smtp.user,
    logoUrl: '',
    brandName: 'HOAS',
  },
  data: {
    userName: 'Delivery Test',
    email: to,
    role: 'student',
    studentId: 'STU-TEST-001',
    collegeName: 'HOAS Delivery Check',
    loginUrl: 'https://hoas-client-4n13.vercel.app',
  },
};

const started = Date.now();
try {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log('HTTP_STATUS:', res.status);
  console.log('DURATION_MS:', Date.now() - started);
  console.log('RESPONSE:', text.slice(0, 2000));
} catch (err) {
  console.error('FETCH_FAILED:', err.message);
  process.exit(1);
}
