import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

import { renderEmailTemplate, EMAIL_TYPES, EmailType, EmailConfig } from './_templates/registry.ts'
import { MOCK_DATA } from './_templates/mockData.ts'

interface EmailPayload {
  to: string
  subject?: string
  type: EmailType
  config: EmailConfig
  data: Record<string, unknown>
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
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<{ success: boolean; via: string; data?: unknown; error?: string }> {
  const host = Deno.env.get('SMTP_HOST')
  const user = Deno.env.get('SMTP_USER')
  const pass = Deno.env.get('SMTP_PASSWORD')
  const port = parseInt(Deno.env.get('SMTP_PORT') || '587', 10)
  if (!host || !user || !pass) {
    return { success: false, via: 'smtp', error: 'SMTP credentials not configured in Supabase secrets' }
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

const DEFAULT_CONFIG: EmailConfig = {
  appUrl: Deno.env.get('HOAS_APP_URL') || 'http://localhost:5173',
  supportEmail: Deno.env.get('SMTP_FROM_EMAIL') || Deno.env.get('SMTP_USER') || 'support@hoas.app',
  logoUrl: Deno.env.get('HOAS_LOGO_URL') || '',
  brandName: 'HOAS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400' } })
  }

  // Dev-only HTML preview: GET ?preview=<type> (also lists types with ?preview=list)
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url)
      const preview = url.searchParams.get('preview')
      if (preview === 'list') {
        return new Response(JSON.stringify({ types: EMAIL_TYPES }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (preview) {
        if (!(EMAIL_TYPES as string[]).includes(preview)) {
          return new Response(JSON.stringify({ error: `Unsupported email template type: ${preview}`, types: EMAIL_TYPES }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const mock = (MOCK_DATA as any)[preview] || {}
        const rendered = renderEmailTemplate(preview, mock.data || {}, { ...DEFAULT_CONFIG, ...(mock.config || {}) })
        return new Response(rendered.html, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } })
      }
    } catch {
      // fall through to POST handling
    }
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

    let rendered: { subject: string; html: string; textBody: string; preheader: string }
    try {
      rendered = renderEmailTemplate(type, data || {}, config)
    } catch (e: any) {
      const msg = e?.message || String(e)
      const status = msg.startsWith('Unsupported email template type') ? 400 : 422
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const html = rendered.html
    const subject = overrideSubject || rendered.subject
    const textBody = rendered.textBody

    if (renderOnly) {
      return new Response(JSON.stringify({ success: true, via: 'render_only', subject, type, html }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Send via SMTP only
    const result = await sendViaSmtp(to, subject, html)

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: result.error, attempted: 'smtp', html, subject, type }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true, via: 'smtp', subject, type }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('Email send error:', error)
    return new Response(JSON.stringify({ error: error?.message || String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})