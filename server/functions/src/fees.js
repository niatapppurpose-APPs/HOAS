/**
 * Fees Management API
 * Express routes for fee management, verification, and payments
 */

import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { db, corsHandler } from './config.js';
import { authenticateRequest } from './reportHelpers.js';
import {
  FEES_COLLECTION,
  USERS_COLLECTION,
  nowTs,
  computeAmounts,
  sanitizeRow,
  toClientFeeRecord,
  isSafeProofUrl,
  getManagementScopeIds,
  studentInManagementScope,
  resolveStudentRef,
  ensureManagementRoleScopeAccess,
  scopeQueryForManagementRole,
  scopeRecordAccessForManagementRole,
  scopeUserAccessForManagementRole,
  getWardenScopeIds,
  wardenOwnsRecord,
  ensureManagementOrAdmin,
  ensureWarden,
  ensureStudent,
  getUserOrThrow,
  normalizeUploadRecords,
} from './feesHelpers.js';

const app = express();
app.use(express.json({ limit: '10mb' }));

function runCors(req, res) {
  return new Promise((resolve, reject) => {
    corsHandler(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

app.use(async (req, res, next) => {
  try {
    await runCors(req, res);
    next();
  } catch {
    res.status(403).json({ error: 'CORS not allowed for this origin' });
  }
});

app.options(/.*/, (req, res) => {
  res.status(200).send('ok');
});

// Upload fee records from CSV/Excel
app.post('/api/fees/upload', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    if (!ensureManagementOrAdmin(userData, res)) return;

    const rawRows = normalizeUploadRecords(req.body);
    const sanitizedRows = rawRows.map(sanitizeRow).filter(Boolean);

    if (!sanitizedRows.length) {
      res.status(400).json({ error: 'No valid fee rows found. Required fields: studentId, totalAmount, paidAmount' });
      return;
    }

    const uploader = await getUserOrThrow(userId);
    const managementScopeIds = getManagementScopeIds(userId, userData);
    const now = nowTs();

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const row of sanitizedRows) {
      try {
        const studentResolved = await resolveStudentRef(row.studentId, managementScopeIds);

        if (!studentResolved) {
          skipped += 1;
          errors.push({ studentId: row.studentId, reason: 'Student not found under this management' });
          continue;
        }

        const studentUser = studentResolved.data;
        if (studentUser.role !== 'student') {
          skipped += 1;
          errors.push({ studentId: row.studentId, reason: 'Provided record is not a student user' });
          continue;
        }

        if (!scopeUserAccessForManagementRole(userData, managementScopeIds, studentUser)) {
          skipped += 1;
          errors.push({ studentId: row.studentId, reason: 'Student does not belong to current management' });
          continue;
        }

        const feeDocId = studentResolved.uid;
        const feeRef = db.collection(FEES_COLLECTION).doc(feeDocId);
        const feeSnap = await feeRef.get();

        const nextData = {
          studentUid: studentResolved.uid,
          studentId: studentUser.studentId || row.studentId,
          studentName: studentUser.fullName || studentUser.displayName || studentUser.name || studentUser.email || 'Student',
          managementId: studentUser.managementId || userId,
          wardenId: studentUser.wardenId || null,
          uploadedBy: userId,
          uploadedByName: uploader.fullName || uploader.displayName || uploader.name || uploader.email || 'Management',
          ...computeAmounts(row.totalAmount, row.paidAmount),
          updatedAt: now,
        };

        const historyEntry = {
          action: 'upload',
          actorId: userId,
          actorRole: userData.role,
          actorName: nextData.uploadedByName,
          note: 'Fee data uploaded by management',
          timestamp: now,
        };

        if (!feeSnap.exists) {
          await feeRef.set({
            ...nextData,
            proofImage: '',
            isVerifiedByManagement: false,
            isVerifiedByWarden: false,
            verifiedByManagementAt: null,
            verifiedByWardenAt: null,
            verifiedByManagementBy: null,
            verifiedByWardenBy: null,
            history: [historyEntry],
            createdAt: now,
          });
          created += 1;
        } else {
          const current = feeSnap.data();
          const mergedHistory = Array.isArray(current.history) ? [...current.history, historyEntry] : [historyEntry];
          await feeRef.set({
            ...nextData,
            proofImage: current.proofImage || '',
            isVerifiedByManagement: false,
            isVerifiedByWarden: false,
            verifiedByManagementAt: null,
            verifiedByWardenAt: null,
            verifiedByManagementBy: null,
            verifiedByWardenBy: null,
            history: mergedHistory,
            createdAt: current.createdAt || now,
          }, { merge: false });
          updated += 1;
        }
      } catch (err) {
        skipped += 1;
        errors.push({ studentId: row.studentId, reason: err.message || 'Upload failed for row' });
      }
    }

    res.status(200).json({
      success: true,
      totalRows: sanitizedRows.length,
      created,
      updated,
      skipped,
      errors,
    });
  } catch (error) {
    console.error('fees upload error', error);
    res.status(500).json({ error: error.message || 'Failed to upload fee records' });
  }
});

// Get fees for management review
app.get('/api/fees/management', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    if (!ensureManagementOrAdmin(userData, res)) return;

    const status = String(req.query.status || '').trim();
    const managementScopeIds = getManagementScopeIds(userId, userData);

    let q = db.collection(FEES_COLLECTION);
    q = scopeQueryForManagementRole(q, userData, managementScopeIds);
    if (status && ['fully_paid', 'partially_paid', 'pending'].includes(status)) {
      q = q.where('paymentStatus', '==', status);
    }

    const snap = await q.get();
    const records = snap.docs.map((docSnap) => toClientFeeRecord(docSnap.data(), docSnap.id));
    records.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    res.status(200).json({ success: true, records });
  } catch (error) {
    console.error('management fee listing error', error);
    res.status(500).json({ error: error.message || 'Failed to fetch fee records' });
  }
});

// Get student's fee record
app.get('/api/fees/student/:id', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    const requestedId = req.params.id;

    const direct = await db.collection(FEES_COLLECTION).doc(requestedId).get();
    let feeDoc = direct;

    if (!feeDoc.exists) {
      const fallback = await db.collection(FEES_COLLECTION)
        .where('studentId', '==', requestedId)
        .limit(1)
        .get();
      feeDoc = fallback.empty ? null : fallback.docs[0];
    }

    if (!feeDoc || !feeDoc.exists) {
      res.status(404).json({ error: 'Fee record not found' });
      return;
    }

    const data = feeDoc.data();
    const managementScopeIds = getManagementScopeIds(userId, userData);

    const allowed =
      userData.role === 'admin' ||
      userData.role === 'owner' ||
      (userData.role === 'management' && scopeRecordAccessForManagementRole(userData, managementScopeIds, data)) ||
      (userData.role === 'warden' && data.wardenId === userId) ||
      (userData.role === 'student' && (data.studentUid === userId || feeDoc.id === userId));

    if (!allowed) {
      res.status(403).json({ error: 'Not allowed to view this fee record' });
      return;
    }

    res.status(200).json({ success: true, record: toClientFeeRecord(data, feeDoc.id) });
  } catch (error) {
    console.error('student fee fetch error', error);
    res.status(500).json({ error: error.message || 'Failed to fetch student fee record' });
  }
});

// Get fees for warden verification
app.get('/api/fees/warden', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    if (!ensureWarden(userData, res)) return;

    const wardenScopeIds = getWardenScopeIds(userId, userData);

    const snap = await db.collection(FEES_COLLECTION)
      .where('wardenId', 'in', wardenScopeIds)
      .where('isVerifiedByManagement', '==', true)
      .get();

    const records = snap.docs.map((docSnap) => toClientFeeRecord(docSnap.data(), docSnap.id));
    records.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    res.status(200).json({ success: true, records });
  } catch (error) {
    console.error('warden fee listing error', error);
    res.status(500).json({ error: error.message || 'Failed to fetch warden fee records' });
  }
});

// Management verification of fees
app.post('/api/fees/verify-management', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    if (!ensureManagementOrAdmin(userData, res)) return;

    const { studentId, note = '' } = req.body || {};
    if (!studentId) {
      res.status(400).json({ error: 'studentId is required' });
      return;
    }

    const targetRef = db.collection(FEES_COLLECTION).doc(studentId);
    const managementScopeIds = getManagementScopeIds(userId, userData);
    const now = nowTs();

    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(targetRef);
      if (!snap.exists) {
        throw new Error('Fee record not found');
      }

      const current = snap.data();
      if (!ensureManagementRoleScopeAccess(userData, managementScopeIds, current.managementId)) {
        throw new Error('Not allowed to verify this student record');
      }

      if (current.isVerifiedByManagement) {
        return { alreadyVerified: true, record: current };
      }

      const history = Array.isArray(current.history) ? [...current.history] : [];
      history.push({
        action: 'management_verify',
        actorId: userId,
        actorRole: userData.role,
        actorName: userData.fullName || userData.displayName || userData.name || userData.email || 'Management',
        note: note || 'Verified by management',
        timestamp: now,
      });

      const patch = {
        isVerifiedByManagement: true,
        verifiedByManagementAt: now,
        verifiedByManagementBy: userId,
        isVerifiedByWarden: false,
        verifiedByWardenAt: null,
        verifiedByWardenBy: null,
        updatedAt: now,
        history,
      };

      tx.update(targetRef, patch);
      return { alreadyVerified: false, record: { ...current, ...patch } };
    });

    res.status(200).json({ success: true, ...updated });
  } catch (error) {
    console.error('verify management error', error);
    res.status(409).json({ error: error.message || 'Management verification failed' });
  }
});

// Warden verification of fees
app.post('/api/fees/verify-warden', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    if (!ensureWarden(userData, res)) return;

    const { studentId, approved = true, note = '' } = req.body || {};
    if (!studentId) {
      res.status(400).json({ error: 'studentId is required' });
      return;
    }

    const targetRef = db.collection(FEES_COLLECTION).doc(studentId);
    const wardenScopeIds = getWardenScopeIds(userId, userData);
    const now = nowTs();

    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(targetRef);
      if (!snap.exists) {
        throw new Error('Fee record not found');
      }

      const current = snap.data();
      if (!wardenOwnsRecord(wardenScopeIds, current)) {
        throw new Error('Not allowed to verify this student record');
      }

      if (!current.isVerifiedByManagement) {
        throw new Error('Management verification is required before warden verification');
      }

      if (!current.proofImage) {
        throw new Error('Payment proof image is required for warden verification');
      }

      if (approved && current.isVerifiedByWarden) {
        return { alreadyVerified: true, record: current };
      }

      const history = Array.isArray(current.history) ? [...current.history] : [];
      history.push({
        action: approved ? 'warden_verify' : 'warden_reject',
        actorId: userId,
        actorRole: userData.role,
        actorName: userData.fullName || userData.displayName || userData.name || userData.email || 'Warden',
        note: note || (approved ? 'Verified by warden' : 'Rejected by warden'),
        timestamp: now,
      });

      const patch = {
        isVerifiedByWarden: Boolean(approved),
        verifiedByWardenAt: approved ? now : null,
        verifiedByWardenBy: approved ? userId : null,
        updatedAt: now,
        history,
      };

      tx.update(targetRef, patch);
      return { alreadyVerified: false, record: { ...current, ...patch } };
    });

    res.status(200).json({ success: true, ...updated });
  } catch (error) {
    console.error('verify warden error', error);
    res.status(409).json({ error: error.message || 'Warden verification failed' });
  }
});

// Student uploads payment proof
app.post('/api/fees/upload-proof', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    if (!ensureStudent(userData, res)) return;

    const { proofImage } = req.body || {};
    if (!proofImage || !isSafeProofUrl(proofImage)) {
      res.status(400).json({ error: 'A valid Firebase Storage proofImage URL is required' });
      return;
    }

    const targetRef = db.collection(FEES_COLLECTION).doc(userId);
    const now = nowTs();

    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(targetRef);
      if (!snap.exists) {
        throw new Error('No fee record found for this student');
      }

      const current = snap.data();
      if (current.studentUid !== userId && snap.id !== userId) {
        throw new Error('Not allowed to upload proof for this record');
      }

      const history = Array.isArray(current.history) ? [...current.history] : [];
      history.push({
        action: 'upload_proof',
        actorId: userId,
        actorRole: userData.role,
        actorName: userData.fullName || userData.displayName || userData.name || userData.email || 'Student',
        note: 'Student uploaded payment proof',
        timestamp: now,
      });

      const patch = {
        proofImage,
        isVerifiedByWarden: false,
        verifiedByWardenAt: null,
        verifiedByWardenBy: null,
        updatedAt: now,
        history,
      };

      tx.update(targetRef, patch);
      return { ...current, ...patch };
    });

    res.status(200).json({ success: true, record: toClientFeeRecord(updated, userId) });
  } catch (error) {
    console.error('upload proof error', error);
    res.status(409).json({ error: error.message || 'Failed to upload proof' });
  }
});

export const feesApi = onRequest({ cors: true, invoker: 'public' }, app);
