// 1. ACCOUNT CREATED - Welcome to HOAS

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderInfoCard, renderDivider, renderSecurityNotice } from '../_components/EmailLayout.ts'

interface AccountCreatedData {
  userName: string
  role: string
  collegeName: string
  loginUrl: string
  studentId?: string
  email?: string
  resetLink?: string
}

export function renderAccountCreated(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: AccountCreatedData): string {
  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    management: 'Management',
    warden: 'Warden',
    student: 'Student',
  }

  const accountRows = [
    { label: 'Role', value: roleLabels[data.role] || data.role },
    { label: 'Institution', value: data.collegeName },
  ]
  if ((data as any).studentId) accountRows.push({ label: 'Student ID (use to log in)', value: String((data as any).studentId) })
  if ((data as any).email) accountRows.push({ label: 'Login Email', value: String((data as any).email) })
  accountRows.push({ label: 'Login URL', value: data.loginUrl })

  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph(`Welcome to HOAS. Your ${roleLabels[data.role] || data.role} account has been created for <strong>${data.collegeName}</strong>.`)}
    ${renderParagraph('Sign in with your email' + ((data as any).studentId ? ' and Student ID' : '') + ' using the button below.')}
    ${renderDivider()}
    ${renderInfoCard('Account Details', accountRows)}
    ${renderButton(data.loginUrl, 'Open HOAS')}
    ${(data as any).resetLink ? renderButton((data as any).resetLink, 'Set Your Password') : ''}
    ${renderSecurityNotice('Security Notice', 'This account was created by your institution administrator. If you did not expect this email, please contact your administrator immediately.')}
  `

  return createEmailLayout(config, content, 'Welcome to HOAS — Your account is ready')
}