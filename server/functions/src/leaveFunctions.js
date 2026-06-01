import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { corsOptions } from './config.js';

const db = getFirestore();

// ═════════════════════════════════════════════════════════════
// SECURE: Request Leave with Anti-Spam Protection
// ═════════════════════════════════════════════════════════════
export const requestLeave = onCall(corsOptions, async (request) => {
    const { auth, data } = request;

    // 1. Authenticated Check
    if (!auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to request leave.');
    }

    const { uid } = auth;
    const { leaveType, startDate, endDate, reason, destination, contactNumber, parentContact } = data;

    // 2. Input Validation
    if (!leaveType || !startDate || !endDate || !reason || !destination || !contactNumber || !parentContact) {
        throw new HttpsError('invalid-argument', 'All fields are required.');
    }

    if (new Date(endDate) < new Date(startDate)) {
        throw new HttpsError('invalid-argument', 'End date must be after start date.');
    }

    try {
        // 3. SPAM PROTECTION: 2-Minute Cooldown
        const lastLeaveQuery = await db.collection('leaveRequests')
            .where('studentId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (!lastLeaveQuery.empty) {
            const lastData = lastLeaveQuery.docs[0].data();
            const lastTime = lastData.createdAt?.toDate?.()?.getTime() || 0;
            const now = Date.now();
            const waitTime = 2 * 60 * 1000; // 2 minutes

            if (now - lastTime < waitTime) {
                const remainingSeconds = Math.ceil((waitTime - (now - lastTime)) / 1000);
                throw new HttpsError(
                    'resource-exhausted', 
                    `Please wait ${remainingSeconds} seconds before submitting another request.`
                );
            }
        }

        // 4. SPAM PROTECTION: Max 3 Pending Leave Requests
        const pendingSnapshot = await db.collection('leaveRequests')
            .where('studentId', '==', uid)
            .where('status', '==', 'pending')
            .get();

        if (pendingSnapshot.size >= 3) {
            throw new HttpsError(
                'resource-exhausted', 
                'You already have 3 pending leave requests. Please wait for approval.'
            );
        }

        // 5. Fetch user data for metadata
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'Student profile does not exist.');
        }
        const userData = userDoc.data();

        // 6. Create the Leave Request
        const leaveData = {
            studentId: uid,
            studentName: userData.fullName || userData.displayName || 'Student',
            studentEmail: userData.email,
            roomNumber: userData.roomNumber || '',
            hostelBlock: userData.hostelBlock || '',
            collegeName: userData.collegeName || '',
            managementId: userData.managementId || '',
            wardenId: userData.wardenId || '',
            leaveType,
            startDate,
            endDate,
            reason,
            destination,
            contactNumber,
            parentContact,
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection('leaveRequests').add(leaveData);

        return {
            success: true,
            leaveId: docRef.id,
            message: 'Leave request submitted successfully!'
        };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error('Error requesting leave:', error);
        throw new HttpsError('internal', 'An unexpected error occurred while submitting your leave request.');
    }
});
