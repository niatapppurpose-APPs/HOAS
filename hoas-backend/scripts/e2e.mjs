import { spawn } from 'child_process';
import { io } from 'socket.io-client';

const BASE = 'http://localhost:4000';
const DB_PORT = 27000 + Math.floor(Math.random() * 500);
const DB_URI = `mongodb://127.0.0.1:${DB_PORT}/hoas`;
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function waitFor(url, probe, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok && (await probe(res))) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function api(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function tokenFor(uid) {
  const { json } = await api('POST', '/api/dev/token', null, { uid });
  return json.token;
}

async function portFree(port, ms = 12000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      await fetch(`http://127.0.0.1:${port}`);
    } catch {
      return true;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

spawn('pkill', ['-9', '-f', 'src/serve[r].js']);
spawn('pkill', ['-9', '-f', 'dev-mong[o]']);
spawn('pkill', ['-9', '-f', 'mongo[d]']);
await new Promise((r) => setTimeout(r, 1500));
const apiPortFree = await portFree(4000);
if (!apiPortFree) {
  spawn('fuser', ['-k', '-n', 'tcp', '4000']);
  await new Promise((r) => setTimeout(r, 1500));
}
if (!(await portFree(4000))) {
  console.error('FATAL: port 4000 still occupied');
  process.exit(1);
}

const mongoEnv = { ...process.env, PORT: String(DB_PORT) };
const appEnv = { ...process.env, MONGODB_URI: DB_URI };
const mongo = spawn('node', ['scripts/dev-mongo.js'], { stdio: 'ignore', detached: false, env: mongoEnv });
const server = spawn('node', ['src/server.js'], { stdio: 'ignore', env: appEnv });

function cleanup() {
  server.kill('SIGTERM');
  mongo.kill('SIGTERM');
  spawn('pkill', ['-9', '-f', 'src/serve[r].js']);
  spawn('pkill', ['-9', '-f', 'dev-mong[o]']);
  spawn('pkill', ['-9', '-f', 'mongo[d]']);
}

try {
  const mongoReady = await waitFor(`http://127.0.0.1:${DB_PORT}`, async () => true);
  check('dev mongodb started', mongoReady);

  const seed = await new Promise((resolve) => {
    const child = spawn('node', ['seed.js'], { stdio: 'inherit', env: appEnv });
    child.on('exit', (code) => resolve(code === 0));
  });
  check('seed ran', seed);

  const serverReady = await waitFor(`${BASE}/api/health`, async (res) => {
    const json = await res.json();
    return json.database === 'connected';
  });
  check('server healthy', serverReady);

  const OWN = await tokenFor('seed-owner');
  const MNG = await tokenFor('seed-management');
  const WAR = await tokenFor('seed-warden');
  const STU = await tokenFor('seed-student-1');
  const STU2 = await tokenFor('seed-student-2');

  const noAuth = await api('GET', '/api/complaints');
  check('401 without token', noAuth.status === 401, String(noAuth.status));

  const complaint = await api('POST', '/api/complaints', STU, {
    title: 'E2E complaint',
    description: 'Testing the full flow',
    category: 'plumbing',
    priority: 'high',
  });
  check('student creates complaint', complaint.status === 201, complaint.json.error || complaint.json.complaint?.title);
  const cid = complaint.json.complaint._id;

  const wardenList = await api('GET', '/api/complaints/warden', WAR);
  check('warden sees complaint', wardenList.json.complaints?.some((c) => c._id === cid));

  const forbidden = await api('GET', '/api/complaints/warden', STU);
  check('student blocked from warden endpoint', forbidden.status === 403, String(forbidden.status));

  const forbiddenCreate = await api('POST', '/api/complaints', WAR, { title: 'x', description: 'y' });
  check('warden blocked from creating complaint', forbiddenCreate.status === 403, String(forbiddenCreate.status));

  await api('PATCH', `/api/complaints/${cid}/status`, WAR, { status: 'in-progress' });
  await api('PATCH', `/api/complaints/${cid}/status`, WAR, { status: 'warden-resolved' });
  const disputed = await api('POST', `/api/complaints/${cid}/review`, STU, { decision: 'dispute', reason: 'Not fixed' });
  check('student disputes resolution', disputed.json.complaint?.status === 'disputed', disputed.json.complaint?.status);

  const otherStudent = await api('GET', '/api/complaints/my', STU2);
  check('student-2 cannot see student-1 complaints', otherStudent.json.complaints?.length === 0);

  const audit = await api('GET', '/api/settings/audit', OWN);
  check('audit log exists', audit.json.logs?.length >= 4, `${audit.json.logs?.length} entries`);

  const leave = await api('POST', '/api/leaves', STU, {
    leaveType: 'medical',
    reason: 'Fever and cold',
    fromDate: '2026-08-20',
    toDate: '2026-08-22',
  });
  check('student requests leave', leave.status === 201, leave.json.error || leave.json.leave?.status);
  const lid = leave.json.leave._id;
  const leaveDecision = await api('POST', `/api/leaves/${lid}/decide`, WAR, { decision: 'approve' });
  check('warden approves leave', leaveDecision.json.leave?.status === 'approved');

  const outIso = new Date(Date.now() + 60000).toISOString();
  const retIso = new Date(Date.now() + 90000).toISOString();
  const outing = await api('POST', '/api/outings', STU, {
    destination: 'City Mall',
    reason: 'Shopping',
    outTime: outIso,
  });
  check('student requests outing', outing.status === 201, outing.json.error || '');
  const oid = outing.json.outing._id;
  const outingDecision = await api('POST', `/api/outings/${oid}/decide`, WAR, {
    decision: 'approve',
    expectedReturnTime: retIso,
  });
  check('warden approves outing', outingDecision.json.outing?.status === 'approved');
  await new Promise((r) => setTimeout(r, 65000));
  const returned = await api('POST', `/api/outings/${oid}/return`, STU);
  check('student marks return', returned.json.outing?.status === 'completed', returned.json.outing?.timingStatus);

  const proof = await api('POST', '/api/fees/proof', STU, {
    proofImageUrl: 'https://storage.googleapis.com/hoas/proof.jpg',
  });
  check('student uploads fee proof', proof.status === 200, proof.json.error || '');
  const fid = proof.json.fee._id;
  const mngVerify = await api('POST', `/api/fees/${fid}/verify-management`, MNG);
  check('management verifies fee', mngVerify.json.fee?.isVerifiedByManagement === true);
  const warVerify = await api('POST', `/api/fees/${fid}/verify-warden`, WAR, { approved: true });
  check('warden verifies fee', warVerify.json.fee?.isVerifiedByWarden === true);

  const share = await api('POST', '/api/emergency/share', STU, {
    lat: 17.385,
    lng: 78.4867,
    durationMinutes: 15,
  });
  check('student shares emergency location', share.status === 201, share.json.error || '');
  const active = await api('GET', '/api/emergency/active', WAR);
  check('warden sees active session', active.json.sessions?.length === 1);
  await api('POST', '/api/emergency/stop', STU);

  const msg = await api('POST', '/api/chat/send', STU, {
    contextType: 'complaint',
    contextId: cid,
    text: 'Hello warden, any update?',
  });
  check('student sends chat message', msg.status === 201, msg.json.error || msg.json.message?.text);
  const reply = await api('POST', '/api/chat/send', WAR, {
    contextType: 'complaint',
    contextId: cid,
    text: 'Plumber coming today',
  });
  check('warden replies', reply.status === 201);
  const conv = await api('GET', `/api/chat/complaint/${cid}`, STU);
  check('conversation has 2 messages', conv.json.messages?.length === 2);

  const college = await api('GET', '/api/colleges', MNG);
  const colId = college.json.colleges[0]._id;
  const ann = await api('POST', '/api/announcements', WAR, {
    title: 'Cleaning day',
    body: 'All rooms cleaned by 10am',
    collegeId: colId,
  });
  check('warden creates announcement', ann.status === 201, ann.json.error || ann.json.announcement?.status);
  const annList = await api('GET', '/api/announcements', STU);
  check('student sees announcement', annList.json.announcements?.length >= 1);

  const notif = await api('POST', '/api/notifications/send', OWN, {
    targetRole: 'student',
    title: 'Fee deadline',
    body: 'Pay by Friday',
  });
  check('owner sends notification', notif.json.sent >= 1, `${notif.json.sent} recipients`);
  const inbox = await api('GET', '/api/notifications/me', STU);
  check('student has notifications', inbox.json.notifications?.length >= 1);

  const ticket = await api('POST', '/api/support', STU, {
    subject: 'Login broken',
    description: 'Page is blank',
  });
  check('student opens support ticket', ticket.status === 201, ticket.json.error || '');
  const tickets = await api('GET', '/api/support', OWN);
  check('owner sees tickets', tickets.json.tickets?.length >= 1);
  const tid = tickets.json.tickets[0]._id;
  const resolved = await api('PATCH', `/api/support/${tid}`, OWN, {
    status: 'resolved',
    resolution: 'Cleared cache',
  });
  check('owner resolves ticket', resolved.json.ticket?.status === 'resolved');

  const settings = await api('PATCH', '/api/settings', OWN, { complaintSlaHours: 24 });
  check('settings updated with version bump', settings.json.settings?.version === 2 && settings.json.settings?.complaintSlaHours === 24);
  const capacity = await api('GET', `/api/settings/capacity/${colId}`, MNG);
  check('college capacity check', capacity.json.allowed === true, `${capacity.json.count}/${capacity.json.max}`);

  const report = await api('GET', '/api/reports', OWN);
  check('owner report generated', report.json.statistics?.students === 3);

  const wardenSocket = io(BASE, { auth: { token: WAR }, transports: ['websocket'] });
  let wardenGotEvent = false;
  wardenSocket.on('complaint:new', () => (wardenGotEvent = true));
  wardenSocket.on('connect_error', (e) => console.log('socket connect error:', e.message));
  await new Promise((r) => setTimeout(r, 1500));
  await api('POST', '/api/complaints', STU, {
    title: 'Socket realtime test',
    description: 'Should reach warden live',
  });
  await new Promise((r) => setTimeout(r, 2500));
  check('socket.io realtime event delivered', wardenGotEvent);
  wardenSocket.close();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nE2E RESULT: ${passed} passed, ${failed} failed`);
} finally {
  cleanup();
  await new Promise((r) => setTimeout(r, 1500));
}
process.exitCode = results.filter((r) => !r.ok).length > 0 ? 1 : 0;