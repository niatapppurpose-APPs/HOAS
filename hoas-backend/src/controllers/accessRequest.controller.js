import crypto from 'crypto';
import AccessRequest from '../models/AccessRequest.js';
import User from '../models/User.js';
import College from '../models/College.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from '../services/audit.service.js';
import {
  sendAccessRequestReceivedEmail,
  sendAccessRequestDecisionEmail,
  sendWelcomeEmail,
} from '../services/email.service.js';
import { notifyAdmins } from '../services/notification.service.js';
import { firebaseAuth } from '../config/firebase.js';

function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  const pick = (set) => set[crypto.randomInt(set.length)];
  let password = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = 0; i < 8; i += 1) password.push(pick(all));
  return password.sort(() => crypto.randomInt(3) - 1).join('');
}

export async function createAccessRequest(req, res, next) {
  try {
    const {
      orgName,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      studentCount,
      hostelCount,
      message,
    } = req.body || {};

    if (!orgName || !contactPerson || !email || !phone || !address) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Missing required organization details');
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists. Please log in instead.');
    }

    const duplicate = await AccessRequest.findOne({
      email: normalizedEmail,
      status: { $in: ['pending', 'verified'] },
    });
    if (duplicate) {
      throw new AppError(409, 'REQUEST_EXISTS', 'A request with this email is already under review.');
    }

    const accessRequest = await AccessRequest.create({
      orgName,
      contactPerson,
      email: normalizedEmail,
      phone,
      address,
      city,
      state,
      country,
      studentCount,
      hostelCount,
      message,
    });

    // Non-blocking thank-you email — the request is already persisted.
    sendAccessRequestReceivedEmail({
      to: normalizedEmail,
      contactPerson,
      orgName,
    });

    notifyAdmins({
      type: 'access_request',
      title: 'New organization access request',
      body: `${orgName} requested HOAS access`,
      data: { requestId: String(accessRequest._id) },
    }).catch(() => {});

    res.status(201).json({
      ok: true,
      message: 'Request received. Our team will contact you via email shortly.',
      request: accessRequest,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAccessRequests(req, res, next) {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orgName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const requests = await AccessRequest.find(filter)
      .populate('createdUserId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ requests });
  } catch (error) {
    next(error);
  }
}

export async function reviewAccessRequest(req, res, next) {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) throw new AppError(404, 'REQUEST_NOT_FOUND');
    if (request.status === 'account_created') {
      throw new AppError(400, 'ALREADY_PROCESSED', 'This request already has an account.');
    }

    const { status, notes } = req.body || {};
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status');
    }

    request.status = status;
    request.reviewNotes = notes ?? request.reviewNotes;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    if (status === 'rejected') {
      sendAccessRequestDecisionEmail({
        to: request.email,
        contactPerson: request.contactPerson,
        orgName: request.orgName,
        approved: false,
        reason: request.reviewNotes,
      });
    }

    await recordAudit({
      actor: req.user,
      action: `ACCESS_REQUEST_${status.toUpperCase()}`,
      targetType: 'AccessRequest',
      targetId: request._id,
      metadata: { orgName: request.orgName },
    });

    res.json({ request });
  } catch (error) {
    next(error);
  }
}

export async function createAccountFromRequest(req, res, next) {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) throw new AppError(404, 'REQUEST_NOT_FOUND');
    if (request.status === 'account_created') {
      throw new AppError(400, 'ALREADY_CREATED', 'An account was already created for this request.');
    }

    const existingUser = await User.findOne({ email: request.email });
    if (existingUser) throw new AppError(409, 'EMAIL_EXISTS');

    const password = generatePassword();

    const authUser = await firebaseAuth.createUser({
      email: request.email,
      password,
      displayName: request.contactPerson,
    }).catch(async (error) => {
      // Dev mode without Firebase admin may not support user creation.
      if (env.firebaseDevMode) return { uid: `dev-${request._id}` };
      throw error;
    });

    const college = await College.findOneAndUpdate(
      { name: request.orgName },
      {
        name: request.orgName,
        address: request.address,
        logoUrl: null,
        status: 'approved',
      },
      { upsert: true, new: true }
    );

    const user = await User.create({
      uid: authUser.uid,
      email: request.email,
      name: request.contactPerson,
      role: 'management',
      status: 'approved',
      phone: request.phone,
      collegeId: college._id,
      collegeName: request.orgName,
      approvedAt: new Date(),
      approvedBy: req.user._id,
      approverRole: req.user.role,
    });

    college.managementId = user._id;
    await college.save();

    request.status = 'account_created';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.createdUserId = user._id;
    request.createdCollegeId = college._id;
    await request.save();

    // Fire-and-forget: credentials + password-reset link are emailed without
    // blocking the HTTP response (Render kills slow requests).
    firebaseAuth
      .generatePasswordResetLink(request.email)
      .catch(() => '')
      .then((resetLink) =>
        sendWelcomeEmail({
          to: request.email,
          name: request.contactPerson,
          role: 'management',
          extra: [
            { name: 'Organization', value: request.orgName },
            { name: 'Email', value: request.email },
            { name: 'Temporary password', value: password },
          ],
          resetLink,
        })
      );

    notifyAdmins({
      type: 'access_request_approved',
      title: 'Organization account created',
      body: `${request.orgName} is now on HOAS`,
      data: { userId: String(user._id) },
    }).catch(() => {});

    await recordAudit({
      actor: req.user,
      action: 'ACCESS_REQUEST_ACCOUNT_CREATED',
      targetType: 'AccessRequest',
      targetId: request._id,
      metadata: { userId: String(user._id), collegeId: String(college._id) },
    });

    res.status(201).json({ ok: true, user, request });
  } catch (error) {
    next(error);
  }
}
