/**
 * HOAS Email Templates — Responsive HTML
 * Pure functions: data in → styled HTML string out.
 */

const APP_URL = 'https://hoas-client-4n13.vercel.app';
const year = () => new Date().getFullYear();

/* ───────────── Shared layout wrapper ───────────── */
function layout(title, bodyContent) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:30px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:1px;">HOAS</h1>
      <p style="margin:6px 0 0;font-size:12px;color:#bfdbfe;letter-spacing:2px;text-transform:uppercase;">Hostel Operations Accountability System</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:36px 40px 28px;">
      ${bodyContent}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">&copy; ${year()} HOAS. All rights reserved.</p>
      <p style="margin:0;font-size:11px;color:#cbd5e1;">This is an automated message. Please do not reply directly.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ───────────── Reusable HTML helpers ───────────── */
function sectionTitle(text) {
    return `<h2 style="margin:28px 0 14px;font-size:14px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1.5px;border-bottom:2px solid #dbeafe;padding-bottom:8px;">${text}</h2>`;
}

function infoRow(label, value) {
    return `<tr>
      <td style="padding:6px 0;font-size:14px;color:#64748b;font-weight:600;width:160px;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;font-size:14px;color:#1e293b;font-weight:700;">${value}</td>
    </tr>`;
}

function infoTable(rows) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">${rows}</table>`;
}

function ctaButton(text, url) {
    return `<div style="text-align:center;margin:28px 0 8px;">
    <a href="${url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1e40af);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.5px;">
      ${text}
    </a>
  </div>`;
}

function warningBox(text) {
    return `<div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:6px;margin:18px 0;">
    <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">&#9888;&#65039; ${text}</p>
  </div>`;
}

function infoBox(text) {
    return `<div style="background-color:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;border-radius:6px;margin:18px 0;">
    <p style="margin:0;font-size:13px;color:#1e40af;">${text}</p>
  </div>`;
}

function credentialBox(emailVal, passwordVal) {
    return `<div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:18px 22px;margin:10px 0 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#64748b;">Email</td>
        <td style="padding:4px 0;font-size:14px;color:#166534;font-weight:700;font-family:monospace;">${emailVal}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#64748b;">Password</td>
        <td style="padding:4px 0;font-size:14px;color:#166534;font-weight:700;font-family:monospace;">${passwordVal}</td>
      </tr>
    </table>
  </div>`;
}

/* =====================================================
   1. STUDENT WELCOME EMAIL
   ===================================================== */
export function studentWelcomeTemplate({ name, studentId, email, institution, password, resetLink }) {
    const loginUrl = APP_URL;

    const resetSection = resetLink
        ? `${sectionTitle('Change Your Password')}
      <p style="font-size:14px;color:#475569;margin:0 0 12px;">Use the secure link below to set a new password:</p>
      <div style="text-align:center;margin:16px 0;">
        <a href="${resetLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 30px;border-radius:8px;">
          Reset Password
        </a>
      </div>
      ${infoBox('This link is valid for <strong>1 hour</strong>. If it has expired, use the <strong>"Forgot Password"</strong> option on the login page.')}`
        : '';

    const body = `
      <p style="font-size:16px;color:#1e293b;margin:0 0 6px;">Dear <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px;">
        Your student account has been successfully created in <strong>HOAS</strong> (Hostel Operations Accountability System).
      </p>

      ${sectionTitle('Account Details')}
      ${infoTable(
        infoRow('Name', name) +
        infoRow('Student ID', studentId || 'N/A') +
        infoRow('Email', email) +
        infoRow('Institution', institution)
      )}

      ${sectionTitle('Login Credentials')}
      ${credentialBox(email, password)}

      ${warningBox('Please change your password immediately after your first login for security.')}

      ${resetSection}

      ${ctaButton('Login to HOAS', loginUrl)}

      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">
        If you did not request this account, please contact your administrator immediately.
      </p>

      <p style="font-size:14px;color:#475569;margin:24px 0 0;">
        Regards,<br/><strong>HOAS Administration Team</strong>
      </p>`;

    return layout('Welcome to HOAS - Student Account', body);
}

/* =====================================================
   2. WARDEN WELCOME EMAIL
   ===================================================== */
export function wardenWelcomeTemplate({ name, email, institution, hostelBlock, password }) {
const loginUrl = APP_URL

    const body = `
      <p style="font-size:16px;color:#1e293b;margin:0 0 6px;">Dear <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px;">
        You have been registered as a <strong>Warden</strong> in <strong>HOAS</strong> (Hostel Operations Accountability System).
      </p>

      ${sectionTitle('Account Details')}
      ${infoTable(
        infoRow('Name', name) +
        infoRow('Email', email) +
        infoRow('Institution', institution) +
        infoRow('Hostel Block', hostelBlock || 'Not assigned')
      )}

      ${sectionTitle('Login Credentials')}
      ${credentialBox(email, password)}

      ${warningBox('Please change this password immediately after your first login via <strong>Profile Settings</strong>.')}

      ${ctaButton('Login to HOAS', loginUrl)}

      ${infoBox('If you forget your password later, use the <strong>"Forgot Password"</strong> option on the login page to request a reset link.')}

      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">
        If you did not request this account, please contact the administrator immediately.
      </p>

      <p style="font-size:14px;color:#475569;margin:24px 0 0;">
        Regards,<br/><strong>HOAS Administration Team</strong>
      </p>`;

    return layout('Welcome to HOAS - Warden Account', body);
}

/* =====================================================
   3. MANAGEMENT WELCOME EMAIL
   ===================================================== */
export function managementWelcomeTemplate({ name, email, collegeName, password }) {
const loginUrl = APP_URL

    const body = `
      <p style="font-size:16px;color:#1e293b;margin:0 0 6px;">Dear <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px;">
        Your management account has been successfully created in <strong>HOAS</strong> (Hostel Operations Accountability System).
      </p>

      ${sectionTitle('Account Details')}
      ${infoTable(
        infoRow('Name', name) +
        infoRow('Email', email) +
        infoRow('Institution', collegeName)
      )}

      ${sectionTitle('Login Credentials')}
      ${credentialBox(email, password)}

      ${warningBox('This is a temporary password. Please change it immediately after your first login via <strong>Profile Settings</strong>.')}

      ${ctaButton('Login to HOAS', loginUrl)}

      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">
        If you did not request this account, please contact the system administrator immediately.
      </p>

      <p style="font-size:14px;color:#475569;margin:24px 0 0;">
        Regards,<br/><strong>HOAS Administration Team</strong>
      </p>`;

    return layout('Welcome to HOAS - Management Account', body);
}

/* =====================================================
   4. BULK UPLOAD SUMMARY EMAIL
   ===================================================== */
export function bulkUploadSummaryTemplate({ results, collegeName, uploaderEmail, downloadUrl }) {
    const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const total = results.total || (results.created + results.failed + results.skipped);

    const studentRows = (results.createdStudents || []).map((s, i) =>
        `<tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:8px 10px;font-size:13px;color:#64748b;">${i + 1}</td>
          <td style="padding:8px 10px;font-size:13px;color:#1e293b;font-weight:600;">${s.name}</td>
          <td style="padding:8px 10px;font-size:13px;color:#475569;">${s.studentId || 'N/A'}</td>
          <td style="padding:8px 10px;font-size:13px;color:#475569;">${s.email}</td>
          <td style="padding:8px 10px;font-size:13px;text-align:center;">
            <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;${s.emailSent ? 'background:#dcfce7;color:#166534;' : 'background:#fee2e2;color:#991b1b;'}">${s.emailSent ? 'Sent' : 'Failed'}</span>
          </td>
        </tr>`
    ).join('');

    const errorSection = results.errors && results.errors.length > 0
        ? `${sectionTitle(`Errors (${results.errors.length})`)}
      <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin-bottom:12px;">
        ${results.errors.map(e => `<p style="margin:4px 0;font-size:13px;color:#991b1b;"><strong>${e.name}:</strong> ${e.reason}</p>`).join('')}
      </div>`
        : '';

    const statCard = (label, value, color) =>
        `<td style="text-align:center;padding:12px 8px;">
        <div style="font-size:24px;font-weight:800;color:${color};">${value}</div>
        <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">${label}</div>
      </td>`;

    const body = `
      <p style="font-size:16px;color:#1e293b;margin:0 0 6px;">Dear <strong>Management</strong>,</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 4px;">
        The bulk student upload for <strong>${collegeName}</strong> has been completed. Here is the summary:
      </p>

      ${sectionTitle('Upload Summary')}
      ${infoTable(
        infoRow('College', collegeName) +
        infoRow('Uploaded By', uploaderEmail || 'Management') +
        infoRow('Date', dateStr) +
        (downloadUrl ? infoRow('Original File', `<a href="${downloadUrl}" style="color:#2563eb;text-decoration:underline;">Download</a>`) : '')
      )}

      <!-- Stats cards -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
        <tr>
          ${statCard('Total', total, '#1e293b')}
          ${statCard('Created', results.created, '#16a34a')}
          ${statCard('Failed', results.failed, '#dc2626')}
          ${statCard('Skipped', results.skipped, '#f59e0b')}
        </tr>
      </table>

      ${sectionTitle('Created Students')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr style="background-color:#f1f5f9;">
          <th style="padding:10px;font-size:12px;color:#64748b;font-weight:700;text-align:left;">#</th>
          <th style="padding:10px;font-size:12px;color:#64748b;font-weight:700;text-align:left;">Name</th>
          <th style="padding:10px;font-size:12px;color:#64748b;font-weight:700;text-align:left;">Student ID</th>
          <th style="padding:10px;font-size:12px;color:#64748b;font-weight:700;text-align:left;">Email</th>
          <th style="padding:10px;font-size:12px;color:#64748b;font-weight:700;text-align:center;">Email Status</th>
        </tr>
        ${studentRows}
      </table>

      ${errorSection}

      ${infoBox('Each student has received a personal welcome email with their login credentials. No passwords have been stored by the system.')}

      <p style="font-size:14px;color:#475569;margin:24px 0 0;">
        Regards,<br/><strong>HOAS Administration Team</strong>
      </p>`;

    return layout(`Bulk Upload Report - ${collegeName}`, body);
}
