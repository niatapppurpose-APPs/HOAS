import College from '../models/College.js';
import User from '../models/User.js';
import Hostel from '../models/Hostel.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege, ensureCollegeAccess } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { deleteAuthUser } from '../services/user.service.js';
import { checkCollegeCapacity } from '../services/capacity.service.js';

export async function listColleges(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === 'management') {
      filter._id = req.user.collegeId;
    }
    const colleges = await College.find(filter)
      .populate('managementId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ colleges });
  } catch (error) {
    next(error);
  }
}

export async function createCollege(req, res, next) {
  try {
    const existing = await College.findOne({ name: req.body.name });
    if (existing) throw new AppError(409, 'COLLEGE_EXISTS');
    const college = await College.create({
      name: req.body.name,
      location: req.body.location,
      address: req.body.address,
      logoUrl: req.body.logoUrl,
    });
    await recordAudit({ actor: req.user, action: 'COLLEGE_CREATED', targetType: 'College', targetId: college._id });
    res.status(201).json({ college });
  } catch (error) {
    next(error);
  }
}

export async function updateCollege(req, res, next) {
  try {
    const college = await College.findById(req.params.id);
    if (!college) throw new AppError(404, 'COLLEGE_NOT_FOUND');

    const canUpdate =
      req.user.role === 'owner' ||
      req.user.role === 'admin' ||
      (req.user.role === 'management' && String(req.user.collegeId) === String(college._id));
    if (!canUpdate) throw new AppError(403, 'FORBIDDEN');

    if (req.body.logoUrl !== undefined) college.logoUrl = req.body.logoUrl;
    if (req.body.address !== undefined) college.address = req.body.address;
    if (req.body.location !== undefined) college.location = req.body.location;
    await college.save();

    await recordAudit({ actor: req.user, action: 'COLLEGE_UPDATED', targetType: 'College', targetId: college._id });
    res.json({ college });
  } catch (error) {
    next(error);
  }
}

export async function getCollegeStats(req, res, next) {
  try {
    const college = await College.findById(req.params.id);
    if (!college) throw new AppError(404, 'COLLEGE_NOT_FOUND');
    ensureCollegeAccess(req.user, college._id);

    const [students, wardens, management] = await Promise.all([
      User.aggregate([
        { $match: { collegeId: college._id, role: 'student' } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { collegeId: college._id, role: 'warden' } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      User.countDocuments({ collegeId: college._id, role: 'management' }),
    ]);

    const countBy = (rows, key) =>
      rows.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), { [key]: 0 });

    res.json({
      college,
      stats: {
        students: countBy(students, 'approved'),
        wardens: countBy(wardens, 'approved'),
        management,
        hostels: await Hostel.countDocuments({ collegeId: college._id }),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCollege(req, res, next) {
  try {
    const college = await College.findById(req.params.id);
    if (!college) throw new AppError(404, 'COLLEGE_NOT_FOUND');

    const managementUsers = await User.find({ collegeId: college._id, role: 'management' });
    const wardenUsers = await User.find({ collegeId: college._id, role: 'warden' });
    const studentUsers = await User.find({ collegeId: college._id, role: 'student' });
    const allUsers = [...managementUsers, ...wardenUsers, ...studentUsers];

    let deleted = 0;
    for (const user of allUsers) {
      await deleteAuthUser(user.uid);
      await User.findByIdAndDelete(user._id);
      deleted++;
    }
    await Hostel.deleteMany({ collegeId: college._id });
    await College.findByIdAndDelete(college._id);

    await recordAudit({
      actor: req.user,
      action: 'COLLEGE_DELETED',
      targetType: 'College',
      targetId: college._id,
      metadata: { usersDeleted: deleted },
    });
    res.json({ ok: true, deletedUsers: deleted });
  } catch (error) {
    next(error);
  }
}