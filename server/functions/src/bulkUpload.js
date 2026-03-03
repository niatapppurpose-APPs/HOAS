/**
 * Bulk Upload Cloud Functions
 * Secure bulk student creation from Excel data with per-student welcome emails.
 *
 * SECURITY: No passwords are generated, stored, or transmitted.
 * Each student receives a Firebase password reset link via email.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth, corsOptions } from './config.js';
import * as logger from 'firebase-functions/logger';
import { sendStudentWelcomeEmail, sendBulkUploadSummaryEmail } from './email/emailService.js';
import crypto from 'crypto';

/**
 * Bulk create students from Excel data.
 * Management uploads Excel → parsed data sent here → creates Auth users + Firestore docs + sends emails.
 *
 * For each student:
 * 1. Create Auth user with throwaway password
 * 2. Generate secure password reset link
 * 3. Write Firestore document
 * 4. Send personal welcome email
 *
 * Then send a summary email to the management user.
 */
export const bulkCreateStudents = onCall({ ...corsOptions, timeoutSeconds: 300 }, async (request) => {
  try {
    logger.info('📋 bulkCreateStudents called');

    // ─── Authentication ──────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { students, collegeName, managementId, downloadUrl } = request.data;

    if (!students || !Array.isArray(students) || students.length === 0) {
      throw new HttpsError('invalid-argument', 'students array is required and must not be empty');
    }

    if (!collegeName) {
      throw new HttpsError('invalid-argument', 'collegeName is required');
    }

    logger.info(`📋 Processing ${students.length} students for ${collegeName}`);

    const results = {
      total: students.length,
      created: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      createdStudents: [],
    };

    // ─── Process Each Student ─────────────────────────────────
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const { name, studentId, email } = student;

      // Validate required fields
      if (!name || !email) {
        results.failed++;
        results.errors.push({ index: i + 1, name: name || 'Unknown', reason: 'Missing name or email' });
        continue;
      }

      try {
        // Check for existing user
        let existingUser = null;
        try {
          existingUser = await auth.getUserByEmail(email);
        } catch (e) {
          if (e.code !== 'auth/user-not-found') {
            throw e;
          }
        }

        if (existingUser) {
          results.skipped++;
          results.errors.push({ index: i + 1, name, reason: `Email ${email} already exists` });
          continue;
        }

        // Create Firebase Auth user with throwaway password
        const throwawayPassword = crypto.randomUUID();
        const userRecord = await auth.createUser({
          email: email,
          password: throwawayPassword,
          displayName: name,
          emailVerified: false,
        });

        // Generate secure password reset link
        let resetLink = null;
        try {
          resetLink = await auth.generatePasswordResetLink(email);
        } catch (linkError) {
          logger.warn(`⚠️ Could not generate reset link for ${email}:`, linkError.message);
        }

        // Create Firestore document
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: email,
          displayName: name,
          fullName: name,
          studentId: studentId || '',
          role: 'student',
          status: 'approved',
          collegeName: collegeName,
          managementId: managementId || request.auth.uid,
          isOnline: false,
          createdBy: request.auth.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bulkUploaded: true,
        });

        // Send welcome email
        let emailSent = false;
        if (resetLink) {
          emailSent = await sendStudentWelcomeEmail({
            name,
            studentId: studentId || '',
            email,
            institution: collegeName,
            resetLink,
          });
        }

        results.created++;
        results.createdStudents.push({
          name,
          email,
          studentId: studentId || '',
          emailSent,
        });

        logger.info(`✅ Created student ${i + 1}/${students.length}: ${name} (${email}) — emailSent: ${emailSent}`);

        // Brief delay between students to avoid SMTP throttling
        if (i < students.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (err) {
        results.failed++;
        results.errors.push({ index: i + 1, name, reason: err.message || 'Unknown error' });
        logger.error(`❌ Failed to create student ${name}:`, err.message);
      }
    }

    // ─── Store Bulk Upload Record ─────────────────────────────
    const uploadRecord = {
      uploadedBy: request.auth.uid,
      uploadedByEmail: request.auth.token?.email || 'unknown',
      collegeName: collegeName,
      totalStudents: results.total,
      createdCount: results.created,
      failedCount: results.failed,
      skippedCount: results.skipped,
      downloadUrl: downloadUrl || '',
      errors: results.errors,
      // NOTE: No passwords stored — only name, email, studentId, emailSent status
      createdStudents: results.createdStudents,
      createdAt: new Date().toISOString(),
    };

    await db.collection('bulkUploads').add(uploadRecord);

    // ─── Send Summary Email to Management ─────────────────────
    try {
      await sendBulkUploadSummaryEmail({
        results,
        collegeName,
        uploaderEmail: request.auth.token?.email || '',
        downloadUrl,
      });
      logger.info('📧 Bulk upload summary email sent successfully');
    } catch (emailErr) {
      logger.warn('⚠️ Failed to send bulk summary email:', emailErr.message);
    }

    logger.info(`📋 Bulk upload complete: ${results.created} created, ${results.failed} failed, ${results.skipped} skipped`);

    return {
      success: true,
      message: `Successfully created ${results.created} out of ${results.total} students`,
      results,
    };

  } catch (error) {
    logger.error('❌ Error in bulkCreateStudents:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to bulk create students: ${error.message}`);
  }
});
