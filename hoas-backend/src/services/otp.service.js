import crypto from 'crypto';
import { sendMail } from './email.service.js';
import { recordAudit } from './audit.service.js';

/**
 * Step-up authentication for the secure Owner pages (Audit Logs, Server Logs).
 * A 6-digit OTP is emailed to the signed-in owner's address. Codes live only
 * in memory: 10-minute TTL, 5 attempts max, 60s resend cooldown.
 */

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

// key `${userId}:${purpose}` -> { hash, expiresAt, attempts, lastSentAt }
const store = new Map();

const PURPOSES = new Set(['audit-logs', 'server-logs']);

function keyFor(userId, purpose) {
  return `${String(userId)}:${purpose}`;
}

function hash(code, salt) {
  return crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

function purposeLabel(purpose) {
  return purpose === 'server-logs' ? 'Server Logs' : 'Audit Logs';
}

export function isValidOtpPurpose(purpose) {
  return PURPOSES.has(String(purpose));
}

export async function requestSecureOtp(user, purpose) {
  if (!isValidOtpPurpose(purpose)) {
    const err = new Error('Invalid OTP purpose');
    err.statusCode = 400;
    err.code = 'INVALID_OTP_PURPOSE';
    throw err;
  }
  if (!user?.email) {
    const err = new Error('No email on account');
    err.statusCode = 400;
    err.code = 'NO_EMAIL';
    throw err;
  }
  const key = keyFor(user._id, purpose);
  const now = Date.now();
  const existing = store.get(key);
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    const err = new Error(`Please wait ${wait}s before requesting a new code`);
    err.statusCode = 429;
    err.code = 'OTP_COOLDOWN';
    throw err;
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(16).toString('hex');
  store.set(key, {
    hash: hash(code, salt),
    salt,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now,
  });

  // Fire-and-forget: OTP request must return fast even if email is slow.
  sendMail({
    to: user.email,
    type: 'security_alert',
    data: {
      userName: user.name || 'Owner',
      alertType: `Secure page verification — ${purposeLabel(purpose)}`,
      message: `Your one-time verification code is: ${code}. It expires in 10 minutes. Never share this code.`,
      timestamp: new Date().toLocaleString('en-IN'),
    },
    subject: `HOAS security code: ${code}`,
  }).catch((err) => console.error('[otp-email-failed]', err.message));

  await recordAudit({
    actor: user,
    action: 'SECURE_OTP_REQUESTED',
    targetType: 'User',
    targetId: user._id,
    metadata: { purpose },
  }).catch(() => {});

  return { expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function verifySecureOtp(user, purpose, code) {
  if (!isValidOtpPurpose(purpose)) {
    const err = new Error('Invalid OTP purpose');
    err.statusCode = 400;
    err.code = 'INVALID_OTP_PURPOSE';
    throw err;
  }
  const key = keyFor(user._id, purpose);
  const entry = store.get(key);
  const fail = (statusCode, errorCode, message) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.code = errorCode;
    throw err;
  };
  if (!entry) fail(400, 'OTP_NOT_REQUESTED', 'No code requested. Request a new code first.');
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    fail(400, 'OTP_EXPIRED', 'Code expired. Request a new code.');
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(key);
    fail(429, 'OTP_LOCKED', 'Too many attempts. Request a new code.');
  }
  const candidate = String(code || '').replace(/\D/g, '');
  if (candidate.length !== 6 || hash(candidate, entry.salt) !== entry.hash) {
    entry.attempts += 1;
    fail(401, 'OTP_INVALID', `Incorrect code. ${MAX_ATTEMPTS - entry.attempts} attempt(s) left.`);
  }
  store.delete(key);
  await recordAudit({
    actor: user,
    action: 'SECURE_PAGE_UNLOCKED',
    targetType: 'User',
    targetId: user._id,
    metadata: { purpose },
  }).catch(() => {});
  return { ok: true };
}
