// 4. ACCOUNT APPROVED

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderInfoCard } from '../_components/EmailLayout.ts'

interface AccountApprovedData {
  userName: string
  collegeName: string
  role: string
  approvedBy: string
  loginUrl: string
}

export function renderAccountApproved(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: AccountApprovedData): string {
  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    management: 'Management',
    warden: 'Warden',
    student: 'Student',
  }

  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph(`Good news! Your HOAS account for <strong>${data.collegeName}</strong> has been approved by ${data.approvedBy}.`)}
    ${renderParagraph('You now have full access to the platform based on your assigned role.')}
    ${renderDivider()}
    ${renderInfoCard('Account Details', [
      { label: 'Role', value: roleLabels[data.role] || data.role },
      { label: 'Institution', value: data.collegeName },
      { label: 'Approved By', value: data.approvedBy },
    ])}
    ${renderButton(data.loginUrl, 'Open HOAS')}
  `

  return createEmailLayout(config, content, 'Your HOAS account has been approved')
}