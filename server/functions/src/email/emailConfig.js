/**
 * HOAS Email Configuration
 * Centralized SMTP environment variable loading and validation.
 * All credentials come from Firebase environment config / secrets.
 *
 * Setup (production):
 *   firebase functions:secrets:set SMTP_HOST
 *   firebase functions:secrets:set SMTP_PORT
 *   firebase functions:secrets:set SMTP_USER
 *   firebase functions:secrets:set SMTP_PASSWORD
 *   firebase functions:secrets:set SMTP_FROM_NAME
 *   firebase functions:secrets:set SMTP_FROM_EMAIL
 *   firebase functions:secrets:set HOAS_APP_URL
 */

import * as logger from 'firebase-functions/logger';

/**
 * Load and validate SMTP configuration from environment variables.
 * Throws a descriptive error if any required variable is missing.
 */
export function getSmtpConfig() {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports (STARTTLS)
    auth: {
      user: process.env.SMTP_USER || process.env.GMAIL_EMAIL || '',
      pass: process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || '',
    },
  };

  // Validate required credentials
  if (!config.auth.user || !config.auth.pass) {
    logger.error(
      '❌ SMTP credentials missing. Set SMTP_USER and SMTP_PASSWORD environment variables. ' +
      'For Gmail, you can also use GMAIL_EMAIL and GMAIL_APP_PASSWORD.'
    );
    throw new Error('SMTP credentials not configured. Email sending is disabled.');
  }

  return config;
}

/**
 * Get the "From" field for outgoing emails.
 */
export function getFromAddress() {
  const name = process.env.SMTP_FROM_NAME || 'HOAS System';
  const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.GMAIL_EMAIL || '';
  return `"${name}" <${email}>`;
}

/**
 * Get the HOAS application URL (for email CTAs and links).
 */
export function getAppUrl() {
  return process.env.HOAS_APP_URL || 'https://hoas-65dee.web.app';
}
