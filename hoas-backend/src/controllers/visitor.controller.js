import Visitor from '../models/Visitor.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege, idOf } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { notifyUser } from '../services/notification.service.js';
import { emitToCollege } from '../services/socket.service.js';
import { getSettingsOrDefaults } from '../services/capacity.service.js';

async function assertVisitorsEnabled() {
  const settings = await getSettingsOrDefaults();
  if (settings?.features?.visitors === false) {
    throw new AppError(403, 'VISITORS_DISABLED');
  }
}

function emitVisitor(visitor) {
  try {
    emitToCollege(visitor.collegeId, 'visitor:updated', visitor.toJSON());
  } catch {
    // sockets are best-effort
  }
}

export async function createVisitor(req, res, next) {
  try {
    await assertVisitorsEnabled();
    const role = req.user.role;
    const collegeId = role === 'student' ? idOf(req.user.collegeId) : req.body.collegeId || idOf(req.user.collegeId);
    if (!collegeId) throw new AppError(400, 'COLLEGE_REQUIRED');
    if (role === 'management' && !canManageCollege(req.user, collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }

    const isWalkIn = role === 'warden' || role === 'management' || role === 'owner' || role === 'admin';
    const visitor = await Visitor.create({
      visitorName: req.body.visitorName,
      phone: req.body.phone,
      purpose: req.body.purpose,
      meetPersonName: req.body.meetPersonName,
      studentId: role === 'student' ? req.user._id : req.body.studentId || undefined,
      collegeId,
      hostelBlock: req.body.hostelBlock || req.user.hostelBlock,
      status: isWalkIn ? 'checked-in' : 'pending',
      requestedBy: role === 'student' ? req.user._id : undefined,
      handledBy: isWalkIn ? req.user._id : undefined,
      checkedInAt: isWalkIn ? new Date() : undefined,
      remarks: req.body.remarks,
    });

    await recordAudit({
      actor: req.user,
      action: isWalkIn ? 'VISITOR_CHECKED_IN' : 'VISITOR_PREREGISTERED',
      targetType: 'Visitor',
      targetId: visitor._id,
    });
    emitVisitor(visitor);
    res.status(201).json({ visitor });
  } catch (error) {
    next(error);
  }
}

export async function listVisitors(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === 'student') {
      filter.$or = [{ requestedBy: req.user._id }, { studentId: req.user._id }];
    } else if (req.user.role === 'warden') {
      filter.collegeId = idOf(req.user.collegeId);
      if (req.user.hostelBlock) filter.hostelBlock = req.user.hostelBlock;
    } else if (req.user.role === 'management') {
      filter.collegeId = idOf(req.user.collegeId);
    }
    if (req.query.status) filter.status = req.query.status;
    const visitors = await Visitor.find(filter)
      .populate('studentId', 'name email studentId')
      .populate('requestedBy', 'name email')
      .populate('handledBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ visitors });
  } catch (error) {
    next(error);
  }
}

export async function decideVisitor(req, res, next) {
  try {
    await assertVisitorsEnabled();
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) throw new AppError(404, 'VISITOR_NOT_FOUND');
    if (req.user.role === 'management' && !canManageCollege(req.user, visitor.collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }
    if (visitor.status !== 'pending') throw new AppError(409, 'NOT_PENDING');

    const { decision } = req.body;
    if (decision === 'approve') {
      visitor.status = 'checked-in';
      visitor.checkedInAt = new Date();
      visitor.handledBy = req.user._id;
    } else if (decision === 'deny') {
      visitor.status = 'denied';
      visitor.handledBy = req.user._id;
      if (req.body.remarks) visitor.remarks = req.body.remarks;
    } else {
      throw new AppError(400, 'INVALID_DECISION');
    }
    await visitor.save();

    const student = visitor.studentId ? await User.findById(visitor.studentId) : null;
    const notifyTarget = student || (visitor.requestedBy ? await User.findById(visitor.requestedBy) : null);
    if (notifyTarget) {
      await notifyUser(notifyTarget, {
        type: 'visitor_status',
        title: decision === 'approve' ? 'Visitor approved' : 'Visitor request denied',
        body: decision === 'approve'
          ? `${visitor.visitorName} has been checked in`
          : `${visitor.visitorName}'s visit was denied${visitor.remarks ? `: ${visitor.remarks}` : ''}`,
        data: { visitorId: String(visitor._id), status: visitor.status },
      });
    }

    await recordAudit({
      actor: req.user,
      action: decision === 'approve' ? 'VISITOR_APPROVED' : 'VISITOR_DENIED',
      targetType: 'Visitor',
      targetId: visitor._id,
    });
    emitVisitor(visitor);
    res.json({ visitor });
  } catch (error) {
    next(error);
  }
}

export async function checkoutVisitor(req, res, next) {
  try {
    await assertVisitorsEnabled();
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) throw new AppError(404, 'VISITOR_NOT_FOUND');
    if (req.user.role === 'management' && !canManageCollege(req.user, visitor.collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }
    if (visitor.status !== 'checked-in') throw new AppError(409, 'NOT_CHECKED_IN');
    visitor.status = 'checked-out';
    visitor.checkedOutAt = new Date();
    visitor.handledBy = req.user._id;
    await visitor.save();

    await recordAudit({
      actor: req.user,
      action: 'VISITOR_CHECKED_OUT',
      targetType: 'Visitor',
      targetId: visitor._id,
    });
    emitVisitor(visitor);
    res.json({ visitor });
  } catch (error) {
    next(error);
  }
}
