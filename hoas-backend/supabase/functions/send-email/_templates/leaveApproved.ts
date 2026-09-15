// 11. LEAVE APPROVED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard, renderStatusBadge } from '../_components/EmailLayout.ts'

interface LeaveApprovedData {
  userName: string
  requestId: string
  startDate: string
  endDate: string
  approvedBy: string
  requestUrl: string
}

export function renderLeaveApproved(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: LeaveApprovedData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('Your leave request has been <strong>approved</strong>.')}
    ${renderDivider()}
    ${renderInfoCard('Approved Leave', [
      { label: 'Request ID', value: `#${data.requestId}` },
      { label: 'Start Date', value: data.startDate },
      { label: 'End Date', value: data.endDate },
      { label: 'Approved By', value: data.approvedBy },
      { label: 'Status', value: renderStatusBadge('Approved', '#10b981') },
    ])}
    ${renderButton(data.requestUrl, 'View Leave Details')}
  `

  return createEmailLayout(config, content, 'Leave request approved')
}