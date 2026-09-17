// Realistic mock payloads for dev preview (?preview=<type>) and tests.
const baseConfig = {
  appUrl: 'https://hoas-client-4n13.vercel.app',
  supportEmail: 'support@hoas.app',
  logoUrl: '',
  brandName: 'HOAS',
}

export const MOCK_DATA: Record<string, { config?: any; data: Record<string, any> }> = {
  account_created: { config: baseConfig, data: { userName: 'Faziya Shaik', email: 'faziya@example.com', role: 'student', studentId: 'STU12345', collegeName: 'A.K. Vishwantha Reddy Degree College', loginUrl: 'https://hoas-client-4n13.vercel.app', resetLink: 'https://hoas-client-4n13.vercel.app/set-password?token=demo' } },
  email_verification: { config: baseConfig, data: { userName: 'Rohan Singh', verificationUrl: 'https://hoas-client-4n13.vercel.app/verify?token=abc123', expiresIn: '24 hours' } },
  password_reset: { config: baseConfig, data: { userName: 'Rohan Singh', resetUrl: 'https://hoas-client-4n13.vercel.app/reset?token=abc123', expiresIn: '1 hour' } },
  account_approved: { config: baseConfig, data: { userName: 'Asha Patel', email: 'asha@example.com', role: 'warden', approvedBy: 'Principal', approvedAt: '2026-09-17 10:00', loginUrl: 'https://hoas-client-4n13.vercel.app' } },
  account_rejected: { config: baseConfig, data: { userName: 'John Doe', email: 'john@example.com', role: 'student', reason: 'ID document could not be verified.', rejectedBy: 'Admin', rejectedAt: '2026-09-17' } },
  role_updated: { config: baseConfig, data: { userName: 'Kiran Rao', previousRole: 'student', newRole: 'warden', updatedBy: 'Management', updatedAt: '2026-09-17', dashboardUrl: 'https://hoas-client-4n13.vercel.app' } },
  access_granted: { config: baseConfig, data: { userName: 'Meera Nair', resourceName: 'Block A Hostel', resourceType: 'hostel', accessLevel: 'warden', grantedBy: 'Management', grantedAt: '2026-09-17', resourceUrl: 'https://hoas-client-4n13.vercel.app' } },
  complaint_created: { config: baseConfig, data: { userName: 'Ravi Kumar', complaintId: 'CMP-1024', complaintTitle: 'Water leakage in Block B', complaintCategory: 'Maintenance', status: 'pending', createdAt: '2026-09-17', complaintUrl: 'https://hoas-client-4n13.vercel.app' } },
  complaint_updated: { config: baseConfig, data: { userName: 'Ravi Kumar', complaintId: 'CMP-1024', complaintTitle: 'Water leakage in Block B', previousStatus: 'pending', newStatus: 'in-progress', updateMessage: 'Plumber assigned.', updatedBy: 'Warden', updatedAt: '2026-09-17', complaintUrl: 'https://hoas-client-4n13.vercel.app' } },
  leave_submitted: { config: baseConfig, data: { userName: 'Sneha Iyer', leaveId: 'LV-2041', leaveType: 'outing', startDate: '2026-09-20', endDate: '2026-09-22', numberOfDays: 3, reason: 'Family function', submittedAt: '2026-09-17', leaveUrl: 'https://hoas-client-4n13.vercel.app' } },
  leave_approved: { config: baseConfig, data: { userName: 'Sneha Iyer', leaveId: 'LV-2041', leaveType: 'outing', startDate: '2026-09-20', endDate: '2026-09-22', approvedBy: 'Warden', approvedAt: '2026-09-18', leaveUrl: 'https://hoas-client-4n13.vercel.app' } },
  leave_rejected: { config: baseConfig, data: { userName: 'Sneha Iyer', leaveId: 'LV-2042', leaveType: 'leave', startDate: '2026-09-25', endDate: '2026-09-30', rejectedBy: 'Warden', rejectedAt: '2026-09-18', reason: 'Mess fees pending.', leaveUrl: 'https://hoas-client-4n13.vercel.app' } },
  new_announcement: { config: baseConfig, data: { userName: 'Student', title: 'Mess timings revised', announcementTitle: 'Mess timings revised', summary: 'Dinner will be served 7–9 PM from Monday.', category: 'Mess', priority: 'normal', publishedBy: 'Warden', publishedAt: '2026-09-17', announcementUrl: 'https://hoas-client-4n13.vercel.app' } },
  emergency_alert: { config: baseConfig, data: { userName: 'Staff', title: 'Fire drill — Block C', alertTitle: 'Fire drill — Block C', message: 'Evacuate Block C via stairwell B and assemble at the ground.', location: 'Block C', severity: 'high', issuedBy: 'Management', issuedAt: '2026-09-17 10:00', actionRequired: 'Evacuate immediately.', alertUrl: 'https://hoas-client-4n13.vercel.app' } },
  support_ticket_created: { config: baseConfig, data: { userName: 'Arjun Menon', ticketId: 'TKT-771', subject: 'Login OTP not received', category: 'Auth', priority: 'high', description: 'No OTP for 2 hours.', createdAt: '2026-09-17', supportUrl: 'https://hoas-client-4n13.vercel.app' } },
  support_ticket_updated: { config: baseConfig, data: { userName: 'Arjun Menon', ticketId: 'TKT-771', subject: 'Login OTP not received', previousStatus: 'open', newStatus: 'in-progress', updateMessage: 'Provider failover enabled.', updatedBy: 'Support', updatedAt: '2026-09-17', supportUrl: 'https://hoas-client-4n13.vercel.app' } },
  security_alert: { config: baseConfig, data: { userName: 'Divya Rao', alertType: 'New sign-in', message: 'New sign-in detected.', device: 'Chrome on Windows', location: 'Hyderabad, IN', timestamp: '2026-09-17 10:00', ipAddress: '49.37.x.x', securityUrl: 'https://hoas-client-4n13.vercel.app' } },
  account_deactivated: { config: baseConfig, data: { userName: 'Kiran Shah', email: 'kiran@example.com', role: 'student', reason: 'Graduated.', deactivatedBy: 'Management', deactivatedAt: '2026-09-17' } },
  account_reactivated: { config: baseConfig, data: { userName: 'Kiran Shah', email: 'kiran@example.com', role: 'student', reactivatedBy: 'Management', reactivatedAt: '2026-09-17', appUrl: 'https://hoas-client-4n13.vercel.app' } },
  administrative_report: { config: baseConfig, data: { recipientName: 'Principal', reportTitle: 'Weekly operations', reportType: 'weekly', reportPeriod: 'Sep 9–15', generatedAt: '2026-09-17', generatedBy: 'HOAS', summary: 'Occupancy steady; complaints down 8%.', metrics: [{ label: 'Students', value: 512 }, { label: 'Complaints', value: 23 }, { label: 'Resolved', value: 17 }, { label: 'Leaves', value: 9 }], sections: [{ title: 'Notes', body: 'No escalations pending.' }], reportUrl: 'https://hoas-client-4n13.vercel.app' } },
}
