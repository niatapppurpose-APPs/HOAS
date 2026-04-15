/**
 * Fees Helper Functions & Utilities
 * Shared utility functions for fee management
 */

import { db } from './config.js';

export const FEES_COLLECTION = 'studentFees';
export const USERS_COLLECTION = 'users';

export function nowTs() {
  return Date.now();
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function computeAmounts(totalAmount, paidAmount) {
  const total = Math.max(0, Number(totalAmount) || 0);
  const paid = Math.min(total, Math.max(0, Number(paidAmount) || 0));
  const remaining = Math.max(0, total - paid);

  let paymentStatus = 'pending';
  if (paid >= total && total > 0) {
    paymentStatus = 'fully_paid';
  } else if (paid > 0) {
    paymentStatus = 'partially_paid';
  }

  return {
    totalAmount: total,
    paidAmount: paid,
    remainingAmount: remaining,
    paymentStatus,
  };
}

export function sanitizeRow(row) {
  if (!row || typeof row !== 'object') return null;

  const rawStudentId = row.studentId ?? row.studentID ?? row.StudentId ?? row.StudentID;
  if (!rawStudentId) return null;

  const studentId = String(rawStudentId).trim();
  const totalAmount = toNumber(row.totalAmount ?? row.total ?? row.TotalAmount ?? row.Total);
  const paidAmount = toNumber(row.paidAmount ?? row.paid ?? row.PaidAmount ?? row.Paid);

  if (!studentId || totalAmount <= 0 || paidAmount < 0) {
    return null;
  }

  return {
    studentId,
    ...computeAmounts(totalAmount, paidAmount),
  };
}

export function isSafeProofUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const safe = /^(https:\/\/firebasestorage\.googleapis\.com\/|https:\/\/storage\.googleapis\.com\/|https:\/\/.*\.googleusercontent\.com\/)/i;
  return safe.test(url);
}

export function toClientFeeRecord(record, id) {
  return {
    id,
    studentUid: record.studentUid || null,
    studentId: record.studentId,
    studentName: record.studentName || 'Unknown Student',
    totalAmount: record.totalAmount,
    paidAmount: record.paidAmount,
    remainingAmount: record.remainingAmount,
    paymentStatus: record.paymentStatus,
    proofImage: record.proofImage || '',
    isVerifiedByManagement: Boolean(record.isVerifiedByManagement),
    isVerifiedByWarden: Boolean(record.isVerifiedByWarden),
    uploadedBy: record.uploadedBy || '',
    uploadedByName: record.uploadedByName || '',
    verifiedByManagementAt: record.verifiedByManagementAt || null,
    verifiedByWardenAt: record.verifiedByWardenAt || null,
    verifiedByManagementBy: record.verifiedByManagementBy || null,
    verifiedByWardenBy: record.verifiedByWardenBy || null,
    managementId: record.managementId || null,
    wardenId: record.wardenId || null,
    updatedAt: record.updatedAt || null,
    createdAt: record.createdAt || null,
    history: Array.isArray(record.history) ? record.history : [],
  };
}

// Authorization & Scoping Functions

export function getManagementScopeIds(userId, userData) {
  const ids = [userId];
  if (userData?.managementId && userData.managementId !== userId) {
    ids.push(userData.managementId);
  }
  return ids;
}

export function studentInManagementScope(studentUser, managementScopeIds) {
  const studentManagementId = studentUser?.managementId;
  return Boolean(studentManagementId) && managementScopeIds.includes(studentManagementId);
}

export async function resolveStudentRef(inputStudentId, managementScopeIds) {
  const directDoc = await db.collection(USERS_COLLECTION).doc(inputStudentId).get();
  if (directDoc.exists) {
    const directData = directDoc.data();
    if (directData?.role === 'student' && studentInManagementScope(directData, managementScopeIds)) {
      return {
        uid: directDoc.id,
        data: directData,
      };
    }
  }

  // Query by studentId and filter in memory
  const byStudentId = await db.collection(USERS_COLLECTION)
    .where('studentId', '==', inputStudentId)
    .limit(10)
    .get();

  if (!byStudentId.empty) {
    const match = byStudentId.docs.find((docSnap) => {
      const data = docSnap.data();
      return data?.role === 'student' && studentInManagementScope(data, managementScopeIds);
    });

    if (match) {
      return {
        uid: match.id,
        data: match.data(),
      };
    }
  }

  return null;
}

export function ensureManagementRoleScopeAccess(userData, managementScopeIds, targetManagementId) {
  if (userData?.role !== 'management') return true;
  return Boolean(targetManagementId) && managementScopeIds.includes(targetManagementId);
}

export function scopeQueryForManagementRole(query, userData, managementScopeIds) {
  if (userData?.role !== 'management') return query;
  const scopedId = userData.managementId || managementScopeIds[0];
  return query.where('managementId', '==', scopedId);
}

export function scopeRecordAccessForManagementRole(userData, managementScopeIds, record) {
  if (userData?.role !== 'management') return true;
  return Boolean(record?.managementId) && managementScopeIds.includes(record.managementId);
}

export function scopeUserAccessForManagementRole(userData, managementScopeIds, studentUser) {
  if (userData?.role !== 'management') return true;
  return studentInManagementScope(studentUser, managementScopeIds);
}

export function getWardenScopeIds(userId, userData) {
  const ids = [userId];
  if (userData?.wardenId && userData.wardenId !== userId) {
    ids.push(userData.wardenId);
  }
  return ids;
}

export function wardenOwnsRecord(wardenScopeIds, record) {
  return Boolean(record?.wardenId) && wardenScopeIds.includes(record.wardenId);
}

// Role Validation Functions

export function ensureManagementOrAdmin(userData, res) {
  if (!['management', 'admin', 'owner'].includes(userData?.role)) {
    res.status(403).json({ error: 'Only management can perform this action' });
    return false;
  }
  return true;
}

export function ensureWarden(userData, res) {
  if (userData?.role !== 'warden') {
    res.status(403).json({ error: 'Only wardens can perform this action' });
    return false;
  }
  return true;
}

export function ensureStudent(userData, res) {
  if (userData?.role !== 'student') {
    res.status(403).json({ error: 'Only students can perform this action' });
    return false;
  }
  return true;
}

// Data Retrieval Functions

export async function getUserOrThrow(userId) {
  const userSnap = await db.collection(USERS_COLLECTION).doc(userId).get();
  if (!userSnap.exists) {
    throw new Error('User not found');
  }
  return userSnap.data();
}

// Parse file helpers

import XLSX from 'xlsx';

export function parseCsvData(csvData) {
  const workbook = XLSX.read(csvData, { type: 'string' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
}

export function parseExcelBase64(fileBase64, fileName = '') {
  const workbook = XLSX.read(fileBase64, { type: 'base64' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

  if (!rows.length) {
    throw new Error(`No rows found in ${fileName || 'uploaded file'}`);
  }

  return rows;
}

export function normalizeUploadRecords(payload) {
  const { records, csvData, fileBase64, fileName } = payload || {};

  if (Array.isArray(records) && records.length) {
    return records;
  }

  if (typeof csvData === 'string' && csvData.trim()) {
    return parseCsvData(csvData);
  }

  if (typeof fileBase64 === 'string' && fileBase64.trim()) {
    return parseExcelBase64(fileBase64, fileName);
  }

  throw new Error('Provide records, csvData, or fileBase64');
}
