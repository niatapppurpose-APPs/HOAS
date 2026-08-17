import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { notifyUser } from '../services/notification.service.js';
import { emitToCollege } from '../services/socket.service.js';

export async function listAnnouncements(req, res, next) {
  try {
    const filter = { collegeId: req.user.collegeId };
    if (req.user.role === 'student' && req.user.hostelBlock) {
      filter.$or = [{ hostelBlock: req.user.hostelBlock }, { hostelBlock: { $exists: false } }];
    }
    if (req.query.status) filter.status = req.query.status;

    const announcements = await Announcement.find(filter).sort({ isPinned: -1, createdAt: -1 });
    res.json({ announcements });
  } catch (error) {
    next(error);
  }
}

export async function createAnnouncement(req, res, next) {
  try {
    const { collegeId } = req.body;
    const canCreate =
      req.user.role === 'owner' ||
      req.user.role === 'admin' ||
      (req.user.role === 'management' && canManageCollege(req.user, collegeId)) ||
      (req.user.role === 'warden' && String(req.user.collegeId) === String(collegeId));
    if (!canCreate) throw new AppError(403, 'FORBIDDEN');

    const announcement = await Announcement.create({
      title: req.body.title,
      body: req.body.body,
      priority: req.body.priority,
      collegeId,
      hostelBlock: req.body.hostelBlock,
      creatorId: req.user._id,
      creatorRole: req.user.role,
      isPinned: req.body.isPinned,
      status: req.body.status || 'published',
      publishAt: req.body.publishAt ? new Date(req.body.publishAt) : undefined,
      recurrence: req.body.recurrence,
      recurrenceEndDate: req.body.recurrenceEndDate ? new Date(req.body.recurrenceEndDate) : undefined,
    });

    if (announcement.status === 'published') {
      await pushToStudents(announcement);
    }

    await recordAudit({
      actor: req.user,
      action: 'ANNOUNCEMENT_CREATED',
      targetType: 'Announcement',
      targetId: announcement._id,
    });
    emitToCollege(collegeId, 'announcement:new', announcement.toJSON());
    res.status(201).json({ announcement });
  } catch (error) {
    next(error);
  }
}

export async function updateAnnouncement(req, res, next) {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) throw new AppError(404, 'ANNOUNCEMENT_NOT_FOUND');
    if (!canManageCollege(req.user, announcement.collegeId)) throw new AppError(403, 'FORBIDDEN');

    const allowed = ['title', 'body', 'priority', 'isPinned', 'status', 'hostelBlock'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) announcement[field] = req.body[field];
    }
    if (req.body.publishAt) announcement.publishAt = new Date(req.body.publishAt);
    await announcement.save();

    await recordAudit({
      actor: req.user,
      action: 'ANNOUNCEMENT_UPDATED',
      targetType: 'Announcement',
      targetId: announcement._id,
    });
    res.json({ announcement });
  } catch (error) {
    next(error);
  }
}

export async function deleteAnnouncement(req, res, next) {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) throw new AppError(404, 'ANNOUNCEMENT_NOT_FOUND');
    if (!canManageCollege(req.user, announcement.collegeId)) throw new AppError(403, 'FORBIDDEN');

    await Announcement.findByIdAndDelete(announcement._id);
    await recordAudit({
      actor: req.user,
      action: 'ANNOUNCEMENT_DELETED',
      targetType: 'Announcement',
      targetId: announcement._id,
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function markAnnouncementRead(req, res, next) {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) throw new AppError(404, 'ANNOUNCEMENT_NOT_FOUND');
    if (!announcement.readBy.includes(req.user._id)) {
      announcement.readBy.push(req.user._id);
      await announcement.save();
    }
    res.json({ ok: true, readCount: announcement.readBy.length });
  } catch (error) {
    next(error);
  }
}

async function pushToStudents(announcement) {
  const filter = { role: 'student', status: 'approved', collegeId: announcement.collegeId };
  if (announcement.hostelBlock) filter.hostelBlock = announcement.hostelBlock;
  const students = await User.find(filter);
  for (const student of students) {
    await notifyUser(student, {
      type: 'announcement',
      title: announcement.title,
      body: announcement.body.slice(0, 150),
      data: { announcementId: String(announcement._id) },
    });
  }
}