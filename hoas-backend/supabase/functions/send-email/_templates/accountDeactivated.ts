// 18. ACCOUNT DEACTIVATED

import { createEmailLayout, renderGreeting, renderParagraph, renderDivider, renderInfoCard, renderButton } from '../_components/EmailLayout.ts'

interface AccountDeactivatedData {
  userName: string
  collegeName: string
  reason: string
  supportUrl: string
}

export function renderAccountDeactivated(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: AccountDeactivatedData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('Your HOAS account has been deactivated.')}
    ${renderDivider()}
    ${renderInfoCard('Account Status', [
      { label: 'Institution', value: data.collegeName },
      { label: 'Status', value: 'Deactivated' },
    ])}
    ${renderParagraph(data.reason || 'Your account has been deactivated by the institution administrator.')}
    ${renderButton(data.supportUrl, 'Contact Support')}
  `

  return createEmailLayout(config, content, 'Your HOAS account has been deactivated')
}