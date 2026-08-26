import { AppError } from './AppError.js';
import Hostel from '../models/Hostel.js';

export async function resolveStudentWarden(student) {
  if (!student) return null;
  if (student.wardenId) return student.wardenId;
  if (!student.hostelId) return null;
  const hostel = await Hostel.findById(student.hostelId).select('wardenId');
  return hostel?.wardenId?._id || hostel?.wardenId || null;
}

export function canManageCollege(user, collegeId) {
  if (!user) return false;
  if (user.role === 'owner' || user.role === 'admin') return true;
  if (user.role === 'management') {
    const sameDocId = user.collegeId && String(user.collegeId) === String(collegeId);
    const byUid = user.uid === String(collegeId);
    return sameDocId || byUid;
  }
  if (user.role === 'warden') {
    return user.collegeId && String(user.collegeId) === String(collegeId);
  }
  return false;
}

export function ensureCollegeAccess(user, collegeId) {
  if (!canManageCollege(user, collegeId)) {
    throw new AppError(403, 'FORBIDDEN', 'Not authorized for this college');
  }
}

export function canAccessHostel(user, hostel) {
  if (!user || !hostel) return false;
  if (user.role === 'owner' || user.role === 'admin') return true;
  if (user.role === 'management') return canManageCollege(user, hostel.collegeId);
  if (user.role === 'warden') return String(user.hostelId) === String(hostel._id);
  return false;
}

export function wardenScopeQuery(user) {
  if (user.role === 'warden') {
    return { hostelId: user.hostelId, assignedWardenId: user._id };
  }
  return {};
}

export function studentOwnsRecord(user, record, studentField = 'studentId') {
  if (!record) return false;
  return String(record[studentField]) === String(user._id);
}