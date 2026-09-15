// 2. EMAIL VERIFICATION

import { createEmailLayout, renderGreeting, renderParagraph, renderButton, renderDivider, renderSecurityNotice } from '../_components/EmailLayout.ts'

interface EmailVerificationData {
  userName: string
  verificationUrl: string
  expirationTime: string
}

export function renderEmailVerification(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: EmailVerificationData): string {
  const content = `
    ${renderGreeting(data.userName)}
    ${renderParagraph('Please verify your email address to complete your HOAS account setup.')}
    ${renderParagraph('Click the button below to verify your email address.')}
    ${renderDivider()}
    ${renderButton(data.verificationUrl, 'Verify Email')}
    ${renderParagraph(`This verification link will expire after ${data.expirationTime}.`, true)}
    ${renderSecurityNotice('Security Notice', 'If you did not create a HOAS account, you can safely ignore this email.')}
  `

  return createEmailLayout(config, content, 'Verify your HOAS email address')
}