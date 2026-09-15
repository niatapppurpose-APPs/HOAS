// 5. ACCOUNT REJECTED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard } from '../_components/EmailLayout.ts'

interface AccountRejectedData {
  userName: string
  collegeName: string
  reason: string
  supportUrl: string
}

export function renderAccountRejected(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: AccountRejectedData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph(`We regret to inform you that your HOAS access request for <strong>${data.collegeName}</strong> could not be approved at this time.`)}
    ${renderParagraph(`<strong>Reason:</strong> ${data.reason || 'No specific reason provided.'}`)}
    ${renderDivider()}
    ${renderInfoCard('Request Details', [
      { label: 'Institution', value: data.collegeName },
      { label: 'Status', value: 'Not Approved' },
    ])}
    ${renderParagraph('If you believe this decision was made in error, you may submit a new request with updated details or contact support for clarification.')}
    ${renderButton(data.supportUrl, 'View Details', true)}
  `

  return createEmailLayout(config, content, 'Update regarding your HOAS account request')
}