// HOAS shared email design system — table-based, email-client safe.
// Single source of truth for layout. Event templates must NOT duplicate this HTML.

export interface EmailConfig {
  appUrl: string
  supportEmail: string
  logoUrl: string
  brandName: string
}

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function stripTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>|<\/div>|<\/tr>|<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s+\n/g, '\n\n')
    .trim()
}

export function toPlainText(htmlBody: string, fallbackUrl?: string): string {
  const text = stripTags(htmlBody)
  return fallbackUrl ? `${text}\n\n${fallbackUrl}` : text
}

// ---------- Reusable components (table-based) ----------

export function EmailHeader(config: EmailConfig): string {
  const logo = config.logoUrl
    ? `<img src="${esc(config.logoUrl)}" alt="${esc(config.brandName)} logo" width="120" style="display:block;margin:0 auto 8px;max-width:140px;height:auto;border:0;outline:none;text-decoration:none;" />`
    : ''
  return `
  <tr>
    <td align="center" style="background-color:#ffffff;padding:24px 32px;border-bottom:1px solid #e5e7eb;">
      ${logo}
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">HOSTEL OPERATIONS ACCOUNTABILITY SYSTEM</div>
    </td>
  </tr>`
}

export function EmailFooter(config: EmailConfig): string {
  return `
  <tr>
    <td align="center" style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 32px;">
      <div style="font-size:14px;font-weight:600;color:#111827;">${esc(config.brandName)}</div>
      <div style="font-size:12px;color:#6b7280;margin:4px 0 12px;">Hostel Operations Accountability System</div>
      <div style="font-size:12px;color:#9ca3af;line-height:1.6;">This email was sent because of activity on your HOAS account.<br/>If you did not perform this action, contact your institution administrator or <a href="mailto:${esc(config.supportEmail)}" style="color:#4f46e5;">HOAS support</a>.</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:8px;">Do not reply to this automated email.</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:12px;"><a href="${esc(config.appUrl)}" style="color:#4f46e5;">${esc(config.appUrl)}</a></div>
    </td>
  </tr>`
}

export function EmailButton(url: string, label: string): string {
  if (!url) return ''
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center" bgcolor="#4f46e5" style="border-radius:6px;">
        <a href="${esc(url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${esc(label)}</a>
      </td>
    </tr>
  </table>`
}

export function EmailCard(title: string, rows: Array<{ label: string; value: string; mono?: boolean }>): string {
  const clean = rows.filter((r) => r.value !== undefined && r.value !== null && String(r.value).trim() !== '')
  const items = clean
    .map((r, i) => `
      <tr>
        <td style="padding:${i === 0 ? '0' : '12px'} 0 0;font-size:14px;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">${esc(r.label)}</div>
          <div style="font-size:14px;color:#111827;font-weight:600;word-break:break-word;${r.mono ? 'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0;' : ''}">${r.value}</div>
        </td>
      </tr>`).join('')
  if (!items) return ''
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:24px 0;">
    <tr><td style="padding:20px;">
      <div style="font-size:13px;font-weight:600;color:#111827;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${esc(title)}</div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">${items}</table>
    </td></tr>
  </table>`
}

export function EmailBadge(label: string, color = '#6b7280'): string {
  return `<span style="display:inline-block;padding:4px 10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border-radius:9999px;background-color:${color}15;color:${color};border:1px solid ${color}33;">${esc(label)}</span>`
}

export function EmailInfoRow(label: string, value: string): string {
  if (!value) return ''
  return `<tr><td style="font-size:14px;color:#6b7280;padding:4px 0;">${esc(label)}</td><td align="right" style="font-size:14px;color:#111827;font-weight:500;padding:4px 0;">${esc(value)}</td></tr>`
}

export function EmailAlert(kind: 'security' | 'emergency' | 'info', title: string, text: string): string {
  const palette = kind === 'emergency'
    ? { bg: '#fef2f2', border: '#fca5a5', title: '#991b1b', text: '#991b1b' }
    : kind === 'security'
      ? { bg: '#fef3c7', border: '#fcd34d', title: '#92400e', text: '#92400e' }
      : { bg: '#eff6ff', border: '#93c5fd', title: '#1e40af', text: '#1e40af' }
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${palette.bg};border:1px solid ${palette.border};border-radius:6px;margin:24px 0;">
    <tr><td style="padding:16px;">
      <div style="font-size:12px;font-weight:600;color:${palette.title};margin-bottom:4px;">${esc(title)}</div>
      <div style="font-size:13px;color:${palette.text};line-height:1.5;">${esc(text)}</div>
    </td></tr>
  </table>`
}

export function EmailDivider(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;"><tr><td style="height:1px;background-color:#e5e7eb;font-size:0;line-height:0;">&nbsp;</td></tr></table>`
}

function pg(text: string, size = 15, color = '#374151'): string {
  return `<div style="font-size:${size}px;color:${color};line-height:1.65;margin:0 0 16px;">${text}</div>`
}

// ---------- Shared layout ----------

export function EmailLayout(config: EmailConfig, title: string, bodyHtml: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background-color:#f8fafc;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f8fafc;">${esc(preheader)}</div>
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px 16px;background-color:#f8fafc;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">
${EmailHeader(config)}
<tr><td style="padding:32px;">
<h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px;line-height:1.4;">${esc(title)}</h1>
${bodyHtml}
</td></tr>
${EmailFooter(config)}
</table>
</div>
</body>
</html>`
}

// ---------- Backward-compatible wrappers (existing templates import these) ----------

export function createEmailLayout(config: EmailConfig, children: string, preheader = ''): string {
  return EmailLayout(config, config.brandName, children, preheader)
}
export function renderGreeting(name: string): string {
  return pg(`Hi ${esc(name || 'there')},`, 16)
}
export function renderParagraph(html: string, small = false): string {
  return pg(html, small ? 14 : 15, small ? '#4b5563' : '#374151')
}
export function renderButton(url: string, text: string): string {
  return EmailButton(url, text)
}
export function renderInfoCard(title: string, rows: Array<{ label: string; value: string }>): string {
  return EmailCard(title, rows)
}
export function renderStatusBadge(label: string, color: string): string {
  return EmailBadge(label, color)
}
export function renderKPIBlock(items: Array<{ label: string; value: string | number }>): string {
  const cells = items.map((it) => `<td align="center" style="padding:16px 12px;vertical-align:top;"><div style="font-size:24px;font-weight:700;color:#111827;">${esc(String(it.value))}</div><div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">${esc(it.label)}</div></td>`).join('')
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;"><tr>${cells}</tr></table>`
}
export function renderSecurityNotice(title: string, text: string): string {
  return EmailAlert('security', title, text)
}
export function renderDivider(): string {
  return EmailDivider()
}
