import nodemailer from 'nodemailer';
import dns from 'dns';
import { env } from '../config/env.js';

// Render instances have no IPv6 egress. Node >=17 prefers AAAA records when
// resolving smtp.gmail.com, so connects hang until ETIMEDOUT on every SMTP
// port. Force IPv4 resolution process-wide.
dns.setDefaultResultOrder('ipv4first');

const transporterCache = new Map();

function buildTransporter(port) {
  return nodemailer.createTransport({
    host: env.smtp.host,
    port,
    secure: port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.password },
    // IPv4 only — see dns note above (Render has no IPv6 route to Gmail).
    family: 4,
    // Keep these tight: on Render, a hanging SMTP socket used to block
    // responses for 20-30s+ per attempt. Fail fast and fall back instead.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });
}

function getTransporter(preferredPort) {
  if (!env.smtp.user || !env.smtp.password) return null;
  const port = preferredPort || env.smtp.port || 587;
  if (!transporterCache.has(port)) {
    transporterCache.set(port, buildTransporter(port));
  }
  return transporterCache.get(port);
}

function isConnectionError(error) {
  const code = error?.code || '';
  return (
    code === 'ECONNECTION' ||
    code === 'ETIMEDOUT' ||
    code === 'ESOCKET' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    /timeout/i.test(error?.message || '')
  );
}

// ── HTTP email APIs (port 443 — never blocked by hosting providers) ────────
async function fetchWithTimeout(url, options, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sendViaResend({ from, to, subject, html, text }) {
  const response = await fetchWithTimeout('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || undefined,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API ${response.status}: ${body.slice(0, 200)}`);
  }
  return { via: 'resend' };
}

async function sendViaBrevo({ from, to, subject, html, text }) {
  // Brevo needs a bare address in "from" (name goes separately).
  const emailMatch = String(from).match(/<([^>]+)>/);
  const senderEmail = emailMatch ? emailMatch[1] : from;
  const response = await fetchWithTimeout('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.brevoApiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: env.smtp.fromName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || undefined,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Brevo API ${response.status}: ${body.slice(0, 200)}`);
  }
  return { via: 'brevo' };
}

async function deliverViaHttpApi(payload) {
  if (env.resendApiKey) return sendViaResend(payload);
  if (env.brevoApiKey) return sendViaBrevo(payload);
  return null;
}

const hasHttpApi = () => Boolean(env.resendApiKey || env.brevoApiKey);

async function deliver({ to, subject, html, text }) {
  const payload = {
    from: `"${env.smtp.fromName}" <${env.smtp.fromEmail || env.smtp.user}>`,
    to,
    subject,
    html,
    text,
  };

  // Preferred path: HTTP API (works everywhere, no SMTP port issues).
  if (hasHttpApi()) {
    try {
      const result = await deliverViaHttpApi(payload);
      if (result) return result;
    } catch (httpError) {
      console.warn(`[email-http] failed (${httpError.message}); falling back to SMTP`);
      if (!env.smtp.user || !env.smtp.password) throw httpError;
    }
  }

  const primaryPort = env.smtp.port || 587;
  const fallbackPort = primaryPort === 465 ? 587 : 465;
  const attempts = [primaryPort, fallbackPort, primaryPort];

  let lastError;
  for (let i = 0; i < attempts.length; i += 1) {
    try {
      return await getTransporter(attempts[i]).sendMail(payload);
    } catch (error) {
      lastError = error;
      if (!isConnectionError(error)) throw error;
      console.warn(
        `[email-retry] to=${to} attempt=${i + 1} port=${attempts[i]} failed (${error.code || error.message})`
      );
    }
  }
  throw lastError;
}

export async function sendMail({ to, subject, html, text = '' }) {
  const smtpConfigured = Boolean(env.smtp.user && env.smtp.password);
  if (!smtpConfigured && !hasHttpApi()) {
    console.log(`[email-disabled] to=${to} subject=${subject}`);
    return null;
  }
  return deliver({ to, subject, html, text });
}

/**
 * Send an email without blocking the request that triggered it. Errors are
 * logged so delivery problems remain diagnosable without delaying responses.
 */
export function sendMailAsync({ to, subject, html, text = '' }) {
  sendMail({ to, subject, html, text }).catch((error) => {
    console.error(`[email-failed] to=${to} subject=${subject}`, error.message || error);
  });
}

export function layout(bodyHtml) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1f2937">
    <div style="background:#6366f1;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
      <strong>HOAS</strong> — Hostel Operations Accountability System
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="color:#6b7280;font-size:12px">This is an automated message from HOAS. Please do not reply to this email.</p>
    </div>
  </div>`;
}

export function credentialBox(name, value) {
  return `<div style="background:#f3f4f6;border-radius:6px;padding:12px;margin:8px 0">
    <div style="font-size:12px;color:#6b7280">${name}</div>
    <div style="font-weight:bold;font-size:16px">${value}</div>
  </div>`;
}

export function sendWelcomeEmail({ to, name, role, extra = [], resetLink = '' }) {
  const resetBlock = resetLink
    ? `<p style="margin-top:12px"><a href="${resetLink}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Set your password</a></p>`
    : '';
  return sendMailAsync({
    to,
    subject: `Welcome to HOAS — your ${role} account is ready`,
    html: layout(`
      <h2>Welcome, ${name}</h2>
      <p>Your ${role} account has been created for the HOAS platform.</p>
      ${extra.map((item) => credentialBox(item.name, item.value)).join('')}
      ${resetBlock}
      <p style="color:#6b7280;font-size:13px">App: <a href="${env.appUrl}">${env.appUrl}</a></p>
    `),
  });
}

export function sendBulkUploadSummaryEmail({ to, collegeName, created, failed, skipped }) {
  // Non-blocking: this is called on a request path and previously awaited the
  // full SMTP round-trip, which caused client/Render timeouts on slow SMTP.
  return sendMailAsync({
    to,
    subject: `Bulk upload complete — ${created} students created`,
    html: layout(`
      <h2>Bulk upload summary</h2>
      <p>Upload for <strong>${collegeName}</strong> finished.</p>
      ${credentialBox('Created', created)}
      ${credentialBox('Failed', failed)}
      ${credentialBox('Skipped', skipped)}
    `),
  });
}

export function sendAccessRequestReceivedEmail({ to, contactPerson, orgName }) {
  return sendMailAsync({
    to,
    subject: 'We received your HOAS access request',
    html: layout(`
      <h2>Thank you, ${contactPerson}!</h2>
      <p>We have received the access request for <strong>${orgName}</strong>.</p>
      <p>Our team is reviewing your organization details. Once verified, you will
      receive a follow-up email with your account credentials.</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:12px;margin:8px 0">
        <div style="font-size:12px;color:#6b7280">What happens next?</div>
        <ol style="margin:8px 0 0 18px;padding:0;color:#374151;font-size:14px">
          <li>The HOAS owner team verifies your organization details.</li>
          <li>Your management account is created.</li>
          <li>You receive your login credentials by email.</li>
        </ol>
      </div>
      <p style="color:#6b7280;font-size:13px">App: <a href="${env.appUrl}">${env.appUrl}</a></p>
    `),
  });
}

export function sendAccessRequestDecisionEmail({ to, contactPerson, orgName, approved, reason = '' }) {
  return sendMailAsync({
    to,
    subject: approved
      ? `Your HOAS access for ${orgName} has been verified`
      : `Update on your HOAS access request`,
    html: layout(`
      <h2>Hello, ${contactPerson}</h2>
      ${
        approved
          ? `<p>Good news! Your organization <strong>${orgName}</strong> has been verified by the HOAS team.
             You will receive your account credentials in a separate email shortly.</p>`
          : `<p>Unfortunately, we could not verify the access request for <strong>${orgName}</strong> at this time.</p>
             ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
             <p>If you believe this is a mistake, feel free to submit a new request with updated details.</p>`
      }
      <p style="color:#6b7280;font-size:13px">App: <a href="${env.appUrl}">${env.appUrl}</a></p>
    `),
  });
}