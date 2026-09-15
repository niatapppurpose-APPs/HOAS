// 19. ACCOUNT REACTIVATED

import { createEmailLayout, renderGreeting, renderParagraph, renderDivider, renderInfoCard, renderButton } from '../_components/EmailLayout.ts'

interface AccountReactivatedData {
  userName: string
  collegeName: string
  role: string
  loginUrl: string
}

export function renderAccountReactivated(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: AccountReactivatedData): string {
  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    management: 'Management',
    warden: 'Warden',
    student: 'Student',
  }

  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('Your HOAS account has been reactivated.')}
    ${renderDivider()}
    ${renderInfoCard('Account Reactivated', [
      { label: 'Institution', value: data.collegeName },
      { label: 'Role', value: roleLabels[data.role] || data.role },
    ])}
    ${renderButton(data.loginUrl, 'Access HOAS')}
  `

  return createEmailLayout(config, content, 'Your HOAS account has been reactivated')
}