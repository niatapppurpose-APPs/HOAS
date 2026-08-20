import { auth } from './firebaseConfig';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const request = async (method, path, payload = null, timeoutMs = 15000) => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = await auth.currentUser.getIdToken();
    const url = `${API_BASE}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(payload ? { 'Content-Type': 'application/json' } : {}),
      },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.message || data.error || 'Request failed';
      throw new Error(message);
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};

const get = (path, timeoutMs) => request('GET', path, null, timeoutMs);
const post = (path, payload, timeoutMs) => request('POST', path, payload, timeoutMs);
const patch = (path, payload) => request('PATCH', path, payload);
const del = (path) => request('DELETE', path);

const getMyProfile = async () => {
  const { user } = await get('/api/auth/me');
  return user;
};

const getMyCollegeId = async () => {
  const user = await getMyProfile();
  return user?.collegeId || null;
};

const requireCollegeId = async (collegeId) => {
  if (collegeId) return collegeId;
  const mine = await getMyCollegeId();
  if (!mine) throw new Error('No college assigned to your account');
  return mine;
};

// =============================================================================
// AUTH & PROFILE
// =============================================================================

export const getMe = getMyProfile;

export const updateProfile = async (profileData) => {
  const { user } = await patch('/api/auth/me', profileData);
  return user;
};

export const registerRequest = async ({ name, role, email }) => {
  const { user } = await post('/api/auth/register', { name, role, email });
  return user;
};

export const getMyNotifications = async () => {
  return get('/api/auth/me/notifications');
};

export const markNotificationRead = async (notificationId) => {
  return patch(`/api/auth/me/notifications/${notificationId}/read`);
};

export const markAllNotificationsRead = async () => {
  return patch('/api/auth/me/notifications/read-all');
};

export const changePassword = async (newPassword) => {
  return post('/api/auth/me/change-password', { newPassword });
};

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export const approveUser = async (userId) => {
  const { user } = await post(`/api/users/${userId}/approve`);
  return { user };
};

export const denyUser = async (userId, reason = '') => {
  const { user } = await post(`/api/users/${userId}/deny`, { reason });
  return { user };
};

export const deleteUserAccount = async (userId) => {
  await del(`/api/users/${userId}`);
  return { ok: true };
};

export const setUserStatus = async (userId, status) => {
  const { user } = await patch(`/api/users/${userId}/status`, { status });
  return { user };
};

export const setUserRole = async (userId, role, collegeId = null) => {
  const { user } = await patch(`/api/users/${userId}/role`, { role, collegeId });
  return { user };
};

export const getAllManagementUsers = async () => {
  return get('/api/users/management');
};

export const createManagement = async (managementData) => {
  const { user } = await post('/api/users/management', managementData);
  return { user };
};

// =============================================================================
// COLLEGE MANAGEMENT
// =============================================================================

export const deleteCollege = async (collegeId) => {
  await del(`/api/colleges/${collegeId}`);
  return { ok: true };
};

// =============================================================================
// SYSTEM SETTINGS
// =============================================================================

export const getSystemSettings = async () => {
  return get('/api/settings');
};

export const getSettingsAuditLogs = async () => {
  return get('/api/settings/audit');
};

export const updateSystemSettings = async (settings) => {
  return patch('/api/settings', settings);
};

export const checkCollegeCapacity = async (collegeId, role) => {
  const capacity = await get(`/api/settings/capacity/${collegeId}`);
  return { ...capacity, role };
};

// =============================================================================
// STUDENTS & WARDENS
// =============================================================================

export const bulkCreateStudents = async (studentsData) => {
  const collegeId = await requireCollegeId(studentsData?.collegeId);
  const results = await post('/api/students/bulk', {
    collegeId,
    students: (studentsData.students || []).map((student) => ({
      ...student,
      collegeId,
      totalFee: student.totalFee ?? student.feeDetails?.totalFee ?? 0,
      paidFee: student.paidFee ?? student.feeDetails?.paidFee ?? 0,
    })),
  }, 5 * 60 * 1000);
  return results;
};

export const createWarden = async (wardenData) => {
  const collegeId = await requireCollegeId(wardenData?.collegeId);
  const { user } = await post('/api/users/warden', { ...wardenData, collegeId });
  return { user };
};

export const createStudent = async (studentData) => {
  const collegeId = await requireCollegeId(studentData?.collegeId);
  const { student } = await post('/api/students', { ...studentData, collegeId });
  return { student };
};

export const listStudents = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return get(`/api/students${query ? `?${query}` : ''}`);
};

export const listUsers = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return get(`/api/users${query ? `?${query}` : ''}`);
};

// =============================================================================
// OUTING PERMISSION & LATE ENTRY TRACKING
// =============================================================================

export const requestOuting = async (destination, reason, outTime) => {
  const { outing } = await post('/api/outings', { destination, reason, outTime });
  return { outing };
};

export const approveOuting = async (outingId, expectedReturnTime) => {
  const { outing } = await post(`/api/outings/${outingId}/decide`, {
    decision: 'approve',
    expectedReturnTime,
  });
  return { outing };
};

export const rejectOuting = async (outingId, rejectionReason) => {
  const { outing } = await post(`/api/outings/${outingId}/decide`, {
    decision: 'reject',
    reason: rejectionReason,
  });
  return { outing };
};

export const markStudentReturn = async (outingId, actualReturnTime) => {
  const { outing } = await post(`/api/outings/${outingId}/return`, { actualReturnTime });
  return { outing };
};

export const getStudentOutings = async () => {
  return get('/api/outings/student');
};

export const getWardenOutings = async () => {
  return get('/api/outings/warden');
};

export const getOutingHistory = async () => {
  return get('/api/outings/history');
};

// =============================================================================
// LEAVES
// =============================================================================

export const requestLeave = async (leaveData) => {
  const { leave } = await post('/api/leaves', {
    leaveType: leaveData.leaveType || leaveData.type,
    reason: leaveData.reason,
    fromDate: leaveData.fromDate,
    toDate: leaveData.toDate,
  });
  return { leave };
};

export const getMyLeaves = async () => {
  return get('/api/leaves/my');
};

export const getWardenLeaves = async () => {
  return get('/api/leaves/warden');
};

export const getManagementLeaves = async () => {
  return get('/api/leaves/management');
};

export const decideLeave = async (leaveId, decision, reason = '') => {
  const { leave } = await post(`/api/leaves/${leaveId}/decide`, { decision, reason });
  return { leave };
};

// =============================================================================
// COMPLAINTS
// =============================================================================

export const fileComplaint = async ({ category, title, description, imageUrl, priority }) => {
  const { complaint } = await post('/api/complaints', {
    category,
    title,
    description,
    imageUrl,
    priority,
  });
  return { complaint };
};

export const getMyComplaints = async () => {
  return get('/api/complaints/my');
};

export const getWardenComplaints = async () => {
  return get('/api/complaints/warden');
};

export const getManagementComplaints = async () => {
  return get('/api/complaints/management');
};

export const updateComplaintStatus = async (complaintId, status, reason = '') => {
  const { complaint } = await patch(`/api/complaints/${complaintId}/status`, { status, reason });
  return { complaint };
};

export const reviewComplaint = async (complaintId, decision, reason = '') => {
  const { complaint } = await post(`/api/complaints/${complaintId}/review`, { decision, reason });
  return { complaint };
};

// =============================================================================
// EMERGENCY LOCATION
// =============================================================================

const toLocationPayload = ({ latitude, longitude, accuracy }) => ({
  lat: latitude,
  lng: longitude,
  accuracy,
});

export const shareEmergencyLocation = async ({ latitude, longitude, accuracy, expiryMinutes = 30 }) => {
  return post('/api/emergency/share', {
    ...toLocationPayload({ latitude, longitude, accuracy }),
    durationMinutes: expiryMinutes,
  }, 30000);
};

export const updateEmergencyLocation = async ({ latitude, longitude, accuracy }) => {
  return post('/api/emergency/update', toLocationPayload({ latitude, longitude, accuracy }), 30000);
};

export const stopEmergencyLocation = async () => {
  return post('/api/emergency/stop', null, 30000);
};

export const getEmergencyLocationSession = async () => {
  return get('/api/emergency/session', 30000);
};

export const getActiveEmergencyLocations = async () => {
  return get('/api/emergency/active', 30000);
};

export const getLocationHistory = async (studentId) => {
  if (!studentId) {
    throw new Error('Student ID is required');
  }
  return get(`/api/emergency/history/${encodeURIComponent(studentId)}`);
};

// =============================================================================
// FEE MANAGEMENT
// =============================================================================

const flattenFee = (fee) => {
  const student = fee.studentId || {};
  return {
    ...fee,
    studentId: student.studentId || student._id,
    studentName: student.name,
    studentEmail: student.email,
    studentUid: student.uid,
  };
};

const parseFeeFile = async (fileBase64, fileName) => {
  const XLSX = (await import('xlsx')).default;
  const binary = atob(fileBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const workbook = XLSX.read(bytes, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
};

export const uploadFeeData = async ({ records, fileBase64, fileName }) => {
  const collegeId = await requireCollegeId(null);
  const parsed = Array.isArray(records) && records.length
    ? records
    : await parseFeeFile(fileBase64, fileName);
  const results = await post('/api/fees/upload', { collegeId, records: parsed });
  return results;
};

export const getStudentFeeDetails = async (studentId) => {
  const { fee } = await get(`/api/fees/student/${encodeURIComponent(studentId)}`);
  return { fee: flattenFee(fee) };
};

export const getManagementFeeRecords = async (status = 'all') => {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  const { fees } = await get(`/api/fees/management${query}`);
  return { records: fees.map(flattenFee) };
};

export const getWardenFeeRecords = async () => {
  const { fees } = await get('/api/fees/warden');
  return { records: fees.map(flattenFee) };
};

export const verifyFeeByManagement = async (studentUid, note = '') => {
  const { fee } = await get(`/api/fees/student/${encodeURIComponent(studentUid)}`);
  const { fee: updated } = await post(`/api/fees/${fee._id}/verify-management`, { note });
  return { fee: flattenFee(updated) };
};

export const verifyFeeByWarden = async (studentUid, approved = true, note = '') => {
  const { fee } = await get(`/api/fees/student/${encodeURIComponent(studentUid)}`);
  const { fee: updated } = await post(`/api/fees/${fee._id}/verify-warden`, { approved, note });
  return { fee: flattenFee(updated) };
};

export const updateStudentVerification = (studentId, value, reason = '') =>
  patch(`/api/users/${studentId}/verification`, { value, reason });

export const uploadStudentFeeProof = async (proofImage) => {
  const { fee } = await post('/api/fees/proof', { proofImageUrl: proofImage });
  return { fee: flattenFee(fee) };
};

export const getStudentFee = async () => {
  const { fee } = await get('/api/fees/me');
  return { fee: flattenFee(fee) };
};

// =============================================================================
// CONTEXT CHAT
// =============================================================================

export const sendContextMessage = async ({ contextType, contextId, message }) => {
  const { message: sent } = await post('/api/chat/send', {
    contextType,
    contextId,
    text: message,
  });
  return { message: sent };
};

export const getContextMessages = async ({ contextType, contextId }) => {
  if (!contextType || !contextId) {
    throw new Error('contextType and contextId are required');
  }
  return get(`/api/chat/${encodeURIComponent(contextType)}/${encodeURIComponent(contextId)}`);
};

export const closeContextConversation = async ({ contextType, contextId, reason = 'closed_by_user' }) => {
  return post(
    `/api/chat/${encodeURIComponent(contextType)}/${encodeURIComponent(contextId)}/close`,
    { reason }
  );
};

// =============================================================================
// ANNOUNCEMENTS / NOTIFICATIONS / SUPPORT
// =============================================================================

export const getAnnouncements = async () => {
  return get('/api/announcements');
};

export const createAnnouncement = async (announcementData) => {
  const { announcement } = await post('/api/announcements', announcementData);
  return { announcement };
};

export const updateAnnouncement = async (announcementId, announcementData) => {
  const { announcement } = await patch(`/api/announcements/${announcementId}`, announcementData);
  return { announcement };
};

export const deleteAnnouncement = async (announcementId) => {
  return del(`/api/announcements/${announcementId}`);
};

export const markAnnouncementRead = async (announcementId) => {
  return post(`/api/announcements/${announcementId}/read`);
};

export const getAllNotifications = async () => {
  return get('/api/notifications/all');
};

export const sendCustomNotification = async (notificationData) => {
  return post('/api/notifications/send', notificationData);
};

export const createSupportTicket = async (ticketData) => {
  const { ticket } = await post('/api/support', ticketData);
  return { ticket };
};

export const listSupportTickets = async () => {
  return get('/api/support');
};

export const resolveSupportTicket = async (ticketId, { status, resolution } = {}) => {
  return patch(`/api/support/${ticketId}`, { status, resolution });
};

export const deleteSupportTicket = async (ticketId) => {
  await del(`/api/support/${ticketId}`);
  return { ok: true };
};

export default {
  getMe,
  updateProfile,
  registerRequest,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  changePassword,
  approveUser,
  denyUser,
  deleteUserAccount,
  getAllManagementUsers,
  createManagement,
  deleteCollege,
  getSystemSettings,
  updateSystemSettings,
  checkCollegeCapacity,
  bulkCreateStudents,
  createWarden,
  createStudent,
  listStudents,
  listUsers,
  requestOuting,
  approveOuting,
  rejectOuting,
  markStudentReturn,
  getStudentOutings,
  getWardenOutings,
  getOutingHistory,
  requestLeave,
  getMyLeaves,
  getWardenLeaves,
  getManagementLeaves,
  decideLeave,
  fileComplaint,
  getMyComplaints,
  getWardenComplaints,
  getManagementComplaints,
  updateComplaintStatus,
  reviewComplaint,
  shareEmergencyLocation,
  updateEmergencyLocation,
  stopEmergencyLocation,
  getEmergencyLocationSession,
  getActiveEmergencyLocations,
  getLocationHistory,
  uploadFeeData,
  getStudentFeeDetails,
  getManagementFeeRecords,
  getWardenFeeRecords,
  verifyFeeByManagement,
  verifyFeeByWarden,
  uploadStudentFeeProof,
  getStudentFee,
  sendContextMessage,
  getContextMessages,
  closeContextConversation,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
  getAllNotifications,
  sendCustomNotification,
  createSupportTicket,
  listSupportTickets,
  resolveSupportTicket,
};
