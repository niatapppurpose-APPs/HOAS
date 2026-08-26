import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege, canAccessHostel, resolveStudentWarden } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import {
  computeSlaDeadline,
  notifyComplaintCreated,
  notifyComplaintStatusChange,
  appendHistory,
} from '../services/complaint.service.js';

const STUDENT_ROLES = ['owner', 'admin'];

export async function createComplaint(req, res, next) {
  try {
    const student = req.user;
    if (student.role !== 'student') throw new AppError(403, 'ONLY_STUDENT_CAN_CREATE');
    if (!student.collegeId || !student.hostelId) throw new AppError(400, 'COLLEGE_OR_HOSTEL_MISSING');

    const complaint = await Complaint.create({
      studentId: student._id,
      collegeId: student.collegeId,
      hostelId: student.hostelId,
      assignedWardenId: await resolveStudentWarden(student),
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      priority: req.body.priority,
      imageUrl: req.body.imageUrl,
      slaDeadline: await computeSlaDeadline(),
    });

    await notifyComplaintCreated(complaint);
    await recordAudit({
      actor: student,
      action: 'COMPLAINT_CREATED',
      targetType: 'Complaint',
      targetId: complaint._id,
      metadata: { category: complaint.category },
    });

    res.status(201).json({ complaint });
  } catch (error) {
    next(error);
  }
}

export async function listMyComplaints(req, res, next) {
  try {
    const complaints = await Complaint.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (error) {
    next(error);
  }
}

export async function listWardenComplaints(req, res, next) {
  try {
    const filter = { $or: [{ assignedWardenId: req.user._id }, { hostelId: req.user.hostelId }] };
    if (req.query.status) filter.status = req.query.status;
    const complaints = await Complaint.find(filter)
      .populate('studentId', 'name email studentId hostelBlock')
      .sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (error) {
    next(error);
  }
}

export async function listManagementComplaints(req, res, next) {
  try {
    const filter = { collegeId: req.user.collegeId };
    if (req.query.status) filter.status = req.query.status;
    const complaints = await Complaint.find(filter)
      .populate('studentId', 'name email studentId hostelBlock')
      .populate('hostelId', 'name')
      .sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (error) {
    next(error);
  }
}

export async function getAllComplaints(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.collegeId) filter.collegeId = req.query.collegeId;
    const complaints = await Complaint.find(filter)
      .populate('studentId', 'name email studentId hostelBlock')
      .populate('collegeId', 'name')
      .populate('hostelId', 'name')
      .sort({ createdAt: -1 })
      .limit(300);
    res.json({ complaints });
  } catch (error) {
    next(error);
  }
}

export async function getComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('studentId', 'name email studentId hostelBlock');
    if (!complaint) throw new AppError(404, 'COMPLAINT_NOT_FOUND');

    const user = req.user;
    const allowed =
      STUDENT_ROLES.includes(user.role) ||
      (user.role === 'student' && String(complaint.studentId._id) === String(user._id)) ||
      (user.role === 'warden' &&
        (String(complaint.assignedWardenId) === String(user._id) ||
          String(complaint.hostelId) === String(user.hostelId))) ||
      (user.role === 'management' && canManageCollege(user, complaint.collegeId));

    if (!allowed) throw new AppError(403, 'FORBIDDEN');
    res.json({ complaint });
  } catch (error) {
    next(error);
  }
}

export async function updateComplaintStatus(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) throw new AppError(404, 'COMPLAINT_NOT_FOUND');

    const { status, reason } = req.body;
    const allowedTransitions = {
      warden: ['in-progress', 'warden-resolved', 'rejected'],
      management: ['in-progress', 'escalated', 'resolved'],
      owner: ['in-progress', 'escalated', 'resolved', 'warden-resolved', 'rejected'],
      admin: ['in-progress', 'escalated', 'resolved', 'warden-resolved', 'rejected'],
    };

    const canActAsWarden =
      req.user.role === 'warden' &&
      (String(complaint.assignedWardenId) === String(req.user._id) ||
        String(complaint.hostelId) === String(req.user.hostelId));
    const canActAsManagement =
      req.user.role === 'management' && canManageCollege(req.user, complaint.collegeId);

    let actorKey = null;
    if (req.user.role === 'owner' || req.user.role === 'admin') actorKey = req.user.role;
    else if (canActAsWarden) actorKey = 'warden';
    else if (canActAsManagement) actorKey = 'management';

    if (!actorKey || !allowedTransitions[actorKey].includes(status)) {
      throw new AppError(403, 'INVALID_STATUS_TRANSITION');
    }
    if (status === 'rejected' && !(reason || '').trim()) {
      throw new AppError(400, 'REJECTION_REASON_REQUIRED', 'A rejection reason is required');
    }

    const previousStatus = complaint.status;
    complaint.status = status;
    if (status === 'warden-resolved') complaint.studentReviewStatus = 'pending';
    if (status === 'rejected') complaint.rejectionReason = reason.trim();
    if (status === 'resolved') complaint.studentReviewStatus = 'accepted';
    appendHistory(complaint, {
      action: 'STATUS_CHANGE',
      reason: status === 'rejected' ? reason.trim() : reason || '',
      previousStatus,
      newStatus: status,
      actor: req.user,
    });
    await complaint.save();

    const student = await User.findById(complaint.studentId);
    await notifyComplaintStatusChange(complaint, student, previousStatus);
    await recordAudit({
      actor: req.user,
      action: 'COMPLAINT_STATUS_CHANGED',
      targetType: 'Complaint',
      targetId: complaint._id,
      metadata: { from: previousStatus, to: status, reason: reason || '' },
    });

    res.json({ complaint });
  } catch (error) {
    next(error);
  }
}

export async function reviewComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) throw new AppError(404, 'COMPLAINT_NOT_FOUND');
    if (String(complaint.studentId) !== String(req.user._id)) throw new AppError(403, 'FORBIDDEN');
    if (complaint.status !== 'warden-resolved') throw new AppError(409, 'NOT_WARDEN_RESOLVED');

    const { decision, reason } = req.body;

    if (decision === 'accept') {
      complaint.status = 'resolved';
      complaint.studentReviewStatus = 'accepted';
      complaint.studentViewed = true;
      complaint.viewedAt = new Date();
      appendHistory(complaint, {
        action: 'STUDENT_ACCEPTED',
        previousStatus: 'warden-resolved',
        newStatus: 'resolved',
        actor: req.user,
      });
    } else if (decision === 'dispute') {
      complaint.status = 'disputed';
      complaint.studentReviewStatus = 'rejected';
      complaint.studentDisputeReason = reason || '';
      complaint.disputeCount += 1;
      appendHistory(complaint, {
        action: 'STUDENT_DISPUTED',
        reason: reason || '',
        previousStatus: 'warden-resolved',
        newStatus: 'disputed',
        actor: req.user,
      });
    } else {
      throw new AppError(400, 'INVALID_DECISION');
    }

    await complaint.save();
    const student = await User.findById(complaint.studentId);
    await notifyComplaintStatusChange(complaint, student, 'warden-resolved');
    await recordAudit({
      actor: req.user,
      action: 'COMPLAINT_REVIEWED',
      targetType: 'Complaint',
      targetId: complaint._id,
      metadata: { decision, reason: reason || '' },
    });

    res.json({ complaint });
  } catch (error) {
    next(error);
  }
}

export async function markComplaintViewed(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) throw new AppError(404, 'COMPLAINT_NOT_FOUND');
    if (String(complaint.studentId) !== String(req.user._id)) throw new AppError(403, 'FORBIDDEN');

    complaint.studentViewed = true;
    complaint.viewedAt = new Date();
    complaint.reminders.enabled = false;
    await complaint.save();
    res.json({ complaint });
  } catch (error) {
    next(error);
  }
}