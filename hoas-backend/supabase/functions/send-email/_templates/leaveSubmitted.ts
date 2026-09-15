// 10. LEAVE REQUEST SUBMITTED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard, renderStatusBadge } from '../_components/EmailLayout.ts'

interface LeaveSubmittedData {
  userName: string
  requestId: string
  leaveType: string
  startDate: string
  endDate: string
  submittedAt: string
  requestUrl: string
}

export function renderLeaveSubmitted(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: LeaveSubmittedData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('Your leave request has been submitted and is pending review.')}
    ${renderDivider()}
    ${renderInfoCard('Leave Request Details', [
      { label: 'Request ID', value: `#${data.requestId}` },
      { label: 'Leave Type', value: data.leaveType },
      { label: 'Start Date', value: data.startDate },
      { label: 'End Date', value: data.endDate },
      { label: 'Submitted', value: data.submittedAt },
      { label: 'Status', value: renderStatusBadge('Pending', '#f59e0b') },
    ])}
    ${renderParagraph('You will be notified once a decision is made on your request.')}
    ${renderButton(data.requestUrl, 'View Request')}
  `

  return createEmailLayout(config, content, 'Leave request submitted — HOAS')
}