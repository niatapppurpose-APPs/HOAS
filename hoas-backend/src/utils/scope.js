import { AppError } from './AppError.js';
import Hostel from '../models/Hostel.js';

export async function resolveStudentWarden(student) {
  if (!student) return null;
  if (student.wardenId) return student.wardenId;
  if (!student.hostelId) return null;
  const hostel = await Hostel.findById(student.hostelId).select('wardenId');
  return hostel?.wardenId?._id || hostel?.wardenId || null;
}

// Normalize anything that may represent a Mongo id into its string form:
// a populated Mongoose document ({ _id, ... }), an ObjectId, or a plain string.
// The HTTP auth middleware populates req.user.collegeId, so every comparison
// and every Mongoose filter MUST go through this helper — String(populatedDoc)
// yields "[object Object]" and silently breaks authorization, queries and
// realtime rooms.
export function idOf(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id !== undefined && value._id !== null) return String(value._id);
    if (typeof value.toHexString === 'function') return value.toHexString();
  }
  return String(value);
}

export function canManageCollege(user, collegeId) {
  if (!user) return false;
  if (user.role === 'owner' || user.role === 'admin') return true;
  const mine = idOf(user.collegeId);
  const target = idOf(collegeId);
  if (user.role === 'management') {
    if (mine && target && mine === target) return true;
    return user.uid === String(target);
  }
  if (user.role === 'warden') {
    return !!mine && !!target && mine === target;
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
  if (user.role === 'warden') {
    const mine = idOf(user.hostelId);
    const target = idOf(hostel._id);
    return !!mine && !!target && mine === target;
  }
  return false;
}

export function wardenScopeQuery(user) {
  if (user.role === 'warden') {
    return { hostelId: user.hostelId, assignedWardenId: user._id };
  }
  return {};
}

// Warden complaint scope: ONLY their assigned complaints plus UNASSIGNED
// complaints in their own hostel. This prevents cross-warden leakage,
// including null == null hostel matches when hostelId is unset.
export function wardenComplaintOr(user) {
  const or = [{ assignedWardenId: user._id }];
  if (user.hostelId) {
    or.push({
      hostelId: user.hostelId,
      $or: [{ assignedWardenId: null }, { assignedWardenId: { $exists: false } }],
    });
  }
  return or;
}

export function canWardenAccessComplaint(user, complaint) {
  if (!user || !complaint) return false;
  if (String(complaint.assignedWardenId) === String(user._id)) return true;
  const unassigned = complaint.assignedWardenId === null || complaint.assignedWardenId === undefined;
  return (
    unassigned &&
    !!user.hostelId &&
    !!complaint.hostelId &&
    String(complaint.hostelId) === String(user.hostelId)
  );
}

export function studentOwnsRecord(user, record, studentField = 'studentId') {
  if (!record) return false;
  return String(record[studentField]) === String(user._id);
}