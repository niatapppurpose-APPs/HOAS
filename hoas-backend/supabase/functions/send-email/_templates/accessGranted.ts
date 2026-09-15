// 7. ACCESS GRANTED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard } from '../_components/EmailLayout.ts'

interface AccessGrantedData {
  userName: string
  collegeName: string
  role: string
  dashboardUrl: string
}

export function renderAccessGranted(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: AccessGrantedData): string {
  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    management: 'Management',
    warden: 'Warden',
    student: 'Student',
  }

  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph(`You have been granted access to <strong>${data.collegeName}</strong> on HOAS as a ${roleLabels[data.role] || data.role}.`)}
    ${renderParagraph('You can now access the dashboard and perform actions based on your assigned permissions.')}
    ${renderDivider()}
    ${renderInfoCard('Access Details', [
      { label: 'Institution', value: data.collegeName },
      { label: 'Role', value: roleLabels[data.role] || data.role },
    ])}
    ${renderButton(data.dashboardUrl, 'Access Dashboard')}
  `

  return createEmailLayout(config, content, `You now have access to ${data.collegeName} on HOAS`)
}