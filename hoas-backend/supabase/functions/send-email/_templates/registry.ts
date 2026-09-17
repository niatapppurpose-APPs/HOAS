// Central HOAS email template registry — single function per event, shared layout only.
// Each entry: required vars, subject, html body builder, text body builder.
// All dynamic values are escaped inside shared helpers. Never include passwords.

import {
  EmailConfig, esc, EmailLayout,
  EmailButton, EmailCard, EmailBadge, EmailAlert,
} from '../_components/EmailLayout.ts'

export type EmailType =
  | 'account_created' | 'email_verification' | 'password_reset'
  | 'account_approved' | 'account_rejected' | 'role_updated'
  | 'access_granted' | 'complaint_created' | 'complaint_updated'
  | 'leave_submitted' | 'leave_approved' | 'leave_rejected'
  | 'new_announcement' | 'emergency_alert'
  | 'support_ticket_created' | 'support_ticket_updated'
  | 'security_alert' | 'account_deactivated' | 'account_reactivated'
  | 'administrative_report'

export const EMAIL_TYPES: EmailType[] = [
  'account_created', 'email_verification', 'password_reset',
  'account_approved', 'account_rejected', 'role_updated',
  'access_granted', 'complaint_created', 'complaint_updated',
  'leave_submitted', 'leave_approved', 'leave_rejected',
  'new_announcement', 'emergency_alert',
  'support_ticket_created', 'support_ticket_updated',
  'security_alert', 'account_deactivated', 'account_reactivated',
  'administrative_report',
]

type Data = Record<string, any>
const v = (d: Data, ...keys: string[]): string => {
  for (const k of keys) {
    const val = d?.[k]
    if (val !== undefined && val !== null && String(val).trim() !== '') return String(val)
  }
  return ''
}
const p = (t: string, small = false) =>
  `<div style="font-size:${small ? 14 : 15}px;color:${small ? '#4b5563' : '#374151'};line-height:1.65;margin:0 0 16px;">${t}</div>`
const greet = (n: string) =>
  `<div style="font-size:16px;font-weight:500;color:#111827;margin:0 0 16px;">Hi ${esc(n || 'there')},</div>`

interface TemplateDef {
  required: string[]
  subject: (d: Data) => string
  body: (d: Data, c: EmailConfig) => string
  text: (d: Data, c: EmailConfig) => string
  preheader: (d: Data) => string
}

const roleLabel = (r: string) => ({ owner: 'Owner', management: 'Management', warden: 'Warden', student: 'Student' } as any)[r] || r || 'User'

export const EMAIL_TEMPLATES: Record<EmailType, TemplateDef> = {
  account_created: {
    required: ['userName'],
    subject: () => 'Your HOAS account has been created',
    body: (d, c) => {
      const name = v(d, 'userName', 'name'), role = v(d, 'role'), email = v(d, 'email', 'loginEmail'),
        studentId = v(d, 'studentId', 'rollNumber', 'idNumber'), college = v(d, 'collegeName', 'college'),
        url = v(d, 'loginUrl', 'appUrl', 'dashboardUrl') || c.appUrl,
        resetUrl = v(d, 'resetLink', 'resetUrl')
      const rows: Array<{ label: string; value: string; mono?: boolean }> = [
        { label: 'Email', value: email ? `<a href="mailto:${esc(email)}" style="color:#4f46e5;text-decoration:none;">${esc(email)}</a>` : '—' },
        { label: 'Assigned role', value: esc(roleLabel(role)) },
        ...(studentId ? [{ label: 'Student ID (use to log in)', value: esc(studentId), mono: true }] : []),
        ...(college ? [{ label: 'Institution', value: esc(college) }] : []),
      ]
      return `${greet(name)}${p(`Welcome to ${esc(c.brandName)}. An account has been created for you.`)}`
        + EmailCard('Account details', rows)
        + p(`Sign in with your email${studentId ? ' and Student ID' : ''} using the button below.`)
        + EmailButton(url || c.appUrl, 'Open HOAS')
        + (resetUrl
          ? EmailButton(resetUrl, 'Set Your Password')
            + p(`Button not working? Copy and paste this link:<br/><a href="${esc(resetUrl)}" style="color:#4f46e5;word-break:break-all;">${esc(resetUrl)}</a>`, true)
          : p(`Use “Forgot password” on the login page if you need to set a password.`, true))
        + p(`Need help? Contact <a href="mailto:${esc(c.supportEmail)}" style="color:#4f46e5;">${esc(c.supportEmail)}</a>.`, true)
    },
    text: (d, c) => {
      const name = v(d, 'userName', 'name'), role = v(d, 'role'), email = v(d, 'email', 'loginEmail'),
        studentId = v(d, 'studentId', 'rollNumber', 'idNumber'), url = v(d, 'loginUrl', 'appUrl', 'dashboardUrl') || c.appUrl
      return [`Hi ${name || 'there'},`, '', `Welcome to ${c.brandName}. An account has been created for you.`,
        `Email: ${email}`, `Role: ${roleLabel(role)}`, ...(studentId ? [`Student ID (use to log in): ${studentId}`] : []),
        '', `Open HOAS: ${url}`, '', `Support: ${c.supportEmail}`].join('\n')
    },
    preheader: () => 'Your HOAS account has been created. Sign in to get started.',
  },

  email_verification: {
    required: ['userName', 'verificationUrl'],
    subject: () => 'Verify your HOAS email address',
    body: (d, c) => {
      const url = v(d, 'verificationUrl'), exp = v(d, 'expiresIn', 'expirationTime')
      return `${greet(v(d, 'userName', 'name'))}${p('Please verify your email address to secure your HOAS account.')}`
        + EmailButton(url, 'Verify Email')
        + p(`Button not working? Copy and paste this link:<br/><a href="${esc(url)}" style="color:#4f46e5;word-break:break-all;">${esc(url)}</a>`, true)
        + (exp ? EmailAlert('info', 'Link expires', `This verification link expires in ${esc(exp)}.`) : '')
        + p('If you did not request this verification, you can safely ignore this email.', true)
    },
    text: (d) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '', 'Please verify your email address:',
      v(d, 'verificationUrl'), ...(v(d, 'expiresIn', 'expirationTime') ? [`Expires in: ${v(d, 'expiresIn', 'expirationTime')}`] : []),
      '', 'If you did not request this, ignore this email.'].join('\n'),
    preheader: () => 'Verify your email to activate your HOAS account.',
  },

  password_reset: {
    required: ['userName', 'resetUrl'],
    subject: () => 'Reset your HOAS password',
    body: (d, c) => {
      const url = v(d, 'resetUrl', 'resetLink'), exp = v(d, 'expiresIn', 'expirationTime')
      return `${greet(v(d, 'userName', 'name'))}${p('A password reset was requested for your HOAS account.')}`
        + EmailButton(url, 'Reset Password')
        + p(`Button not working? Copy and paste this link:<br/><a href="${esc(url)}" style="color:#4f46e5;word-break:break-all;">${esc(url)}</a>`, true)
        + (exp ? p(`This link expires in ${esc(exp)}.`, true) : '')
        + EmailAlert('security', 'Didn’t request this?', 'If you did not request a password reset, you can safely ignore this email. Your current password remains unchanged.')
    },
    text: (d) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '', 'A password reset was requested.',
      `Reset link: ${v(d, 'resetUrl', 'resetLink')}`, ...(v(d, 'expiresIn', 'expirationTime') ? [`Expires in: ${v(d, 'expiresIn', 'expirationTime')}`] : []),
      '', 'If you did not request this, ignore this email.'].join('\n'),
    preheader: () => 'Reset your HOAS password.',
  },

  account_approved: {
    required: ['userName'],
    subject: () => 'Your HOAS account has been approved',
    body: (d, c) => {
      const url = v(d, 'loginUrl', 'appUrl', 'dashboardUrl') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p('Your HOAS account has been approved. You now have access to the platform.')}`
        + EmailCard('Approval details', [
          { label: 'Email', value: esc(v(d, 'email') || '—') },
          { label: 'Role', value: esc(roleLabel(v(d, 'role'))) },
          { label: 'Approved by', value: esc(v(d, 'approvedBy') || '—') },
          { label: 'Approved at', value: esc(v(d, 'approvedAt') || '—') },
        ])
        + EmailButton(url, 'Open HOAS')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '', 'Your HOAS account has been approved.',
      `Role: ${roleLabel(v(d, 'role'))}`, `Open HOAS: ${v(d, 'loginUrl', 'appUrl', 'dashboardUrl') || c.appUrl}`].join('\n'),
    preheader: () => 'Your HOAS account was approved.',
  },

  account_rejected: {
    required: ['userName'],
    subject: () => 'Update regarding your HOAS account',
    body: (d, c) => {
      const reason = v(d, 'reason')
      return `${greet(v(d, 'userName', 'name'))}${p('After review, your HOAS account request was not approved.')}`
        + EmailCard('Request details', [
          { label: 'Email', value: esc(v(d, 'email') || '—') },
          { label: 'Role requested', value: esc(roleLabel(v(d, 'role'))) },
          { label: 'Reviewed by', value: esc(v(d, 'rejectedBy') || '—') },
          { label: 'Reviewed at', value: esc(v(d, 'rejectedAt') || '—') },
        ])
        + (reason ? EmailCard('Reason provided', [{ label: 'Reason', value: esc(reason) }]) : p('For next steps, please contact support.'))
        + p(`Support: <a href="mailto:${esc(c.supportEmail)}" style="color:#4f46e5;">${esc(c.supportEmail)}</a>.`, true)
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '', 'Your HOAS account request was not approved.',
      ...(v(d, 'reason') ? [`Reason: ${v(d, 'reason')}`] : []), '', `Support: ${c.supportEmail}`].join('\n'),
    preheader: () => 'Update regarding your HOAS account request.',
  },

  role_updated: {
    required: ['userName', 'newRole'],
    subject: () => 'Your HOAS role has been updated',
    body: (d, c) => {
      const url = v(d, 'dashboardUrl', 'appUrl', 'loginUrl') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p('Your HOAS role has been updated. Your permissions may have changed.')}`
        + EmailCard('Role change', [
          { label: 'Previous role', value: esc(roleLabel(v(d, 'previousRole', 'oldRole'))) },
          { label: 'New role', value: esc(roleLabel(v(d, 'newRole'))) },
          { label: 'Updated by', value: esc(v(d, 'updatedBy') || '—') },
          { label: 'Updated at', value: esc(v(d, 'updatedAt') || '—') },
        ])
        + EmailButton(url, 'Open HOAS')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `Previous role: ${roleLabel(v(d, 'previousRole', 'oldRole'))}`, `New role: ${roleLabel(v(d, 'newRole'))}`,
      '', `Open HOAS: ${v(d, 'dashboardUrl', 'appUrl', 'loginUrl') || c.appUrl}`].join('\n'),
    preheader: () => 'Your HOAS role was updated.',
  },

  access_granted: {
    required: ['userName'],
    subject: () => 'Access granted in HOAS',
    body: (d, c) => {
      const resUrl = v(d, 'resourceUrl', 'dashboardUrl', 'appUrl') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p('Access has been granted to you in HOAS.')}`
        + EmailCard('Access details', [
          { label: 'Resource', value: esc(v(d, 'resourceName', 'collegeName') || '—') },
          { label: 'Resource type', value: esc(v(d, 'resourceType') || '—') },
          { label: 'Access level', value: esc(v(d, 'accessLevel', 'role') || '—') },
          { label: 'Granted by', value: esc(v(d, 'grantedBy') || '—') },
          { label: 'Granted at', value: esc(v(d, 'grantedAt') || '—') },
        ])
        + (v(d, 'resourceUrl', 'dashboardUrl') ? EmailButton(resUrl, 'View Access') : EmailButton(c.appUrl, 'Open HOAS'))
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '', 'Access has been granted to you in HOAS.',
      `Resource: ${v(d, 'resourceName', 'collegeName')}`, `Access: ${v(d, 'accessLevel', 'role')}`,
      '', `${v(d, 'resourceUrl', 'dashboardUrl') || c.appUrl}`].join('\n'),
    preheader: () => 'Access was granted to you in HOAS.',
  },

  complaint_created: {
    required: ['complaintId'],
    subject: (d) => `Complaint submitted — #${v(d, 'complaintId', 'id')}`,
    body: (d, c) => {
      const id = v(d, 'complaintId', 'id'), url = v(d, 'complaintUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p('Your complaint has been submitted successfully.')}`
        + EmailCard('Complaint', [
          { label: 'Complaint ID', value: esc('#' + id) },
          { label: 'Title', value: esc(v(d, 'complaintTitle', 'title') || '—') },
          { label: 'Category', value: esc(v(d, 'complaintCategory', 'category') || '—') },
          { label: 'Status', value: EmailBadge(v(d, 'status') || 'submitted', '#3b82f6') },
          { label: 'Submitted', value: esc(v(d, 'createdAt', 'submittedAt') || '—') },
        ])
        + (v(d, 'complaintDescription', 'description') ? p(esc(v(d, 'complaintDescription', 'description')), true) : '')
        + EmailButton(url, 'View Complaint')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '', `Complaint #${v(d, 'complaintId', 'id')} submitted.`,
      `Title: ${v(d, 'complaintTitle', 'title')}`, `Status: ${v(d, 'status') || 'submitted'}`,
      '', `View: ${v(d, 'complaintUrl', 'url') || c.appUrl}`].join('\n'),
    preheader: (d) => `Complaint #${v(d, 'complaintId', 'id')} submitted.`,
  },

  complaint_updated: {
    required: ['complaintId', 'newStatus'],
    subject: (d) => `Complaint #${v(d, 'complaintId', 'id')} has been updated`,
    body: (d, c) => {
      const url = v(d, 'complaintUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p(`Your complaint <strong>#${esc(v(d, 'complaintId', 'id'))} — ${esc(v(d, 'complaintTitle', 'title'))}</strong> has a new status.`)}`
        + EmailCard('Update', [
          { label: 'Previous status', value: EmailBadge(v(d, 'previousStatus') || '—', '#6b7280') },
          { label: 'New status', value: EmailBadge(v(d, 'newStatus'), '#10b981') },
          { label: 'Updated by', value: esc(v(d, 'updatedBy') || '—') },
          { label: 'Updated at', value: esc(v(d, 'updatedAt') || '—') },
        ])
        + (v(d, 'updateMessage', 'message') ? p(esc(v(d, 'updateMessage', 'message'))) : '')
        + EmailButton(url, 'View Complaint')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `Complaint #${v(d, 'complaintId', 'id')} updated: ${v(d, 'previousStatus')} → ${v(d, 'newStatus')}`,
      ...(v(d, 'updateMessage', 'message') ? [`Message: ${v(d, 'updateMessage', 'message')}`] : []),
      '', `View: ${v(d, 'complaintUrl', 'url') || c.appUrl}`].join('\n'),
    preheader: (d) => `Complaint #${v(d, 'complaintId', 'id')} → ${v(d, 'newStatus')}.`,
  },

  leave_submitted: {
    required: ['leaveId'],
    subject: (d) => `Leave request submitted — #${v(d, 'leaveId', 'requestId', 'id')}`,
    body: (d, c) => {
      const url = v(d, 'leaveUrl', 'requestUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p('Your leave request has been submitted and is awaiting review.')}`
        + EmailCard('Leave request', [
          { label: 'Request ID', value: esc('#' + v(d, 'leaveId', 'requestId', 'id')) },
          { label: 'Type', value: esc(v(d, 'leaveType', 'type') || '—') },
          { label: 'From', value: esc(v(d, 'startDate') || '—') },
          { label: 'To', value: esc(v(d, 'endDate') || '—') },
          { label: 'Days', value: esc(v(d, 'numberOfDays', 'days') || '—') },
          { label: 'Submitted', value: esc(v(d, 'submittedAt') || '—') },
        ])
        + (v(d, 'reason') ? p(`<strong>Reason:</strong> ${esc(v(d, 'reason'))}`, true) : '')
        + EmailButton(url, 'View Leave Request')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `Leave #${v(d, 'leaveId', 'requestId', 'id')} submitted (${v(d, 'leaveType', 'type')}).`,
      `From ${v(d, 'startDate')} to ${v(d, 'endDate')}.`, '', `View: ${v(d, 'leaveUrl', 'requestUrl', 'url') || c.appUrl}`].join('\n'),
    preheader: (d) => `Leave #${v(d, 'leaveId', 'requestId', 'id')} submitted.`,
  },

  leave_approved: {
    required: ['leaveId'],
    subject: (d) => `Leave request approved — #${v(d, 'leaveId', 'requestId', 'id')}`,
    body: (d, c) => {
      const url = v(d, 'leaveUrl', 'requestUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p(`<strong>APPROVED</strong> — your leave request <strong>#${esc(v(d, 'leaveId', 'requestId', 'id'))}</strong> has been approved.`)}`
        + EmailCard('Approved leave', [
          { label: 'Type', value: esc(v(d, 'leaveType', 'type') || '—') },
          { label: 'From', value: esc(v(d, 'startDate') || '—') },
          { label: 'To', value: esc(v(d, 'endDate') || '—') },
          { label: 'Approved by', value: esc(v(d, 'approvedBy') || '—') },
          { label: 'Approved at', value: esc(v(d, 'approvedAt') || '—') },
        ])
        + (v(d, 'comments') ? p(esc(v(d, 'comments')), true) : '')
        + EmailButton(url, 'View Leave Request')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `APPROVED — leave #${v(d, 'leaveId', 'requestId', 'id')} (${v(d, 'startDate')} → ${v(d, 'endDate')}).`,
      `Approved by: ${v(d, 'approvedBy')}`, '', `View: ${v(d, 'leaveUrl', 'requestUrl', 'url') || c.appUrl}`].join('\n'),
    preheader: (d) => `Leave #${v(d, 'leaveId', 'requestId', 'id')} approved.`,
  },

  leave_rejected: {
    required: ['leaveId'],
    subject: (d) => `Leave request update — #${v(d, 'leaveId', 'requestId', 'id')}`,
    body: (d, c) => {
      const url = v(d, 'leaveUrl', 'requestUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p(`<strong>NOT APPROVED</strong> — your leave request <strong>#${esc(v(d, 'leaveId', 'requestId', 'id'))}</strong> was not approved.`)}`
        + EmailCard('Leave request', [
          { label: 'Type', value: esc(v(d, 'leaveType', 'type') || '—') },
          { label: 'From', value: esc(v(d, 'startDate') || '—') },
          { label: 'To', value: esc(v(d, 'endDate') || '—') },
          { label: 'Reviewed by', value: esc(v(d, 'rejectedBy') || '—') },
          { label: 'Reviewed at', value: esc(v(d, 'rejectedAt') || '—') },
        ])
        + (v(d, 'reason', 'comments') ? EmailCard('Reviewer note', [{ label: 'Note', value: esc(v(d, 'reason', 'comments')) }]) : '')
        + EmailButton(url, 'View Leave Request')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `NOT APPROVED — leave #${v(d, 'leaveId', 'requestId', 'id')}.`,
      ...(v(d, 'reason', 'comments') ? [`Note: ${v(d, 'reason', 'comments')}`] : []),
      '', `View: ${v(d, 'leaveUrl', 'requestUrl', 'url') || c.appUrl}`].join('\n'),
    preheader: (d) => `Update on leave #${v(d, 'leaveId', 'requestId', 'id')}.`,
  },

  new_announcement: {
    required: ['title'],
    subject: (d) => `New announcement: ${v(d, 'title', 'announcementTitle')}`,
    body: (d, c) => {
      const url = v(d, 'announcementUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p(`A new announcement was published${v(d, 'collegeName') ? ` by <strong>${esc(v(d, 'collegeName'))}</strong>` : ''}.`)}`
        + EmailCard('Announcement', [
          { label: 'Title', value: esc(v(d, 'title', 'announcementTitle')) },
          { label: 'Category', value: esc(v(d, 'category') || '—') },
          { label: 'Priority', value: EmailBadge(v(d, 'priority') || 'normal', '#3b82f6') },
          { label: 'Published by', value: esc(v(d, 'publishedBy') || '—') },
          { label: 'Published', value: esc(v(d, 'publishedAt') || '—') },
        ])
        + (v(d, 'summary', 'content') ? p(esc(v(d, 'summary', 'content'))) : '')
        + EmailButton(url, 'View Announcement')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `New announcement: ${v(d, 'title', 'announcementTitle')}`, `${v(d, 'summary', 'content') || ''}`,
      '', `View: ${v(d, 'announcementUrl', 'url') || c.appUrl}`].join('\n'),
    preheader: (d) => v(d, 'title', 'announcementTitle'),
  },

  emergency_alert: {
    required: ['title', 'message'],
    subject: (d) => `EMERGENCY ALERT: ${v(d, 'title', 'alertTitle')}`,
    body: (d, c) => {
      const url = v(d, 'alertUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}`
        + EmailAlert('emergency', `EMERGENCY ALERT — ${v(d, 'severity') || 'urgent'}`.toUpperCase(), v(d, 'title', 'alertTitle'))
        + p(esc(v(d, 'message', 'alertMessage')))
        + EmailCard('Alert details', [
          { label: 'Location', value: esc(v(d, 'location') || '—') },
          { label: 'Issued by', value: esc(v(d, 'issuedBy') || '—') },
          { label: 'Issued at', value: esc(v(d, 'issuedAt') || '—') },
        ])
        + (v(d, 'actionRequired') ? EmailAlert('emergency', 'Action required', v(d, 'actionRequired')) : '')
        + EmailButton(url, 'View Emergency Alert')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `EMERGENCY ALERT: ${v(d, 'title', 'alertTitle')}`, `${v(d, 'message', 'alertMessage')}`,
      `Location: ${v(d, 'location')}`, `Issued by: ${v(d, 'issuedBy')} at ${v(d, 'issuedAt')}`,
      ...(v(d, 'actionRequired') ? [`Action required: ${v(d, 'actionRequired')}`] : []),
      '', `View: ${v(d, 'alertUrl', 'url') || c.appUrl}`].join('\n'),
    preheader: (d) => `EMERGENCY: ${v(d, 'title', 'alertTitle')}`,
  },

  support_ticket_created: {
    required: ['ticketId'],
    subject: (d) => `Support ticket created — #${v(d, 'ticketId', 'id')}`,
    body: (d, c) => {
      const url = v(d, 'supportUrl', 'ticketUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p('Your support ticket has been created.')}`
        + EmailCard('Ticket', [
          { label: 'Ticket ID', value: esc('#' + v(d, 'ticketId', 'id')) },
          { label: 'Subject', value: esc(v(d, 'subject', 'title') || '—') },
          { label: 'Category', value: esc(v(d, 'category') || '—') },
          { label: 'Priority', value: esc(v(d, 'priority') || '—') },
          { label: 'Created', value: esc(v(d, 'createdAt') || '—') },
        ])
        + (v(d, 'description') ? p(esc(v(d, 'description')), true) : '')
        + EmailButton(url, 'View Ticket')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `Ticket #${v(d, 'ticketId', 'id')} created: ${v(d, 'subject', 'title')}`,
      '', `View: ${v(d, 'supportUrl', 'ticketUrl', 'url') || c.appUrl}`].join('\n'),
    preheader: (d) => `Ticket #${v(d, 'ticketId', 'id')} created.`,
  },

  support_ticket_updated: {
    required: ['ticketId', 'newStatus'],
    subject: (d) => `Support ticket #${v(d, 'ticketId', 'id')} updated`,
    body: (d, c) => {
      const url = v(d, 'supportUrl', 'ticketUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p(`Your support ticket <strong>#${esc(v(d, 'ticketId', 'id'))}</strong> has been updated.`)}`
        + EmailCard('Update', [
          { label: 'Subject', value: esc(v(d, 'subject', 'title') || '—') },
          { label: 'Previous status', value: EmailBadge(v(d, 'previousStatus') || '—', '#6b7280') },
          { label: 'New status', value: EmailBadge(v(d, 'newStatus'), '#10b981') },
          { label: 'Updated by', value: esc(v(d, 'updatedBy') || '—') },
          { label: 'Updated at', value: esc(v(d, 'updatedAt') || '—') },
        ])
        + (v(d, 'updateMessage', 'latestMessage', 'message') ? p(esc(v(d, 'updateMessage', 'latestMessage', 'message'))) : '')
        + EmailButton(url, 'View Ticket')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `Ticket #${v(d, 'ticketId', 'id')}: ${v(d, 'previousStatus')} → ${v(d, 'newStatus')}`,
      ...(v(d, 'updateMessage', 'latestMessage', 'message') ? [`Message: ${v(d, 'updateMessage', 'latestMessage', 'message')}`] : []),
      '', `View: ${v(d, 'supportUrl', 'ticketUrl', 'url') || c.appUrl}`].join('\n'),
    preheader: (d) => `Ticket #${v(d, 'ticketId', 'id')} → ${v(d, 'newStatus')}.`,
  },

  security_alert: {
    required: ['message'],
    subject: () => 'Security alert for your HOAS account',
    body: (d, c) => {
      const url = v(d, 'securityUrl', 'url') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}`
        + EmailAlert('security', 'Security event detected', v(d, 'alertType', 'activity') || 'Unusual account activity')
        + EmailCard('Activity', [
          { label: 'What happened', value: esc(v(d, 'message', 'activity')) },
          { label: 'When', value: esc(v(d, 'timestamp') || '—') },
          { label: 'Device', value: esc(v(d, 'device') || '—') },
          { label: 'Location', value: esc(v(d, 'location') || '—') },
          { label: 'IP', value: esc(v(d, 'ipAddress', 'ip') || '—') },
        ])
        + EmailButton(url, 'Review Account Security')
        + EmailAlert('security', 'Not you?', 'If you don’t recognize this activity, secure your account and contact your institution administrator.')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '',
      `Security event: ${v(d, 'message', 'activity')}`, `When: ${v(d, 'timestamp')}`,
      `Device: ${v(d, 'device')}`, `Location: ${v(d, 'location')}`,
      '', `Review: ${v(d, 'securityUrl', 'url') || c.appUrl}`,
      '', 'If this wasn’t you, contact your administrator.'].join('\n'),
    preheader: () => 'Security alert for your HOAS account.',
  },

  account_deactivated: {
    required: ['userName'],
    subject: () => 'Your HOAS account has been deactivated',
    body: (d, c) => `${greet(v(d, 'userName', 'name'))}${p('Your HOAS account is currently deactivated.')}`
      + EmailCard('Account', [
        { label: 'Email', value: esc(v(d, 'email') || '—') },
        { label: 'Role', value: esc(roleLabel(v(d, 'role'))) },
        { label: 'Deactivated by', value: esc(v(d, 'deactivatedBy') || '—') },
        { label: 'Deactivated at', value: esc(v(d, 'deactivatedAt') || '—') },
      ])
      + (v(d, 'reason') ? EmailCard('Reason provided', [{ label: 'Reason', value: esc(v(d, 'reason')) }]) : '')
      + p(`To appeal, contact <a href="mailto:${esc(c.supportEmail)}" style="color:#4f46e5;">${esc(c.supportEmail)}</a>.`, true),
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '', 'Your HOAS account is deactivated.',
      ...(v(d, 'reason') ? [`Reason: ${v(d, 'reason')}`] : []), '', `Support: ${c.supportEmail}`].join('\n'),
    preheader: () => 'Your HOAS account was deactivated.',
  },

  account_reactivated: {
    required: ['userName'],
    subject: () => 'Your HOAS account has been reactivated',
    body: (d, c) => {
      const url = v(d, 'appUrl', 'loginUrl', 'dashboardUrl') || c.appUrl
      return `${greet(v(d, 'userName', 'name'))}${p('Your HOAS account has been reactivated. You can sign in again.')}`
        + EmailCard('Account', [
          { label: 'Email', value: esc(v(d, 'email') || '—') },
          { label: 'Role', value: esc(roleLabel(v(d, 'role'))) },
          { label: 'Reactivated by', value: esc(v(d, 'reactivatedBy') || '—') },
          { label: 'Reactivated at', value: esc(v(d, 'reactivatedAt') || '—') },
        ])
        + EmailButton(url, 'Open HOAS')
    },
    text: (d, c) => [`Hi ${v(d, 'userName', 'name') || 'there'},`, '', 'Your HOAS account was reactivated.',
      '', `Open HOAS: ${v(d, 'appUrl', 'loginUrl', 'dashboardUrl') || c.appUrl}`].join('\n'),
    preheader: () => 'Your HOAS account was reactivated.',
  },

  administrative_report: {
    required: [],
    subject: (d) => `HOAS Administrative Report — ${v(d, 'reportTitle', 'reportPeriod') || 'Summary'}`,
    body: (d, c) => {
      const metrics = Array.isArray(d.metrics) ? d.metrics : [
        ...(d.studentCount !== undefined ? [{ label: 'Students', value: String(d.studentCount) }] : []),
        ...(d.complaintCount !== undefined ? [{ label: 'Complaints', value: String(d.complaintCount) }] : []),
        ...(d.resolvedComplaints !== undefined ? [{ label: 'Resolved', value: String(d.resolvedComplaints) }] : []),
        ...(d.leaveRequests !== undefined ? [{ label: 'Leave requests', value: String(d.leaveRequests) }] : []),
      ]
      const sections = Array.isArray(d.sections) ? d.sections : []
      const reportUrl = v(d, 'reportUrl', 'url'), downloadUrl = v(d, 'downloadUrl')
      const kpi = metrics.length
        ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;"><tr>${metrics.slice(0, 4).map((m: any) => `<td align="center" style="padding:16px 12px;vertical-align:top;"><div style="font-size:24px;font-weight:700;color:#111827;">${esc(String(m.value))}</div><div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">${esc(m.label)}</div></td>`).join('')}</tr></table>`
        : ''
      const sectionHtml = sections.map((s: any) =>
        `<div style="margin:16px 0;"><div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:4px;">${esc(s.title || 'Section')}</div><div style="font-size:14px;color:#374151;">${esc(s.body || s.text || '')}</div></div>`).join('')
      return `${greet(v(d, 'recipientName', 'adminName', 'userName'))}`
        + p(`<strong>${esc(v(d, 'reportTitle') || 'Administrative report')}</strong>${v(d, 'reportPeriod') ? ` — ${esc(v(d, 'reportPeriod'))}` : ''}`)
        + EmailCard('Report info', [
          { label: 'Type', value: esc(v(d, 'reportType') || '—') },
          { label: 'Generated', value: esc(v(d, 'generatedAt') || '—') },
          { label: 'Generated by', value: esc(v(d, 'generatedBy') || '—') },
        ])
        + (v(d, 'summary') ? p(esc(v(d, 'summary'))) : '')
        + kpi + sectionHtml
        + (reportUrl ? EmailButton(reportUrl, 'View Report') : '')
        + (downloadUrl ? p(`<a href="${esc(downloadUrl)}" style="color:#4f46e5;">Download report</a>`, true) : '')
    },
    text: (d, c) => {
      const metrics = Array.isArray(d.metrics) ? d.metrics : []
      return [`Hi ${v(d, 'recipientName', 'adminName', 'userName') || 'there'},`, '',
        `${v(d, 'reportTitle') || 'Administrative report'}${v(d, 'reportPeriod') ? ` — ${v(d, 'reportPeriod')}` : ''}`,
        `${v(d, 'summary') || ''}`,
        ...metrics.map((m: any) => `${m.label}: ${m.value}`),
        '', `View: ${v(d, 'reportUrl', 'url') || c.appUrl}`].join('\n')
    },
    preheader: (d) => `${v(d, 'reportTitle') || 'HOAS report'} ready.`,
  },
}

export function renderEmailTemplate(type: string, data: Data = {}, config: any) {
  const def = (EMAIL_TEMPLATES as any)[type as EmailType]
  if (!def) throw new Error(`Unsupported email template type: ${type}`)
  const cfg = {
    appUrl: config?.appUrl || '',
    supportEmail: config?.supportEmail || '',
    logoUrl: config?.logoUrl || '',
    brandName: config?.brandName || 'HOAS',
  }
  const missing = (def.required || []).filter((k: string) => {
    // allow documented aliases
    const aliases: Record<string, string[]> = {
      userName: ['userName', 'name', 'recipientName', 'adminName'],
    }
    const keys = aliases[k] || [k]
    return !keys.some((kk) => data?.[kk] !== undefined && data?.[kk] !== null && String(data[kk]).trim() !== '')
  })
  if (missing.length) throw new Error(`Missing required variables for ${type}: ${missing.join(', ')}`)
  const subject = def.subject(data)
  const bodyHtml = def.body(data, cfg)
  const preheader = def.preheader(data)
  const html = EmailLayout(cfg, subject, bodyHtml, preheader)
  const text = `${cfg.brandName}\n${subject}\n\n${def.text(data, cfg)}\n\nSupport: ${cfg.supportEmail}\n${cfg.appUrl}`
  return { subject, bodyHtml, html, textBody: text, preheader }
}
