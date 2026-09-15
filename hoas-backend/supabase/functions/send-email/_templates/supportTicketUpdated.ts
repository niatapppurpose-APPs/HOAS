// 16. SUPPORT TICKET UPDATED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard, renderStatusBadge } from '../_components/EmailLayout.ts'

interface SupportTicketUpdatedData {
  userName: string
  ticketId: string
  subject: string
  status: string
  latestMessage: string
  ticketUrl: string
}

export function renderSupportTicketUpdated(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: SupportTicketUpdatedData): string {
  const statusColors: Record<string, string> = {
    open: '#f59e0b',
    inProgress: '#3b82f6',
    resolved: '#10b981',
    closed: '#6b7280',
  }

  const statusLabels: Record<string, string> = {
    open: 'Open',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  }

  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('Your HOAS support ticket has been updated.')}
    ${renderDivider()}
    ${renderInfoCard('Ticket Update', [
      { label: 'Ticket ID', value: `#${data.ticketId}` },
      { label: 'Subject', value: data.subject },
      { label: 'Status', value: renderStatusBadge(statusLabels[data.status] || data.status, statusColors[data.status] || '#6b7280') },
      { label: 'Latest Message', value: data.latestMessage },
    ])}
    ${renderButton(data.ticketUrl, 'View Ticket')}
  `

  return createEmailLayout(config, content, 'Your HOAS support ticket has been updated')
}