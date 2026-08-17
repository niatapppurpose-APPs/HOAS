import College from '../models/College.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from '../services/audit.service.js';

export async function getReportData(req, res, next) {
  try {
    const data =
      req.user.role === 'owner' || req.user.role === 'admin'
        ? await systemWideReport()
        : req.user.role === 'management'
          ? await collegeReport(req.user.collegeId)
          : null;
    if (!data) throw new AppError(403, 'FORBIDDEN');
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function downloadReportJson(req, res, next) {
  try {
    const data =
      req.user.role === 'owner' || req.user.role === 'admin'
        ? await systemWideReport()
        : req.user.role === 'management'
          ? await collegeReport(req.user.collegeId)
          : null;
    if (!data) throw new AppError(403, 'FORBIDDEN');

    const filename = `HOAS-Report-${randomCode(8)}-${dateStamp()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
    await recordAudit({ actor: req.user, action: 'REPORT_JSON_DOWNLOADED', targetType: 'Report' });
  } catch (error) {
    next(error);
  }
}

export async function downloadReportPdf(req, res, next) {
  try {
    const data =
      req.user.role === 'owner' || req.user.role === 'admin'
        ? await systemWideReport()
        : req.user.role === 'management'
          ? await collegeReport(req.user.collegeId)
          : null;
    if (!data) throw new AppError(403, 'FORBIDDEN');

    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const filename = `HOAS-Report-${randomCode(8)}-${dateStamp()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(20).fillColor('#6366f1').text('HOAS Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('#111827').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text('Statistics');
    doc.moveDown();
    for (const [key, value] of Object.entries(data.statistics)) {
      doc.fontSize(11).text(`${label(key)}: ${value}`);
    }
    doc.moveDown(2);

    doc.fontSize(14).text('Colleges');
    doc.moveDown();
    data.colleges.forEach((college, index) => {
      doc.fontSize(11).text(`${index + 1}. ${college.name}`);
    });
    doc.moveDown(2);

    doc.fontSize(14).text('Students');
    doc.moveDown();
    data.students.forEach((student, index) => {
      doc.fontSize(10).text(`${index + 1}. ${student.name} — ${student.email}`);
    });

    doc.fontSize(8).fillColor('#6b7280').text(`HOAS — ${new Date().getFullYear()}`, 40, doc.page.height - 50, { align: 'center' });
    doc.end();
    await recordAudit({ actor: req.user, action: 'REPORT_PDF_DOWNLOADED', targetType: 'Report' });
  } catch (error) {
    next(error);
  }
}

async function systemWideReport() {
  const [colleges, students, wardens, management, complaints] = await Promise.all([
    College.find().select('name status'),
    User.find({ role: 'student' }).select('name email studentId collegeName status'),
    User.find({ role: 'warden' }).select('name email collegeName'),
    User.find({ role: 'management' }).select('name email collegeName'),
    Complaint.find().select('status'),
  ]);

  return {
    scope: 'system',
    statistics: {
      colleges: colleges.length,
      students: students.length,
      wardens: wardens.length,
      management: management.length,
      complaints: complaints.length,
      pendingComplaints: complaints.filter((c) => c.status === 'pending').length,
    },
    colleges,
    students,
    wardens,
    management,
  };
}

async function collegeReport(collegeId) {
  const college = await College.findById(collegeId);
  const [students, wardens, complaints] = await Promise.all([
    User.find({ role: 'student', collegeId }).select('name email studentId status'),
    User.find({ role: 'warden', collegeId }).select('name email'),
    Complaint.find({ collegeId }).select('status category'),
  ]);

  return {
    scope: 'college',
    college: college ? college.name : '',
    statistics: {
      students: students.length,
      wardens: wardens.length,
      complaints: complaints.length,
      pendingComplaints: complaints.filter((c) => c.status === 'pending').length,
    },
    colleges: [],
    students,
    wardens,
  };
}

function label(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase());
}

function randomCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}