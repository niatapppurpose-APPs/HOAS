import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/User.js';
import College from '../src/models/College.js';
import Complaint from '../src/models/Complaint.js';
import { deleteUser, listUsers } from '../src/controllers/user.controller.js';
import { listWardenComplaints } from '../src/controllers/complaint.controller.js';

const mongod = await MongoMemoryServer.create();
await mongoose.connect(mongod.getUri());

let pass = 0, fail = 0;
const check = (name, cond) => {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name); }
};
const mockRes = () => {
  const r = {};
  r.body = null;
  r.json = (b) => { r.body = b; return r; };
  r.status = () => r;
  return r;
};
const noNext = (e) => { if (e) throw e; };

const college = await College.create({ name: 'Test College' });
const mgmt = await User.create({ uid: 'mgmt-1', email: 'm@t.com', name: 'Mgmt', role: 'management', status: 'approved', collegeId: college._id });
const wA = await User.create({ uid: 'w-a', email: 'a@t.com', name: 'Warden A', role: 'warden', status: 'approved', collegeId: college._id, hostelBlock: 'A' });
const wB = await User.create({ uid: 'w-b', email: 'b@t.com', name: 'Warden B', role: 'warden', status: 'approved', collegeId: college._id, hostelBlock: 'A' });
const s1 = await User.create({ uid: 's-1', email: 's1@t.com', name: 'S1', role: 'student', status: 'approved', collegeId: college._id, hostelBlock: 'A', wardenId: wA._id });
const s2 = await User.create({ uid: 's-2', email: 's2@t.com', name: 'S2', role: 'student', status: 'approved', collegeId: college._id, hostelBlock: 'A', wardenId: wA._id });
const s3 = await User.create({ uid: 's-3', email: 's3@t.com', name: 'S3', role: 'student', status: 'approved', collegeId: college._id, hostelBlock: 'B', wardenId: wB._id });

// complaints: one assigned to A, one to B, one unassigned-no-hostel
const cA = await Complaint.create({ studentId: s1._id, collegeId: college._id, assignedWardenId: wA._id, title: 't1', description: 'd1', status: 'pending' });
await Complaint.create({ studentId: s3._id, collegeId: college._id, assignedWardenId: wB._id, title: 't2', description: 'd2', status: 'pending' });
await Complaint.create({ studentId: s3._id, collegeId: college._id, title: 't3', description: 'd3', status: 'pending' });

// --- warden A sees only own scope BEFORE delete ---
const wardenA = await User.findById(wA._id);
const r1 = mockRes();
await listUsers({ user: wardenA, query: { role: 'student' } }, r1, noNext);
const seenIds = (r1.body.users || []).map((u) => String(u._id));
check('wardenA students = s1,s2 only', seenIds.includes(String(s1._id)) && seenIds.includes(String(s2._id)) && !seenIds.includes(String(s3._id)));

const r2 = mockRes();
await listWardenComplaints({ user: wardenA, query: {} }, r2, noNext);
const seenC = (r2.body.complaints || []).map((c) => String(c._id));
check('wardenA complaints scoped', seenC.includes(String(cA._id)) && seenC.length === 1);

// --- delete warden A: students must survive, reassigned to B ---
const r3 = mockRes();
await deleteUser({ user: mgmt, params: { id: String(wA._id) } }, r3, noNext);
check('delete ok', r3.body?.ok === true);
check('wardenA gone', (await User.findById(wA._id)) === null);
const s1After = await User.findById(s1._id);
const s2After = await User.findById(s2._id);
check('s1 survives', !!s1After);
check('s2 survives', !!s2After);
check('s1 reassigned to wB', String(s1After.wardenId) === String(wB._id));
check('s2 reassigned to wB', String(s2After.wardenId) === String(wB._id));

// warden B now sees s1,s2,s3
const wardenB = await User.findById(wB._id);
const r4 = mockRes();
await listUsers({ user: wardenB, query: { role: 'student' } }, r4, noNext);
check('wardenB sees 3 students', (r4.body.users || []).length === 3);

// --- delete last warden: students survive unassigned ---
const r5 = mockRes();
await deleteUser({ user: mgmt, params: { id: String(wB._id) } }, r5, noNext);
const s1Final = await User.findById(s1._id);
check('s1 survives last-warden delete', !!s1Final);
check('s1 wardenId unset', !s1Final.wardenId);

await mongoose.disconnect();
await mongod.stop();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
