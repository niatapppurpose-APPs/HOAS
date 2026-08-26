import Hostel from '../models/Hostel.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege, canAccessHostel } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { checkCollegeCapacity } from '../services/capacity.service.js';

export async function listHostels(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === 'warden') {
      filter._id = req.user.hostelId;
    } else if (req.user.role === 'management') {
      filter.collegeId = req.user.collegeId;
    }
    const hostels = await Hostel.find(filter)
      .populate('wardenId', 'name email')
      .populate('collegeId', 'name')
      .sort({ createdAt: -1 });

    const hostelIds = hostels.map((h) => h._id);
    const assignedStudents = await User.find({ hostelId: { $in: hostelIds }, role: 'student' }).select('_id hostelId');
    const studentsByHostel = new Map();
    for (const student of assignedStudents) {
      const key = String(student.hostelId);
      if (!studentsByHostel.has(key)) studentsByHostel.set(key, []);
      studentsByHostel.get(key).push(String(student._id));
    }

    const result = hostels.map((h) => ({
      ...h.toObject(),
      wardens: h.wardenId ? [h.wardenId] : [],
      students: studentsByHostel.get(String(h._id)) || [],
    }));

    res.json({ hostels: result });
  } catch (error) {
    next(error);
  }
}

export async function createHostel(req, res, next) {
  try {
    const { collegeId } = req.body;
    if (req.user.role === 'management' && String(req.user.collegeId) !== String(collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }
    const capacity = await checkCollegeCapacity(req.user, collegeId, 'hostel');
    if (!capacity.allowed) throw new AppError(409, 'COLLEGE_CAPACITY_EXCEEDED', capacity.message);

    const hostel = await Hostel.create({
      name: req.body.name,
      block: req.body.block,
      collegeId,
      wardenId: req.body.wardenId,
      capacity: req.body.capacity,
      address: req.body.address,
    });

    if (req.body.wardenId) {
      await User.findByIdAndUpdate(req.body.wardenId, { hostelId: hostel._id });
    }

    await recordAudit({ actor: req.user, action: 'HOSTEL_CREATED', targetType: 'Hostel', targetId: hostel._id });
    res.status(201).json({ hostel });
  } catch (error) {
    next(error);
  }
}

export async function updateHostel(req, res, next) {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) throw new AppError(404, 'HOSTEL_NOT_FOUND');
    if (!canManageCollege(req.user, hostel.collegeId)) throw new AppError(403, 'FORBIDDEN');

    const allowed = ['name', 'block', 'capacity', 'address', 'active'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) hostel[field] = req.body[field];
    }

    const previousWardenId = hostel.wardenId ? String(hostel.wardenId) : null;

    if (Array.isArray(req.body.wardens)) {
      const nextWardenId = req.body.wardens[0] || null;
      hostel.wardenId = nextWardenId;
    } else if (req.body.wardenId !== undefined) {
      hostel.wardenId = req.body.wardenId || null;
    }

    const newWardenId = hostel.wardenId ? String(hostel.wardenId) : null;
    if (newWardenId && newWardenId !== previousWardenId) {
      await User.findByIdAndUpdate(newWardenId, { hostelId: hostel._id });
    }
    if (previousWardenId && previousWardenId !== newWardenId) {
      await User.updateOne({ _id: previousWardenId, hostelId: hostel._id }, { $unset: { hostelId: 1 } });
    }

    if (Array.isArray(req.body.students)) {
      const nextIds = [...new Set(req.body.students.map(String))];
      const current = await User.find({ hostelId: hostel._id, role: 'student' }).select('_id');
      const currentIds = current.map((u) => String(u._id));
      const toAdd = nextIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !nextIds.includes(id));
      if (toAdd.length > 0) {
        await User.updateMany({ _id: { $in: toAdd } }, { $set: { hostelId: hostel._id, hostelBlock: hostel.block } });
      }
      if (toRemove.length > 0) {
        await User.updateMany({ _id: { $in: toRemove } }, { $unset: { hostelId: 1 } });
      }
    }

    await hostel.save();
    await recordAudit({ actor: req.user, action: 'HOSTEL_UPDATED', targetType: 'Hostel', targetId: hostel._id });
    res.json({ hostel });
  } catch (error) {
    next(error);
  }
}

export async function deleteHostel(req, res, next) {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) throw new AppError(404, 'HOSTEL_NOT_FOUND');
    if (!canManageCollege(req.user, hostel.collegeId)) throw new AppError(403, 'FORBIDDEN');

    await Hostel.findByIdAndDelete(hostel._id);
    await User.updateMany({ hostelId: hostel._id }, { $unset: { hostelId: 1 } });

    await recordAudit({ actor: req.user, action: 'HOSTEL_DELETED', targetType: 'Hostel', targetId: hostel._id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}