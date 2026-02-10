import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth, corsOptions } from './config.js';
import * as logger from 'firebase-functions/logger';
import { verifyManagementAccess } from './helpers.js';
import nodemailer from 'nodemailer';

/**
 * Bulk create students from Excel data
 * Management uploads Excel → parsed data sent here → creates Auth users + Firestore docs
 * Sends email notification to naitapppurpose@gmail.com with summary
 */
export const bulkCreateStudents = onCall({ ...corsOptions, timeoutSeconds: 300 }, async (request) => {
    try {
        logger.info('📋 bulkCreateStudents called');

        // Check authentication
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
            createdStudents: []
        };

        // Process each student
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const { name, studentId, email } = student;

            // Validate required fields
            if (!name || !email) {
                results.failed++;
                results.errors.push({ index: i + 1, name: name || 'Unknown', reason: 'Missing name or email' });
                continue;
            }

            // Use studentId as default password (students can change it later)
            const defaultPassword = studentId || `HOAS${String(i + 1).padStart(4, '0')}`;

            try {
                // Check if user already exists
                let existingUser = null;
                try {
                    existingUser = await auth.getUserByEmail(email);
                } catch (e) {
                    // User doesn't exist - good, we'll create them
                    if (e.code !== 'auth/user-not-found') {
                        throw e;
                    }
                }

                if (existingUser) {
                    results.skipped++;
                    results.errors.push({ index: i + 1, name, reason: `Email ${email} already exists` });
                    continue;
                }

                // Create Firebase Auth user
                const userRecord = await auth.createUser({
                    email: email,
                    password: defaultPassword,
                    displayName: name,
                    emailVerified: false
                });

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
                    bulkUploaded: true
                });

                results.created++;
                results.createdStudents.push({
                    name,
                    email,
                    studentId: studentId || '',
                    defaultPassword: defaultPassword
                });

                logger.info(`✅ Created student ${i + 1}/${students.length}: ${name} (${email})`);

            } catch (err) {
                results.failed++;
                results.errors.push({ index: i + 1, name, reason: err.message || 'Unknown error' });
                logger.error(`❌ Failed to create student ${name}:`, err.message);
            }
        }

        // Store bulk upload record in Firestore
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
            createdAt: new Date().toISOString()
        };

        await db.collection('bulkUploads').add(uploadRecord);

        // Send email notification
        try {
            await sendBulkUploadEmail(results, collegeName, downloadUrl, request.auth.token?.email);
            logger.info('📧 Email notification sent successfully');
        } catch (emailErr) {
            logger.warn('⚠️ Failed to send email notification:', emailErr.message);
            // Don't fail the entire operation just because email failed
        }

        logger.info(`📋 Bulk upload complete: ${results.created} created, ${results.failed} failed, ${results.skipped} skipped`);

        return {
            success: true,
            message: `Successfully created ${results.created} out of ${results.total} students`,
            results
        };

    } catch (error) {
        logger.error('❌ Error in bulkCreateStudents:', error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', `Failed to bulk create students: ${error.message}`);
    }
});

/**
 * Send email notification about bulk upload
 */
async function sendBulkUploadEmail(results, collegeName, downloadUrl, uploaderEmail) {
    // Create a transporter using Gmail
    // Note: For production, set up App Password in Firebase environment config
    // firebase functions:config:set gmail.email="naitapppurpose@gmail.com" gmail.password="your-app-password"

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_EMAIL || 'naitapppurpose@gmail.com',
            pass: process.env.GMAIL_APP_PASSWORD || '' // App password required
        }
    });

    const studentListHtml = results.createdStudents.map((s, i) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px;">${i + 1}</td>
      <td style="padding: 8px 12px;">${s.name}</td>
      <td style="padding: 8px 12px;">${s.studentId}</td>
      <td style="padding: 8px 12px;">${s.email}</td>
      <td style="padding: 8px 12px; font-family: monospace;">${s.defaultPassword}</td>
    </tr>
  `).join('');

    const errorListHtml = results.errors.length > 0
        ? `<h3 style="color: #e53e3e;">⚠️ Errors (${results.errors.length})</h3>
       <ul>${results.errors.map(e => `<li><strong>${e.name}</strong>: ${e.reason}</li>`).join('')}</ul>`
        : '';

    const mailOptions = {
        from: `"HOAS System" <${process.env.GMAIL_EMAIL || 'naitapppurpose@gmail.com'}>`,
        to: 'naitapppurpose@gmail.com',
        subject: `📋 HOAS Bulk Upload - ${collegeName} (${results.created} students)`,
        html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📋 HOAS Bulk Student Upload</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Student accounts created successfully</p>
        </div>
        
        <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; border-bottom: 2px solid #4f46e5; padding-bottom: 8px;">Upload Summary</h2>
          
          <div style="display: flex; gap: 16px; margin: 16px 0;">
            <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #16a34a;">${results.created}</div>
              <div style="color: #4ade80; font-size: 12px;">Created</div>
            </div>
            <div style="flex: 1; background: #fef2f2; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${results.failed}</div>
              <div style="color: #f87171; font-size: 12px;">Failed</div>
            </div>
            <div style="flex: 1; background: #fffbeb; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #d97706;">${results.skipped}</div>
              <div style="color: #fbbf24; font-size: 12px;">Skipped</div>
            </div>
          </div>

          <p><strong>College:</strong> ${collegeName}</p>
          <p><strong>Uploaded by:</strong> ${uploaderEmail || 'Management'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          
          ${downloadUrl ? `<p><strong>📎 Excel File:</strong> <a href="${downloadUrl}" style="color: #4f46e5;">Download Original Sheet</a></p>` : ''}
          
          <h3 style="color: #1e293b; margin-top: 24px;">👨‍🎓 Created Students</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 10px 12px; text-align: left;">#</th>
                  <th style="padding: 10px 12px; text-align: left;">Name</th>
                  <th style="padding: 10px 12px; text-align: left;">Student ID</th>
                  <th style="padding: 10px 12px; text-align: left;">Email</th>
                  <th style="padding: 10px 12px; text-align: left;">Default Password</th>
                </tr>
              </thead>
              <tbody>
                ${studentListHtml}
              </tbody>
            </table>
          </div>

          ${errorListHtml}
          
          <div style="margin-top: 24px; padding: 16px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af; font-size: 13px;">
              <strong>ℹ️ Note:</strong> Students can log in using their email and the default password (Student ID). 
              They should change their password after first login.
            </p>
          </div>
        </div>
        
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
          HOAS — Hostel Operations Accountability System
        </p>
      </div>
    `
    };

    await transporter.sendMail(mailOptions);
}
