import { sendMail } from '../src/services/email.service.js';

const TARGET_EMAIL = process.argv[2] || 'ramasaiahemanth@gmail.com';
const BASE_URL = 'https://hoas-client-4n13.vercel.app';

const templates = [
  {
    type: 'account_created',
    data: {
      userName: 'Hemanth Atthuluri',
      role: 'student',
      collegeName: 'National Institute of Advanced Tech',
      loginUrl: `${BASE_URL}/login`,
      tempPassword: 'HOAS-Temp#2026',
      resetLink: `${BASE_URL}/password-reset?token=test-token-123`,
    },
  },
  {
    type: 'email_verification',
    data: {
      userName: 'Hemanth Atthuluri',
      verificationUrl: `${BASE_URL}/verify-email?token=verify-abc-456`,
      expirationTime: '24 hours',
    },
  },
  {
    type: 'password_reset',
    data: {
      userName: 'Hemanth Atthuluri',
      resetUrl: `${BASE_URL}/password-reset?token=reset-xyz-789`,
      expirationTime: '1 hour',
    },
  },
  {
    type: 'account_approved',
    data: {
      userName: 'Hemanth Atthuluri',
      collegeName: 'National Institute of Advanced Tech',
      role: 'Warden',
      approvedBy: 'Campus Dean Administration',
      loginUrl: `${BASE_URL}/login`,
    },
  },
  {
    type: 'account_rejected',
    data: {
      userName: 'Hemanth Atthuluri',
      collegeName: 'National Institute of Advanced Tech',
      role: 'Guest / Visitor',
      reason: 'Official student ID credentials could not be verified against the university database.',
      supportUrl: `${BASE_URL}/support`,
    },
  },
  {
    type: 'role_updated',
    data: {
      userName: 'Hemanth Atthuluri',
      collegeName: 'National Institute of Advanced Tech',
      oldRole: 'student',
      newRole: 'head_warden',
      updatedBy: 'System Administrator',
      dashboardUrl: `${BASE_URL}/dashboard/warden`,
    },
  },
  {
    type: 'access_granted',
    data: {
      userName: 'Hemanth Atthuluri',
      collegeName: 'National Institute of Advanced Tech',
      grantedBy: 'Hostel Management Committee',
      accessLevel: 'Full Administrative Management',
      expiryDate: '2027-06-30',
      loginUrl: `${BASE_URL}/dashboard/management`,
    },
  },
  {
    type: 'complaint_created',
    data: {
      userName: 'Hemanth Atthuluri',
      complaintId: 'CMP-2026-8842',
      category: 'Electrical & Power Supply',
      title: 'AC Room Cooling Unit Circuit Failure',
      description: 'The AC unit in Room 302, Block B has tripped and requires urgent electrician inspection.',
      status: 'Open',
      submittedAt: new Date().toLocaleString('en-IN'),
      complaintUrl: `${BASE_URL}/dashboard/student/complaints`,
    },
  },
  {
    type: 'complaint_updated',
    data: {
      userName: 'Hemanth Atthuluri',
      complaintId: 'CMP-2026-8842',
      category: 'Electrical & Power Supply',
      title: 'AC Room Cooling Unit Circuit Failure',
      oldStatus: 'In Progress',
      newStatus: 'Resolved',
      resolutionNotes: 'Technician replaced the 16A breaker capacitor. System tested and fully operational.',
      updatedAt: new Date().toLocaleString('en-IN'),
      complaintUrl: `${BASE_URL}/dashboard/student/complaints`,
    },
  },
  {
    type: 'leave_submitted',
    data: {
      studentName: 'Hemanth Atthuluri',
      leaveId: 'LV-2026-0914',
      leaveType: 'Home Visit Weekend',
      fromDate: '2026-09-18',
      toDate: '2026-09-21',
      reason: 'Family festival celebration at hometown.',
      submittedAt: new Date().toLocaleString('en-IN'),
      leaveUrl: `${BASE_URL}/dashboard/student/leave`,
    },
  },
  {
    type: 'leave_approved',
    data: {
      studentName: 'Hemanth Atthuluri',
      leaveId: 'LV-2026-0914',
      leaveType: 'Home Visit Weekend',
      fromDate: '2026-09-18',
      toDate: '2026-09-21',
      approvedBy: 'Dr. S. K. Rao (Hostel Warden)',
      approvedAt: new Date().toLocaleString('en-IN'),
      remarks: 'Granted with parent digital sign-off confirmed.',
      leaveUrl: `${BASE_URL}/dashboard/student/leave`,
    },
  },
  {
    type: 'leave_rejected',
    data: {
      studentName: 'Hemanth Atthuluri',
      leaveId: 'LV-2026-0914',
      leaveType: 'Weekday Emergency Leave',
      fromDate: '2026-09-15',
      toDate: '2026-09-16',
      rejectedBy: 'Warden Office',
      rejectedAt: new Date().toLocaleString('en-IN'),
      rejectionReason: 'Scheduled end-term laboratory practical exam falls on the requested date.',
      supportUrl: `${BASE_URL}/support`,
    },
  },
  {
    type: 'new_announcement',
    data: {
      userName: 'Hemanth Atthuluri',
      collegeName: 'National Institute of Advanced Tech',
      announcementTitle: 'Annual Hostel Festival & Sports Tournament 2026',
      announcementBody: 'Registrations are now open for inter-hostel cricket, football, and robotics competitions. Visit the student council desk.',
      priority: 'High',
      postedBy: 'Chief Warden Office',
      postedAt: new Date().toLocaleString('en-IN'),
      actionUrl: `${BASE_URL}/dashboard/student/announcements`,
    },
  },
  {
    type: 'emergency_alert',
    data: {
      userName: 'Hemanth Atthuluri',
      collegeName: 'National Institute of Advanced Tech',
      alertTitle: 'Severe Weather Warning: Heavy Rain & Flash Flood Alert',
      alertMessage: 'City meteorological department issued an orange alert. All students are advised to stay indoors within hostel premises.',
      location: 'Campus Perimeter & Main Hostel Blocks',
      issuedAt: new Date().toLocaleString('en-IN'),
      alertUrl: `${BASE_URL}/dashboard/student/emergency`,
    },
  },
  {
    type: 'support_ticket_created',
    data: {
      userName: 'Hemanth Atthuluri',
      ticketId: 'TCK-9901',
      subject: 'Hostel Wi-Fi Portal Authentication Certificate Issue',
      description: 'Unable to login to campus 5GHz Wi-Fi on Android 15 devices after recent router firmware update.',
      priority: 'Medium',
      submittedAt: new Date().toLocaleString('en-IN'),
      ticketUrl: `${BASE_URL}/dashboard/student/support`,
    },
  },
  {
    type: 'support_ticket_updated',
    data: {
      userName: 'Hemanth Atthuluri',
      ticketId: 'TCK-9901',
      subject: 'Hostel Wi-Fi Portal Authentication Certificate Issue',
      status: 'Resolved',
      resolutionMessage: 'Network team re-issued RADIUS intermediate certificate. Please reconnect and accept new cert.',
      updatedAt: new Date().toLocaleString('en-IN'),
      ticketUrl: `${BASE_URL}/dashboard/student/support`,
    },
  },
  {
    type: 'security_alert',
    data: {
      userName: 'Hemanth Atthuluri',
      alertTitle: 'Unrecognized Device Login Detected',
      alertMessage: 'Your HOAS account was accessed from IP 152.58.18.24 (Hyderabad, India) using Firefox on Windows 11.',
      ipAddress: '152.58.18.24',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0)',
      occurredAt: new Date().toLocaleString('en-IN'),
      actionUrl: `${BASE_URL}/security`,
    },
  },
  {
    type: 'account_deactivated',
    data: {
      userName: 'Hemanth Atthuluri',
      collegeName: 'National Institute of Advanced Tech',
      deactivationReason: 'End of academic session course completion / checkout process.',
      deactivatedAt: new Date().toLocaleString('en-IN'),
      supportUrl: `${BASE_URL}/support`,
    },
  },
  {
    type: 'account_reactivated',
    data: {
      userName: 'Hemanth Atthuluri',
      collegeName: 'National Institute of Advanced Tech',
      reactivatedAt: new Date().toLocaleString('en-IN'),
      loginUrl: `${BASE_URL}/login`,
    },
  },
  {
    type: 'administrative_report',
    data: {
      adminName: 'Chief Administrator',
      collegeName: 'National Institute of Advanced Tech',
      reportPeriod: 'September 2026 Monthly Audit',
      studentCount: 1420,
      complaintCount: 78,
      resolvedComplaints: 75,
      leaveRequests: 312,
      reportUrl: `${BASE_URL}/dashboard/management/reports`,
    },
  },
];

async function runTest() {
  console.log(`\n======================================================`);
  console.log(`HOAS Email Test — Testing All 20 Templates`);
  console.log(`Recipient: ${TARGET_EMAIL}`);
  console.log(`Total Templates: ${templates.length}`);
  console.log(`======================================================\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < templates.length; i++) {
    const item = templates[i];
    const num = i + 1;
    process.stdout.write(`[${num}/20] Sending "${item.type}"... `);

    try {
      const res = await sendMail({
        to: TARGET_EMAIL,
        type: item.type,
        data: item.data,
      });

      console.log(`✅ OK (${res.via || 'sent'})`);
      successCount++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failCount++;
    }

    // Small delay between emails to avoid hitting Gmail SMTP rate limits
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\n======================================================`);
  console.log(`Test Completed!`);
  console.log(`Success: ${successCount}/${templates.length}`);
  console.log(`Failed:  ${failCount}/${templates.length}`);
  console.log(`Target:  ${TARGET_EMAIL}`);
  console.log(`======================================================\n`);
}

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
