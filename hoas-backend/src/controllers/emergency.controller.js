import EmergencyLocation from '../models/EmergencyLocation.js';
import LocationHistory from '../models/LocationHistory.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { emitToCollege } from '../services/socket.service.js';

const DEFAULT_EXPIRY_MINUTES = 30;
const MAX_EXPIRY_MINUTES = 60;
const COOLDOWN_SECONDS = 60;

export async function shareLocation(req, res, next) {
  try {
    const student = req.user;
    if (!student.collegeId) throw new AppError(400, 'COLLEGE_MISSING');

    const last = await EmergencyLocation.findOne({ studentId: student._id, isActive: true });
    if (last) {
      return res.json({ session: await serializeSession(last) });
    }

    const recent = await EmergencyLocation.findOne({
      studentId: student._id,
      isActive: false,
      stoppedAt: { $gte: new Date(Date.now() - COOLDOWN_SECONDS * 1000) },
    });
    if (recent) throw new AppError(429, 'SHARE_COOLDOWN', 'Wait 60 seconds before sharing again');

    const { lat, lng, accuracy, durationMinutes } = req.body;
    const expiry = Math.min(
      Math.max(Number(durationMinutes) || DEFAULT_EXPIRY_MINUTES, 5),
      MAX_EXPIRY_MINUTES
    );

    let visibleTo = [];
    if (student.wardenId) {
      visibleTo = [student.wardenId];
    } else {
      const wardens = await User.find({ role: 'warden', collegeId: student.collegeId });
      visibleTo = wardens.map((w) => w._id);
    }

    const session = await EmergencyLocation.create({
      studentId: student._id,
      collegeId: student.collegeId,
      managementId: (await User.findOne({ role: 'management', collegeId: student.collegeId }))?._id || null,
      visibleTo,
      lat,
      lng,
      accuracy,
      expiresAt: new Date(Date.now() + expiry * 60 * 1000),
    });

    await LocationHistory.create({
      sessionId: session._id,
      studentId: student._id,
      lat,
      lng,
      accuracy,
      action: 'share',
    });

    await recordAudit({ actor: student, action: 'LOCATION_SHARED', targetType: 'EmergencyLocation', targetId: session._id });
    emitToCollege(student.collegeId, 'emergency:started', { sessionId: session._id, studentId: student._id });
    res.status(201).json({ session: await serializeSession(session) });
  } catch (error) {
    next(error);
  }
}

export async function updateLocation(req, res, next) {
  try {
    const session = await EmergencyLocation.findOne({ studentId: req.user._id, isActive: true });
    if (!session) throw new AppError(404, 'NO_ACTIVE_SESSION');

    if (session.expiresAt <= new Date()) {
      session.isActive = false;
      session.stoppedAt = new Date();
      await session.save();
      throw new AppError(410, 'SESSION_EXPIRED');
    }

    session.lat = req.body.lat;
    session.lng = req.body.lng;
    session.accuracy = req.body.accuracy;
    session.lastUpdateAt = new Date();
    await session.save();

    await LocationHistory.create({
      sessionId: session._id,
      studentId: req.user._id,
      lat: req.body.lat,
      lng: req.body.lng,
      accuracy: req.body.accuracy,
      action: 'update',
    });

    emitToCollege(req.user.collegeId, 'emergency:updated', {
      sessionId: session._id,
      studentId: req.user._id,
      lat: req.body.lat,
      lng: req.body.lng,
    });
    res.json({ session: await serializeSession(session) });
  } catch (error) {
    next(error);
  }
}

export async function stopSharing(req, res, next) {
  try {
    const session = await EmergencyLocation.findOne({ studentId: req.user._id, isActive: true });
    if (!session) throw new AppError(404, 'NO_ACTIVE_SESSION');

    session.isActive = false;
    session.stoppedAt = new Date();
    await session.save();

    await LocationHistory.create({
      sessionId: session._id,
      studentId: req.user._id,
      lat: session.lat,
      lng: session.lng,
      action: 'stop',
    });

    emitToCollege(req.user.collegeId, 'emergency:stopped', { sessionId: session._id, studentId: req.user._id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function getMySession(req, res, next) {
  try {
    const session = await EmergencyLocation.findOne({ studentId: req.user._id, isActive: true });
    res.json({ session: session ? await serializeSession(session) : null });
  } catch (error) {
    next(error);
  }
}

export async function listActiveSessions(req, res, next) {
  try {
    const now = new Date();
    await EmergencyLocation.updateMany(
      { isActive: true, expiresAt: { $lt: now } },
      { isActive: false, stoppedAt: now }
    );

    const filter = { isActive: true, expiresAt: { $gt: now } };
    if (req.user.role === 'warden') filter.visibleTo = req.user._id;
    else if (req.user.role === 'management') {
      filter.$or = [{ collegeId: req.user.collegeId }, { visibleTo: req.user._id }];
    }

    const sessions = await EmergencyLocation.find(filter)
      .populate('studentId', 'name studentId hostelBlock')
      .sort({ startedAt: -1 });
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function getLocationHistory(req, res, next) {
  try {
    let target = null;
    if (/^[0-9a-fA-F]{24}$/.test(req.params.studentId)) {
      target = await User.findById(req.params.studentId);
    }
    if (!target) {
      target = await User.findOne({ uid: req.params.studentId });
    }
    if (!target) throw new AppError(404, 'STUDENT_NOT_FOUND');

    const allowed =
      req.user.role === 'owner' ||
      req.user.role === 'admin' ||
      (req.user.role === 'student' && String(target._id) === String(req.user._id)) ||
      (req.user.role === 'management' && canManageCollege(req.user, target.collegeId)) ||
      (req.user.role === 'warden' && String(target.wardenId) === String(req.user._id));
    if (!allowed) throw new AppError(403, 'FORBIDDEN');

    const history = await LocationHistory.find({ studentId: target._id }).sort({ createdAt: -1 }).limit(100);
    res.json({ history });
  } catch (error) {
    next(error);
  }
}

async function serializeSession(session) {
  const student = await User.findById(session.studentId).select('name studentId hostelBlock');
  return { ...session.toJSON(), student };
}