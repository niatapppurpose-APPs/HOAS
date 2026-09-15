// 12. LEAVE REJECTED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard, renderStatusBadge } from '../_components/EmailLayout.ts'

interface LeaveRejectedData {
  userName: string
  requestId: string
  startDate: string
  endDate: string
  reason: string
  requestUrl: string
}

export function renderLeaveRejected(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: LeaveRejectedData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('We regret to inform you that your leave request has not been approved.')}
    ${renderParagraph(`<strong>Reason:</strong> ${data.reason || 'No specific reason provided.'}`)}
    ${renderDivider()}
    ${renderInfoCard('Rejected Leave Request', [
      { label: 'Request ID', value: `#${data.requestId}` },
      { label: 'Start Date', value: data.startDate },
      { label: 'End Date', value: data.endDate },
      { label: 'Status', value: renderStatusBadge('Rejected', '#ef4444') },
    ])}
    ${renderParagraph('If you have questions about this decision, please contact your warden or hostel administration.')}
    ${renderButton(data.requestUrl, 'View Request', true)}
  `

  return createEmailLayout(config, content, 'Update regarding your leave request')
}