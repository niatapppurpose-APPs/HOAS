// 8. COMPLAINT CREATED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard, renderStatusBadge } from '../_components/EmailLayout.ts'

interface ComplaintCreatedData {
  userName: string
  complaintId: string
  complaintTitle: string
  submittedAt: string
  status: string
  complaintUrl: string
}

export function renderComplaintCreated(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: ComplaintCreatedData): string {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    'in-progress': '#3b82f6',
    resolved: '#10b981',
    escalated: '#ef4444',
    rejected: '#6b7280',
  }

  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('Your complaint has been successfully submitted and is now being reviewed.')}
    ${renderDivider()}
    ${renderInfoCard('Complaint Details', [
      { label: 'Complaint ID', value: `#${data.complaintId}` },
      { label: 'Title', value: data.complaintTitle },
      { label: 'Submitted', value: data.submittedAt },
      { label: 'Status', value: renderStatusBadge(data.status, statusColors[data.status] || '#6b7280') },
    ])}
    ${renderParagraph('You will be notified when there are updates to your complaint.')}
    ${renderButton(data.complaintUrl, 'View Complaint')}
  `

  return createEmailLayout(config, content, `Complaint received — HOAS #${data.complaintId}`)
}