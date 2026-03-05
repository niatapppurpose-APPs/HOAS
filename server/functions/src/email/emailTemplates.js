/**
 * HOAS Email Templates €” Plain Text
 * Pure functions: data in †’ plain-text string out. No HTML, no styling.
 */

const year = () => new Date().getFullYear();

const DIVIDER = '----------------------------------------------------------------';

/**
 * Generate the welcome email plain text for a newly created student.
 * @param {Object} data
 * @param {string} data.name - Student full name
 * @param {string} data.studentId - Student ID
 * @param {string} data.email - Student email
 * @param {string} data.institution - Institution / college name
 * @param {string} data.resetLink - Firebase password reset link
 * @param {string} data.appUrl - HOAS application login URL
 * @returns {string} Plain-text email body
 */
export function studentWelcomeTemplate({ name, studentId, email, institution, password, resetLink, appUrl }) {
    const resetSection = resetLink
        ? [
            ``,
            DIVIDER,
            `CHANGE YOUR PASSWORD`,
            DIVIDER,
            `To set a new password, use the secure link below:`,
            ``,
            `Password Reset Link:`,
            `${resetLink}`,
            ``,
            `Note: This link is valid for 1 hour. If it has expired, use the`,
            `"Forgot Password" option on the login page to request a new link.`,
        ]
        : [];

    return [
        `Dear ${name},`,
        ``,
        `Your student account has been successfully created in HOAS`,
        `(Hostel Operations Accountability System).`,
        ``,
        DIVIDER,
        `ACCOUNT DETAILS`,
        DIVIDER,
        `Name              : ${name}`,
        `Student ID        : ${studentId || 'N/A'}`,
        `Registered Email  : ${email}`,
        `Institution       : ${institution}`,
        ``,
        DIVIDER,
        `LOGIN CREDENTIALS`,
        DIVIDER,
        `Email             : ${email}`,
        `Default Password  : ${password}`,
        ``,
        `Please change your password after your first login for security.`,
        ...resetSection,
        ``,
        DIVIDER,
        `LOGIN URL`,
        DIVIDER,
        `${appUrl}`,
        ``,
        DIVIDER,
        `If you did not request this account creation, please contact the`,
        `administrator immediately.`,
        ``,
        `Regards,`,
        `HOAS Administration Team`,
        `Hostel Operations Accountability System`,
        ``,
        `© ${year()} HOAS. All rights reserved. This is an automated message.`,
    ].join('\n');
}

/**
 * Generate the welcome email plain text for a newly created warden.
 * @param {Object} data
 * @param {string} data.name - Warden full name
 * @param {string} data.email - Warden email
 * @param {string} data.institution - Institution / college name
 * @param {string} data.hostelBlock - Assigned hostel block
 * @param {string} data.password - Account password set by management
 * @param {string} data.appUrl - HOAS application login URL
 * @returns {string} Plain-text email body
 */
export function wardenWelcomeTemplate({ name, email, institution, hostelBlock, password, appUrl }) {
    return [
        `Dear ${name},`,
        ``,
        `You have been registered as a Warden in HOAS`,
        `(Hostel Operations Accountability System).`,
        ``,
        DIVIDER,
        `ACCOUNT DETAILS`,
        DIVIDER,
        `Name              : ${name}`,
        `Registered Email  : ${email}`,
        `Institution       : ${institution}`,
        `Hostel Block      : ${hostelBlock || 'Not assigned'}`,
        ``,
        DIVIDER,
        `LOGIN CREDENTIALS`,
        DIVIDER,
        `Email             : ${email}`,
        `Password          : ${password}`,
        ``,
        `IMPORTANT: Please change this password immediately after your first`,
        `login via Profile Settings for account security.`,
        ``,
        DIVIDER,
        `LOGIN URL`,
        DIVIDER,
        `${appUrl}`,
        ``,
        DIVIDER,
        `If you forget your password later, use the "Forgot Password" option`,
        `on the login page to request a reset link.`,
        `If you did not request this account creation, please contact the`,
        `administrator immediately.`,
        ``,
        `Regards,`,
        `HOAS Administration Team`,
        `Hostel Operations Accountability System`,
        ``,
        `© ${year()} HOAS. All rights reserved. This is an automated message.`,
    ].join('\n');
}

/**
 * Generate the welcome email plain text for a newly created management user.
 * @param {Object} data
 * @param {string} data.name - Principal / management user name
 * @param {string} data.email - Management email
 * @param {string} data.collegeName - College name
 * @param {string} data.password - Temporary account password
 * @param {string} data.appUrl - HOAS application login URL
 * @returns {string} Plain-text email body
 */
export function managementWelcomeTemplate({ name, email, collegeName, password, appUrl }) {
    return [
        `Dear ${name},`,
        ``,
        `Your management account has been successfully created in HOAS`,
        `(Hostel Operations Accountability System).`,
        ``,
        DIVIDER,
        `ACCOUNT DETAILS`,
        DIVIDER,
        `Name              : ${name}`,
        `Registered Email  : ${email}`,
        `Institution       : ${collegeName}`,
        ``,
        DIVIDER,
        `LOGIN CREDENTIALS`,
        DIVIDER,
        `Email             : ${email}`,
        `Temporary Password: ${password}`,
        ``,
        `IMPORTANT: This is a temporary password. Please change it`,
        `immediately after your first login via Profile Settings.`,
        ``,
        DIVIDER,
        `LOGIN URL`,
        DIVIDER,
        `${appUrl}`,
        ``,
        DIVIDER,
        `If you did not request this account creation, please contact the`,
        `system administrator immediately.`,
        ``,
        `Regards,`,
        `HOAS Administration Team`,
        `Hostel Operations Accountability System`,
        ``,
        `© ${year()} HOAS. All rights reserved. This is an automated message.`,
    ].join('\n');
}

/**
 * Generate the bulk upload summary email plain text (sent to management).
 * NOTE: No passwords are included €” each student receives their own welcome email.
 * @param {Object} data
 * @param {Object} data.results - { created, failed, skipped, total, errors, createdStudents }
 * @param {string} data.collegeName - College name
 * @param {string} data.uploaderEmail - Management user email
 * @param {string} [data.downloadUrl] - Original Excel download URL
 * @returns {string} Plain-text email body
 */
export function bulkUploadSummaryTemplate({ results, collegeName, uploaderEmail, downloadUrl }) {
    const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const studentLines = (results.createdStudents || []).map((s, i) =>
        `  ${String(i + 1).padStart(3, ' ')}. ${s.name} | ${s.studentId || 'N/A'} | ${s.email} | Email: ${s.emailSent ? 'Sent' : 'Failed'}`
    );

    const errorLines = results.errors && results.errors.length > 0
        ? [
            ``,
            DIVIDER,
            `ERRORS (${results.errors.length})`,
            DIVIDER,
            ...results.errors.map(e => `  - ${e.name}: ${e.reason}`),
        ]
        : [];

    return [
        `Dear Management,`,
        ``,
        `The bulk student upload for ${collegeName} has been completed.`,
        `Below is the summary of the operation.`,
        ``,
        DIVIDER,
        `UPLOAD SUMMARY`,
        DIVIDER,
        `College           : ${collegeName}`,
        `Uploaded By       : ${uploaderEmail || 'Management'}`,
        `Date              : ${dateStr}`,
        ...(downloadUrl ? [`Original File     : ${downloadUrl}`] : []),
        ``,
        `Total Processed   : ${results.total || (results.created + results.failed + results.skipped)}`,
        `Successfully Created: ${results.created}`,
        `Failed            : ${results.failed}`,
        `Skipped (Existing): ${results.skipped}`,
        ``,
        DIVIDER,
        `CREATED STUDENTS`,
        DIVIDER,
        ...studentLines,
        ...errorLines,
        ``,
        DIVIDER,
        `Note: Each student has received a personal welcome email with a`,
        `secure link to set their own password. No passwords have been`,
        `generated or stored by this system.`,
        ``,
        `Regards,`,
        `HOAS Administration Team`,
        `Hostel Operations Accountability System`,
        ``,
        `© ${year()} HOAS. All rights reserved. This is an automated message.`,
    ].join('\n');
}
