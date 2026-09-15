// 17. SECURITY ALERT

import { createEmailLayout, renderGreeting, renderParagraph, renderDivider, renderButton, renderInfoCard, renderSecurityNotice } from '../_components/EmailLayout.ts'

interface SecurityAlertData {
  userName: string
  activity: string
  device: string
  location: string
  timestamp: string
  securityUrl: string
}

export function renderSecurityAlert(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: SecurityAlertData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('Important security alert for your HOAS account.')}
    ${renderDivider()}
    ${renderInfoCard('Security Activity', [
      { label: 'Activity', value: data.activity },
      { label: 'Device', value: data.device || '—' },
      { label: 'Location', value: data.location || '—' },
      { label: 'Timestamp', value: data.timestamp },
    ])}
    ${renderParagraph('If you do not recognize this activity, please take immediate action to secure your account.')}
    ${renderButton(data.securityUrl, 'Review Account')}
    ${renderSecurityNotice('Security Notice', 'If you do not recognize this activity, contact your institution administrator or HOAS support immediately.')}
  `

  return createEmailLayout(config, content, 'Security alert for your HOAS account')
}