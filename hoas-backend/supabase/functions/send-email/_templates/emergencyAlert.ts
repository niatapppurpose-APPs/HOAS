// 14. EMERGENCY ALERT

import { createEmailLayout, renderGreeting, renderParagraph, renderDivider, renderButton, renderInfoCard, renderSecurityNotice } from '../_components/EmailLayout.ts'

interface EmergencyAlertData {
  userName: string
  collegeName: string
  alertTitle: string
  alertMessage: string
  location: string
  issuedAt: string
  alertUrl: string
}

export function renderEmergencyAlert(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: EmergencyAlertData): string {
  const content = `
    ${renderParagraph(`URGENT — ${data.alertTitle}`)}
    ${renderDivider()}
    ${renderInfoCard('Emergency Alert', [
      { label: 'College', value: data.collegeName },
      { label: 'Issued', value: data.issuedAt },
      { label: 'Location', value: data.location || '—' },
    ])}
    ${renderParagraph(data.alertMessage)}
    ${renderButton(data.alertUrl, 'View Emergency Alert')}
    ${renderSecurityNotice('Emergency Protocol', 'If you are directly affected, please follow your institution\'s emergency procedures and contact campus security immediately.')}
  `

  return createEmailLayout(config, content, `URGENT — Emergency alert from ${data.collegeName}`)
}