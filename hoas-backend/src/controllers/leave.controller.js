import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { notifyUser } from '../services/notification.service.js';
import { emitToUser, emitToCollege } from '../services/socket.service.js';

export async function requestLeave(req, res, next) {
  try {
    const student = req.user;
    if (!student.collegeId) throw new AppError(400, 'COLLEGE_MISSING');
    if (!student.wardenId) throw new AppError(400, 'NO_WARDEN_ASSIGNED');

    const fromDate = new Date(req.body.fromDate);
    const toDate = new Date(req.body.toDate);
    if (toDate < fromDate) throw new AppError(400, 'INVALID_DATE_RANGE');

    const leave = await LeaveRequest.create({
      studentId: student._id,
      collegeId: student.collegeId,
      wardenId: student.wardenId,
      leaveType: req.body.leaveType,
      reason: req.body.reason,
      fromDate,
      toDate,
    });

    const warden = await User.findById(student.wardenId);
    if (warden) {
      await notifyUser(warden, {
        type: 'leave_request',
        title: 'New leave request',
        body: `${student.name} requested ${req.body.leaveType} leave (${req.body.fromDate} to ${req.body.toDate})`,
        data: { leaveId: String(leave._id) },
      });
    }
    emitToCollege(student.collegeId, 'leave:new', leave.toJSON());

    await recordAudit({ actor: student, action: 'LEAVE_REQUESTED', targetType: 'LeaveRequest', targetId: leave._id });
    res.status(201).json({ leave });
  } catch (error) {
    next(error);
  }
}

export async function listMyLeaves(req, res, next) {
  try {
    const leaves = await LeaveRequest.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (error) {
    next(error);
  }
}

export async function listWardenLeaves(req, res, next) {
  try {
    const filter = { wardenId: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const leaves = await LeaveRequest.find(filter)
      .populate('studentId', 'name email studentId hostelBlock')
      .sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (error) {
    next(error);
  }
}

export async function listManagementLeaves(req, res, next) {
  try {
    const filter = { collegeId: req.user.collegeId };
    if (req.query.status) filter.status = req.query.status;
    const leaves = await LeaveRequest.find(filter)
      .populate('studentId', 'name email studentId')
      .sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (error) {
    next(error);
  }
}

export async function decideLeave(req, res, next) {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) throw new AppError(404, 'LEAVE_NOT_FOUND');
    if (req.user.role === 'warden' && String(leave.wardenId) !== String(req.user._id)) {
      throw new AppError(403, 'FORBIDDEN');
    }
    if (req.user.role === 'management' && !canManageCollege(req.user, leave.collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }
    if (leave.status !== 'pending') throw new AppError(409, 'NOT_PENDING');

    const { decision, reason } = req.body;
    leave.status = decision === 'approve' ? 'approved' : 'denied';
    if (decision === 'deny') leave.denialReason = reason || '';
    if (decision === 'approve') leave.approvedAt = new Date();
    await leave.save();

    const student = await User.findById(leave.studentId);
    if (student) {
      await notifyUser(student, {
        type: 'leave_status',
        title: decision === 'approve' ? 'Leave approved' : 'Leave denied',
        body: decision === 'approve'
          ? `Your ${leave.leaveType} leave was approved`
          : `Your ${leave.leaveType} leave was denied${reason ? `: ${reason}` : ''}`,
        data: { leaveId: String(leave._id), status: leave.status },
      });
      emitToUser(student._id, 'leave:updated', leave.toJSON());
    }

    await recordAudit({
      actor: req.user,
      action: 'LEAVE_DECIDED',
      targetType: 'LeaveRequest',
      targetId: leave._id,
      metadata: { decision, reason: reason || '' },
    });
    res.json({ leave });
  } catch (error) {
    next(error);
  }
}