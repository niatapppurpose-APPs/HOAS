// 9. COMPLAINT STATUS UPDATED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard, renderStatusBadge } from '../_components/EmailLayout.ts'

interface ComplaintUpdatedData {
  userName: string
  complaintId: string
  complaintTitle: string
  previousStatus: string
  newStatus: string
  updatedAt: string
  complaintUrl: string
}

export function renderComplaintUpdated(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: ComplaintUpdatedData): string {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    'in-progress': '#3b82f6',
    resolved: '#10b981',
    escalated: '#ef4444',
    rejected: '#6b7280',
    'warden-resolved': '#8b5cf6',
    disputed: '#ef4444',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
    escalated: 'Escalated',
    rejected: 'Rejected',
    'warden-resolved': 'Warden Resolved',
    disputed: 'Disputed',
  }

  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph(`The status of your complaint <strong>"${data.complaintTitle}"</strong> has been updated.`)}
    ${renderDivider()}
    ${renderInfoCard('Status Update', [
      { label: 'Complaint ID', value: `#${data.complaintId}` },
      { label: 'Previous Status', value: renderStatusBadge(statusLabels[data.previousStatus] || data.previousStatus, statusColors[data.previousStatus] || '#6b7280') },
      { label: 'New Status', value: renderStatusBadge(statusLabels[data.newStatus] || data.newStatus, statusColors[data.newStatus] || '#6b7280') },
      { label: 'Updated', value: data.updatedAt },
    ])}
    ${renderButton(data.complaintUrl, 'View Complaint')}
  `

  return createEmailLayout(config, content, 'Your HOAS complaint has been updated')
}