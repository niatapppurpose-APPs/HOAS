/**
 * Student Management Cloud Functions
 * Secure single student creation with automated welcome email.
 * Password is never generated, stored, or transmitted.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth, corsOptions } from './config.js';
import * as logger from 'firebase-functions/logger';
import { verifyManagementAccess } from './helpers.js';
import { sendStudentWelcomeEmail } from './email/emailService.js';
import crypto from 'crypto';

/**
 * Create a single student account.
 * Flow: Auth → Reset Link → Firestore → Email
 *
 * Security:
 * - Only authenticated management users can call this.
 * - A throwaway random password is used for auth.createUser() — never stored or sent.
 * - Student receives a secure password reset link via email.
 */
export const createStudent = onCall(corsOptions, async (request) => {
    try {
        logger.info('📋 createStudent called');

        // ─── 1. Authentication Check ───────────────────────────────
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { 
            name, 
            studentId, 
            email, 
            collegeName, 
            managementId, 
            phone, 
            course, 
            branch, 
            year, 
            hostelBlock,
            hostelRoom, 
            fatherName,
            address,
            wardenId // optional explicit assignment
        } = request.data;

        // ─── 2. Input Validation ───────────────────────────────────
        if (!name || !email) {
            throw new HttpsError('invalid-argument', 'name and email are required');
        }
        if (!collegeName) {
            throw new HttpsError('invalid-argument', 'collegeName is required');
        }

        // ─── 3. Authorization (RBAC) ──────────────────────────────
        const effectiveManagementId = managementId || request.auth.uid;
        await verifyManagementAccess(request, effectiveManagementId);

        logger.info(`📋 Creating student: ${name} (${email}) for ${collegeName}`);

        // ─── 4. Duplicate Check ───────────────────────────────────
        try {
            const existingUser = await auth.getUserByEmail(email);
            if (existingUser) {
                throw new HttpsError('already-exists', `A user with email ${email} already exists`);
            }
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
            // User doesn't exist — good, proceed
        }

        // ─── 5. Create Firebase Auth User ─────────────────────────
        // Throwaway password: short & readable, never stored or logged
        const throwawayPassword = crypto.randomBytes(6).toString('hex');

        const userRecord = await auth.createUser({
            email: email,
            password: throwawayPassword,
            displayName: name,
            emailVerified: false,
        });

        logger.info(`✅ Firebase Auth user created: ${userRecord.uid}`);

        // ─── 6. Generate Secure Password Reset Link ───────────────
        let resetLink = null;
        try {
            resetLink = await auth.generatePasswordResetLink(email);
            logger.info(`✅ Password reset link generated for: ${email}`);
        } catch (linkError) {
            logger.error(`❌ Failed to generate reset link for ${email}:`, linkError.message);
            // Continue — account still works, management can share a manual reset later
        }

        // ─── 7. Write to Firestore ────────────────────────────────
        try {
            const studentData = {
                uid: userRecord.uid,
                email: email,
                displayName: name,
                fullName: name,
                studentId: studentId || '',
                role: 'student',
                status: 'approved',
                collegeName: collegeName,
                managementId: effectiveManagementId,
                phone: phone || '',
                course: course || '',
                branch: branch || '',
                year: year || '',
                hostelBlock: hostelBlock || '',
                hostelRoom: hostelRoom || '',
                fatherName: fatherName || '',
                address: address || '',
                isOnline: false,
                createdBy: request.auth.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            if (wardenId) {
                studentData.wardenId = wardenId;
            }
            await db.collection('users').doc(userRecord.uid).set(studentData);

            logger.info(`✅ Firestore document created for: ${userRecord.uid}`);

            // add hostel block to hostels collection if not already present
            if (hostelBlock && collegeName) {
                try {
                    const existing = await db.collection('hostels')
                        .where('name', '==', hostelBlock)
                        .where('collegeName', '==', collegeName)
                        .limit(1)
                        .get();
                    if (existing.empty) {
                        await db.collection('hostels').add({
                            name: hostelBlock,
                            block: hostelBlock,
                            collegeName,
                            createdAt: new Date().toISOString(),
                        });
                    }
                } catch (hostelErr) {
                    logger.warn('⚠️ failed to add hostel block record:', hostelErr.message);
                }
            }
        } catch (firestoreError) {
            // Firestore failed — clean up the auth user to avoid orphans
            logger.error(`❌ Firestore write failed for ${userRecord.uid}. Cleaning up auth user.`, firestoreError.message);
            try {
                await auth.deleteUser(userRecord.uid);
                logger.info(`🧹 Cleaned up orphaned auth user: ${userRecord.uid}`);
            } catch (cleanupError) {
                logger.error(`❌ Failed to clean up auth user ${userRecord.uid}:`, cleanupError.message);
            }
            throw new HttpsError('internal', 'Failed to create student profile. Auth user has been cleaned up.');
        }

        // ─── 8. Attempt warden assignment based on block if not explicitly set ─
        if (!wardenId && hostelBlock && collegeName) {
            try {
                const wardenSnap = await db.collection('users')
                    .where('role', '==', 'warden')
                    .where('collegeName', '==', collegeName)
                    .where('hostelBlock', '==', hostelBlock)
                    .limit(1)
                    .get();
                if (!wardenSnap.empty) {
                    const assigned = wardenSnap.docs[0].id;
                    await db.collection('users').doc(userRecord.uid).update({ wardenId: assigned });
                    logger.info(`➡️ Assigned warden ${assigned} to student ${userRecord.uid}`);
                }
            } catch (assignErr) {
                logger.warn('⚠️ Failed to auto-assign warden:', assignErr.message);
            }
        }

        // ─── 9. Send Welcome Email ────────────────────────────────
        let emailSent = false;
        emailSent = await sendStudentWelcomeEmail({
            name,
            studentId: studentId || '',
            email,
            institution: collegeName,
            password: throwawayPassword,
            resetLink,
        });

        // ─── 10. Return Response ──────────────────────────────────
        logger.info(`✅ Student created successfully: ${name} (${email}) — emailSent: ${emailSent}`);

        return {
            success: true,
            uid: userRecord.uid,
            emailSent,
            message: emailSent
                ? `Student "${name}" created successfully. Welcome email sent.`
                : `Student "${name}" created successfully. Welcome email could not be sent — the student can use "Forgot Password" to set their password.`,
        };
    } catch (error) {
        logger.error('❌ Error in createStudent:', error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', `Failed to create student: ${error.message}`);
    }
});
