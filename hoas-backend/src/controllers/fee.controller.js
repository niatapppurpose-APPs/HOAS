import Fee from '../models/Fee.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege, resolveStudentWarden } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { notifyUser } from '../services/notification.service.js';
import { emitToUser } from '../services/socket.service.js';

function computeStatus(paid, total) {
  if (paid <= 0) return 'pending';
  if (paid >= total) return 'fully_paid';
  return 'partially_paid';
}

function normalizeRow(row) {
  const email = String(row.email || '').trim().toLowerCase();
  const studentId = String(row.studentId || row.student_id || row.rollNumber || '').trim();
  const totalAmount = Number(row.totalAmount ?? row.total ?? row.totalFee ?? 0);
  const paidAmount = Number(row.paidAmount ?? row.paid ?? row.paidFee ?? 0);
  return { email, studentId, totalAmount, paidAmount };
}

export async function uploadFees(req, res, next) {
  try {
    const { collegeId, records } = req.body;
    if (req.user.role === 'management' && String(req.user.collegeId) !== String(collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }

    const management = await User.findById(req.user._id);
    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const rawRow of records) {
      const row = normalizeRow(rawRow);
      if (!row.email && !row.studentId) {
        results.skipped++;
        results.errors.push({ row: rawRow, error: 'Missing email or studentId' });
        continue;
      }

      const query = { collegeId };
      if (row.email) query.email = row.email;
      else query.studentId = row.studentId;

      const student = await User.findOne({ role: 'student', ...query });
      if (!student) {
        results.skipped++;
        results.errors.push({ row: rawRow, error: 'Student not found in this college' });
        continue;
      }

      const status = computeStatus(row.paidAmount, row.totalAmount);
      const fee = await Fee.findOneAndUpdate(
        { studentId: student._id },
        {
          studentId: student._id,
          collegeId,
          managementId: management._id,
          wardenId: await resolveStudentWarden(student),
          totalAmount: row.totalAmount,
          paidAmount: row.paidAmount,
          status,
          isVerifiedByManagement: false,
          isVerifiedByWarden: false,
          approved: false,
          $push: {
            history: {
              action: 'upload',
              actorId: management._id,
              actorRole: management.role,
              timestamp: new Date(),
            },
          },
        },
        { upsert: true, new: true }
      );

      student.feeDetails = { totalFee: row.totalAmount, paidFee: row.paidAmount, pendingFee: Math.max(0, row.totalAmount - row.paidAmount) };
      await student.save();

      if (fee.createdAt && fee.updatedAt && Math.abs(fee.updatedAt - fee.createdAt) < 5000) results.created++;
      else results.updated++;
    }

    await recordAudit({
      actor: req.user,
      action: 'FEES_UPLOADED',
      targetType: 'College',
      targetId: collegeId,
      metadata: { results },
    });
    res.json(results);
  } catch (error) {
    next(error);
  }
}

export async function listManagementFees(req, res, next) {
  try {
    const filter = { collegeId: req.user.collegeId };
    if (req.query.status) filter.status = req.query.status;
    const fees = await Fee.find(filter)
      .populate('studentId', 'name email studentId hostelBlock uid')
      .sort({ createdAt: -1 });
    res.json({ fees });
  } catch (error) {
    next(error);
  }
}

export async function listWardenFees(req, res, next) {
  try {
    const filter = { isVerifiedByManagement: true };
    if (req.user.role === 'warden') {
      const hostelStudents = await User.find({ hostelId: req.user.hostelId, role: 'student' }).select('_id');
      filter.studentId = { $in: hostelStudents.map((s) => s._id) };
    } else {
      filter.wardenId = req.user._id;
    }
    if (req.query.status) filter.status = req.query.status;
    const fees = await Fee.find(filter)
      .populate('studentId', 'name email studentId hostelBlock uid')
      .sort({ createdAt: -1 });
    res.json({ fees });
  } catch (error) {
    next(error);
  }
}

export async function getStudentFee(req, res, next) {
  try {
    const fee = await Fee.findOne({ studentId: req.user._id });
    if (!fee) throw new AppError(404, 'FEE_NOT_FOUND');
    res.json({ fee });
  } catch (error) {
    next(error);
  }
}

export async function getStudentFeeByUid(req, res, next) {
  try {
    const student = await User.findOne({ uid: req.params.studentUid, role: 'student' });
    if (!student) throw new AppError(404, 'STUDENT_NOT_FOUND');
    const fee = await Fee.findOne({ studentId: student._id })
      .populate('studentId', 'name email studentId hostelBlock uid');
    if (!fee) throw new AppError(404, 'FEE_NOT_FOUND');
    res.json({ fee });
  } catch (error) {
    next(error);
  }
}

export async function getFeeById(req, res, next) {
  try {
    const fee = await Fee.findById(req.params.id).populate('studentId', 'name email studentId');
    if (!fee) throw new AppError(404, 'FEE_NOT_FOUND');

    const allowed =
      req.user.role === 'owner' ||
      req.user.role === 'admin' ||
      (req.user.role === 'management' && canManageCollege(req.user, fee.collegeId)) ||
      (req.user.role === 'warden' && String(fee.wardenId) === String(req.user._id)) ||
      (req.user.role === 'student' && String(fee.studentId._id) === String(req.user._id));
    if (!allowed) throw new AppError(403, 'FORBIDDEN');

    res.json({ fee });
  } catch (error) {
    next(error);
  }
}

export async function verifyByManagement(req, res, next) {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) throw new AppError(404, 'FEE_NOT_FOUND');
    if (req.user.role === 'management' && !canManageCollege(req.user, fee.collegeId)) {
      throw new AppError(403, 'FORBIDDEN');
    }

    fee.isVerifiedByManagement = true;
    fee.history.push({
      action: 'management_verify',
      actorId: req.user._id,
      actorRole: req.user.role,
      timestamp: new Date(),
    });
    await fee.save();

    await recordAudit({ actor: req.user, action: 'FEE_MANAGEMENT_VERIFIED', targetType: 'Fee', targetId: fee._id });
    res.json({ fee });
  } catch (error) {
    next(error);
  }
}

export async function verifyByWarden(req, res, next) {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) throw new AppError(404, 'FEE_NOT_FOUND');

    let isMyFee = String(fee.wardenId) === String(req.user._id);
    if (!isMyFee && req.user.role === 'warden' && fee.studentId) {
      const student = await User.findById(fee.studentId).select('hostelId');
      isMyFee = student && String(student.hostelId) === String(req.user.hostelId);
    }
    if (!isMyFee) throw new AppError(403, 'FORBIDDEN');
    if (!fee.isVerifiedByManagement) throw new AppError(409, 'MANAGEMENT_NOT_VERIFIED');
    if (!fee.proofImageUrl) throw new AppError(409, 'PROOF_IMAGE_REQUIRED');

    const { approved, note } = req.body;
    fee.isVerifiedByWarden = approved;
    fee.approved = approved;
    fee.history.push({
      action: approved ? 'warden_verify' : 'warden_reject',
      actorId: req.user._id,
      actorRole: req.user.role,
      timestamp: new Date(),
      note: note || '',
    });
    await fee.save();

    if (fee.studentId) {
      const student = await User.findById(fee.studentId);
      if (student) {
        if (approved) {
          student.wardenVerification = 'Verified';
          student.managementVerification = 'Verified';
          await student.save();
        }
        await notifyUser(student, {
          type: 'fee_verified',
          title: approved ? 'Fees verified' : 'Fee proof rejected',
          body: approved
            ? 'Your fee payment has been verified'
            : `Your fee proof was rejected${note ? `: ${note}` : ''}`,
          data: { feeId: String(fee._id) },
        });
        emitToUser(student._id, 'fee:updated', fee.toJSON());
      }
    }

    await recordAudit({
      actor: req.user,
      action: approved ? 'FEE_WARDEN_VERIFIED' : 'FEE_WARDEN_REJECTED',
      targetType: 'Fee',
      targetId: fee._id,
      metadata: { note: note || '' },
    });
    res.json({ fee });
  } catch (error) {
    next(error);
  }
}

export async function uploadProof(req, res, next) {
  try {
    const { proofImageUrl } = req.body;
    if (!/^https?:\/\//.test(proofImageUrl)) throw new AppError(400, 'INVALID_PROOF_URL');

    const fee = await Fee.findOneAndUpdate(
      { studentId: req.user._id },
      {
        proofImageUrl,
        isVerifiedByWarden: false,
        approved: false,
        $push: {
          history: {
            action: 'upload_proof',
            actorId: req.user._id,
            actorRole: 'student',
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );
    if (!fee) throw new AppError(404, 'FEE_NOT_FOUND');

    await recordAudit({ actor: req.user, action: 'FEE_PROOF_UPLOADED', targetType: 'Fee', targetId: fee._id });
    res.json({ fee });
  } catch (error) {
    next(error);
  }
}