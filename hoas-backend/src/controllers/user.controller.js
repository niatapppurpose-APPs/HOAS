import User from '../models/User.js';
import College from '../models/College.js';
import Hostel from '../models/Hostel.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import { notifyUser, notifyAdmins } from '../services/notification.service.js';
import { firebaseAuth } from '../config/firebase.js';
import { emitToUser, broadcastUserUpdate } from '../services/socket.service.js';

const STUDENT_FIELDS = ['studentId', 'rollNumber', 'idNumber', 'feeDetails', 'hostelBlock'];

// A user counts as online only if their last activity is recent (socket
// heartbeats / connects). If lastActiveAt is missing or stale the presence
// dot decays to offline even if isOnline was never flipped off (tab closed,
// network dropped without a disconnect event).
const PRESENCE_TTL_MS = 90 * 1000;

function withPresence(users) {
  const now = Date.now();
  return users.map((u) => {
    const doc = typeof u.toObject === 'function' ? u.toObject() : u;
    doc.isOnline = !!(u.isOnline && u.lastActiveAt && now - new Date(u.lastActiveAt).getTime() < PRESENCE_TTL_MS);
    return doc;
  });
}

export async function listUsers(req, res, next) {
  try {
    const { role, status, search, collegeId } = req.query;
    const filter = {};
    if (req.user.role === 'management') {
      filter.collegeId = req.user.collegeId;
    }
    if (req.user.role === 'warden') {
      filter.collegeId = req.user.collegeId;
    }
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (collegeId) filter.collegeId = collegeId;
    if (search) {
      const searchOr = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }
    const users = await User.find(filter)
      .populate('collegeId', 'name')
      .populate('hostelId', 'name')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ users: withPresence(users) });
  } catch (error) {
    next(error);
  }
}

export async function listManagementUsers(req, res, next) {
  try {
    const users = await User.find({ role: { $in: ['management', 'unknown'] } })
      .populate('collegeId', 'name')
      .sort({ createdAt: -1 });
    res.json({ users: withPresence(users) });
  } catch (error) {
    next(error);
  }
}

export async function createManagement(req, res, next) {
  try {
    const { principalName, email, password, collegeName, location, collegeLogo } = req.body;
    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError(409, 'EMAIL_EXISTS');

    const authUser = await firebaseAuth.createUser({ email: normalizedEmail, password, displayName: principalName });
    const college = await College.findOneAndUpdate(
      { name: collegeName },
      { name: collegeName, location, logoUrl: collegeLogo || null },
      { upsert: true, new: true }
    );

    const user = await User.create({
      uid: authUser.uid,
      email: normalizedEmail,
      name: principalName,
      role: 'management',
      status: 'approved',
      collegeId: college._id,
      collegeName,
      location,
      logoUrl: collegeLogo || null,
      approvedAt: new Date(),
      approvedBy: req.user._id,
      approverRole: req.user.role,
    });

    college.managementId = user._id;
    await college.save();

    const resetLink = await firebaseAuth.generatePasswordResetLink(email);
    await sendWelcomeEmail({
      to: normalizedEmail,
      name: principalName,
      role: 'management',
      extra: [
        { name: 'College', value: collegeName },
        { name: 'Principal', value: principalName },
        { name: 'Email', value: normalizedEmail },
        { name: 'Temporary password', value: password },
      ],
      resetLink,
    });

    await notifyAdmins({
      type: 'management_created',
      title: 'Management account created',
      body: `${principalName} created for ${collegeName}`,
      data: { userId: String(user._id) },
    });

    await recordAudit({ actor: req.user, action: 'MANAGEMENT_CREATED', targetType: 'User', targetId: user._id });
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function createWarden(req, res, next) {
  try {
    const { name, email, password, collegeId, hostelBlock, hostelName } = req.body;
    if (req.user.role === 'management' && String(req.user.collegeId) !== String(collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }

    const college = await College.findById(collegeId);
    if (!college) throw new AppError(404, 'COLLEGE_NOT_FOUND');

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError(409, 'EMAIL_EXISTS');

    const authUser = await firebaseAuth.createUser({ email, password, displayName: name });

    const hostel = await Hostel.findOneAndUpdate(
      { collegeId: college._id, name: hostelName || hostelBlock },
      { collegeId: college._id, name: hostelName || hostelBlock, block: hostelBlock },
      { upsert: true, new: true }
    );

    const user = await User.create({
      uid: authUser.uid,
      email,
      name,
      role: 'warden',
      status: 'approved',
      collegeId: college._id,
      collegeName: college.name,
      hostelId: hostel._id,
      hostelBlock,
      approvedAt: new Date(),
      approvedBy: req.user._id,
      approverRole: req.user.role,
    });

    hostel.wardenId = user._id;
    await hostel.save();

    const resetLink = await firebaseAuth.generatePasswordResetLink(email);
    await sendWelcomeEmail({
      to: email,
      name,
      role: 'warden',
      extra: [
        { name: 'College', value: college.name },
        { name: 'Hostel block', value: hostelBlock || hostelName },
        { name: 'Email', value: email },
        { name: 'Temporary password', value: password },
      ],
      resetLink,
    });

    await recordAudit({ actor: req.user, action: 'WARDEN_CREATED', targetType: 'User', targetId: user._id });
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function approveUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND');
    if (user.status === 'approved') return res.json({ user });
    user.status = 'approved';
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;
    user.approverRole = req.user.role;
    await user.save();
    await recordAudit({ actor: req.user, action: 'USER_APPROVED', targetType: 'User', targetId: user._id });
    broadcastUserUpdate(user);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function denyUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND');
    user.status = 'denied';
    user.deniedAt = new Date();
    user.deniedBy = req.user._id;
    user.denialReason = req.body.reason || '';
    await user.save();
    await recordAudit({
      actor: req.user,
      action: 'USER_DENIED',
      targetType: 'User',
      targetId: user._id,
      metadata: { reason: user.denialReason },
    });
    broadcastUserUpdate(user);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function setUserStatus(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND');
    user.status = req.body.status;
    if (req.body.status === 'approved') user.approvedAt = new Date();
    await user.save();
    await recordAudit({
      actor: req.user,
      action: `USER_${req.body.status.toUpperCase()}`,
      targetType: 'User',
      targetId: user._id,
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function setUserRole(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND');
    if (req.body.role === 'admin' && req.user.role !== 'owner') {
      throw new AppError(403, 'ONLY_OWNER_CAN_ASSIGN_ADMIN');
    }

    user.role = req.body.role;
    if (req.body.collegeId !== undefined) {
      user.collegeId = req.body.collegeId || undefined;
      if (!req.body.collegeId) user.collegeName = undefined;
    }
    await user.save();
    await recordAudit({
      actor: req.user,
      action: 'USER_ROLE_CHANGED',
      targetType: 'User',
      targetId: user._id,
      metadata: { role: user.role, collegeId: req.body.collegeId || null },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateStudentVerification(req, res, next) {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) throw new AppError(404, 'STUDENT_NOT_FOUND');

    if (req.user.role === 'management' && !canManageCollege(req.user, student.collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }
    if (req.user.role === 'warden' && !(student.collegeId && String(req.user.collegeId) === String(student.collegeId))) {
      throw new AppError(403, 'FORBIDDEN');
    }

    const field = req.user.role === 'warden' ? 'wardenVerification' : 'managementVerification';
    const value = req.body.value === 'Verify' ? 'Verified' : 'Not Verified';
    student[field] = value;
    if (value === 'Not Verified') student.unverifyReason = req.body.reason || '';
    else if (field === 'managementVerification') student.unverifyReason = '';
    await student.save();

    await recordAudit({
      actor: req.user,
      action: value === 'Verified' ? 'STUDENT_VERIFIED' : 'STUDENT_UNVERIFIED',
      targetType: 'User',
      targetId: student._id,
      metadata: { field, reason: req.body.reason || '' },
    });
    const realtimeUser = student.toObject();
    emitToUser(student._id, 'user:updated', { user: realtimeUser });
    broadcastUserUpdate(student);
    res.json({ user: student });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) throw new AppError(404, 'USER_NOT_FOUND');
    if (req.user.role === 'management' && !canManageCollege(req.user, target.collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }

    if (target.role === 'management') {
      const wardens = await User.find({ collegeId: target.collegeId, role: 'warden' });
      for (const warden of wardens) {
        const students = await User.find({ wardenId: warden._id });
        for (const student of students) {
          await firebaseAuth.deleteUser(student.uid).catch(() => {});
          await User.findByIdAndDelete(student._id);
        }
        await firebaseAuth.deleteUser(warden.uid).catch(() => {});
        await User.findByIdAndDelete(warden._id);
      }
      await Hostel.deleteMany({ collegeId: target.collegeId });
      await College.findByIdAndDelete(target.collegeId);
    } else {
      const students = await User.find({ wardenId: target._id });
      for (const student of students) {
        await firebaseAuth.deleteUser(student.uid).catch(() => {});
        await User.findByIdAndDelete(student._id);
      }
      await Hostel.updateOne({ wardenId: target._id }, { $unset: { wardenId: 1 } });
    }

    await firebaseAuth.deleteUser(target.uid).catch(() => {});
    await User.findByIdAndDelete(target._id);

    await recordAudit({
      actor: req.user,
      action: 'USER_DELETED',
      targetType: 'User',
      targetId: target._id,
      metadata: { role: target.role, cascade: target.role === 'management' },
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
