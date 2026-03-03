/**
 * HOAS Email Service
 * NodeMailer transport factory + send functions.
 * All email sending routes through this module — single point of control.
 */

import nodemailer from 'nodemailer';
import * as logger from 'firebase-functions/logger';
import { getSmtpConfig, getFromAddress, getAppUrl } from './emailConfig.js';
import {
    studentWelcomeTemplate,
    wardenWelcomeTemplate,
    managementWelcomeTemplate,
    bulkUploadSummaryTemplate,
} from './emailTemplates.js';

/**
 * Create a configured NodeMailer transporter.
 * Uses centralized SMTP config from emailConfig.js.
 * @returns {import('nodemailer').Transporter}
 */
function createTransporter() {
    const smtpConfig = getSmtpConfig();
    return nodemailer.createTransport(smtpConfig);
}

/**
 * Send a welcome email to a newly created student.
 * Contains account details and a secure password reset link.
 *
 * @param {Object} data
 * @param {string} data.name - Student full name
 * @param {string} data.studentId - Student ID
 * @param {string} data.email - Student email
 * @param {string} data.institution - Institution / college name
 * @param {string} data.resetLink - Firebase password reset link
 * @returns {Promise<boolean>} true if sent successfully, false otherwise
 */
export async function sendStudentWelcomeEmail({ name, studentId, email, institution, resetLink }) {
    try {
        const transporter = createTransporter();
        const appUrl = getAppUrl();

        const html = studentWelcomeTemplate({ name, studentId, email, institution, resetLink, appUrl });

        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: `🎓 Welcome to HOAS — Set Your Password`,
            html,
            text: `Welcome to HOAS, ${name}!\n\nYour student account has been created.\n\nStudent ID: ${studentId || 'N/A'}\nEmail: ${email}\nInstitution: ${institution}\n\nSet your password: ${resetLink}\n\nThis link expires in 1 hour. If expired, use "Forgot Password" on the login page.\n\nLogin URL: ${appUrl}\n\n— HOAS System`,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`📧 Welcome email sent to student: ${email}`);
        return true;
    } catch (error) {
        logger.error(`❌ Failed to send welcome email to ${email}:`, error.message);
        return false;
    }
}

/**
 * Send a welcome email to a newly created warden.
 *
 * @param {Object} data
 * @param {string} data.name - Warden full name
 * @param {string} data.email - Warden email
 * @param {string} data.institution - Institution / college name
 * @param {string} data.hostelBlock - Assigned hostel block
 * @param {string} data.resetLink - Firebase password reset link
 * @returns {Promise<boolean>} true if sent successfully, false otherwise
 */
export async function sendWardenWelcomeEmail({ name, email, institution, hostelBlock, resetLink }) {
    try {
        const transporter = createTransporter();
        const appUrl = getAppUrl();

        const html = wardenWelcomeTemplate({ name, email, institution, hostelBlock, resetLink, appUrl });

        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: `🛡️ Welcome to HOAS — Warden Account Created`,
            html,
            text: `Welcome to HOAS, ${name}!\n\nYou have been registered as a Warden.\n\nEmail: ${email}\nInstitution: ${institution}\nHostel Block: ${hostelBlock || 'Not assigned'}\n\nSet your password: ${resetLink}\n\nThis link expires in 1 hour. If expired, use "Forgot Password" on the login page.\n\nLogin URL: ${appUrl}\n\n— HOAS System`,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`📧 Welcome email sent to warden: ${email}`);
        return true;
    } catch (error) {
        logger.error(`❌ Failed to send warden welcome email to ${email}:`, error.message);
        return false;
    }
}

/**
 * Send a welcome email to a newly created management user.
 *
 * @param {Object} data
 * @param {string} data.name - Principal / management user name
 * @param {string} data.email - Management email
 * @param {string} data.collegeName - College name
 * @param {string} data.resetLink - Firebase password reset link
 * @returns {Promise<boolean>} true if sent successfully, false otherwise
 */
export async function sendManagementWelcomeEmail({ name, email, collegeName, resetLink }) {
    try {
        const transporter = createTransporter();
        const appUrl = getAppUrl();

        const html = managementWelcomeTemplate({ name, email, collegeName, resetLink, appUrl });

        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: `🏛️ Welcome to HOAS — Management Account Created`,
            html,
            text: `Welcome to HOAS, ${name}!\n\nA Management account has been created for you.\n\nEmail: ${email}\nCollege: ${collegeName}\n\nSet your password: ${resetLink}\n\nThis link expires in 1 hour. If expired, use "Forgot Password" on the login page.\n\nLogin URL: ${appUrl}\n\n— HOAS System`,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`📧 Welcome email sent to management: ${email}`);
        return true;
    } catch (error) {
        logger.error(`❌ Failed to send management welcome email to ${email}:`, error.message);
        return false;
    }
}

/**
 * Send a bulk upload summary email to the management user.
 *
 * @param {Object} data
 * @param {Object} data.results - Bulk upload results { created, failed, skipped, total, errors, createdStudents }
 * @param {string} data.collegeName - College name
 * @param {string} data.uploaderEmail - Management user who performed the upload
 * @param {string} [data.downloadUrl] - Original Excel file download URL
 * @returns {Promise<boolean>} true if sent successfully, false otherwise
 */
export async function sendBulkUploadSummaryEmail({ results, collegeName, uploaderEmail, downloadUrl }) {
    try {
        const transporter = createTransporter();

        const html = bulkUploadSummaryTemplate({ results, collegeName, uploaderEmail, downloadUrl });

        const mailOptions = {
            from: getFromAddress(),
            to: uploaderEmail,
            subject: `📋 HOAS Bulk Upload — ${collegeName} (${results.created} students created)`,
            html,
            text: `HOAS Bulk Upload Summary\n\nCollege: ${collegeName}\nCreated: ${results.created}\nFailed: ${results.failed}\nSkipped: ${results.skipped}\nTotal: ${results.total}\n\nEach student has received a personal welcome email with a link to set their own password.\n\n— HOAS System`,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`📧 Bulk upload summary email sent to: ${uploaderEmail}`);
        return true;
    } catch (error) {
        logger.error(`❌ Failed to send bulk upload summary email:`, error.message);
        return false;
    }
}
