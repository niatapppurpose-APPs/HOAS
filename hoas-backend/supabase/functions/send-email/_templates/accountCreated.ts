// 1. ACCOUNT CREATED - Welcome to HOAS

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderInfoCard, renderDivider, renderSecurityNotice } from '../_components/EmailLayout.ts'

interface AccountCreatedData {
  userName: string
  role: string
  collegeName: string
  loginUrl: string
  tempPassword?: string
}

export function renderAccountCreated(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: AccountCreatedData): string {
  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    management: 'Management',
    warden: 'Warden',
    student: 'Student',
  }

  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph(`Welcome to HOAS. Your ${roleLabels[data.role] || data.role} account has been created for <strong>${data.collegeName}</strong>.`)}
    ${renderParagraph('You can now access the platform to manage hostel operations, track student activities, and oversee daily operations.')}
    ${renderDivider()}
    ${renderInfoCard('Account Details', [
      { label: 'Role', value: roleLabels[data.role] || data.role },
      { label: 'Institution', value: data.collegeName },
      { label: 'Login URL', value: data.loginUrl },
    ])}
    ${data.tempPassword ? renderInfoCard('Temporary Credentials', [
      { label: 'Temporary Password', value: data.tempPassword },
      { label: 'Action Required', value: 'Please change your password on first login' },
    ]) : ''}
    ${renderButton(data.loginUrl, 'Access HOAS')}
    ${renderSecurityNotice('Security Notice', 'This account was created by your institution administrator. If you did not expect this email, please contact your administrator immediately.')}
  `

  return createEmailLayout(config, content, 'Welcome to HOAS — Your account is ready')
}