// HOAS Email Layout System
// Reusable components for professional transactional emails

export interface EmailConfig {
  appUrl: string
  supportEmail: string
  logoUrl: string
  brandName: string
}

// CSS Styles as inline styles for email compatibility
export const styles = {
  // Container
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px 16px',
    backgroundColor: '#f8fafc',
    minWidth: '320px',
  },
  
  // Main card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },

  // Header
  header: {
    backgroundColor: '#ffffff',
    padding: '24px 32px',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'center' as const,
  },
  
  logo: {
    maxWidth: '140px',
    height: 'auto',
    display: 'block',
    margin: '0 auto 8px',
  },
  
  brandText: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#6b7280',
    margin: 0,
  },

  // Content area
  content: {
    padding: '32px',
  },

  // Greeting
  greeting: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#111827',
    margin: '0 0 16px',
    lineHeight: 1.5,
  },

  // Body text
  body: {
    fontSize: '15px',
    color: '#374151',
    lineHeight: 1.65,
    margin: '0 0 16px',
  },

  bodySmall: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1.6,
    margin: '0 0 12px',
  },

  // Primary button
  button: {
    display: 'inline-block' as const,
    padding: '12px 24px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: '6px',
    textAlign: 'center' as const,
    margin: '24px 0',
    border: 'none',
    cursor: 'pointer',
  },

  buttonHover: {
    backgroundColor: '#4338ca',
  },

  // Secondary button
  buttonSecondary: {
    display: 'inline-block' as const,
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    color: '#4f46e5',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: '6px',
    textAlign: 'center' as const,
    margin: '24px 0',
    border: '1px solid #4f46e5',
    cursor: 'pointer',
  },

  // Info card
  infoCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '20px',
    margin: '24px 0',
  },

  infoCardTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '14px',
  },

  infoRowLast: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    padding: '8px 0 0',
    fontSize: '14px',
  },

  infoLabel: {
    color: '#6b7280',
    fontWeight: 400,
  },

  infoValue: {
    color: '#111827',
    fontWeight: 500,
    textAlign: 'right' as const,
    maxWidth: '60%',
    wordBreak: 'break-word' as const,
  },

  // Status badge
  statusBadge: (color: string) => ({
    display: 'inline-block' as const,
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderRadius: '9999px',
    backgroundColor: `${color}15`,
    color: color,
    border: `1px solid ${color}33`,
  }),

  // KPI Block
  kpiBlock: {
    display: 'table',
    width: '100%',
    borderCollapse: 'collapse' as const,
    margin: '24px 0',
  },

  kpiRow: {
    display: 'table-row',
  },

  kpiCell: {
    display: 'table-cell',
    padding: '16px 12px',
    textAlign: 'center' as const,
    borderRight: '1px solid #e5e7eb',
    verticalAlign: 'top' as const,
  },

  kpiCellLast: {
    display: 'table-cell',
    padding: '16px 12px',
    textAlign: 'center' as const,
    verticalAlign: 'top' as const,
  },

  kpiValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.2,
    margin: '0 0 4px',
  },

  kpiLabel: {
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#6b7280',
  },

  // Security notice
  securityNotice: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '6px',
    padding: '16px',
    margin: '24px 0',
  },

  securityNoticeTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#92400e',
    margin: '0 0 4px',
  },

  securityNoticeText: {
    fontSize: '13px',
    color: '#92400e',
    margin: 0,
    lineHeight: 1.5,
  },

  // Divider
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '24px 0',
  },

  // Footer
  footer: {
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    padding: '24px 32px',
    textAlign: 'center' as const,
  },

  footerBrand: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 4px',
  },

  footerTagline: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 16px',
  },

  footerText: {
    fontSize: '12px',
    color: '#9ca3af',
    lineHeight: 1.6,
    margin: '0 0 8px',
  },

  footerLink: {
    color: '#4f46e5',
    textDecoration: 'underline',
  },

  // Unsubscribe/preferences
  footerMuted: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '16px',
  },

  // Section spacing
  section: {
    marginBottom: '24px',
  },

  // Link
  link: {
    color: '#4f46e5',
    textDecoration: 'underline',
  },
}

// Main layout wrapper
export function createEmailLayout(
  config: EmailConfig,
  children: string,
  preheader?: string
): string {
  const preheaderText = preheader || ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>HOAS</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- Preheader text for inbox preview without spam triggering styling -->
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheaderText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <div style="${Object.entries(styles.container).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="${styles.card}">
      <tr>
        <td style="${styles.header}">
          ${config.logoUrl ? `<img src="${config.logoUrl}" alt="${config.brandName}" style="${styles.logo}" />` : ''}
          <p style="${styles.brandText}">HOSTEL OPERATIONS ACCOUNTABILITY SYSTEM</p>
        </td>
      </tr>
      <tr>
        <td style="${styles.content}">
          ${children}
        </td>
      </tr>
      <tr>
        <td style="${styles.footer}">
          <p style="${styles.footerBrand}">${config.brandName}</p>
          <p style="${styles.footerTagline}">Official Campus Notification Service</p>
          <p style="${styles.footerText}">This verified notification was sent regarding your HOAS account.</p>
          <p style="${styles.footerText}">Questions or assistance needed? Reach out to <a href="mailto:${config.supportEmail}" style="${styles.footerLink}">${config.supportEmail}</a>.</p>
          <p style="${styles.footerText}">You may reply directly to this email to contact hostel administration.</p>
          <p style="${styles.footerMuted}">${config.brandName} &middot; <a href="${config.appUrl}" style="${styles.footerLink}">${config.appUrl}</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`
}

// Component renderers
export function renderGreeting(name: string): string {
  return `<p style="${Object.entries(styles.greeting).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}">Hi ${name},</p>`
}

export function renderParagraph(text: string, small = false): string {
  const style = small ? styles.bodySmall : styles.body
  return `<p style="${Object.entries(style).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}">${text}</p>`
}

export function renderButton(url: string, text: string, secondary = false): string {
  const style = secondary ? styles.buttonSecondary : styles.button
  return `<a href="${url}" style="${Object.entries(style).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}" target="_blank" rel="noopener noreferrer">${text}</a>`
}

export function renderInfoCard(title: string, rows: Array<{ label: string; value: string }>): string {
  const cardStyle = Object.entries(styles.infoCard).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const titleStyle = Object.entries(styles.infoCardTitle).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const rowStyle = Object.entries(styles.infoRow).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const lastRowStyle = Object.entries(styles.infoRowLast).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const labelStyle = Object.entries(styles.infoLabel).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const valueStyle = Object.entries(styles.infoValue).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')

  const rowsHtml = rows.map((row, i) => `
    <div style="${i === rows.length - 1 ? lastRowStyle : rowStyle}">
      <span style="${labelStyle}">${row.label}</span>
      <span style="${valueStyle}">${row.value}</span>
    </div>
  `).join('')

  return `
    <div style="${cardStyle}">
      <p style="${titleStyle}">${title}</p>
      ${rowsHtml}
    </div>
  `
}

export function renderStatusBadge(label: string, color: string): string {
  const badgeStyle = Object.entries(styles.statusBadge(color)).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  return `<span style="${badgeStyle}">${label}</span>`
}

export function renderKPIBlock(items: Array<{ label: string; value: string | number }>): string {
  const blockStyle = Object.entries(styles.kpiBlock).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const rowStyle = Object.entries(styles.kpiRow).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const cellStyle = Object.entries(styles.kpiCell).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const lastCellStyle = Object.entries(styles.kpiCellLast).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const valueStyle = Object.entries(styles.kpiValue).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const labelStyle = Object.entries(styles.kpiLabel).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')

  const cellsHtml = items.map((item, i) => `
    <td style="${i === items.length - 1 ? lastCellStyle : cellStyle}">
      <div style="${valueStyle}">${item.value}</div>
      <div style="${labelStyle}">${item.label}</div>
    </td>
  `).join('')

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="${blockStyle}">
      <tr style="${rowStyle}">
        ${cellsHtml}
      </tr>
    </table>
  `
}

export function renderSecurityNotice(title: string, text: string): string {
  const noticeStyle = Object.entries(styles.securityNotice).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const titleStyle = Object.entries(styles.securityNoticeTitle).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')
  const textStyle = Object.entries(styles.securityNoticeText).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')

  return `
    <div style="${noticeStyle}">
      <p style="${titleStyle}">${title}</p>
      <p style="${textStyle}">${text}</p>
    </div>
  `
}

export function renderDivider(): string {
  return `<hr style="${Object.entries(styles.divider).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}" />`
}