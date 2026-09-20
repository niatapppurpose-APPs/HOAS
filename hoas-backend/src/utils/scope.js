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

// Warden student scope: ONLY students assigned to this warden, in their
// hostel, or in their block — always within their own college. Every clause
// requires a set (non-null) key so null == null can never leak the hostel.
export function wardenStudentFilter(user) {
  const or = [{ wardenId: user._id }];
  if (user.hostelId) or.push({ hostelId: idOf(user.hostelId) });
  if (user.hostelBlock) or.push({ hostelBlock: user.hostelBlock });
  return { collegeId: idOf(user.collegeId), $or: or };
}

// Warden complaint scope: complaints assigned to them, complaints filed by
// their scoped students, plus UNASSIGNED complaints in their own hostel.
export async function wardenComplaintFilter(user) {
  const or = [{ assignedWardenId: user._id }];
  try {
    const Student = (await import('../models/User.js')).default;
    const scope = wardenStudentFilter(user);
    const myStudentIds = await Student.distinct('_id', { role: 'student', ...scope });
    if (myStudentIds.length > 0) or.push({ studentId: { $in: myStudentIds } });
  } catch {
    // Fall back to assignment-only scope rather than failing the request.
  }
  if (user.hostelId) {
    or.push({
      hostelId: idOf(user.hostelId),
      $or: [{ assignedWardenId: null }, { assignedWardenId: { $exists: false } }],
    });
  }
  return { $or: or };
}

export async function canWardenAccessComplaint(user, complaint) {
  if (!user || !complaint) return false;
  if (String(complaint.assignedWardenId) === String(user._id)) return true;
  const unassigned = complaint.assignedWardenId === null || complaint.assignedWardenId === undefined;
  if (
    unassigned &&
    !!user.hostelId &&
    !!complaint.hostelId &&
    String(complaint.hostelId) === String(user.hostelId)
  ) return true;
  // Filed by one of my scoped students (even if assigned elsewhere).
  try {
    const Student = (await import('../models/User.js')).default;
    const studentId = complaint.studentId?._id || complaint.studentId;
    if (!studentId) return false;
    const scope = wardenStudentFilter(user);
    const match = await Student.exists({ _id: studentId, role: 'student', ...scope });
    return !!match;
  } catch {
    return false;
  }
}