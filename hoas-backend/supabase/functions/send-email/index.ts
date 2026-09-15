import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

import { renderAccountCreated } from './_templates/accountCreated.ts'
import { renderEmailVerification } from './_templates/emailVerification.ts'
import { renderPasswordReset } from './_templates/passwordReset.ts'
import { renderAccountApproved } from './_templates/accountApproved.ts'
import { renderAccountRejected } from './_templates/accountRejected.ts'
import { renderRoleUpdated } from './_templates/roleUpdated.ts'
import { renderAccessGranted } from './_templates/accessGranted.ts'
import { renderComplaintCreated } from './_templates/complaintCreated.ts'
import { renderComplaintUpdated } from './_templates/complaintUpdated.ts'
import { renderLeaveSubmitted } from './_templates/leaveSubmitted.ts'
import { renderLeaveApproved } from './_templates/leaveApproved.ts'
import { renderLeaveRejected } from './_templates/leaveRejected.ts'
import { renderAnnouncement } from './_templates/announcement.ts'
import { renderEmergencyAlert } from './_templates/emergencyAlert.ts'
import { renderSupportTicketCreated } from './_templates/supportTicketCreated.ts'
import { renderSupportTicketUpdated } from './_templates/supportTicketUpdated.ts'
import { renderSecurityAlert } from './_templates/securityAlert.ts'
import { renderAccountDeactivated } from './_templates/accountDeactivated.ts'
import { renderAccountReactivated } from './_templates/accountReactivated.ts'
import { renderAdministrativeReport } from './_templates/administrativeReport.ts'

interface EmailConfig {
  appUrl: string
  supportEmail: string
  logoUrl: string
  brandName: string
}

type EmailType =
  | 'account_created'
  | 'email_verification'
  | 'password_reset'
  | 'account_approved'
  | 'account_rejected'
  | 'role_updated'
  | 'access_granted'
  | 'complaint_created'
  | 'complaint_updated'
  | 'leave_submitted'
  | 'leave_approved'
  | 'leave_rejected'
  | 'new_announcement'
  | 'emergency_alert'
  | 'support_ticket_created'
  | 'support_ticket_updated'
  | 'security_alert'
  | 'account_deactivated'
  | 'account_reactivated'
  | 'administrative_report'

interface EmailPayload {
  to: string
  subject?: string
  type: EmailType
  config: EmailConfig
  data: Record<string, unknown>
}

const templateMap: Record<EmailType, (config: EmailConfig, data: Record<string, unknown>) => string> = {
  'account_created': renderAccountCreated as any,
  'email_verification': renderEmailVerification as any,
  'password_reset': renderPasswordReset as any,
  'account_approved': renderAccountApproved as any,
  'account_rejected': renderAccountRejected as any,
  'role_updated': renderRoleUpdated as any,
  'access_granted': renderAccessGranted as any,
  'complaint_created': renderComplaintCreated as any,
  'complaint_updated': renderComplaintUpdated as any,
  'leave_submitted': renderLeaveSubmitted as any,
  'leave_approved': renderLeaveApproved as any,
  'leave_rejected': renderLeaveRejected as any,
  'new_announcement': renderAnnouncement as any,
  'emergency_alert': renderEmergencyAlert as any,
  'support_ticket_created': renderSupportTicketCreated as any,
  'support_ticket_updated': renderSupportTicketUpdated as any,
  'security_alert': renderSecurityAlert as any,
  'account_deactivated': renderAccountDeactivated as any,
  'account_reactivated': renderAccountReactivated as any,
  'administrative_report': renderAdministrativeReport as any,
}

async function sendViaResend(to: string, subject: string, html: string): Promise<{ success: boolean; via: string; data?: unknown; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) return { success: false, via: 'resend', error: 'RESEND_API_KEY not set' }

  const fromName = Deno.env.get('SMTP_FROM_NAME') || 'HOAS'
  const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'onboarding@resend.dev'
  const sender = `"${fromName}" <${fromEmail}>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: sender, to: [to], subject, html }),
  })

  if (!res.ok) {
    const txt = await res.text()
    return { success: false, via: 'resend', error: txt.slice(0, 500) }
  }
  const data = await res.json()
  return { success: true, via: 'resend', data }
}

async function sendViaBrevo(to: string, subject: string, html: string): Promise<{ success: boolean; via: string; data?: unknown; error?: string }> {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY')
  if (!brevoApiKey) return { success: false, via: 'brevo', error: 'BREVO_API_KEY not set' }

  const fromName = Deno.env.get('SMTP_FROM_NAME') || 'HOAS'
  const senderEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'no-reply@hoas.app'

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify({
      sender: { name: fromName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    return { success: false, via: 'brevo', error: txt.slice(0, 500) }
  }
  const data = await res.json()
  return { success: true, via: 'brevo', data }
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<\/p>|<\/div>|<\/tr>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<{ success: boolean; via: string; data?: unknown; error?: string }> {
  const host = Deno.env.get('SMTP_HOST')
  const user = Deno.env.get('SMTP_USER')
  const pass = Deno.env.get('SMTP_PASSWORD')
  const port = parseInt(Deno.env.get('SMTP_PORT') || '587', 10)
  if (!host || !user || !pass) {
    return { success: false, via: 'smtp', error: 'SMTP credentials not configured in environment' }
  }

  try {
    const nodemailer = await import('npm:nodemailer@6.9.10')
    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    })

    const fromName = Deno.env.get('SMTP_FROM_NAME') || 'HOAS'
    const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || user
    const sender = `"${fromName}" <${fromEmail}>`
    const plainText = htmlToPlainText(html)
    const domain = fromEmail.includes('@') ? fromEmail.split('@')[1] : 'gmail.com'
    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 10)}@${domain}>`

    const info = await transporter.sendMail({
      from: sender,
      to,
      replyTo: sender,
      subject,
      text: plainText,
      html,
      messageId,
      headers: {
        'X-Mailer': 'HOAS Mail Service',
        'X-Priority': '3',
        'List-Unsubscribe': `<mailto:${fromEmail}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Auto-Submitted': 'auto-generated',
      }
    })

    return { success: true, via: 'smtp', data: info }
  } catch (err: any) {
    return { success: false, via: 'smtp', error: err?.message || String(err) }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400' } })
  }

  try {
    const body = await req.json() as EmailPayload & { renderOnly?: boolean }
    const { to, type, config, data, subject: overrideSubject, renderOnly } = body

    if (type === 'ping' as any) {
      return new Response(JSON.stringify({ success: true, message: 'pong', timestamp: new Date().toISOString() }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!to || !type || !config) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, type, config' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const renderer = templateMap[type]
    if (!renderer) {
      return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const html = renderer(config, data || {})

    const subjectMap: Record<EmailType, string> = {
      'account_created': 'Welcome to HOAS — Your account is ready',
      'email_verification': 'Verify your HOAS email address',
      'password_reset': 'Reset your HOAS password',
      'account_approved': 'Your HOAS account has been approved',
      'account_rejected': 'Update regarding your HOAS account request',
      'role_updated': 'Your HOAS role has been updated',
      'access_granted': `You now have access to ${String(data?.collegeName || 'your institution')} on HOAS`,
      'complaint_created': `Complaint received — HOAS #${String(data?.complaintId || '')}`,
      'complaint_updated': 'Your HOAS complaint has been updated',
      'leave_submitted': 'Leave request submitted — HOAS',
      'leave_approved': 'Leave request approved',
      'leave_rejected': 'Update regarding your leave request',
      'new_announcement': `New announcement from ${String(data?.collegeName || 'HOAS')}`,
      'emergency_alert': `URGENT — Emergency alert from ${String(data?.collegeName || 'HOAS')}`,
      'support_ticket_created': `Support ticket received — HOAS #${String(data?.ticketId || '')}`,
      'support_ticket_updated': 'Your HOAS support ticket has been updated',
      'security_alert': 'Security alert for your HOAS account',
      'account_deactivated': 'Your HOAS account has been deactivated',
      'account_reactivated': 'Your HOAS account has been reactivated',
      'administrative_report': `HOAS ${String(data?.reportPeriod || '')} report is ready`,
    }

    const subject = overrideSubject || subjectMap[type] || 'HOAS Notification'

    if (renderOnly) {
      return new Response(JSON.stringify({ success: true, via: 'render_only', subject, type, html }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Attempt 1: Resend
    let result = await sendViaResend(to, subject, html)
    // Attempt 2: Brevo
    if (!result.success) {
      const brevoResult = await sendViaBrevo(to, subject, html)
      if (brevoResult.success) result = brevoResult
      else {
        // Attempt 3: SMTP (Gmail or custom SMTP)
        const smtpResult = await sendViaSmtp(to, subject, html)
        if (smtpResult.success) result = smtpResult
        else result = { success: false, via: 'all_failed', error: `${result.error} | ${brevoResult.error} | ${smtpResult.error}` } as any
      }
    }

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: result.error, attempted: result.via, html, subject, type }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true, via: result.via, subject, type }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('Email send error:', error)
    return new Response(JSON.stringify({ error: error?.message || String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
