import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!env.smtp.user || !env.smtp.password) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.password },
    });
  }
  return transporter;
}

export function sendMail({ to, subject, html, text = '' }) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[email-disabled] to=${to} subject=${subject}`);
    return Promise.resolve(null);
  }
  return transport.sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.fromEmail || env.smtp.user}>`,
    to,
    subject,
    html,
    text,
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
  return sendMail({
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
  return sendMail({
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