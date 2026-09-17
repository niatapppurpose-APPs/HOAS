import '../src/config/env.js';
import { env } from '../src/config/env.js';

const url = env.supabase.emailFunctionUrl
  || `${env.supabase.url.replace(/\/$/, '')}/functions/v1/send-email`;
const key = env.supabase.serviceRoleKey || env.supabase.anonKey;

const payload = {
  to: 'preview@example.com',
  type: 'account_created',
  renderOnly: true,
  config: {
    appUrl: 'https://hoas-client-4n13.vercel.app',
    supportEmail: env.smtp.fromEmail || env.smtp.user,
    logoUrl: '',
    brandName: 'HOAS',
  },
  data: {
    userName: 'Faziya Shaik',
    email: 'preview@example.com',
    role: 'student',
    studentId: 'STU-539',
    collegeName: 'A.K. Vishwantha Reddy Degree College, Mulkanoor',
    loginUrl: 'https://hoas-client-4n13.vercel.app',
    resetLink: 'https://hoas-client-4n13.vercel.app/set-password?token=demo',
  },
};

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
  },
  body: JSON.stringify(payload),
});
const json = await res.json();
console.log('SUBJECT:', json.subject);
console.log('---HTML START---');
console.log(json.html);
console.log('---HTML END---');
