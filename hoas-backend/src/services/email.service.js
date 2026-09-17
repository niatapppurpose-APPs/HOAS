import { env } from '../config/env.js';

// HOAS Email Service - ONLY via Supabase Edge Function
// All 20 templates are rendered inside the edge function using the HOAS design system

function getEmailConfig() {
  const fromEmail = env.smtp?.fromEmail || env.smtp?.user || 'niatapppurpose@gmail.com';
  // Use public https web app URL for emails so Gmail spam filters do not flag http://localhost
  const appUrl = (env.appUrl && !env.appUrl.includes('localhost')) 
    ? env.appUrl 
    : 'https://hoas-client-4n13.vercel.app';

  return {
    appUrl,
    supportEmail: fromEmail,
    logoUrl: process.env.HOAS_LOGO_URL || '',
    brandName: 'HOAS',
  }
}

function getSupabaseEmailUrl() {
  // Prefer explicit function URL, else construct from SUPABASE_URL
  if (env.supabase.emailFunctionUrl) return env.supabase.emailFunctionUrl
  if (env.supabase.url) return `${env.supabase.url.replace(/\/$/, '')}/functions/v1/send-email`
  return null
}

import nodemailer from 'nodemailer';

let directTransporter = null;
function getDirectTransporter() {
  if (directTransporter) return directTransporter;
  if (env.smtp?.host && env.smtp?.user && env.smtp?.password) {
    directTransporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: Number(env.smtp.port) || 587,
      secure: Number(env.smtp.port) === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return directTransporter;
}

async function sendDirectNodemailer({ to, subject, html, text }) {
  const transporter = getDirectTransporter();
  if (!transporter) {
    throw new Error('Direct SMTP not configured');
  }
  const fromName = env.smtp?.fromName || 'HOAS';
  const fromEmail = env.smtp?.fromEmail || env.smtp?.user || 'niatapppurpose@gmail.com';
  const domain = fromEmail.includes('@') ? fromEmail.split('@')[1] : 'gmail.com';
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 10)}@${domain}>`;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    replyTo: `"${fromName}" <${fromEmail}>`,
    subject: subject || 'HOAS Notification',
    html,
    text: text || '',
    messageId,
    headers: {
      'X-Mailer': 'HOAS Mail Service',
      'X-Priority': '3',
      'List-Unsubscribe': `<mailto:${fromEmail}?subject=Unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Auto-Submitted': 'auto-generated',
    },
  });
  return { success: true, via: 'direct-smtp', messageId: info.messageId };
}

async function callSupabaseEmail({ to, type, data, subject }) {
  const url = getSupabaseEmailUrl()
  if (!url) {
    console.warn('[email-supabase] SUPABASE_URL or SUPABASE_EMAIL_FUNCTION_URL not configured')
    return null
  }

  const headers = { 'Content-Type': 'application/json' }
  // Supabase edge functions require Authorization if not public
  const key = env.supabase.serviceRoleKey || env.supabase.anonKey
  if (key) headers['Authorization'] = `Bearer ${key}`

  const config = getEmailConfig()

  const payload = { to, type, config, data: data || {}, subject }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const body = await res.text()
    let json
    try { json = JSON.parse(body) } catch { json = { raw: body } }

    if (!res.ok) {
      // If edge function returned an error, check if it returned rendered html so we can fallback
      if (json?.html) {
        console.warn(`[email-supabase] failed with status ${res.status}, falling back to direct nodemailer...`);
        return await sendDirectNodemailer({ to, subject: json.subject || subject, html: json.html });
      }
      throw new Error(`Supabase edge ${res.status}: ${JSON.stringify(json).slice(0, 500)}`)
    }

    return json
  } catch (err) {
    console.error(`[email-supabase-failed] to=${to} type=${type}`, err.message || err)
    // Fallback to direct SMTP if edge function fetch fails
    try {
      // Request renderOnly from edge function if possible, or send simple fallback
      const renderRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...payload, renderOnly: true }),
      }).catch(() => null);

      if (renderRes && renderRes.ok) {
        const renderJson = await renderRes.json();
        if (renderJson?.html) {
          return await sendDirectNodemailer({ to, subject: renderJson.subject || subject, html: renderJson.html });
        }
      }
    } catch (fallbackErr) {
      console.error('[email-fallback-failed]', fallbackErr.message);
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function sendMail({ to, subject, html, text = '', type, data, config }) {
  // New path: type-based templated email via Supabase (preferred)
  if (type) {
    return callSupabaseEmail({ to, type, data, subject })
  }

  // Legacy path: raw html - wrap as generic notification using account template style
  // We convert legacy html to a generic email by sending as raw via supabase if html provided
  // If html is provided without type, we still try supabase with a fallback type
  if (html) {
    try {
      return await sendDirectNodemailer({ to, subject, html, text });
    } catch (err) {
      console.warn('[email-direct-nodemailer-failed] trying edge fallback...', err.message);
    }
    const url = getSupabaseEmailUrl()
    if (!url) {
      return null
    }
    // For legacy callers, we create a minimal templated email by using a generic approach
    // The edge function expects type, so we use a workaround: send html directly via resend-like payload
    // We'll call edge with type=account_created but override html - better to add raw support in edge
    // For now, log and attempt supabase raw path
    const headers = { 'Content-Type': 'application/json' }
    const key = env.supabase.serviceRoleKey || env.supabase.anonKey
    if (key) headers['Authorization'] = `Bearer ${key}`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to,
          type: 'account_created',
          config: config || getEmailConfig(),
          data: { userName: 'User', role: 'user', collegeName: 'HOAS', loginUrl: env.appUrl, _rawHtml: html, _rawSubject: subject },
          subject,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      return await res.json()
    } catch (err) {
      console.error(`[email-legacy-failed] to=${to}`, err.message)
      throw err
    }
  }

  return null
}

export function sendMailAsync({ to, subject, html, text = '', type, data }) {
  sendMail({ to, subject, html, text, type, data }).catch((error) => {
    console.error(`[email-failed] to=${to} subject=${subject} type=${type || 'raw'}`, error.message || error)
  })
}

// Helpers kept for backward compat but now they call templated types

export function layout(bodyHtml) {
  // Kept for legacy callers - returns html fragment
  return bodyHtml
}

export function credentialBox(name, value) {
  return `<div>${name}: ${value}</div>`
}

// Templated senders - all use Supabase edge with proper type

export function sendWelcomeEmail({ to, name, role, extra = [], resetLink = '' }) {
  // Security: never forward passwords to email templates (reset link only).
  const findVal = (keys) => extra.find(e => keys.some(k => e.name?.toLowerCase().includes(k)))?.value;
  return sendMailAsync({
    to,
    type: 'account_created',
    data: {
      userName: name,
      email: to,
      role,
      collegeName: findVal(['college', 'institution', 'org']) || 'your institution',
      loginUrl: env.appUrl,
      appUrl: env.appUrl,
      studentId: findVal(['student id', 'studentid', 'roll', 'id number']),
      resetLink,
    },
  })
}

export function sendBulkUploadSummaryEmail({ to, collegeName, created, failed, skipped }) {
  return sendMailAsync({
    to,
    type: 'administrative_report',
    data: {
      adminName: 'Admin',
      collegeName,
      reportPeriod: 'Bulk Upload',
      studentCount: created,
      complaintCount: failed,
      resolvedComplaints: created,
      leaveRequests: skipped,
      reportUrl: env.appUrl,
    },
  })
}

export function sendAccessRequestReceivedEmail({ to, contactPerson, orgName }) {
  return sendMailAsync({
    to,
    type: 'account_created',
    data: {
      userName: contactPerson,
      role: 'management',
      collegeName: orgName,
      loginUrl: env.appUrl,
    },
  })
}

export function sendAccessRequestDecisionEmail({ to, contactPerson, orgName, approved, reason = '' }) {
  if (approved) {
    return sendMailAsync({
      to,
      type: 'account_approved',
      data: {
        userName: contactPerson,
        collegeName: orgName,
        role: 'management',
        approvedBy: 'HOAS Team',
        loginUrl: env.appUrl,
      },
    })
  }
  return sendMailAsync({
    to,
    type: 'account_rejected',
    data: {
      userName: contactPerson,
      collegeName: orgName,
      reason,
      supportUrl: env.appUrl,
    },
  })
}

// Generic templated sender for any of the 20 types
export function sendTemplatedEmail({ to, type, data, subject }) {
  return sendMailAsync({ to, type, data, subject })
}
