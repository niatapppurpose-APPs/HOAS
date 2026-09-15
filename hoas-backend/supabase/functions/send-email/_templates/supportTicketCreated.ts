// 15. SUPPORT TICKET CREATED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard, renderStatusBadge } from '../_components/EmailLayout.ts'

interface SupportTicketCreatedData {
  userName: string
  ticketId: string
  subject: string
  createdAt: string
  ticketUrl: string
}

export function renderSupportTicketCreated(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: SupportTicketCreatedData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('A support ticket has been created on your behalf.')}
    ${renderDivider()}
    ${renderInfoCard('Ticket Details', [
      { label: 'Ticket ID', value: `#${data.ticketId}` },
      { label: 'Subject', value: data.subject },
      { label: 'Created', value: data.createdAt },
      { label: 'Status', value: renderStatusBadge('Open', '#f59e0b') },
    ])}
    ${renderParagraph('Our support team will review your request and respond within 24–48 hours.')}
    ${renderButton(data.ticketUrl, 'View Ticket')}
  `

  return createEmailLayout(config, content, `Support ticket received — HOAS #${data.ticketId}`)
}