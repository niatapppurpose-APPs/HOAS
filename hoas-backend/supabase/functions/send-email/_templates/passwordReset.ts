// 3. PASSWORD RESET

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderSecurityNotice } from '../_components/EmailLayout.ts'

interface PasswordResetData {
  userName: string
  resetUrl: string
  expirationTime: string
}

export function renderPasswordReset(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: PasswordResetData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('We received a request to reset your HOAS account password.')}
    ${renderParagraph('Click the button below to create a new password.')}
    ${renderDivider()}
    ${renderButton(data.resetUrl, 'Reset Password')}
    ${renderParagraph(`This password reset link will expire after ${data.expirationTime}.`, true)}
    ${renderSecurityNotice('Security Notice', 'If you did not request a password reset, you can safely ignore this email. Your account security is not affected.')}
  `

  return createEmailLayout(config, content, 'Reset your HOAS password')
}