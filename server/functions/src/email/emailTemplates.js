/**
 * HOAS Email Templates
 * Pure functions: data in → HTML string out. No side effects.
 * All templates follow HOAS dark-themed branding.
 */

/**
 * Generate the welcome email HTML for a newly created student.
 * @param {Object} data
 * @param {string} data.name - Student full name
 * @param {string} data.studentId - Student ID
 * @param {string} data.email - Student email
 * @param {string} data.institution - Institution / college name
 * @param {string} data.resetLink - Firebase password reset link
 * @param {string} data.appUrl - HOAS application login URL
 * @returns {string} HTML email body
 */
export function studentWelcomeTemplate({ name, studentId, email, institution, resetLink, appUrl }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HOAS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f14; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f14;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">🏠 HOAS</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Hostel Operations Accountability System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #1a1a24; padding: 32px 28px; border-left: 1px solid #2d2d3d; border-right: 1px solid #2d2d3d;">

              <!-- Greeting -->
              <h2 style="color: #f1f5f9; margin: 0 0 8px; font-size: 22px;">Welcome, ${name}! 🎓</h2>
              <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
                Your account has been created by your institution's management. Here are your account details:
              </p>

              <!-- Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #12121a; border: 1px solid #2d2d3d; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 120px;">👤 Name</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #1e1e2e;">🆔 Student ID</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600; border-top: 1px solid #1e1e2e;">${studentId || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #1e1e2e;">📧 Email</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600; border-top: 1px solid #1e1e2e;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #1e1e2e;">🏫 Institution</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600; border-top: 1px solid #1e1e2e;">${institution}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Section -->
              <p style="color: #cbd5e1; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
                To get started, set your password by clicking the button below:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 4px 0 24px;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                      🔐 Set Your Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e1b2e; border-left: 3px solid #f59e0b; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="color: #fbbf24; margin: 0; font-size: 13px; line-height: 1.5;">
                      ⏳ <strong>This link expires in 1 hour.</strong><br>
                      <span style="color: #94a3b8;">If expired, use "Forgot Password" on the login page to get a new link.</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Login URL -->
              <p style="color: #64748b; margin: 0; font-size: 13px;">
                🔗 Login URL: <a href="${appUrl}" style="color: #818cf8; text-decoration: none;">${appUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="background-color: #14141e; padding: 18px 28px; border-left: 1px solid #2d2d3d; border-right: 1px solid #2d2d3d;">
              <p style="color: #64748b; margin: 0; font-size: 12px; line-height: 1.5;">
                ⚠️ If you did not request this account, please ignore this email or contact your institution's management.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0c0c12; padding: 20px 28px; border-radius: 0 0 16px 16px; border: 1px solid #2d2d3d; border-top: none; text-align: center;">
              <p style="color: #475569; margin: 0 0 4px; font-size: 12px;">HOAS — Hostel Operations Accountability System</p>
              <p style="color: #334155; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} All rights reserved. This is an automated message.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate the welcome email HTML for a newly created warden.
 * @param {Object} data
 * @param {string} data.name - Warden full name
 * @param {string} data.email - Warden email
 * @param {string} data.institution - Institution / college name
 * @param {string} data.hostelBlock - Assigned hostel block
 * @param {string} data.resetLink - Firebase password reset link
 * @param {string} data.appUrl - HOAS application login URL
 * @returns {string} HTML email body
 */
export function wardenWelcomeTemplate({ name, email, institution, hostelBlock, resetLink, appUrl }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HOAS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f14; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f14;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">🏠 HOAS</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Hostel Operations Accountability System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #1a1a24; padding: 32px 28px; border-left: 1px solid #2d2d3d; border-right: 1px solid #2d2d3d;">

              <h2 style="color: #f1f5f9; margin: 0 0 8px; font-size: 22px;">Welcome, ${name}! 🛡️</h2>
              <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
                You have been registered as a Warden on HOAS. Here are your account details:
              </p>

              <!-- Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #12121a; border: 1px solid #2d2d3d; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 130px;">👤 Name</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #1e1e2e;">📧 Email</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600; border-top: 1px solid #1e1e2e;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #1e1e2e;">🏫 Institution</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600; border-top: 1px solid #1e1e2e;">${institution}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #1e1e2e;">🏢 Hostel Block</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600; border-top: 1px solid #1e1e2e;">${hostelBlock || 'Not assigned'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #cbd5e1; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
                To get started, set your password by clicking the button below:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 4px 0 24px;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                      🔐 Set Your Password
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e1b2e; border-left: 3px solid #f59e0b; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="color: #fbbf24; margin: 0; font-size: 13px; line-height: 1.5;">
                      ⏳ <strong>This link expires in 1 hour.</strong><br>
                      <span style="color: #94a3b8;">If expired, use "Forgot Password" on the login page to get a new link.</span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; margin: 0; font-size: 13px;">
                🔗 Login URL: <a href="${appUrl}" style="color: #818cf8; text-decoration: none;">${appUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="background-color: #14141e; padding: 18px 28px; border-left: 1px solid #2d2d3d; border-right: 1px solid #2d2d3d;">
              <p style="color: #64748b; margin: 0; font-size: 12px; line-height: 1.5;">
                ⚠️ If you did not request this account, please ignore this email or contact your institution's management.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0c0c12; padding: 20px 28px; border-radius: 0 0 16px 16px; border: 1px solid #2d2d3d; border-top: none; text-align: center;">
              <p style="color: #475569; margin: 0 0 4px; font-size: 12px;">HOAS — Hostel Operations Accountability System</p>
              <p style="color: #334155; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} All rights reserved. This is an automated message.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate the welcome email HTML for a newly created management user.
 * @param {Object} data
 * @param {string} data.name - Principal / management user name
 * @param {string} data.email - Management email
 * @param {string} data.collegeName - College name
 * @param {string} data.resetLink - Firebase password reset link
 * @param {string} data.appUrl - HOAS application login URL
 * @returns {string} HTML email body
 */
export function managementWelcomeTemplate({ name, email, collegeName, resetLink, appUrl }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HOAS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f14; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f14;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #f59e0b); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">🏠 HOAS</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Hostel Operations Accountability System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #1a1a24; padding: 32px 28px; border-left: 1px solid #2d2d3d; border-right: 1px solid #2d2d3d;">

              <h2 style="color: #f1f5f9; margin: 0 0 8px; font-size: 22px;">Welcome, ${name}! 🏛️</h2>
              <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
                A Management account has been created for you on HOAS. You can now manage your institution's hostel operations.
              </p>

              <!-- Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #12121a; border: 1px solid #2d2d3d; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 120px;">👤 Name</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #1e1e2e;">📧 Email</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600; border-top: 1px solid #1e1e2e;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; border-top: 1px solid #1e1e2e;">🏫 College</td>
                        <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; font-weight: 600; border-top: 1px solid #1e1e2e;">${collegeName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #cbd5e1; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
                To get started, set your password by clicking the button below:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 4px 0 24px;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #f59e0b); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                      🔐 Set Your Password
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e1b2e; border-left: 3px solid #f59e0b; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="color: #fbbf24; margin: 0; font-size: 13px; line-height: 1.5;">
                      ⏳ <strong>This link expires in 1 hour.</strong><br>
                      <span style="color: #94a3b8;">If expired, use "Forgot Password" on the login page to get a new link.</span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; margin: 0; font-size: 13px;">
                🔗 Login URL: <a href="${appUrl}" style="color: #818cf8; text-decoration: none;">${appUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="background-color: #14141e; padding: 18px 28px; border-left: 1px solid #2d2d3d; border-right: 1px solid #2d2d3d;">
              <p style="color: #64748b; margin: 0; font-size: 12px; line-height: 1.5;">
                ⚠️ If you did not request this account, please ignore this email or contact the system administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0c0c12; padding: 20px 28px; border-radius: 0 0 16px 16px; border: 1px solid #2d2d3d; border-top: none; text-align: center;">
              <p style="color: #475569; margin: 0 0 4px; font-size: 12px;">HOAS — Hostel Operations Accountability System</p>
              <p style="color: #334155; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} All rights reserved. This is an automated message.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate the bulk upload summary email HTML (sent to management).
 * NOTE: No passwords are included — each student receives their own welcome email.
 * @param {Object} data
 * @param {Object} data.results - { created, failed, skipped, total, errors, createdStudents }
 * @param {string} data.collegeName - College name
 * @param {string} data.uploaderEmail - Management user email
 * @param {string} [data.downloadUrl] - Original Excel download URL
 * @returns {string} HTML email body
 */
export function bulkUploadSummaryTemplate({ results, collegeName, uploaderEmail, downloadUrl }) {
    const studentRowsHtml = (results.createdStudents || []).map((s, i) => `
    <tr style="border-bottom: 1px solid #2d2d3d;">
      <td style="padding: 10px 12px; color: #cbd5e1; font-size: 13px;">${i + 1}</td>
      <td style="padding: 10px 12px; color: #f1f5f9; font-size: 13px;">${s.name}</td>
      <td style="padding: 10px 12px; color: #cbd5e1; font-size: 13px;">${s.studentId || 'N/A'}</td>
      <td style="padding: 10px 12px; color: #cbd5e1; font-size: 13px;">${s.email}</td>
      <td style="padding: 10px 12px; color: ${s.emailSent ? '#4ade80' : '#f87171'}; font-size: 13px; text-align: center;">${s.emailSent ? '✅ Sent' : '❌ Failed'}</td>
    </tr>
  `).join('');

    const errorListHtml = results.errors && results.errors.length > 0
        ? `
      <h3 style="color: #f87171; margin: 24px 0 12px; font-size: 16px;">⚠️ Errors (${results.errors.length})</h3>
      <ul style="color: #94a3b8; font-size: 13px; padding-left: 20px;">
        ${results.errors.map(e => `<li style="margin-bottom: 4px;"><strong style="color: #f1f5f9;">${e.name}</strong>: ${e.reason}</li>`).join('')}
      </ul>
    `
        : '';

    const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HOAS Bulk Upload Summary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f14; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f14;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="700" cellpadding="0" cellspacing="0" style="max-width: 700px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">📋 HOAS Bulk Student Upload</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px;">Student accounts created successfully</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #1a1a24; padding: 28px; border-left: 1px solid #2d2d3d; border-right: 1px solid #2d2d3d;">

              <h2 style="color: #f1f5f9; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; font-size: 18px;">Upload Summary</h2>

              <!-- Stats Cards -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 20px;">
                <tr>
                  <td width="33%" style="padding: 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a2e1a; border-radius: 8px; text-align: center;">
                      <tr><td style="padding: 16px 8px 4px;"><span style="font-size: 28px; font-weight: bold; color: #4ade80;">${results.created}</span></td></tr>
                      <tr><td style="padding: 0 8px 14px;"><span style="color: #4ade80; font-size: 12px;">Created</span></td></tr>
                    </table>
                  </td>
                  <td width="33%" style="padding: 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #2e0a0a; border-radius: 8px; text-align: center;">
                      <tr><td style="padding: 16px 8px 4px;"><span style="font-size: 28px; font-weight: bold; color: #f87171;">${results.failed}</span></td></tr>
                      <tr><td style="padding: 0 8px 14px;"><span style="color: #f87171; font-size: 12px;">Failed</span></td></tr>
                    </table>
                  </td>
                  <td width="33%" style="padding: 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #2e2a0a; border-radius: 8px; text-align: center;">
                      <tr><td style="padding: 16px 8px 4px;"><span style="font-size: 28px; font-weight: bold; color: #fbbf24;">${results.skipped}</span></td></tr>
                      <tr><td style="padding: 0 8px 14px;"><span style="color: #fbbf24; font-size: 12px;">Skipped</span></td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #cbd5e1; font-size: 14px; margin: 8px 0;"><strong style="color: #f1f5f9;">College:</strong> ${collegeName}</p>
              <p style="color: #cbd5e1; font-size: 14px; margin: 8px 0;"><strong style="color: #f1f5f9;">Uploaded by:</strong> ${uploaderEmail || 'Management'}</p>
              <p style="color: #cbd5e1; font-size: 14px; margin: 8px 0;"><strong style="color: #f1f5f9;">Date:</strong> ${dateStr}</p>

              ${downloadUrl ? `<p style="color: #cbd5e1; font-size: 14px; margin: 8px 0;"><strong style="color: #f1f5f9;">📎 Excel File:</strong> <a href="${downloadUrl}" style="color: #818cf8;">Download Original Sheet</a></p>` : ''}

              <!-- Student Table -->
              <h3 style="color: #f1f5f9; margin: 24px 0 12px; font-size: 16px;">👨‍🎓 Created Students</h3>
              <div style="overflow-x: auto;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
                  <thead>
                    <tr style="background: #12121a;">
                      <th style="padding: 12px; text-align: left; color: #94a3b8; font-weight: 600; border-bottom: 1px solid #2d2d3d;">#</th>
                      <th style="padding: 12px; text-align: left; color: #94a3b8; font-weight: 600; border-bottom: 1px solid #2d2d3d;">Name</th>
                      <th style="padding: 12px; text-align: left; color: #94a3b8; font-weight: 600; border-bottom: 1px solid #2d2d3d;">Student ID</th>
                      <th style="padding: 12px; text-align: left; color: #94a3b8; font-weight: 600; border-bottom: 1px solid #2d2d3d;">Email</th>
                      <th style="padding: 12px; text-align: center; color: #94a3b8; font-weight: 600; border-bottom: 1px solid #2d2d3d;">Email Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${studentRowsHtml}
                  </tbody>
                </table>
              </div>

              ${errorListHtml}

              <!-- Info Note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: #0c1a2e; border-left: 3px solid #3b82f6; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0; color: #93c5fd; font-size: 13px; line-height: 1.5;">
                      <strong>ℹ️ Note:</strong> Each student has received a personal welcome email with a secure link to set their own password. No passwords have been generated or stored.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0c0c12; padding: 20px 28px; border-radius: 0 0 12px 12px; border: 1px solid #2d2d3d; border-top: none; text-align: center;">
              <p style="color: #475569; margin: 0; font-size: 12px;">HOAS — Hostel Operations Accountability System</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
