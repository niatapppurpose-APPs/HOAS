import Outing from '../models/Outing.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { notifyUser } from '../services/notification.service.js';
import { emitToUser, emitToCollege } from '../services/socket.service.js';
import { getSettingsOrDefaults } from '../services/capacity.service.js';

export async function requestOuting(req, res, next) {
  try {
    const student = req.user;
    const settings = await getSettingsOrDefaults();
    if (!settings.features?.outings) throw new AppError(403, 'OUTINGS_DISABLED');
    if (!student.wardenId) throw new AppError(400, 'NO_WARDEN_ASSIGNED');

    const active = await Outing.findOne({
      studentId: student._id,
      status: { $in: ['pending', 'approved'] },
    });
    if (active) throw new AppError(409, 'ACTIVE_OUTING_EXISTS');

    const outTime = new Date(req.body.outTime);
    if (outTime <= new Date()) throw new AppError(400, 'OUT_TIME_MUST_BE_FUTURE');

    const outing = await Outing.create({
      studentId: student._id,
      collegeId: student.collegeId,
      wardenId: student.wardenId,
      destination: req.body.destination,
      reason: req.body.reason,
      outTime,
    });

    const warden = await User.findById(student.wardenId);
    if (warden) {
      await notifyUser(warden, {
        type: 'outing_request',
        title: 'New outing request',
        body: `${student.name} wants to go to ${req.body.destination}`,
        data: { outingId: String(outing._id) },
      });
    }
    emitToCollege(student.collegeId, 'outing:new', outing.toJSON());

    await recordAudit({ actor: student, action: 'OUTING_REQUESTED', targetType: 'Outing', targetId: outing._id });
    res.status(201).json({ outing });
  } catch (error) {
    next(error);
  }
}

export async function decideOuting(req, res, next) {
  try {
    const outing = await Outing.findById(req.params.id);
    if (!outing) throw new AppError(404, 'OUTING_NOT_FOUND');
    if (req.user.role === 'warden' && String(outing.wardenId) !== String(req.user._id)) {
      throw new AppError(403, 'FORBIDDEN');
    }
    if (req.user.role === 'management' && !canManageCollege(req.user, outing.collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }
    if (outing.status !== 'pending') throw new AppError(409, 'NOT_PENDING');

    const { decision, reason, expectedReturnTime } = req.body;

    if (decision === 'approve') {
      if (!expectedReturnTime) throw new AppError(400, 'EXPECTED_RETURN_TIME_REQUIRED');
      const returnTime = new Date(expectedReturnTime);
      if (returnTime <= outing.outTime) throw new AppError(400, 'RETURN_TIME_AFTER_OUT_TIME');
      if (returnTime - outing.outTime > 24 * 60 * 60 * 1000) throw new AppError(400, 'OUTING_MAX_24H');
      outing.status = 'approved';
      outing.expectedReturnTime = returnTime;
    } else if (decision === 'reject') {
      outing.status = 'rejected';
      outing.rejectionReason = reason || '';
    } else {
      throw new AppError(400, 'INVALID_DECISION');
    }

    await outing.save();

    const student = await User.findById(outing.studentId);
    if (student) {
      await notifyUser(student, {
        type: 'outing_status',
        title: decision === 'approve' ? 'Outing approved' : 'Outing rejected',
        body: decision === 'approve'
          ? `Your outing to ${outing.destination} was approved`
          : `Your outing was rejected${reason ? `: ${reason}` : ''}`,
        data: { outingId: String(outing._id), status: outing.status },
      });
      emitToUser(student._id, 'outing:updated', outing.toJSON());
    }

    await recordAudit({
      actor: req.user,
      action: 'OUTING_DECIDED',
      targetType: 'Outing',
      targetId: outing._id,
      metadata: { decision, reason: reason || '' },
    });
    res.json({ outing });
  } catch (error) {
    next(error);
  }
}

export async function markReturn(req, res, next) {
  try {
    const outing = await Outing.findOne({ _id: req.params.id, studentId: req.user._id });
    if (!outing) throw new AppError(404, 'OUTING_NOT_FOUND');
    if (outing.status !== 'approved') throw new AppError(409, 'NOT_APPROVED');

    const now = new Date();
    if (now < outing.outTime) throw new AppError(400, 'OUT_TIME_NOT_REACHED');

    outing.status = 'completed';
    outing.actualReturnTime = now;
    if (outing.expectedReturnTime) {
      const hoursLate = (now - outing.expectedReturnTime) / (60 * 60 * 1000);
      outing.timingStatus = hoursLate > 2 ? 'very-late' : hoursLate > 0 ? 'late' : 'on-time';
    } else {
      outing.timingStatus = 'on-time';
    }
    await outing.save();

    const warden = await User.findById(outing.wardenId);
    if (warden) {
      await notifyUser(warden, {
        type: 'outing_return',
        title: 'Student returned',
        body: `${req.user.name} returned from ${outing.destination} (${outing.timingStatus})`,
        data: { outingId: String(outing._id), timingStatus: outing.timingStatus },
      });
    }
    emitToCollege(outing.collegeId, 'outing:updated', outing.toJSON());

    await recordAudit({
      actor: req.user,
      action: 'OUTING_RETURNED',
      targetType: 'Outing',
      targetId: outing._id,
      metadata: { timingStatus: outing.timingStatus },
    });
    res.json({ outing });
  } catch (error) {
    next(error);
  }
}

export async function listStudentOutings(req, res, next) {
  try {
    const outings = await Outing.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json({ outings });
  } catch (error) {
    next(error);
  }
}

export async function listWardenOutings(req, res, next) {
  try {
    const filter = { wardenId: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const outings = await Outing.find(filter)
      .populate('studentId', 'name email studentId hostelBlock')
      .sort({ createdAt: -1 });
    res.json({ outings });
  } catch (error) {
    next(error);
  }
}

export async function getOutingHistory(req, res, next) {
  try {
    const filter = { status: { $in: ['completed', 'rejected'] } };
    if (req.user.role === 'warden') filter.wardenId = req.user._id;
    else if (req.user.role === 'student') filter.studentId = req.user._id;
    else if (req.user.role === 'management') filter.collegeId = req.user.collegeId;

    const outings = await Outing.find(filter)
      .populate('studentId', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(200);

    const timing = { 'on-time': 0, late: 0, 'very-late': 0 };
    for (const outing of outings) {
      if (outing.timingStatus === 'late') timing.late++;
      else if (outing.timingStatus === 'very-late') timing['very-late']++;
      else timing['on-time']++;
    }
    const total = outings.length;

    res.json({
      outings,
      analytics: {
        total,
        onTime: timing['on-time'],
        late: timing.late,
        veryLate: timing['very-late'],
        onTimePercent: total ? Math.round((timing['on-time'] / total) * 100) : 0,
        latePercent: total ? Math.round((timing.late / total) * 100) : 0,
        veryLatePercent: total ? Math.round((timing['very-late'] / total) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}