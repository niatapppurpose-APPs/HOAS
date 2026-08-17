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
    res.json({ hostels });
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

    if (req.body.wardenId) {
      await User.findByIdAndUpdate(req.body.wardenId, { hostelId: hostel._id });
      hostel.wardenId = req.body.wardenId;
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