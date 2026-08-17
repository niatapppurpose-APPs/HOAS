import crypto from 'crypto';
import User from '../models/User.js';
import Hostel from '../models/Hostel.js';
import College from '../models/College.js';
import Fee from '../models/Fee.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from '../services/audit.service.js';
import { sendWelcomeEmail, sendBulkUploadSummaryEmail } from '../services/email.service.js';
import { createAuthUser, deleteAuthUser, generateResetLink } from '../services/user.service.js';
import { checkCollegeCapacity } from '../services/capacity.service.js';

async function buildStudentPayload(data, collegeId, actingUser) {
  const college = await College.findById(collegeId);
  if (!college) throw new AppError(404, 'COLLEGE_NOT_FOUND');

  let wardenId = data.wardenId || null;
  let hostel = null;

  if (data.hostelBlock) {
    hostel = await Hostel.findOneAndUpdate(
      { collegeId, name: data.hostelBlock },
      { collegeId, name: data.hostelBlock, block: data.hostelBlock },
      { upsert: true, new: true }
    );
    if (!wardenId && hostel.wardenId) wardenId = hostel.wardenId;
  }
  if (!wardenId) {
    const autoWarden = await User.findOne({ role: 'warden', collegeId });
    if (autoWarden) wardenId = autoWarden._id;
  }

  const totalFee = Number(data.totalFee || 0);
  const paidFee = Number(data.paidFee || 0);
  const pendingFee = Math.max(0, totalFee - paidFee);

  return {
    uid: null,
    email: data.email,
    name: data.name,
    role: 'student',
    status: 'approved',
    collegeId,
    collegeName: college.name,
    hostelId: hostel ? hostel._id : null,
    hostelBlock: data.hostelBlock,
    studentId: data.studentId,
    rollNumber: data.rollNumber,
    idNumber: data.idNumber,
    wardenId,
    feeDetails: { totalFee, paidFee, pendingFee },
    approvedAt: new Date(),
    approvedBy: actingUser._id,
    approverRole: actingUser.role,
  };
}

export async function createStudent(req, res, next) {
  try {
    const { collegeId, email } = req.body;
    if (req.user.role === 'management' && String(req.user.collegeId) !== String(collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }

    const capacity = await checkCollegeCapacity(req.user, collegeId, ['student']);
    if (!capacity.allowed) throw new AppError(409, 'COLLEGE_CAPACITY_EXCEEDED', capacity.message);

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError(409, 'EMAIL_EXISTS');

    const authUser = await createAuthUser({ email, password: cryptoRandom(), name: req.body.name });
    const payload = await buildStudentPayload(req.body, collegeId, req.user);
    payload.uid = authUser.uid;

    try {
      const student = await User.create(payload);
      await Fee.create({
        studentId: student._id,
        collegeId,
        totalAmount: payload.feeDetails.totalFee,
        paidAmount: payload.feeDetails.paidFee,
      });
      const resetLink = await generateResetLink(email);
      await sendWelcomeEmail({
        to: email,
        name: payload.name,
        role: 'student',
        extra: [
          { name: 'College', value: payload.collegeName },
          { name: 'Hostel', value: payload.hostelBlock || '-' },
          { name: 'Student ID', value: payload.studentId || '-' },
          { name: 'Email', value: email },
        ],
        resetLink,
      });
      await recordAudit({ actor: req.user, action: 'STUDENT_CREATED', targetType: 'User', targetId: student._id });
      res.status(201).json({ student });
    } catch (error) {
      await deleteAuthUser(authUser.uid).catch(() => {});
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateStudents(req, res, next) {
  try {
    const { collegeId, students } = req.body;
    if (req.user.role === 'management' && String(req.user.collegeId) !== String(collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }

    const capacity = await checkCollegeCapacity(req.user, collegeId, ['student']);
    if (!capacity.allowed) throw new AppError(409, 'COLLEGE_CAPACITY_EXCEEDED', capacity.message);

    const existingEmails = new Set(
      (await User.find({ email: { $in: students.map((s) => s.email.toLowerCase()) } })).map((u) => u.email)
    );

    const results = { created: 0, failed: 0, skipped: 0, errors: [] };

    for (const row of students) {
      const email = (row.email || '').toLowerCase();
      if (!row.name || !email) {
        results.failed++;
        results.errors.push({ row, error: 'Missing name or email' });
        continue;
      }
      if (existingEmails.has(email)) {
        results.skipped++;
        results.errors.push({ row, error: 'Duplicate email' });
        continue;
      }

      try {
        const authUser = await createAuthUser({ email, password: cryptoRandom(), name: row.name });
        const payload = await buildStudentPayload(row, collegeId, req.user);
        payload.uid = authUser.uid;
        try {
          const student = await User.create(payload);
          await Fee.create({
            studentId: student._id,
            collegeId,
            totalAmount: payload.feeDetails.totalFee,
            paidAmount: payload.feeDetails.paidFee,
          });
          const resetLink = await generateResetLink(email);
          await sendWelcomeEmail({
            to: email,
            name: payload.name,
            role: 'student',
            extra: [
              { name: 'College', value: payload.collegeName },
              { name: 'Student ID', value: payload.studentId || '-' },
            ],
            resetLink,
          });
          existingEmails.add(email);
          results.created++;
          await new Promise((resolve) => setTimeout(resolve, 250));
        } catch (innerError) {
          await deleteAuthUser(authUser.uid).catch(() => {});
          results.failed++;
          results.errors.push({ row, error: innerError.message });
        }
      } catch (authError) {
        results.failed++;
        results.errors.push({ row, error: authError.message });
      }
    }

    await sendBulkUploadSummaryEmail({
      to: req.user.email,
      collegeName: req.user.collegeName || 'HOAS',
      created: results.created,
      failed: results.failed,
      skipped: results.skipped,
    });

    await recordAudit({
      actor: req.user,
      action: 'STUDENTS_BULK_CREATED',
      targetType: 'College',
      targetId: collegeId,
      metadata: results,
    });
    res.json(results);
  } catch (error) {
    next(error);
  }
}

export async function listStudents(req, res, next) {
  try {
    const { role } = req.user;
    const filter = { role: 'student' };

    if (role === 'warden') {
      filter.$or = [{ hostelId: req.user.hostelId }, { wardenId: req.user._id }];
    } else if (role === 'management') {
      filter.collegeId = req.user.collegeId;
    } else if (role !== 'owner' && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN');
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.collegeId) filter.collegeId = req.query.collegeId;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { studentId: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const students = await User.find(filter)
      .populate('collegeId', 'name')
      .populate('hostelId', 'name')
      .populate('wardenId', 'name')
      .sort({ createdAt: -1 })
      .limit(300);
    res.json({ students });
  } catch (error) {
    next(error);
  }
}

function cryptoRandom() {
  return crypto.randomBytes(6).toString('hex');
}