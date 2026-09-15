// 6. ROLE UPDATED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard } from '../_components/EmailLayout.ts'

interface RoleUpdatedData {
  userName: string
  oldRole: string
  newRole: string
  collegeName: string
  dashboardUrl: string
}

export function renderRoleUpdated(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: RoleUpdatedData): string {
  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    management: 'Management',
    warden: 'Warden',
    student: 'Student',
  }

  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph(`Your role within <strong>${data.collegeName}</strong> has been updated.`)}
    ${renderDivider()}
    ${renderInfoCard('Role Change', [
      { label: 'Previous Role', value: roleLabels[data.oldRole] || data.oldRole },
      { label: 'New Role', value: roleLabels[data.newRole] || data.newRole },
      { label: 'Institution', value: data.collegeName },
    ])}
    ${renderParagraph('Your permissions and dashboard access have been updated accordingly.')}
    ${renderButton(data.dashboardUrl, 'Open Dashboard')}
  `

  return createEmailLayout(config, content, 'Your HOAS role has been updated')
}